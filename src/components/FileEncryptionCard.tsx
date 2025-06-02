
// @ts-nocheck
"use client";

/**
 * FileEncryptionCard Component
 * 
 * A comprehensive UI component for secure file encryption and decryption operations.
 * Provides client-side encryption using WebCrypto API with AES-GCM algorithm,
 * along with passphrase strength analysis, AI-generated passphrases,
 * and sharing capabilities.
 * 
 * Features:
 * - File drag-and-drop interface with multi-file support
 * - Client-side encryption/decryption with AES-GCM
 * - Passphrase strength analysis (basic rules and AI-powered)
 * - Progress tracking for file operations
 * - AI-generated secure passphrases
 * - Secure file sharing workflow
 * - Activity logging for authenticated users
 */

// React & Type Imports
import type { FC, ChangeEvent } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';

// Form Handling
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileEncryptionSchema, type FileEncryptionFormValues } from '@/lib/schemas';

// Custom Components & Hooks
import FileDropzone from '@/components/FileDropzone';
import { useToast } from '@/hooks/use-toast';
import { useActivity } from '@/contexts/ActivityContext';
import { useAuth } from '@/contexts/AuthContext';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Icons
import { 
  ShieldCheck, ShieldOff, Loader2, KeyRound, Download, Lock, Unlock, Eye, 
  EyeOff, Info, Share2, Copy, AlertTriangle, FileText, XCircle, 
  Wand2, Trash2 
} from 'lucide-react';
import { SparklesIcon } from 'lucide-react';

// Services & Utilities
import { handleAnalyzePassphraseStrengthAction, handleGeneratePassphraseAction } from '@/app/actions';
import { addActivity } from '@/lib/services/firestoreService';
import type { AnalyzePassphraseStrengthOutput } from '@/ai/flows/analyze-passphrase-strength';
import { cn } from '@/lib/utils';

/**
 * Cryptography Constants
 */
const SALT_LENGTH = 16;            // Salt length in bytes
const IV_LENGTH = 12;              // Initialization vector length in bytes
const PBKDF2_ITERATIONS = 100000;  // Number of iterations for key derivation

/**
 * File Size Limits
 */
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;       // 100MB per file
const MAX_TOTAL_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024; // 500MB total
const MAX_FILES_IN_BATCH = 10;                       // Maximum files per operation

/**
 * Props interface for the FileEncryptionCard component
 */
interface FileEncryptionCardProps {
  /** Operation mode: encrypt or decrypt */
  mode: 'encrypt' | 'decrypt';
}

/**
 * Interface for basic password strength assessment
 */
interface PasswordStrength {
  /** Strength level: 0 (very weak) to 4 (strong) */
  level: 0 | 1 | 2 | 3 | 4;
  
  /** Text representation of strength */
  text: string;
  
  /** CSS color class for visual indication */
  color: string;
}

/**
 * Interface for AI-powered password strength analysis
 * Extends the output from the analyze-passphrase-strength AI flow
 */
interface AIPasswordStrength extends AnalyzePassphraseStrengthOutput {
  /** Indicates if AI analysis is in progress */
  isLoading?: boolean;
}

/**
 * Assesses password strength based on common security rules
 * 
 * Evaluates:
 * - Length (minimum 8, better if 12+)
 * - Character variety (lowercase, uppercase, numbers, symbols)
 * 
 * @param password - The password string to evaluate
 * @returns A PasswordStrength object with level, text description and color
 */
const checkPasswordStrength = (password: string): PasswordStrength => {
  // Start with a score of 0
  let score = 0;
  
  // Check for minimum length
  if (!password || password.length < 8) {
    return { level: 0, text: "Very Weak", color: "bg-red-500" };
  }
  
  // Basic length check
  score++;
  
  // Length bonus
  if (password.length >= 12) score++;
  
  // Case variety (lower and upper)
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  
  // Number inclusion
  if (/\d/.test(password)) score++;
  
  // Special character inclusion
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  // Convert score to strength level
  if (score < 2) return { level: 1, text: "Weak", color: "bg-orange-500" };
  if (score === 2) return { level: 2, text: "Fair", color: "bg-yellow-500" };
  if (score === 3) return { level: 3, text: "Good", color: "bg-lime-500" };
  
  // Maximum strength
  return { level: 4, text: "Strong", color: "bg-green-500" };
};

/**
 * FileEncryptionCard Component
 * 
 * Provides a user interface for encrypting and decrypting files
 * with secure cryptography and password management features.
 * 
 * @param props - Component properties
 * @returns A card component for file encryption/decryption
 */
const FileEncryptionCard: FC<FileEncryptionCardProps> = ({ mode }) => {
  // Authentication and activity tracking
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivity();
  const { toast } = useToast();
  
  // File management state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [lastEncryptedDetails, setLastEncryptedDetails] = useState<{
    fileName: string;
    passphraseUsed: string;
    blob: Blob
  } | null>(null);
  
  // Processing state
  const [progress, setProgress] = useState(0);
  const [currentFileProgress, setCurrentFileProgress] = useState(0);
  const [processingFileIndex, setProcessingFileIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Password management state
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [aiPasswordStrength, setAiPasswordStrength] = useState<AIPasswordStrength | null>(null);
  const [isGeneratingAIPassphrase, setIsGeneratingAIPassphrase] = useState(false);
  
  // UI state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  
  // Refs
  const passphraseInputRef = useRef<HTMLInputElement | null>(null);
  const aiAnalysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Form initialization with zod schema validation
   */
  const form = useForm<FileEncryptionFormValues>({
    resolver: zodResolver(FileEncryptionSchema),
    defaultValues: { passphrase: '' },
    mode: 'onChange',
  });
  /**
   * Handles files dropped into the dropzone
   * 
   * Validates files for size constraints, file type requirements,
   * and adds valid files to the selection.
   * 
   * @param files - Array of files from the drop or selection event
   */
  const handleFileDrop = (files: File[]) => {
    let totalSize = 0;
    const validFiles: File[] = [];
    
    // Check if too many files were selected at once
    if (files.length > MAX_FILES_IN_BATCH) {
      toast({ 
        title: "Too Many Files", 
        description: `Max ${MAX_FILES_IN_BATCH} files.`, 
        variant: "destructive" 
      }); 
      return;
    }
    
    // Validate each file individually
    for (const file of files) {
      // Check individual file size limit
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({ 
          title: "File Too Large", 
          description: `${file.name} exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB. Removed.`, 
          variant: "destructive" 
        }); 
        continue;
      }
      
      // For decrypt mode, ensure file has .lockme extension
      if (mode === 'decrypt' && !file.name.endsWith('.lockme')) {
        toast({ 
          title: "Invalid File Type", 
          description: `${file.name} is not a .lockme file. Removed.`, 
          variant: "destructive" 
        }); 
        continue;
      }
      
      // Track total size and add to valid files
      totalSize += file.size;
      validFiles.push(file);
    }
    
    // Check total batch size limit
    if (totalSize > MAX_TOTAL_UPLOAD_SIZE_BYTES) {
      toast({ 
        title: "Total Size Exceeded", 
        description: `Total size exceeds ${MAX_TOTAL_UPLOAD_SIZE_BYTES / (1024*1024)}MB.`, 
        variant: "destructive" 
      }); 
      return;
    }
    
    // Update selected files, ensuring we don't exceed maximum batch size
    setSelectedFiles(currentFiles => 
      [...currentFiles, ...validFiles].slice(0, MAX_FILES_IN_BATCH)
    );
    
    // Reset progress indicators
    setProgress(0);
    setCurrentFileProgress(0);
    
    // Show success notification if files were added
    if (validFiles.length > 0) {
      toast({ 
        title: "Files Added", 
        description: `${validFiles.length} file(s) ready.` 
      });
    }
    
    // Reset related states
    setPasswordStrength(null);
    setAiPasswordStrength(null);
    setLastEncryptedDetails(null);
  };
  
  /**
   * Removes all selected files from the component state
   */
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    toast({ 
      title: "Selection Cleared", 
      description: "All selected files have been removed." 
    });
  };

  /**
   * Removes a single file from the selection by index
   * 
   * @param indexToRemove - Array index of the file to remove
   */
  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles(prevFiles => 
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  /**
   * Triggers browser download for a processed file
   * 
   * @param blob - The file blob to download
   * @param fileName - Name to use for the downloaded file
   */
  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = fileName;
    
    // Append, click, and clean up
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  /**
   * Processes a file for encryption or decryption using WebCrypto API
   * 
   * Implements AES-GCM encryption with PBKDF2 key derivation for secure
   * file processing. For encrypted files, it stores the salt and IV
   * at the beginning of the file.
   * 
   * @param file - The file to process
   * @param passphrase - The passphrase for encryption/decryption
   * @param operation - Whether to encrypt or decrypt
   * @param onProgress - Callback function to report progress (0-100)
   * @returns A Promise resolving to the processed file blob or null if failed
   */
  const processFile = async (
    file: File, 
    passphrase: string, 
    operation: 'encrypt' | 'decrypt', 
    onProgress: (p: number) => void
  ): Promise<Blob | null> => {
    // Initialize progress
    onProgress(0);
    
    try {
      // For encryption, generate a random salt
      // For decryption, we'll extract it from the file
      const salt = operation === 'encrypt' 
        ? window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH)) 
        : undefined;
      
      onProgress(operation === 'encrypt' ? 10 : 5);
      
      // Read the file into an ArrayBuffer
      let fileBuffer = await file.arrayBuffer();
      onProgress(operation === 'encrypt' ? 20 : 15);
      
      // Set up variables for cryptographic operations
      let actualSalt = salt;
      let iv: Uint8Array;
      let dataToProcess: ArrayBuffer;
      
      // Handle decrypt-specific preprocessing
      if (operation === 'decrypt') {
        // Validate file format
        if (fileBuffer.byteLength < SALT_LENGTH + IV_LENGTH) {
          throw new Error("Invalid encrypted file format.");
        }
        
        // Extract salt and IV from beginning of file
        actualSalt = new Uint8Array(fileBuffer.slice(0, SALT_LENGTH));
        iv = new Uint8Array(fileBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH));
        
        // Extract the encrypted data (everything after salt and IV)
        dataToProcess = fileBuffer.slice(SALT_LENGTH + IV_LENGTH);
        onProgress(25);
      } else {
        // For encryption, generate a random IV and use the whole file
        iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        dataToProcess = fileBuffer;
        onProgress(30);
      }
      
      // Import the passphrase as a key for PBKDF2
      const passphraseKey = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      onProgress(operation === 'encrypt' ? 40 : 35);
      
      // Derive the encryption/decryption key using PBKDF2
      const derivedKey = await window.crypto.subtle.deriveKey(
        { 
          name: 'PBKDF2', 
          salt: actualSalt!, 
          iterations: PBKDF2_ITERATIONS, 
          hash: 'SHA-256' 
        },
        passphraseKey,
        { name: 'AES-GCM', length: 256 },
        true,
        [operation]
      );
      onProgress(operation === 'encrypt' ? 60 : 50);
      
      // Perform the actual encrypt/decrypt operation
      const resultBuffer = await window.crypto.subtle[operation](
        { name: 'AES-GCM', iv: iv! },
        derivedKey,
        dataToProcess
      );
      onProgress(operation === 'encrypt' ? 80 : 70);
      
      // Process the result differently based on operation
      if (operation === 'encrypt') {
        // For encryption, combine salt + IV + encrypted data
        const encryptedFileContent = new Uint8Array(
          salt!.length + iv!.length + resultBuffer.byteLength
        );
        
        // Write each part to the output buffer
        encryptedFileContent.set(salt!, 0);
        encryptedFileContent.set(iv!, salt!.length);
        encryptedFileContent.set(
          new Uint8Array(resultBuffer),
          salt!.length + iv!.length
        );
        
        onProgress(90);
        return new Blob([encryptedFileContent], { type: 'application/octet-stream' });
      } else {
        // For decryption, try to determine appropriate MIME type
        let blobType = 'application/octet-stream';
        
        // Extract original filename (remove .lockme extension)
        const originalFileName = file.name.endsWith('.lockme') 
          ? file.name.slice(0, -'.lockme'.length) 
          : `decrypted_${file.name}`;
        
        // Try to determine MIME type from file extension
        const extension = originalFileName.split('.').pop()?.toLowerCase();
        
        if (extension === 'txt' || extension === 'md') 
          blobType = 'text/plain';
        else if (extension === 'jpg' || extension === 'jpeg') 
          blobType = 'image/jpeg';
        else if (extension === 'png') 
          blobType = 'image/png';
        else if (extension === 'pdf') 
          blobType = 'application/pdf';
        
        onProgress(90);
        return new Blob([resultBuffer], { type: blobType });
      }
    } catch (error) {
      // Log and report errors
      console.error(`${operation} error for ${file.name}:`, error);
      
      toast({
        title: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Failed: ${file.name}`,
        description: (error as Error).message || `Error processing.`,
        variant: "destructive"
      });
      
      onProgress(100);
      return null;
    }
  };
  /**
   * Form submission handler
   * 
   * Processes all selected files for encryption or decryption,
   * handles progress tracking, and manages user notifications.
   * 
   * @param values - Form values containing the passphrase
   */
  const onSubmit = async (values: FileEncryptionFormValues) => {
    // Validate file selection
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files",
        description: "Please select file(s).",
        variant: "destructive"
      });
      return;
    }
    
    // Initialize processing state
    setIsProcessing(true);
    setProgress(0);
    setLastEncryptedDetails(null);
    
    // Track overall success
    let allSuccessful = true;
    
    // Process each file sequentially
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Update UI state for current file
      setProcessingFileIndex(i);
      setCurrentFileProgress(0);
      
      // Process the file
      const processedBlob = await processFile(
        file,
        values.passphrase,
        mode,
        setCurrentFileProgress
      );
      
      // Handle successful processing
      if (processedBlob) {
        let downloadFileName: string;
        
        // Set appropriate filename based on operation
        if (mode === 'encrypt') {
          downloadFileName = `${file.name}.lockme`;
          
          // For single file encryption, store details for sharing
          if (selectedFiles.length === 1) {
            setLastEncryptedDetails({
              fileName: file.name,
              passphraseUsed: values.passphrase,
              blob: processedBlob
            });
          }
        } else {
          // For decryption, remove .lockme extension or prefix with "decrypted_"
          downloadFileName = file.name.endsWith('.lockme')
            ? file.name.slice(0, -'.lockme'.length)
            : `decrypted_${file.name}`;
        }
        
        // Trigger file download
        triggerDownload(processedBlob, downloadFileName);
        
        // Log activity for authenticated users
        if (user?.uid) {
          try {
            await addActivity(
              mode,
              `${mode.charAt(0).toUpperCase() + mode.slice(1)}ed file: ${file.name}`,
              { fileName: file.name, userId: user.uid }
            );
            triggerActivityRefresh();
          } catch (logError) {
            console.error(`Failed to log activity for ${file.name}:`, logError);
            toast({
              title: "Logging Failed",
              description: `Could not record ${mode} activity.`,
              variant: "warning"
            });
          }
        } else {
          triggerActivityRefresh();
        }
      } else {
        // Mark as unsuccessful if any file fails
        allSuccessful = false;
      }
      
      // Update progress
      setCurrentFileProgress(100);
      setProgress(((i + 1) / selectedFiles.length) * 100);
    }
    
    // Reset processing state
    setIsProcessing(false);
    setProcessingFileIndex(0);
    
    // Show appropriate completion notification
    if (allSuccessful) {
      toast({
        title: "Complete!",
        description: `${selectedFiles.length} file(s) processed.`
      });
    } else if (selectedFiles.length > 1) {
      toast({
        title: "Partially Complete",
        description: `Some files failed.`,
        variant: "warning"
      });
    }
  };
    /**
   * Generates a secure passphrase using AI
   * 
   * Uses the AI service to create a strong, memorable passphrase
   * and updates the form with the result.
   */
  const generateAIPassphrase = async () => {
    // Authentication check
    if (!user || !user.uid) {
      toast({
        title: "Login Required",
        description: "Please log in to use AI features.",
        variant: "destructive"
      });
      return;
    }
    
    // Set loading state
    setIsGeneratingAIPassphrase(true);
    
    try {
      // Call server action to generate passphrase
      const result = await handleGeneratePassphraseAction({
        length: 16,
        includeSymbols: true,
        includeNumbers: true
      }, user.uid);
      
      // Update form with generated passphrase
      form.setValue('passphrase', result.passphrase, { shouldValidate: true });
      
      // Trigger strength analysis
      handlePassphraseSideEffects(result.passphrase);
      
      // Show success notification
      toast({
        title: "AI Passphrase Generated",
        description: "Passphrase field updated."
      });
    } catch (error) {
      // Handle errors
      console.error("Error generating AI passphrase:", error);
      
      toast({
        title: "AI Generation Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      // Reset loading state
      setIsGeneratingAIPassphrase(false);
    }
  };

  /**
   * Analyzes passphrase strength using AI
   * 
   * Sends the passphrase to the AI service for advanced strength analysis
   * and recommendations for improvement.
   * 
   * @param passphrase - The passphrase to analyze
   */
  const analyzePassphraseWithAI = useCallback(async (passphrase: string) => {
    // Skip analysis for very short passphrases
    if (!passphrase || passphrase.length < 4) {
      setAiPasswordStrength(null);
      return;
    }
    
    // Set loading state
    setAiPasswordStrength(prev => ({
      ...prev,
      isLoading: true,
      feedback: 'Analyzing...',
      suggestions: []
    }));
    
    try {
      // Call server action for AI analysis
      const result = await handleAnalyzePassphraseStrengthAction({ passphrase });
      
      // Update state with analysis results
      setAiPasswordStrength({
        ...result,
        isLoading: false
      });
    } catch (error) {
      // Handle errors gracefully
      console.warn("AI strength analysis failed:", error);
      
      setAiPasswordStrength({
        strengthLevel: 0,
        feedback: "AI analysis unavailable.",
        suggestions: [],
        isLoading: false
      });
    }
  }, []);

  /**
   * Handles side effects when passphrase changes
   * 
   * Performs strength analysis and schedules AI analysis with debouncing
   * 
   * @param currentPassphraseValue - The current passphrase to evaluate
   */
  const handlePassphraseSideEffects = (currentPassphraseValue: string) => {
    // Only analyze strength for encryption mode
    if (mode === 'encrypt') {
      // Perform basic strength check
      setPasswordStrength(checkPasswordStrength(currentPassphraseValue));
      
      // Clear any pending AI analysis
      if (aiAnalysisTimeoutRef.current) {
        clearTimeout(aiAnalysisTimeoutRef.current);
      }
      
      // Schedule AI analysis with debounce for passphrases of sufficient length
      if (currentPassphraseValue.length >= 8) {
        aiAnalysisTimeoutRef.current = setTimeout(() => {
          analyzePassphraseWithAI(currentPassphraseValue);
        }, 750);
      } else {
        setAiPasswordStrength(null);
      }
    } else {
      // No strength analysis needed for decryption
      setPasswordStrength(null);
      setAiPasswordStrength(null);
    }
  };
  /**
   * Set up keyboard shortcut for toggling password visibility
   * and handle cleanup of timeouts
   */
  useEffect(() => {
    const inputElement = passphraseInputRef.current;
    
    /**
     * Handle keyboard shortcuts
     * Specifically Ctrl/Cmd+Shift+P to toggle password visibility
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        document.activeElement === inputElement && 
        (event.ctrlKey || event.metaKey) && 
        event.shiftKey && 
        event.key.toLowerCase() === 'p'
      ) {
        event.preventDefault();
        setShowPassword(prev => !prev);
      }
    };
    
    // Add event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Clear any pending AI analysis
      if (aiAnalysisTimeoutRef.current) {
        clearTimeout(aiAnalysisTimeoutRef.current);
      }
    };
  }, []);

  // Dynamic content based on operation mode
  const cardTitle = mode === 'encrypt' 
    ? "Encrypt Your File(s)" 
    : "Decrypt Your File(s)";
    
  const cardDescription = mode === 'encrypt' 
    ? `Select up to ${MAX_FILES_IN_BATCH} files. Max ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB/file, ${MAX_TOTAL_UPLOAD_SIZE_BYTES / (1024*1024)}MB total.` 
    : `Select up to ${MAX_FILES_IN_BATCH} encrypted (.lockme) files.`;
    
  const buttonText = mode === 'encrypt' 
    ? "Encrypt File(s)" 
    : "Decrypt File(s)";
    
  const ButtonIcon = mode === 'encrypt' 
    ? ShieldCheck 
    : ShieldOff;
    
  const TitleIcon = mode === 'encrypt' 
    ? Lock 
    : Unlock;
  return (
    <>
      <Card className="w-full shadow-xl">
        {/* Card Header with Title and Help Icon */}
        <CardHeader>
          <div className="flex items-center justify-between">
            {/* Title with appropriate icon based on mode */}
            <CardTitle className="flex items-center text-2xl">
              <TitleIcon className="mr-2 h-6 w-6 text-primary" />
              {cardTitle}
            </CardTitle>
            
            {/* Help tooltip with instructions */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Info className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="bottom" 
                  align="end" 
                  className="max-w-xs bg-popover text-popover-foreground p-3 rounded-lg shadow-md"
                >
                  {/* Mode-specific instructions */}
                  {mode === 'encrypt' ? (
                    <>
                      <p className="text-sm font-medium mb-1">How to Encrypt:</p>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        <li>Drag & drop or click to select.</li>
                        <li>Max {MAX_FILES_IN_BATCH} files, {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB/file, {MAX_TOTAL_UPLOAD_SIZE_BYTES / (1024*1024)}MB total.</li>
                        <li>Enter a strong passphrase.</li>
                        <li>Click 'Encrypt File(s)'.</li>
                        <li>Ctrl/Cmd+Shift+P to toggle passphrase visibility.</li>
                        <li>Files are encrypted locally and downloaded with '.lockme'.</li>
                        <li>Keep passphrase safe!</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium mb-1">How to Decrypt:</p>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        <li>Drag & drop or click to select '.lockme' file(s).</li>
                        <li>Max {MAX_FILES_IN_BATCH} files.</li>
                        <li>Enter exact passphrase.</li>
                        <li>Ctrl/Cmd+Shift+P to toggle passphrase visibility.</li>
                        <li>Click 'Decrypt File(s)'.</li>
                        <li>Files decrypted locally and downloaded.</li>
                      </ul>
                    </>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* File Dropzone */}
              <FileDropzone 
                onFilesDrop={handleFileDrop} 
                className={mode === 'decrypt' ? "accept-.lockme" : ""} 
                mode={mode} 
              />
              
              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium text-foreground">
                      Selected file(s): ({selectedFiles.length})
                    </Label>
                    
                    {/* Clear All Button */}
                    {selectedFiles.length > 0 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={clearSelectedFiles} 
                        className="text-xs"
                      >
                        <Trash2 className="mr-1.5 h-3 w-3"/>
                        Clear All
                      </Button>
                    )}
                  </div>
                  
                  {/* File List */}
                  <ul className="list-inside text-sm text-muted-foreground max-h-40 overflow-y-auto space-y-1 border p-2 rounded-md bg-muted/30">
                    {selectedFiles.map((file, index) => (
                      <li 
                        key={`${file.name}-${index}-${file.lastModified}`} 
                        className="flex items-center justify-between p-1.5 bg-muted/50 rounded-md hover:bg-muted"
                      >
                        {/* File name and size */}
                        <span className="truncate flex-grow mr-2">
                          {file.name} ({(file.size / (1024*1024)).toFixed(2)} MB)
                        </span>
                        
                        {/* Remove file button */}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10 flex-shrink-0" 
                          onClick={() => removeSelectedFile(index)} 
                          aria-label={`Remove ${file.name}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}              {/* Passphrase Form Field */}
              <FormField 
                control={form.control} 
                name="passphrase" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passphrase</FormLabel>
                    <div className="flex items-center gap-2">
                      {/* Passphrase Input with Toggle Visibility */}
                      <div className="relative flex-grow">
                        <FormControl>
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter your secure passphrase" 
                            {...field} 
                            ref={(e) => { 
                              field.ref(e); 
                              passphraseInputRef.current = e; 
                            }} 
                            onChange={(e) => { 
                              field.onChange(e); 
                              handlePassphraseSideEffects(e.target.value); 
                            }} 
                            className="pr-10" 
                          />
                        </FormControl>
                        
                        {/* Toggle Password Visibility Button */}
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground" 
                          onClick={() => setShowPassword(!showPassword)} 
                          tabIndex={-1}
                        >
                          <span className="sr-only">
                            {showPassword ? "Hide" : "Show"} password
                          </span>
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      
                      {/* AI Passphrase Generator Button (Encrypt mode only) */}
                      {mode === 'encrypt' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                onClick={generateAIPassphrase} 
                                disabled={isProcessing || isGeneratingAIPassphrase} 
                                aria-label="Generate passphrase with AI"
                              >
                                {isGeneratingAIPassphrase 
                                  ? <Loader2 className="h-4 w-4 animate-spin" /> 
                                  : <Wand2 className="h-4 w-4" />
                                }
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Generate with AI</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    
                    {/* Basic Password Strength Indicator */}
                    {mode === 'encrypt' && passwordStrength && field.value && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Rule-based Strength: {passwordStrength.text}
                          </span>
                        </div>
                        <Progress 
                          value={passwordStrength.level * 25} 
                          className={`h-2 ${passwordStrength.color}`} 
                        />
                      </div>
                    )}
                    
                    {/* AI Password Strength Analysis */}
                    {mode === 'encrypt' && aiPasswordStrength && field.value && (
                      <div className="mt-2 p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center text-xs font-medium text-muted-foreground mb-1">
                          <SparklesIcon className="mr-2 h-4 w-4 text-primary" />
                          AI Strength Analysis:
                          {aiPasswordStrength.isLoading && (
                            <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                          )}
                        </div>
                        
                        {/* AI Feedback */}
                        <p className="text-xs text-foreground">
                          {aiPasswordStrength.feedback}
                        </p>
                        
                        {/* AI Suggestions */}
                        {aiPasswordStrength.suggestions && 
                         aiPasswordStrength.suggestions.length > 0 && (
                          <ul className="list-disc list-inside pl-4 mt-1 text-xs text-muted-foreground">
                            {aiPasswordStrength.suggestions.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}                  <FormMessage />
                </FormItem>
              )} />
              
              {/* Progress Indicators */}
              {isProcessing && (
                <div className="space-y-2">
                  {/* Overall Progress */}
                  <Label htmlFor="overall-progress">
                    Overall Progress ({processingFileIndex + 1} of {selectedFiles.length} files)
                  </Label>
                  <Progress 
                    id="overall-progress" 
                    value={progress} 
                    className="w-full mb-2" 
                  />
                  
                  {/* Current File Progress */}
                  {selectedFiles[processingFileIndex] && (
                    <Label htmlFor="current-file-progress">
                      {mode === 'encrypt' ? 'Encrypting' : 'Decrypting'}: {selectedFiles[processingFileIndex].name}
                    </Label>
                  )}
                  <Progress 
                    id="current-file-progress" 
                    value={currentFileProgress} 
                    className="w-full" 
                  />
                  
                  <p className="text-sm text-muted-foreground text-center">
                    {currentFileProgress}% complete for current file
                  </p>
                </div>
              )}
              
              {/* Share Button (only shown for single encrypted files) */}
              {lastEncryptedDetails && mode === 'encrypt' && !isProcessing && selectedFiles.length === 1 && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsShareDialogOpen(true)} 
                  className="w-full sm:w-auto mt-4" 
                  type="button"
                >
                  <Share2 className="mr-2 h-4 w-4" /> 
                  Share Encrypted File
                </Button>
              )}
            </CardContent>
            
            {/* Form Action Buttons */}
            <CardFooter className="flex justify-end">
              <Button 
                type="submit" 
                disabled={
                  isProcessing || 
                  isGeneratingAIPassphrase || 
                  selectedFiles.length === 0 || 
                  !form.formState.isValid
                } 
                className="w-full sm:w-auto"
              >
                {isProcessing 
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  : <ButtonIcon className="mr-2 h-4 w-4" />
                }
                {buttonText}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>      {/* Sharing Dialog */}
      {lastEncryptedDetails && mode === 'encrypt' && (
        <Dialog 
          open={isShareDialogOpen} 
          onOpenChange={setIsShareDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                Share Encrypted File: {lastEncryptedDetails.fileName}.lockme
              </DialogTitle>
              <DialogDescription>
                Follow these steps to securely share your encrypted file.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              {/* Step 1: Send File Instructions */}
              <div>
                <Label className="font-semibold">Step 1: Send the file</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  The encrypted file <code className="bg-muted px-1 py-0.5 rounded text-xs">
                    {lastEncryptedDetails.fileName}.lockme
                  </code> has been downloaded. Send this file to your recipient.
                </p>
              </div>
              
              {/* Step 2: Share Passphrase */}
              <div>
                <Label className="font-semibold">Step 2: Share the passphrase</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Securely share the following passphrase with your recipient. 
                  Use a different communication channel.
                </p>
                
                {/* Passphrase Display with Copy Button */}
                <div className="flex items-center space-x-2 mt-2">
                  <Input 
                    id="sharePassphrase" 
                    readOnly 
                    defaultValue={lastEncryptedDetails.passphraseUsed} 
                    className="font-mono flex-grow" 
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={() => { 
                      navigator.clipboard.writeText(lastEncryptedDetails.passphraseUsed); 
                      toast({ title: "Passphrase Copied!" }); 
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
              </div>
              
              {/* Security Warning */}
              <div className="mt-3 text-xs text-destructive/90 p-3 border border-destructive/50 rounded-md bg-destructive/10 flex items-start">
                <AlertTriangle className="inline h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Important:</strong> Security depends on how securely you transmit this passphrase. 
                  Avoid sending file and passphrase together.
                </div>
              </div>
            </div>
            
            {/* Dialog Footer */}
            <DialogFooter className="sm:justify-end">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setIsShareDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
export default FileEncryptionCard;
