// @ts-nocheck
"use client";

import type { FC, ChangeEvent } from 'react';
import { useState, useEffect, useRef } from 'react'; 
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import FileDropzone from '@/components/FileDropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { FileEncryptionSchema, type FileEncryptionFormValues } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { ShieldCheck, ShieldOff, Loader2, KeyRound, Download, Lock, Unlock, Eye, EyeOff, Info, Share2, Copy, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes for AES-GCM
const PBKDF2_ITERATIONS = 100000;
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

interface FileEncryptionCardProps {
  mode: 'encrypt' | 'decrypt';
}

interface PasswordStrength {
  level: 0 | 1 | 2 | 3 | 4; // 0: Very Weak, 1: Weak, 2: Fair, 3: Good, 4: Strong
  text: string;
  color: string;
}

const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  if (!password || password.length < 8) return { level: 0, text: "Very Weak", color: "bg-red-500" };
  
  score++; // Min length met

  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score < 2) return { level: 1, text: "Weak", color: "bg-orange-500" };
  if (score === 2) return { level: 2, text: "Fair", color: "bg-yellow-500" };
  if (score === 3) return { level: 3, text: "Good", color: "bg-lime-500" };
  return { level: 4, text: "Strong", color: "bg-green-500" };
};


const FileEncryptionCard: FC<FileEncryptionCardProps> = ({ mode }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const { toast } = useToast();
  const passphraseInputRef = useRef<HTMLInputElement>(null);
  const [lastEncryptedDetails, setLastEncryptedDetails] = useState<{fileName: string; passphraseUsed: string; blob: Blob} | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);


  const form = useForm<FileEncryptionFormValues>({
    resolver: zodResolver(FileEncryptionSchema),
    defaultValues: {
      passphrase: '',
    },
  });

  const handleFileDrop = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({
        title: "File Too Large",
        description: `The selected file exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB size limit. Please choose a smaller file.`,
        variant: "destructive",
      });
      setSelectedFile(null);
      form.resetField("passphrase"); 
      setPasswordStrength(null);
      setLastEncryptedDetails(null);
      return;
    }
    setSelectedFile(file);
    setProgress(0);
    form.resetField("passphrase");
    setPasswordStrength(null);
    setLastEncryptedDetails(null);
    toast({ title: "File Selected", description: `${file.name} is ready.` });
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const encryptFile = async (file: File, passphrase: string): Promise<Blob | null> => {
    try {
      setProgress(10);
      const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
      setProgress(20);
      const passphraseKey = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      setProgress(30);
      const derivedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: PBKDF2_ITERATIONS,
          hash: 'SHA-256',
        },
        passphraseKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt']
      );
      setProgress(50);
      const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      const fileBuffer = await file.arrayBuffer();
      setProgress(70);
      const encryptedContent = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        fileBuffer
      );
      setProgress(90);
      const encryptedFileContent = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
      encryptedFileContent.set(salt, 0);
      encryptedFileContent.set(iv, salt.length);
      encryptedFileContent.set(new Uint8Array(encryptedContent), salt.length + iv.length);
      return new Blob([encryptedFileContent], { type: 'application/octet-stream' });
    } catch (error) {
      console.error('Encryption error:', error);
      toast({
        title: "Encryption Failed",
        description: (error as Error).message || "An unexpected error occurred during encryption.",
        variant: "destructive",
      });
      return null;
    }
  };

  const decryptFile = async (file: File, passphrase: string): Promise<Blob | null> => {
    try {
      setProgress(10);
      const fileBuffer = await file.arrayBuffer();
      setProgress(20);
      if (fileBuffer.byteLength < SALT_LENGTH + IV_LENGTH) {
        throw new Error("File is too short to be a valid encrypted file.");
      }
      const salt = new Uint8Array(fileBuffer.slice(0, SALT_LENGTH));
      const iv = new Uint8Array(fileBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH));
      const encryptedData = fileBuffer.slice(SALT_LENGTH + IV_LENGTH);
      setProgress(30);
      const passphraseKey = await window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      setProgress(40);
      const derivedKey = await window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: PBKDF2_ITERATIONS,
          hash: 'SHA-256',
        },
        passphraseKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['decrypt']
      );
      setProgress(60);
      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        encryptedData
      );
      setProgress(90);
      let blobType = 'application/octet-stream'; // Default
      // Try to infer original mime type if available, or keep as octet-stream
      // This is a simple example; more robust type detection might be needed
      const originalFileName = file.name.endsWith('.lockme') ? file.name.slice(0, -'.lockme'.length) : `decrypted_${file.name}`;
      const extension = originalFileName.split('.').pop()?.toLowerCase();
      if (extension === 'txt' || extension === 'md') blobType = 'text/plain';
      else if (extension === 'jpg' || extension === 'jpeg') blobType = 'image/jpeg';
      else if (extension === 'png') blobType = 'image/png';
      else if (extension === 'pdf') blobType = 'application/pdf';

      return new Blob([decryptedContent], { type: blobType });
    } catch (error) {
      console.error('Decryption error:', error);
      let errorMessage = "An unexpected error occurred during decryption.";
      if (error instanceof DOMException && (error.name === "OperationError" || error.message.includes("operation failed") || error.message.includes("Data must be a string"))) {
        errorMessage = "Decryption failed. This might be due to an incorrect passphrase or a corrupted file.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Decryption Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const onSubmit = async (values: FileEncryptionFormValues) => {
    if (!selectedFile) {
      toast({ title: "No File Selected", description: "Please select a file to process.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    setLastEncryptedDetails(null); // Reset previous details

    if (mode === 'encrypt') {
      const encryptedBlob = await encryptFile(selectedFile, values.passphrase);
      if (encryptedBlob) {
        const downloadFileName = `${selectedFile.name}.lockme`;
        triggerDownload(encryptedBlob, downloadFileName);
        setProgress(100);
        setLastEncryptedDetails({ fileName: selectedFile.name, passphraseUsed: values.passphrase, blob: encryptedBlob });
        toast({
          title: "Encryption Complete!",
          description: `${selectedFile.name} has been encrypted. Download started as ${downloadFileName}.`,
          action: <Button variant="outline" size="sm" onClick={() => triggerDownload(encryptedBlob, downloadFileName)}><Download className="mr-2 h-4 w-4" />Download Again</Button>,
        });
      }
    } else if (mode === 'decrypt') {
      const decryptedBlob = await decryptFile(selectedFile, values.passphrase);
      if (decryptedBlob) {
        const originalFileName = selectedFile.name.endsWith('.lockme')
          ? selectedFile.name.slice(0, -'.lockme'.length)
          : `decrypted_${selectedFile.name}`;
        triggerDownload(decryptedBlob, originalFileName);
        setProgress(100);
        toast({
          title: "Decryption Complete!",
          description: `${selectedFile.name} has been decrypted. Download started as ${originalFileName}.`,
          action: <Button variant="outline" size="sm" onClick={() => triggerDownload(decryptedBlob, originalFileName)}><Download className="mr-2 h-4 w-4" />Download Again</Button>,
        });
      }
    }
    setIsProcessing(false);
  };

  useEffect(() => {
    const inputElement = passphraseInputRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement === inputElement && (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setShowPassword(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [passphraseInputRef]);
  
  const cardTitle = mode === 'encrypt' ? "Encrypt Your File" : "Decrypt Your File";
  const cardDescription = mode === 'encrypt' 
    ? "Select a file, enter a passphrase, and click Encrypt to secure it."
    : "Select an encrypted (.lockme) file, enter the passphrase, and click Decrypt to access it.";
  const buttonText = mode === 'encrypt' ? "Encrypt File" : "Decrypt File";
  const ButtonIcon = mode === 'encrypt' ? ShieldCheck : ShieldOff;
  const TitleIcon = mode === 'encrypt' ? Lock : Unlock;


  return (
    <>
      <Card className="w-full shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-2xl">
              <TitleIcon className="mr-2 h-6 w-6 text-primary" />
              {cardTitle}
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Info className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="end" className="max-w-xs bg-popover text-popover-foreground p-3 rounded-lg shadow-md">
                  {mode === 'encrypt' ? (
                    <>
                      <p className="text-sm font-medium mb-1">How to Encrypt:</p>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        <li>Drag & drop any file or click to select.</li>
                        <li>Supported files: Any type. Max size: {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.</li>
                        <li>Enter a strong passphrase (use the strength indicator!).</li>
                        <li>Click 'Encrypt File'.</li>
                        <li>Shortcut: While typing passphrase, use Ctrl/Cmd+Shift+P to toggle visibility.</li>
                        <li>Your file is encrypted locally in your browser and downloaded as a '.lockme' file.</li>
                        <li>Keep your passphrase safe; it's needed for decryption!</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium mb-1">How to Decrypt:</p>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        <li>Drag & drop your '.lockme' file or click to select.</li>
                        <li>Expected file: Must be a '.lockme' file previously encrypted by LockMe.</li>
                        <li>Enter the exact passphrase used during encryption.</li>
                        <li>Shortcut: While typing passphrase, use Ctrl/Cmd+Shift+P to toggle visibility.</li>
                        <li>Click 'Decrypt File'.</li>
                        <li>Your file is decrypted locally in your browser and downloaded.</li>
                      </ul>
                    </>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FileDropzone 
                onFileDrop={handleFileDrop} 
                className={mode === 'decrypt' ? "accept-.lockme" : ""} 
              />
              {selectedFile && (
                <div className="text-sm text-muted-foreground">
                  Selected file: <span className="font-medium text-foreground">{selectedFile.name}</span>
                </div>
              )}
              <FormField
                control={form.control}
                name="passphrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Passphrase</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter your secure passphrase" 
                          {...field} 
                          onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            field.onChange(e); // Update react-hook-form state
                            setPasswordStrength(checkPasswordStrength(e.target.value)); // Update strength indicator
                          }}
                          ref={passphraseInputRef}
                          className="pr-10"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                    {passwordStrength && field.value && (
                       <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-muted-foreground">Strength: {passwordStrength.text}</span>
                        </div>
                        <Progress value={passwordStrength.level * 25} className={`h-2 ${passwordStrength.color}`} />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(isProcessing || (progress > 0 && progress < 100)) && (
                <div className="space-y-2">
                  <Label htmlFor="processing-progress">
                    {mode === 'encrypt' ? 'Encrypting...' : 'Decrypting...'}
                  </Label>
                  <Progress id="processing-progress" value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">{progress}% complete</p>
                </div>
              )}
              {lastEncryptedDetails && mode === 'encrypt' && !isProcessing && progress === 100 && (
                <Button variant="outline" onClick={() => setIsShareDialogOpen(true)} className="w-full sm:w-auto mt-4">
                  <Share2 className="mr-2 h-4 w-4" /> Share Encrypted File
                </Button>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                disabled={isProcessing || !selectedFile || !form.formState.isValid}
                className="w-full sm:w-auto"
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ButtonIcon className="mr-2 h-4 w-4" />}
                {buttonText}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {lastEncryptedDetails && mode === 'encrypt' && (
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Encrypted File: {lastEncryptedDetails.fileName}.lockme</DialogTitle>
              <DialogDescription>
                Follow these steps to securely share your encrypted file.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="font-semibold">Step 1: Send the file</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  The encrypted file <code className="bg-muted px-1 py-0.5 rounded text-xs">{lastEncryptedDetails.fileName}.lockme</code> has already been downloaded. Send this file to your recipient.
                </p>
              </div>
              
              <div>
                <Label className="font-semibold">Step 2: Share the passphrase</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Securely share the following passphrase with your recipient. Use a different communication channel (e.g., a secure messaging app, in person).
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    id="sharePassphrase"
                    readOnly
                    defaultValue={lastEncryptedDetails.passphraseUsed}
                    className="font-mono flex-grow"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(lastEncryptedDetails.passphraseUsed);
                      toast({ title: "Passphrase Copied!", description: "The passphrase has been copied to your clipboard." });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy passphrase</span>
                  </Button>
                </div>
              </div>
              <div className="mt-3 text-xs text-destructive/90 p-3 border border-destructive/50 rounded-md bg-destructive/10 flex items-start">
                <AlertTriangle className="inline h-4 w-4 mr-2 flex-shrink-0 mt-0.5" /> 
                <div>
                  <strong>Important:</strong> The security of the shared file depends on how securely you transmit this passphrase. Avoid sending the file and passphrase together through the same insecure channel (like the same email).
                </div>
              </div>
            </div>
            <DialogFooter className="sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setIsShareDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default FileEncryptionCard;
