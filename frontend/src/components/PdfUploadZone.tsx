import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle2, X, Loader2 } from 'lucide-react';

interface PdfUploadZoneProps {
  uploadedFile: { name: string; size: number; pdfId: string } | null;
  onFileUpload: (file: File) => Promise<void>;
  onRemoveFile: () => void;
  isUploading?: boolean;
}

export function PdfUploadZone({ uploadedFile, onFileUpload, onRemoveFile, isUploading = false }: PdfUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      await onFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await onFileUpload(files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (uploadedFile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl">
            <File className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-slate-900">{uploadedFile.name}</h3>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-slate-500">{formatFileSize(uploadedFile.size)}</p>
          </div>
          <button
            onClick={onRemoveFile}
            disabled={isUploading}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Remove file"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-slate-900 mb-1">Processing PDF...</h3>
            <p className="text-sm text-slate-500">Please wait while we process your document</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-white rounded-2xl shadow-sm border-2 border-dashed transition-all ${
        isDragging
          ? 'border-blue-400 bg-blue-50'
          : 'border-slate-300 hover:border-slate-400'
      }`}
    >
      <div className="p-12 text-center">
        <div className="inline-flex p-4 bg-slate-100 rounded-2xl mb-6">
          <Upload className="w-12 h-12 text-slate-600" />
        </div>
        <h3 className="text-xl font-medium text-slate-900 mb-2">
          Drop your PDF here
        </h3>
        <p className="text-slate-500 mb-6">
          or click the button below to browse
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shadow-sm"
        >
          <Upload className="w-5 h-5" />
          Upload PDF
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
