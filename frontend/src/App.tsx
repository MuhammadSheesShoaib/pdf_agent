import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { PdfUploadZone } from './components/PdfUploadZone';
import { ChatMessage } from './components/ChatMessage';
import { QuestionInput } from './components/QuestionInput';
import { TypingIndicator } from './components/TypingIndicator';
import { EmptyState } from './components/EmptyState';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UploadedFile {
  name: string;
  size: number;
  pdfId: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [question, setQuestion] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setMessages([]);
    
    try {
      // Upload PDF to backend
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Store uploaded file info with pdf_id
      setUploadedFile({
        name: file.name,
        size: file.size,
        pdfId: data.pdf_id,
      });

      // Welcome message after successful upload
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Great! I've loaded **${file.name}** and processed it successfully. I'm ready to answer any questions you have about this document. What would you like to know?`,
        timestamp: new Date(),
      }]);
    } catch (error) {
      // Show error message
      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Sorry, I encountered an error while uploading your PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setMessages([]);
    setQuestion('');
  };

  const handleSendQuestion = async () => {
    if (!question.trim() || !uploadedFile) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentQuestion = question;
    setQuestion('');
    setIsTyping(true);

    try {
      // Call the backend API with pdf_id and question
      const response = await fetch(`${API_BASE_URL}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_id: uploadedFile.pdfId,
          question: currentQuestion,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Header />
        
        <div className="mt-12">
          <PdfUploadZone
            uploadedFile={uploadedFile}
            onFileUpload={handleFileUpload}
            onRemoveFile={handleRemoveFile}
            isUploading={isUploading}
          />
        </div>

        {!uploadedFile && messages.length === 0 && (
          <div className="mt-16">
            <EmptyState />
          </div>
        )}

        {uploadedFile && (
          <div className="mt-12">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Chat Area */}
              <div className="h-[500px] overflow-y-auto p-6 space-y-6">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isTyping && <TypingIndicator />}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-slate-200 bg-slate-50 p-4">
                <QuestionInput
                  value={question}
                  onChange={setQuestion}
                  onSend={handleSendQuestion}
                  disabled={!uploadedFile || isTyping}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
