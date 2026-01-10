import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_groq import ChatGroq
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from dotenv import load_dotenv

load_dotenv()
groq_api_key = os.getenv("GROQ_API_KEY")

loader = PyPDFLoader("your_pdf_doc.pdf")
documents = loader.load()

# Splitting text into chunks
splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
docs = splitter.split_documents(documents)

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Storing in FAISS vector database
vector_db = FAISS.from_documents(docs, embeddings)
retriever = vector_db.as_retriever()

llm = ChatGroq(model_name="llama-3.3-70b-versatile", api_key=groq_api_key)

prompt = ChatPromptTemplate.from_template(
    "Use the following context to answer the question.\n\nContext: {context}\n\nQuestion: {question}"
)

document_chain = create_stuff_documents_chain(llm, prompt)

# Creating a question mapper that will map from the input dictionary to the retriever
question_mapper = RunnablePassthrough.assign(
    context=lambda x: retriever.invoke(x["question"])
)

# Creating retrieval chain
qa_chain = question_mapper | document_chain

query = input("what you want to know from resume?")
response = qa_chain.invoke({"question": query})

print(response)