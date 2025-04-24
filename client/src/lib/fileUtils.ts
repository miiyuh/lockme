// File size formatter
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// File icon selector
export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) {
    return 'image';
  } else if (fileType.startsWith('video/')) {
    return 'video';
  } else if (fileType.startsWith('audio/')) {
    return 'music';
  } else if (fileType.startsWith('text/')) {
    return 'file-text';
  } else if (fileType.includes('pdf')) {
    return 'file-text';
  } else if (fileType.includes('word') || fileType.includes('document')) {
    return 'file-text';
  } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
    return 'file-spreadsheet';
  } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
    return 'file-presentation';
  } else if (fileType.includes('zip') || fileType.includes('compressed')) {
    return 'archive';
  } else {
    return 'file';
  }
}

// Function to truncate long file names
export function truncateFileName(fileName: string, maxLength = 20): string {
  if (fileName.length <= maxLength) return fileName;
  
  const extension = fileName.lastIndexOf('.') !== -1 
    ? fileName.slice(fileName.lastIndexOf('.')) 
    : '';
    
  const nameWithoutExt = fileName.slice(0, fileName.length - extension.length);
  
  if (nameWithoutExt.length <= maxLength - 3) {
    return nameWithoutExt + extension;
  }
  
  return nameWithoutExt.slice(0, maxLength - 3 - extension.length) + '...' + extension;
}
