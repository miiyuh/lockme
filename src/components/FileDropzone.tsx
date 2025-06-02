
"use client";

/**
 * FileDropzone Component
 * 
 * A versatile drag-and-drop file upload component that supports both single and multiple
 * file selection, with specialized handling for encryption and decryption operations.
 * 
 * Features:
 * - Drag-and-drop file upload interface
 * - Click to select files fallback
 * - Visual feedback during drag operations
 * - File type icon detection and display
 * - Multiple file selection support
 * - Mode-specific file type filtering (encrypt/decrypt)
 */

import type { FC, DragEvent, ReactNode } from 'react';
import { useState, useCallback } from 'react';

// Icons
import { 
  UploadCloud, 
  File as FileIcon, 
  FileText, 
  Image as ImageIcon, 
  Archive, 
  FileSpreadsheet, 
  Presentation, 
  FileAudio2, 
  FileVideo2, 
  FileCode2, 
  Files 
} from 'lucide-react';

// UI Components
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Props interface for the FileDropzone component
 */
interface FileDropzoneProps {
  /** Callback function triggered when files are dropped or selected */
  onFilesDrop: (files: File[]) => void;
  
  /** Optional additional CSS classes */
  className?: string;
  
  /** Operation mode affecting accepted file types */
  mode?: 'encrypt' | 'decrypt';
}

/**
 * Determines the appropriate icon to display based on file type and extension
 * 
 * @param file - The file object to analyze, or null if no file is present
 * @returns A React node containing the appropriate icon component
 */
const getFileIcon = (file: File | null): ReactNode => {
  // Default icon for null file
  if (!file) return <FileIcon size={24} className="mr-2 text-muted-foreground flex-shrink-0" />;

  const type = file.type;
  const name = file.name.toLowerCase();
  const iconClass = "mr-2 text-muted-foreground flex-shrink-0";

  // Image files
  if (type.startsWith('image/')) 
    return <ImageIcon size={24} className={iconClass} />;
  
  // PDF files
  if (type === 'application/pdf') 
    return <FileText size={24} className={iconClass} />;
  
  // Audio files
  if (type.startsWith('audio/')) 
    return <FileAudio2 size={24} className={iconClass} />;
  
  // Video files
  if (type.startsWith('video/')) 
    return <FileVideo2 size={24} className={iconClass} />;
  
  // Archive files
  if (type === 'application/zip' || 
      type === 'application/x-zip-compressed' || 
      name.endsWith('.zip') || 
      name.endsWith('.rar') || 
      name.endsWith('.tar') || 
      name.endsWith('.gz')) 
    return <Archive size={24} className={iconClass} />;
  
  // Spreadsheet files
  if (type.includes('spreadsheet') || 
      type.includes('excel') || 
      type.includes('sheet') || 
      name.endsWith('.xls') || 
      name.endsWith('.xlsx') || 
      name.endsWith('.csv') || 
      name.endsWith('.ods')) 
    return <FileSpreadsheet size={24} className={iconClass} />;
  
  // Presentation files
  if (type.includes('presentation') || 
      type.includes('powerpoint') || 
      name.endsWith('.ppt') || 
      name.endsWith('.pptx') || 
      name.endsWith('.odp')) 
    return <Presentation size={24} className={iconClass} />;
  
  // Document files
  if (type.includes('document') || 
      type.includes('word') || 
      name.endsWith('.doc') || 
      name.endsWith('.docx') || 
      name.endsWith('.odt') || 
      name.endsWith('.rtf')) 
    return <FileText size={24} className={iconClass} />;
  
  // Text files
  if (type.startsWith('text/plain') || 
      name.endsWith('.txt') || 
      name.endsWith('.md')) 
    return <FileText size={24} className={iconClass} />;
  
  // Code files
  if (type.startsWith('text/') || 
      type === 'application/json' || 
      type === 'application/xml' || 
      name.endsWith('.js') || name.endsWith('.ts') || 
      name.endsWith('.jsx') || name.endsWith('.tsx') || 
      name.endsWith('.json') || name.endsWith('.html') || 
      name.endsWith('.css') || name.endsWith('.py') || 
      name.endsWith('.java') || name.endsWith('.c') || 
      name.endsWith('.cpp') || name.endsWith('.cs') || 
      name.endsWith('.go') || name.endsWith('.php') || 
      name.endsWith('.rb') || name.endsWith('.swift') || 
      name.endsWith('.kt') || name.endsWith('.rs') || 
      name.endsWith('.sh')) 
    return <FileCode2 size={24} className={iconClass} />;
  
  // Default file icon for unknown types
  return <FileIcon size={24} className={iconClass} />;
};

/**
 * FileDropzone Component
 * 
 * A drag-and-drop interface for file uploads with visual feedback and 
 * specialized handling for different file types.
 * 
 * @param props - Component properties
 * @returns A styled dropzone component for file uploads
 */
const FileDropzone: FC<FileDropzoneProps> = ({ onFilesDrop, className, mode }) => {
  // Component state
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  /**
   * Handles drag enter events
   * Updates state to show active dragging feedback
   */
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  /**
   * Handles drag leave events
   * Resets the dragging state when files are dragged out
   */
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  /**
   * Handles drag over events
   * Prevents default browser behavior for drag operations
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  /**
   * Handles the file drop event
   * Processes files dropped into the dropzone and passes them to the callback
   * 
   * @param e - The drag event containing dropped files
   */
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      // Process dropped files if any are present
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const filesArray = Array.from(e.dataTransfer.files);
        setDroppedFiles(filesArray);
        onFilesDrop(filesArray);
        e.dataTransfer.clearData();
      }
    },
    [onFilesDrop]
  );

  /**
   * Handles file selection via the file input element
   * Triggers when files are selected using the file browser dialog
   * 
   * @param e - The change event from the file input
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setDroppedFiles(filesArray);
      onFilesDrop(filesArray);
    }
  };

  // Set acceptable file types based on operation mode
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
      {/* Hidden file input, triggered by clicking the dropzone */}
      <input
        type="file"
        id="fileInput"
        className="hidden"
        onChange={handleFileChange}
        accept={acceptType}
        multiple
      />

      {/* Upload cloud icon */}
      <UploadCloud 
        size={48} 
        className="mx-auto mb-4 text-muted-foreground" 
      />

      {/* Display selected files or dropzone instructions */}
      {droppedFiles.length > 0 ? (
        // Selected files display
        <div className="flex items-center justify-center text-foreground break-all">
          {/* Show appropriate icon based on number of files */}
          {droppedFiles.length === 1 
            ? getFileIcon(droppedFiles[0]) 
            : <Files size={24} className="mr-2 text-muted-foreground flex-shrink-0" />
          }
          
          {/* File name or count display */}
          <span className="truncate">
            {droppedFiles.length === 1 
              ? droppedFiles[0].name 
              : `${droppedFiles.length} files selected`
            }
          </span>
        </div>
      ) : (
        // Dropzone instructions
        <>
          <p className="text-lg font-semibold text-foreground">
            Drag & drop your file(s) here
          </p>
          <p className="text-sm text-muted-foreground">
            or click to select file(s) (from your computer)
          </p>
        </>
      )}
    </div>
  );
};

export default FileDropzone;
