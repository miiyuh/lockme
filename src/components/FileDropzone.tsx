
"use client";

import type { FC, DragEvent, ReactNode } from 'react';
import { useState, useCallback } from 'react';
import { UploadCloud, File as FileIcon, FileText, Image as ImageIcon, Archive, FileSpreadsheet, Presentation, FileAudio2, FileVideo2, FileCode2, Files } from 'lucide-react'; // Added Files icon
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFilesDrop: (files: File[]) => void; // Changed to handle multiple files
  className?: string;
  mode?: 'encrypt' | 'decrypt'; // Added mode to adjust accept criteria
}

const getFileIcon = (file: File | null): ReactNode => {
  if (!file) return <FileIcon size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;

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
  
  return <FileIcon size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;
};


const FileDropzone: FC<FileDropzoneProps> = ({ onFilesDrop, className, mode }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]); // Changed to handle multiple files

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
        const filesArray = Array.from(e.dataTransfer.files);
        setDroppedFiles(filesArray);
        onFilesDrop(filesArray);
        e.dataTransfer.clearData();
      }
    },
    [onFilesDrop]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setDroppedFiles(filesArray);
      onFilesDrop(filesArray);
    }
  };

  const acceptType = mode === 'decrypt' ? ".lockme" : "*";

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
        accept={acceptType}
        multiple // Allow multiple file selection
      />
      <UploadCloud size={48} className="mx-auto mb-4 text-muted-foreground" />
      {droppedFiles.length > 0 ? (
         <div className="flex items-center justify-center text-foreground break-all">
            {droppedFiles.length === 1 ? getFileIcon(droppedFiles[0]) : <Files size={24} className="mr-2 text-muted-foreground flex-shrink-0" />}
            <span className="truncate">
                {droppedFiles.length === 1 ? droppedFiles[0].name : `${droppedFiles.length} files selected`}
            </span>
        </div>
      ) : (
        <>
          <p className="text-lg font-semibold text-foreground">Drag & drop your file(s) here</p>
          <p className="text-sm text-muted-foreground">or click to select file(s) (from your computer)</p>
        </>
      )}
    </div>
  );
};

export default FileDropzone;
