
// @ts-nocheck
"use client";

import type { FC, ChangeEvent } from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
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
import { ShieldCheck, ShieldOff, Loader2, KeyRound, Download, Lock, Unlock, Eye, EyeOff, Info, Share2, Copy, AlertTriangle, FileText, SparklesIcon, XCircle, Wand2, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { handleAnalyzePassphraseStrengthAction, handleGeneratePassphraseAction } from '@/app/actions'; // Import handleGeneratePassphraseAction
import { addActivity } from '@/lib/services/firestoreService';
import { useActivity } from '@/contexts/ActivityContext';
import type { AnalyzePassphraseStrengthOutput } from '@/ai/flows/analyze-passphrase-strength';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const SALT_LENGTH = 16; 
const IV_LENGTH = 12; 
const PBKDF2_ITERATIONS = 100000;
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; 
const MAX_TOTAL_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024; 
const MAX_FILES_IN_BATCH = 10;

interface FileEncryptionCardProps {
  mode: 'encrypt' | 'decrypt';
}

interface PasswordStrength {
  level: 0 | 1 | 2 | 3 | 4;
  text: string;
  color: string;
}

interface AIPasswordStrength extends AnalyzePassphraseStrengthOutput {
  isLoading?: boolean;
}

const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  if (!password || password.length < 8) return { level: 0, text: "Very Weak", color: "bg-red-500" };
  score++;
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
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivity();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentFileProgress, setCurrentFileProgress] = useState(0);
  const [processingFileIndex, setProcessingFileIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingAIPassphrase, setIsGeneratingAIPassphrase] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [aiPasswordStrength, setAiPasswordStrength] = useState<AIPasswordStrength | null>(null);
  const { toast } = useToast();
  const passphraseInputRef = useRef<HTMLInputElement | null>(null);
  const [lastEncryptedDetails, setLastEncryptedDetails] = useState<{fileName: string; passphraseUsed: string; blob: Blob} | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const aiAnalysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm<FileEncryptionFormValues>({
    resolver: zodResolver(FileEncryptionSchema),
    defaultValues: { passphrase: '' },
    mode: 'onChange',
  });

  const handleFileDrop = (files: File[]) => {
    let totalSize = 0;
    const validFiles: File[] = [];
    if (files.length > MAX_FILES_IN_BATCH) {
      toast({ title: "Too Many Files", description: `Max ${MAX_FILES_IN_BATCH} files.`, variant: "destructive" }); return;
    }
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({ title: "File Too Large", description: `${file.name} exceeds ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB. Removed.`, variant: "destructive" }); continue;
      }
      if (mode === 'decrypt' && !file.name.endsWith('.lockme')) {
        toast({ title: "Invalid File Type", description: `${file.name} is not a .lockme file. Removed.`, variant: "destructive" }); continue;
      }
      totalSize += file.size;
      validFiles.push(file);
    }
    if (totalSize > MAX_TOTAL_UPLOAD_SIZE_BYTES) {
      toast({ title: "Total Size Exceeded", description: `Total size exceeds ${MAX_TOTAL_UPLOAD_SIZE_BYTES / (1024*1024)}MB.`, variant: "destructive" }); return;
    }
    setSelectedFiles(currentFiles => [...currentFiles, ...validFiles].slice(0, MAX_FILES_IN_BATCH)); // Ensure not exceeding max batch even with prior selections
    setProgress(0); setCurrentFileProgress(0);
    if (validFiles.length > 0) { toast({ title: "Files Added", description: `${validFiles.length} file(s) ready.` }); }
    setPasswordStrength(null); setAiPasswordStrength(null); setLastEncryptedDetails(null);
  };
  
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    toast({ title: "Selection Cleared", description: "All selected files have been removed." });
  };

  const removeSelectedFile = (indexToRemove: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const triggerDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const processFile = async (file: File, passphrase: string, operation: 'encrypt' | 'decrypt', onProgress: (p: number) => void): Promise<Blob | null> => {
    onProgress(0);
    try {
      const salt = operation === 'encrypt' ? window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH)) : undefined;
      onProgress(operation === 'encrypt' ? 10 : 5);
      let fileBuffer = await file.arrayBuffer(); onProgress(operation === 'encrypt' ? 20 : 15);
      let actualSalt = salt; let iv: Uint8Array; let dataToProcess: ArrayBuffer;
      if (operation === 'decrypt') {
        if (fileBuffer.byteLength < SALT_LENGTH + IV_LENGTH) { throw new Error("Invalid encrypted file format."); }
        actualSalt = new Uint8Array(fileBuffer.slice(0, SALT_LENGTH));
        iv = new Uint8Array(fileBuffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH));
        dataToProcess = fileBuffer.slice(SALT_LENGTH + IV_LENGTH); onProgress(25);
      } else { iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH)); dataToProcess = fileBuffer; onProgress(30); }
      const passphraseKey = await window.crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey']);
      onProgress(operation === 'encrypt' ? 40 : 35);
      const derivedKey = await window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt: actualSalt!, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, passphraseKey, { name: 'AES-GCM', length: 256 }, true, [operation]);
      onProgress(operation === 'encrypt' ? 60 : 50);
      const resultBuffer = await window.crypto.subtle[operation]({ name: 'AES-GCM', iv: iv! }, derivedKey, dataToProcess);
      onProgress(operation === 'encrypt' ? 80 : 70);
      if (operation === 'encrypt') {
        const encryptedFileContent = new Uint8Array(salt!.length + iv!.length + resultBuffer.byteLength);
        encryptedFileContent.set(salt!, 0); encryptedFileContent.set(iv!, salt!.length); encryptedFileContent.set(new Uint8Array(resultBuffer), salt!.length + iv!.length);
        onProgress(90); return new Blob([encryptedFileContent], { type: 'application/octet-stream' });
      } else {
        let blobType = 'application/octet-stream';
        const originalFileName = file.name.endsWith('.lockme') ? file.name.slice(0, -'.lockme'.length) : `decrypted_${file.name}`;
        const extension = originalFileName.split('.').pop()?.toLowerCase();
        if (extension === 'txt' || extension === 'md') blobType = 'text/plain';
        else if (extension === 'jpg' || extension === 'jpeg') blobType = 'image/jpeg';
        else if (extension === 'png') blobType = 'image/png';
        else if (extension === 'pdf') blobType = 'application/pdf';
        onProgress(90); return new Blob([resultBuffer], { type: blobType });
      }
    } catch (error) {
      console.error(`${operation} error for ${file.name}:`, error);
      toast({ title: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Failed: ${file.name}`, description: (error as Error).message || `Error processing.`, variant: "destructive" });
      onProgress(100); return null;
    }
  };

  const onSubmit = async (values: FileEncryptionFormValues) => {
    if (selectedFiles.length === 0) { toast({ title: "No Files", description: "Please select file(s).", variant: "destructive" }); return; }
    setIsProcessing(true); setProgress(0); setLastEncryptedDetails(null);
    let allSuccessful = true;
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]; setProcessingFileIndex(i); setCurrentFileProgress(0);
      const processedBlob = await processFile(file, values.passphrase, mode, setCurrentFileProgress);
      if (processedBlob) {
        let downloadFileName: string;
        if (mode === 'encrypt') {
          downloadFileName = `${file.name}.lockme`;
          if (selectedFiles.length === 1) { setLastEncryptedDetails({ fileName: file.name, passphraseUsed: values.passphrase, blob: processedBlob }); }
        } else { downloadFileName = file.name.endsWith('.lockme') ? file.name.slice(0, -'.lockme'.length) : `decrypted_${file.name}`; }
        triggerDownload(processedBlob, downloadFileName);
        if (user?.uid) {
          try { await addActivity(mode, `${mode.charAt(0).toUpperCase() + mode.slice(1)}ed file: ${file.name}`, { fileName: file.name, userId: user.uid }); triggerActivityRefresh(); }
          catch (logError) { console.error(`Failed to log activity for ${file.name}:`, logError); toast({ title: "Logging Failed", description: `Could not record ${mode} activity.`, variant: "warning" }); }
        } else { triggerActivityRefresh(); }
      } else { allSuccessful = false; }
      setCurrentFileProgress(100); setProgress(((i + 1) / selectedFiles.length) * 100);
    }
    setIsProcessing(false); setProcessingFileIndex(0);
    if (allSuccessful) { toast({ title: "Complete!", description: `${selectedFiles.length} file(s) processed.` }); }
    else if (selectedFiles.length > 1) { toast({ title: "Partially Complete", description: `Some files failed.`, variant: "warning" }); }
  };
  
  const generateAIPassphrase = async () => {
    if (!user || !user.uid) { toast({ title: "Login Required", description: "Please log in to use AI features.", variant: "destructive" }); return; }
    setIsGeneratingAIPassphrase(true);
    try {
      const result = await handleGeneratePassphraseAction({ length: 16, includeSymbols: true, includeNumbers: true }, user.uid);
      form.setValue('passphrase', result.passphrase, { shouldValidate: true });
      handlePassphraseSideEffects(result.passphrase); // Manually trigger strength update
      toast({ title: "AI Passphrase Generated", description: "Passphrase field updated." });
    } catch (error) {
      console.error("Error generating AI passphrase:", error);
      toast({ title: "AI Generation Failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsGeneratingAIPassphrase(false);
    }
  };

  const analyzePassphraseWithAI = useCallback(async (passphrase: string) => {
    if (!passphrase || passphrase.length < 4) { setAiPasswordStrength(null); return; }
    setAiPasswordStrength(prev => ({ ...prev, isLoading: true, feedback: 'Analyzing...', suggestions: [] }));
    try {
      const result = await handleAnalyzePassphraseStrengthAction({ passphrase });
      setAiPasswordStrength({ ...result, isLoading: false });
    } catch (error) {
      console.warn("AI strength analysis failed:", error);
      setAiPasswordStrength({ strengthLevel: 0, feedback: "AI analysis unavailable.", suggestions: [], isLoading: false });
    }
  }, []);

  const handlePassphraseSideEffects = (currentPassphraseValue: string) => {
    if (mode === 'encrypt') {
      setPasswordStrength(checkPasswordStrength(currentPassphraseValue));
      if (aiAnalysisTimeoutRef.current) { clearTimeout(aiAnalysisTimeoutRef.current); }
      if (currentPassphraseValue.length >= 8) { aiAnalysisTimeoutRef.current = setTimeout(() => { analyzePassphraseWithAI(currentPassphraseValue); }, 750); }
      else { setAiPasswordStrength(null); }
    } else { setPasswordStrength(null); setAiPasswordStrength(null); }
  };

  useEffect(() => {
    const inputElement = passphraseInputRef.current;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement === inputElement && (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault(); setShowPassword(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); if (aiAnalysisTimeoutRef.current) { clearTimeout(aiAnalysisTimeoutRef.current); } };
  }, []);

  const cardTitle = mode === 'encrypt' ? "Encrypt Your File(s)" : "Decrypt Your File(s)";
  const cardDescription = mode === 'encrypt' ? `Select up to ${MAX_FILES_IN_BATCH} files. Max ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB/file, ${MAX_TOTAL_UPLOAD_SIZE_BYTES / (1024*1024)}MB total.` : `Select up to ${MAX_FILES_IN_BATCH} encrypted (.lockme) files.`;
  const buttonText = mode === 'encrypt' ? "Encrypt File(s)" : "Decrypt File(s)";
  const ButtonIcon = mode === 'encrypt' ? ShieldCheck : ShieldOff;
  const TitleIcon = mode === 'encrypt' ? Lock : Unlock;

  return (
    <>
      <Card className="w-full shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-2xl"><TitleIcon className="mr-2 h-6 w-6 text-primary" />{cardTitle}</CardTitle>
            <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Info className="h-5 w-5" /></Button></TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="max-w-xs bg-popover text-popover-foreground p-3 rounded-lg shadow-md">
                {mode === 'encrypt' ? (<><p className="text-sm font-medium mb-1">How to Encrypt:</p><ul className="list-disc list-inside text-xs space-y-1"><li>Drag & drop or click to select.</li><li>Max {MAX_FILES_IN_BATCH} files, {MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB/file, {MAX_TOTAL_UPLOAD_SIZE_BYTES / (1024*1024)}MB total.</li><li>Enter a strong passphrase.</li><li>Click 'Encrypt File(s)'.</li><li>Ctrl/Cmd+Shift+P to toggle passphrase visibility.</li><li>Files are encrypted locally and downloaded with '.lockme'.</li><li>Keep passphrase safe!</li></ul></>) : (<><p className="text-sm font-medium mb-1">How to Decrypt:</p><ul className="list-disc list-inside text-xs space-y-1"><li>Drag & drop or click to select '.lockme' file(s).</li><li>Max {MAX_FILES_IN_BATCH} files.</li><li>Enter exact passphrase.</li><li>Ctrl/Cmd+Shift+P to toggle passphrase visibility.</li><li>Click 'Decrypt File(s)'.</li><li>Files decrypted locally and downloaded.</li></ul></>)}
              </TooltipContent></Tooltip></TooltipProvider>
          </div>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FileDropzone onFilesDrop={handleFileDrop} className={mode === 'decrypt' ? "accept-.lockme" : ""} mode={mode} />
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="font-medium text-foreground">Selected file(s): ({selectedFiles.length})</Label>
                    {selectedFiles.length > 0 && (<Button type="button" variant="outline" size="sm" onClick={clearSelectedFiles} className="text-xs"><Trash2 className="mr-1.5 h-3 w-3"/>Clear All</Button>)}
                  </div>
                  <ul className="list-inside text-sm text-muted-foreground max-h-40 overflow-y-auto space-y-1 border p-2 rounded-md bg-muted/30">
                    {selectedFiles.map((file, index) => (<li key={`${file.name}-${index}-${file.lastModified}`} className="flex items-center justify-between p-1.5 bg-muted/50 rounded-md hover:bg-muted"><span className="truncate flex-grow mr-2">{file.name} ({(file.size / (1024*1024)).toFixed(2)} MB)</span><Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive/70 hover:text-destructive hover:bg-destructive/10 flex-shrink-0" onClick={() => removeSelectedFile(index)} aria-label={`Remove ${file.name}`}><XCircle className="h-4 w-4" /></Button></li>))}
                  </ul>
                </div>
              )}
              <FormField control={form.control} name="passphrase" render={({ field }) => (
                <FormItem>
                  <FormLabel>Passphrase</FormLabel>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-grow">
                      <FormControl><Input type={showPassword ? "text" : "password"} placeholder="Enter your secure passphrase" {...field} ref={(e) => { field.ref(e); passphraseInputRef.current = e; }} onChange={(e) => { field.onChange(e); handlePassphraseSideEffects(e.target.value); }} className="pr-10" /></FormControl>
                      <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}><span className="sr-only">{showPassword ? "Hide" : "Show"} password</span>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button>
                    </div>
                    {mode === 'encrypt' && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button type="button" variant="outline" size="icon" onClick={generateAIPassphrase} disabled={isProcessing || isGeneratingAIPassphrase} aria-label="Generate passphrase with AI">
                                        {isGeneratingAIPassphrase ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Generate with AI</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                  </div>
                  {mode === 'encrypt' && passwordStrength && field.value && (<div className="mt-2"><div className="flex items-center justify-between mb-1"><span className="text-xs font-medium text-muted-foreground">Rule-based Strength: {passwordStrength.text}</span></div><Progress value={passwordStrength.level * 25} className={`h-2 ${passwordStrength.color}`} /></div>)}
                  {mode === 'encrypt' && aiPasswordStrength && field.value && (<div className="mt-2 p-3 border rounded-md bg-muted/50"><div className="flex items-center text-xs font-medium text-muted-foreground mb-1"><SparklesIcon className="mr-2 h-4 w-4 text-primary" />AI Strength Analysis:{aiPasswordStrength.isLoading && <Loader2 className="ml-2 h-3 w-3 animate-spin" />}</div><p className="text-xs text-foreground">{aiPasswordStrength.feedback}</p>{aiPasswordStrength.suggestions && aiPasswordStrength.suggestions.length > 0 && (<ul className="list-disc list-inside pl-4 mt-1 text-xs text-muted-foreground">{aiPasswordStrength.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>)}</div>)}
                  <FormMessage />
                </FormItem>
              )} />
              {isProcessing && (<div className="space-y-2"><Label htmlFor="overall-progress">Overall Progress ({processingFileIndex + 1} of {selectedFiles.length} files)</Label><Progress id="overall-progress" value={progress} className="w-full mb-2" />{selectedFiles[processingFileIndex] && <Label htmlFor="current-file-progress">{mode === 'encrypt' ? 'Encrypting' : 'Decrypting'}: {selectedFiles[processingFileIndex].name}</Label>}<Progress id="current-file-progress" value={currentFileProgress} className="w-full" /><p className="text-sm text-muted-foreground text-center">{currentFileProgress}% complete for current file</p></div>)}
              {lastEncryptedDetails && mode === 'encrypt' && !isProcessing && selectedFiles.length === 1 && (<Button variant="outline" onClick={() => setIsShareDialogOpen(true)} className="w-full sm:w-auto mt-4" type="button"><Share2 className="mr-2 h-4 w-4" /> Share Encrypted File</Button>)}
            </CardContent>
            <CardFooter className="flex justify-end"><Button type="submit" disabled={isProcessing || isGeneratingAIPassphrase || selectedFiles.length === 0 || !form.formState.isValid} className="w-full sm:w-auto">{isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ButtonIcon className="mr-2 h-4 w-4" />}{buttonText}</Button></CardFooter>
          </form>
        </Form>
      </Card>
      {lastEncryptedDetails && mode === 'encrypt' && (<Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Share Encrypted File: {lastEncryptedDetails.fileName}.lockme</DialogTitle><DialogDescription>Follow these steps to securely share your encrypted file.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div><Label className="font-semibold">Step 1: Send the file</Label><p className="text-sm text-muted-foreground mt-1">The encrypted file <code className="bg-muted px-1 py-0.5 rounded text-xs">{lastEncryptedDetails.fileName}.lockme</code> has been downloaded. Send this file to your recipient.</p></div><div><Label className="font-semibold">Step 2: Share the passphrase</Label><p className="text-sm text-muted-foreground mt-1">Securely share the following passphrase with your recipient. Use a different communication channel.</p><div className="flex items-center space-x-2 mt-2"><Input id="sharePassphrase" readOnly defaultValue={lastEncryptedDetails.passphraseUsed} className="font-mono flex-grow" /><Button type="button" variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(lastEncryptedDetails.passphraseUsed); toast({ title: "Passphrase Copied!" }); }}><Copy className="h-4 w-4" /><span className="sr-only">Copy</span></Button></div></div><div className="mt-3 text-xs text-destructive/90 p-3 border border-destructive/50 rounded-md bg-destructive/10 flex items-start"><AlertTriangle className="inline h-4 w-4 mr-2 flex-shrink-0 mt-0.5" /><div><strong>Important:</strong> Security depends on how securely you transmit this passphrase. Avoid sending file and passphrase together.</div></div></div><DialogFooter className="sm:justify-end"><Button type="button" variant="secondary" onClick={() => setIsShareDialogOpen(false)}>Close</Button></DialogFooter></DialogContent></Dialog>)}
    </>
  );
};
export default FileEncryptionCard;
