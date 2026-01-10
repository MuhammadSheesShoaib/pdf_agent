import React from 'react';
import { Sparkles } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-4">
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-white" />
      </div>

      {/* Typing Animation */}
      <div className="flex-1">
        <div className="inline-block bg-slate-100 rounded-2xl px-5 py-4">
          <div className="flex gap-1.5">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
