"use client";

import type { FC, DragEvent, ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { UploadCloud, File, FileText, Image as ImageIcon, Archive, FileSpreadsheet, Presentation, FileAudio2, FileVideo2, FileCode2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFileDrop: (file: File) => void;
  className?: string;
}

const getFileIcon = (file: File | null): ReactNode => {
  if (!file) return <File size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;

  const type = file.type;
  const name = file.name.toLowerCase();

  if (type.startsWith('image/')) return <ImageIcon size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
  if (type === 'application/pdf') return <FileText size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
  if (type.startsWith('audio/')) return <FileAudio2 size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
  if (type.startsWith('video/')) return <FileVideo2 size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
  if (type === 'application/zip' || type === 'application/x-zip-compressed' || name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.tar') || name.endsWith('.gz')) return <Archive size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('sheet') || name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv') || name.endsWith('.ods')) return <FileSpreadsheet size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
  if (type.includes('presentation') || type.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx') || name.endsWith('.odp')) return <Presentation size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
  if (type.includes('document') || type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx') || name.endsWith('.odt') || name.endsWith('.rtf')) return <FileText size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
  if (type.startsWith('text/plain') || name.endsWith('.txt') || name.endsWith('.md')) return <FileText size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
  if (type.startsWith('text/') || type === 'application/json' || type === 'application/xml' || name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.jsx') || name.endsWith('.tsx') || name.endsWith('.json') || name.endsWith('.html') || name.endsWith('.css') || name.endsWith('.py') || name.endsWith('.java') || name.endsWith('.c') || name.endsWith('.cpp') || name.endsWith('.cs') || name.endsWith('.go') || name.endsWith('.php') || name.endsWith('.rb') || name.endsWith('.swift') || name.endsWith('.kt') || name.endsWith('.rs') || name.endsWith('.sh')) return <FileCode2 size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
  
  return <File size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
};


const FileDropzone: FC<FileDropzoneProps> = ({ onFileDrop, className }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        setDroppedFile(file);
        onFileDrop(file);
        e.dataTransfer.clearData();
      }
    },
    [onFileDrop]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setDroppedFile(file);
      onFileDrop(file);
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
        isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        onChange={handleFileChange}
        // Allow any file type for encryption, specific for decryption
        accept={className?.includes("accept-.lockme") ? ".lockme" : "*"}
      />
      <UploadCloud size={48} className="mx-auto mb-4 text-muted-foreground" />
      {droppedFile ? (
        <div className="flex items-center justify-center text-foreground break-all">
          {getFileIcon(droppedFile)}
          <span className="truncate">{droppedFile.name}</span>
        </div>
      ) : (
        <>
          <p className="text-lg font-semibold text-foreground">Drag & drop your file here</p>
          <p className="text-sm text-muted-foreground">or click to select a file (from your computer)</p>
        </>
      )}
    </div>
  );
};

export default FileDropzone;
