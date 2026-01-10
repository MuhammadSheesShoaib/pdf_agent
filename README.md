# PDF Q&A Agent

A full-stack application that allows users to upload PDF documents and ask questions about them using AI-powered natural language processing.

## Features

- 📄 Upload PDF documents via drag-and-drop or file browser
- 💬 Ask questions about the uploaded PDF content
- 🤖 AI-powered responses using LangChain and Groq LLM
- 🎨 Modern, responsive UI built with React and TypeScript
- ⚡ Fast API built with FastAPI

## Project Structure

```
pdf_agent/
├── backend/          # FastAPI backend
│   ├── main.py      # Main API application
│   └── requirements.txt
└── frontend/         # React frontend
    ├── src/
    │   ├── App.tsx
    │   └── components/
    └── package.json
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn
- Groq API key (get one from https://console.groq.com/)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (if not already created):
```bash
python -m venv venv
```

3. Activate the virtual environment:
   - On Windows:
   ```bash
   venv\Scripts\activate
   ```
   - On macOS/Linux:
   ```bash
   source venv/bin/activate
   ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file in the `backend` directory:
```env
GROQ_API_KEY=your_groq_api_key_here
HF_TOKEN=your_huggingface_token_here
```

**Note:** The `HF_TOKEN` is optional but recommended if you're using private or gated models. You can get a token from [HuggingFace Settings](https://huggingface.co/settings/tokens).

6. Run the backend server:
```bash
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create a `.env` file in the `frontend` directory if you want to customize the API URL:
```env
VITE_API_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

1. Start both the backend and frontend servers (see Setup Instructions above)
2. Open your browser and navigate to `http://localhost:3000`
3. Upload a PDF file by dragging and dropping it or clicking the upload button
4. Once the PDF is uploaded, you'll see a welcome message
5. Type your question in the input field and press Enter or click Send
6. Wait for the AI to process your question and provide an answer based on the PDF content

## API Endpoints

### POST `/ask`
Upload a PDF file and ask a question about it.

**Request:**
- Content-Type: `multipart/form-data`
- `file`: PDF file
- `question`: Question text

**Response:**
```json
{
  "answer": "Answer to the question based on PDF content"
}
```

### GET `/health`
Health check endpoint to verify the API is running.

### GET `/`
Root endpoint with API information.

## Technology Stack

### Backend
- FastAPI - Modern Python web framework
- LangChain - Framework for building LLM applications
- Groq - Fast LLM inference
- FAISS - Vector database for similarity search
- HuggingFace - Embeddings model

### Frontend
- React 18 - UI library
- TypeScript - Type safety
- Vite - Build tool
- Tailwind CSS - Styling
- Radix UI - Component library

## Troubleshooting

### Backend Issues

1. **Module not found errors**: Make sure all dependencies are installed:
   ```bash
   pip install -r requirements.txt
   ```

2. **GROQ_API_KEY error**: Ensure your `.env` file exists in the `backend` directory and contains a valid API key.

3. **Port already in use**: Change the port in the uvicorn command:
   ```bash
   uvicorn main:app --reload --port 8001
   ```

### Frontend Issues

1. **Cannot connect to backend**: 
   - Ensure the backend is running on port 8000
   - Check the `VITE_API_URL` in your frontend `.env` file
   - Verify CORS is properly configured in the backend

2. **Dependencies not installed**: Run `npm install` in the frontend directory

## Development

### Backend Development
- The backend uses FastAPI with auto-reload enabled
- API documentation is available at `http://localhost:8000/docs` (Swagger UI)
- Alternative docs at `http://localhost:8000/redoc`

### Frontend Development
- The frontend uses Vite with hot module replacement
- Changes will automatically reload in the browser

## License

MIT
