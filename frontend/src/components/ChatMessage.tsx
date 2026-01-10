import React from 'react';
import { User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const formatContent = (content: string) => {
    // Split by line breaks
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Check for bold text
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formatted = parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Check for bullet points
      if (line.trim().startsWith('•')) {
        return (
          <div key={index} className="flex gap-2 ml-2">
            <span className="text-blue-600 flex-shrink-0">•</span>
            <span>{formatted}</span>
          </div>
        );
      }

      // Regular line
      if (line.trim()) {
        return <p key={index}>{formatted}</p>;
      }

      return <div key={index} className="h-3" />;
    });
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
        isUser 
          ? 'bg-slate-200' 
          : 'bg-gradient-to-br from-blue-500 to-blue-600'
      }`}>
        {isUser ? (
          <User className="w-5 h-5 text-slate-700" />
        ) : (
          <Sparkles className="w-5 h-5 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block rounded-2xl px-5 py-3 space-y-2 ${
          isUser 
            ? 'bg-slate-900 text-white text-left' 
            : 'bg-slate-100 text-slate-800'
        }`}>
          <div className="text-[15px] leading-relaxed">
            {formatContent(message.content)}
          </div>
        </div>
      </div>
    </div>
  );
}
