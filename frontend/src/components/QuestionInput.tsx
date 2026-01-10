import React from 'react';
import { Send } from 'lucide-react';

interface QuestionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export function QuestionInput({ value, onChange, onSend, disabled }: QuestionInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex gap-3 items-end">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask a question about your PDF…"
        className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all"
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm flex-shrink-0"
        aria-label="Send question"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
