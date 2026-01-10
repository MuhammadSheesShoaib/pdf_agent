import os
import tempfile
import logging
import traceback
import uuid
from typing import Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from dotenv import load_dotenv

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import create_stuff_documents_chain from different locations
try:
    from langchain_classic.chains.combine_documents import create_stuff_documents_chain
    logger.info("Imported create_stuff_documents_chain from langchain_classic")
except ImportError:
    try:
        from langchain.chains.combine_documents import create_stuff_documents_chain
        logger.info("Imported create_stuff_documents_chain from langchain")
    except ImportError:
        try:
            from langchain.chains.combine_documents.stuff import create_stuff_documents_chain
            logger.info("Imported create_stuff_documents_chain from langchain.chains.combine_documents.stuff")
        except ImportError as e:
            logger.error(f"Failed to import create_stuff_documents_chain: {e}")
            raise ImportError(
                "Could not import create_stuff_documents_chain. "
                "Please install langchain-classic: pip install langchain-classic"
            )

load_dotenv()

app = FastAPI(title="PDF Q&A API", description="API for asking questions about PDF documents")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to store API keys
groq_api_key = None
hf_token = None

# In-memory storage for processed PDFs (maps pdf_id to QA chain)
pdf_storage: Dict[str, Any] = {}

class UploadResponse(BaseModel):
    pdf_id: str
    message: str
    filename: str

class QuestionRequest(BaseModel):
    pdf_id: str
    question: str

class QuestionResponse(BaseModel):
    answer: str

def get_groq_api_key():
    """Get and validate Groq API key"""
    global groq_api_key
    if groq_api_key is None:
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
    return groq_api_key

def get_hf_token():
    """Get HuggingFace token for accessing transformer models"""
    global hf_token
    if hf_token is None:
        hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_TOKEN") or os.getenv("HUGGINGFACE_HUB_TOKEN")
        if hf_token:
            logger.info("HuggingFace token found in environment")
            # Set it in environment variables for huggingface_hub to use
            os.environ['HF_TOKEN'] = hf_token
            os.environ['HUGGINGFACE_HUB_TOKEN'] = hf_token
            os.environ['HUGGINGFACEHUB_API_TOKEN'] = hf_token
        else:
            logger.warning("HF_TOKEN not found in environment variables. Some models may require authentication.")
    return hf_token

def create_qa_chain_from_pdf(pdf_path: str):
    """Create QA chain from a PDF file"""
    try:
        logger.info(f"Starting PDF processing for: {pdf_path}")
        
        # Get API key
        api_key = get_groq_api_key()
        logger.info("Groq API key retrieved successfully")
        
        # Load PDF document
        logger.info("Loading PDF document...")
        loader = PyPDFLoader(pdf_path)
        documents = loader.load()
        
        if not documents:
            raise ValueError("PDF file is empty or could not be loaded")
        
        logger.info(f"PDF loaded successfully. Number of pages: {len(documents)}")
        
        # Splitting text into chunks
        logger.info("Splitting documents into chunks...")
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        docs = splitter.split_documents(documents)
        logger.info(f"Documents split into {len(docs)} chunks")
        
        # Create embeddings
        logger.info("Creating embeddings...")
        hf_token = get_hf_token()
        if hf_token:
            logger.info(f"Using HuggingFace token for embeddings model (token starts with: {hf_token[:10]}...)")
            # Pass token in model_kwargs as well as set in environment
            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'token': hf_token, 'trust_remote_code': True}
            )
        else:
            logger.info("Creating embeddings without token (public model)")
            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={'trust_remote_code': True}
            )
        
        # Store in FAISS vector database
        logger.info("Creating FAISS vector store...")
        vector_db = FAISS.from_documents(docs, embeddings)
        retriever = vector_db.as_retriever()
        logger.info("Vector store created successfully")
        
        # Initialize LLM
        logger.info("Initializing Groq LLM...")
        llm = ChatGroq(model_name="llama-3.3-70b-versatile", api_key=api_key)
        
        # Create prompt template
        prompt = ChatPromptTemplate.from_template(
            "Use the following context to answer the question.\n\nContext: {context}\n\nQuestion: {question}"
        )
        
        # Create document chain
        logger.info("Creating document chain...")
        document_chain = create_stuff_documents_chain(llm, prompt)
        
        # Create question mapper that maps from input dictionary to retriever
        question_mapper = RunnablePassthrough.assign(
            context=lambda x: retriever.invoke(x["question"])
        )
        
        # Create retrieval chain
        qa_chain = question_mapper | document_chain
        logger.info("QA chain created successfully")
        
        return qa_chain
    except Exception as e:
        logger.error(f"Error in create_qa_chain_from_pdf: {str(e)}")
        logger.error(traceback.format_exc())
        raise

@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(..., description="PDF file to upload and process")):
    """
    Upload and process a PDF file for later querying
    
    - **file**: PDF file to upload and process
    - Returns a pdf_id that can be used to ask questions about this PDF
    """
    tmp_file_path = None
    pdf_id = None
    try:
        logger.info(f"Received PDF upload request - File: {file.filename}")
        
        # Validate file type
        if not file.filename or not file.filename.endswith('.pdf'):
            raise HTTPException(status_code=400, detail="File must be a PDF")
        
        # Generate unique ID for this PDF
        pdf_id = str(uuid.uuid4())
        logger.info(f"Generated PDF ID: {pdf_id}")
        
        # Create temporary file to store uploaded PDF
        logger.info("Creating temporary file...")
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            # Save uploaded file to temporary location
            content = await file.read()
            if not content:
                raise HTTPException(status_code=400, detail="Uploaded file is empty")
            
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
            logger.info(f"File saved to temporary location: {tmp_file_path}")
        
        # Create QA chain from PDF
        logger.info("Creating QA chain from PDF...")
        qa_chain = create_qa_chain_from_pdf(tmp_file_path)
        
        # Store the QA chain in memory
        pdf_storage[pdf_id] = qa_chain
        logger.info(f"PDF processed and stored with ID: {pdf_id}")
        
        return UploadResponse(
            pdf_id=pdf_id,
            message="PDF uploaded and processed successfully",
            filename=file.filename
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        logger.error(f"Error in upload_pdf: {error_msg}")
        logger.error(f"Traceback: {error_trace}")
        # Clean up stored PDF if something went wrong
        if pdf_id and pdf_id in pdf_storage:
            del pdf_storage[pdf_id]
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing PDF: {error_msg}"
        )
    finally:
        # Clean up temporary file
        if tmp_file_path and os.path.exists(tmp_file_path):
            try:
                os.unlink(tmp_file_path)
                logger.info(f"Temporary file deleted: {tmp_file_path}")
            except Exception as e:
                logger.warning(f"Failed to delete temporary file: {e}")

@app.post("/ask", response_model=QuestionResponse)
async def ask_question(request: QuestionRequest = Body(..., description="Question request with pdf_id and question")):
    """
    Ask a question about a previously uploaded PDF
    
    - **pdf_id**: The ID of the PDF returned from the /upload endpoint
    - **question**: The question to ask about the PDF content
    """
    try:
        logger.info(f"Received question request - PDF ID: {request.pdf_id}, Question: {request.question[:50]}...")
        
        # Validate inputs
        if not request.pdf_id or not request.pdf_id.strip():
            raise HTTPException(status_code=400, detail="pdf_id cannot be empty")
        
        if not request.question or not request.question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        
        # Check if PDF exists in storage
        if request.pdf_id not in pdf_storage:
            raise HTTPException(
                status_code=404, 
                detail=f"PDF with ID '{request.pdf_id}' not found. Please upload the PDF first using /upload endpoint."
            )
        
        # Get the QA chain for this PDF
        qa_chain = pdf_storage[request.pdf_id]
        logger.info(f"Found QA chain for PDF ID: {request.pdf_id}")
        
        # Invoke the QA chain with the question
        logger.info("Invoking QA chain with question...")
        response = qa_chain.invoke({"question": request.question})
        logger.info("QA chain response received")
        
        return QuestionResponse(answer=response)
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        error_msg = str(e)
        error_trace = traceback.format_exc()
        logger.error(f"Error in ask_question: {error_msg}")
        logger.error(f"Traceback: {error_trace}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing question: {error_msg}"
        )

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "PDF Q&A API is running",
        "endpoints": {
            "POST /upload": "Upload and process a PDF file (returns pdf_id)",
            "POST /ask": "Ask a question about a previously uploaded PDF (requires pdf_id and question)"
        }
    }

@app.on_event("startup")
async def startup_event():
    """Initialize tokens when the application starts"""
    try:
        # Pre-load tokens to verify they're available
        get_groq_api_key()
        hf_token = get_hf_token()
        logger.info("Application startup complete")
        if hf_token:
            logger.info("HuggingFace token is configured")
        else:
            logger.warning("HuggingFace token not found - some models may not work")
    except Exception as e:
        logger.error(f"Error during startup: {e}")

@app.get("/health")
async def health():
    """Health check endpoint"""
    try:
        get_groq_api_key()
        hf_token = get_hf_token()
        return {
            "status": "healthy", 
            "groq_api_key_configured": True,
            "hf_token_configured": hf_token is not None
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
