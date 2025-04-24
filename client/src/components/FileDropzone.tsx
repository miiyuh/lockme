import { useState, useCallback } from "react";
import { Upload, X, FileIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FileDropzoneProps {
  onFileSelect: (file: globalThis.File) => void;
  accept?: string;
  maxSize?: number;
}

export function FileDropzone({
  onFileSelect,
  accept = "*",
  maxSize = 10 * 1024 * 1024, // 10MB
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: globalThis.File): boolean => {
    setError(null);

    // Check file size
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      return false;
    }

    // Check file type if accept is specified
    if (accept !== "*") {
      const acceptedTypes = accept.split(",").map(type => type.trim());
      const fileType = file.type || "";
      const fileExtension = `.${file.name.split('.').pop()}`;
      
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith(".")) {
          return fileExtension.toLowerCase() === type.toLowerCase();
        }
        if (type.includes("*")) {
          const typePrefix = type.split("*")[0];
          return fileType.startsWith(typePrefix);
        }
        return fileType === type;
      });

      if (!isAccepted) {
        setError(`File type not accepted. Please select a file of type: ${accept}`);
        return false;
      }
    }

    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect, validateFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  }, [onFileSelect, validateFile]);

  const clearSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  return (
    <div className="w-full">
      {!selectedFile ? (
        <Card
          className={`border-2 border-dashed ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300"
          } transition-colors duration-200`}
        >
          <CardContent
            className="flex flex-col items-center justify-center p-6 cursor-pointer"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
          >
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept={accept}
              onChange={handleFileSelect}
            />
            <Upload size={40} className="text-gray-400 mb-4" />
            <p className="text-sm font-medium mb-1">
              Drag & drop your file here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports any file type. Max file size: {maxSize / (1024 * 1024)}MB
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-gray-200">
          <CardContent className="flex items-center p-4">
            <FileIcon size={24} className="text-primary mr-3" />
            <div className="flex-1 overflow-hidden">
              <p className="font-medium text-sm truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button 
              onClick={clearSelectedFile} 
              className="rounded-full p-1 hover:bg-gray-100"
              title="Remove file"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
