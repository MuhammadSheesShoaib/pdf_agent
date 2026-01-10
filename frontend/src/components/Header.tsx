import React from 'react';
import { FileText } from 'lucide-react';

export function Header() {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
          <FileText className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-semibold text-slate-900">PDF Assistant</h1>
      </div>
      <p className="text-slate-600 text-lg">
        Upload a PDF and ask questions about it
      </p>
    </div>
  );
}
