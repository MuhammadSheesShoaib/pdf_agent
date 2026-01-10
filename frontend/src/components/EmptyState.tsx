import React from 'react';
import { MessageCircle, Upload, Sparkles } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12">
        <div className="mb-8">
          <div className="inline-flex p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full">
            <Sparkles className="w-10 h-10 text-blue-600" />
          </div>
        </div>
        
        <h2 className="text-2xl font-medium text-slate-900 mb-4">
          How to use PDF Assistant
        </h2>
        
        <div className="space-y-6 text-left">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">1. Upload Your PDF</h3>
              <p className="text-slate-600">
                Drag and drop your PDF file or click the upload button above to get started.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">2. Ask Questions</h3>
              <p className="text-slate-600">
                Type your questions in the chat interface and get instant answers about the content.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-1">3. Get Insights</h3>
              <p className="text-slate-600">
                Receive detailed answers with key highlights, summaries, and relevant information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
