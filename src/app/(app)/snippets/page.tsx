
"use client";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, PlusCircle, Trash2, Copy, Lock, Unlock, Eye, EyeOff, ListCollapse, RefreshCw, Search, Tag, Filter, UserCog, Edit, X, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addSnippetToFirestore, getSnippetsFromFirestore, updateSnippetInFirestore, deleteSnippetFromFirestore, addActivity } from '@/lib/services/firestoreService';
import type { SnippetDocument } from '@/types/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Timestamp, deleteField } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useActivity } from '@/contexts/ActivityContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import atomDark from 'react-syntax-highlighter/dist/esm/styles/prism/atom-dark';


interface ClientSnippet extends Omit<SnippetDocument, 'createdAt' | 'updatedAt'> {
  id: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  tags: string[];
}

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100000;

const languageOptions = [
  { value: "env", label: ".env" },
  { value: "csharp", label: "C#" },
  { value: "css", label: "CSS" },
  { value: "html", label: "HTML" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "php", label: "PHP" },
  { value: "text", label: "Plain Text" },
  { value: "python", label: "Python" },
  { value: "typescript", label: "TypeScript" },
].sort((a, b) => a.label.localeCompare(b.label));


export default function CodeSnippetsPage() {
  const { user, loading: authLoading } = useAuth();
  const { triggerActivityRefresh } = useActivity();
  const [snippets, setSnippets] = useState<ClientSnippet[]>([]);
  const [isLoadingSnippets, setIsLoadingSnippets] = useState(true);

  // For Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<ClientSnippet | null>(null);
  const [currentSnippetName, setCurrentSnippetName] = useState('');
  const [currentSnippetLang, setCurrentSnippetLang] = useState('');
  const [currentSnippetCode, setCurrentSnippetCode] = useState('');
  const [currentSnippetTags, setCurrentSnippetTags] = useState('');

  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSnippets = useCallback(async () => {
    if (!user) {
      setSnippets([]);
      setIsLoadingSnippets(false);
      return;
    }
    setIsLoadingSnippets(true);
    try {
      console.log(`CodeSnippetsPage: Fetching snippets for userId: ${user.uid}`);
      const firestoreSnippets = await getSnippetsFromFirestore(user.uid, true);
      const clientSnippets = firestoreSnippets.map(s => ({
        ...s,
        id: s.id!,
        tags: s.tags || [],
      }));
      setSnippets(clientSnippets);
      console.log(`CodeSnippetsPage: Fetched ${clientSnippets.length} snippets for userId: ${user.uid}`);
    } catch (error) {
      console.error("CodeSnippetsPage: Failed to load snippets from Firestore:", error);
      toast({ title: "Error Loading Snippets", description: "Could not load your snippets.", variant: "destructive" });
      setSnippets([]);
    } finally {
      setIsLoadingSnippets(false);
    }
  }, [toast, user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchSnippets();
    } else if (!authLoading && !user) {
      setIsLoadingSnippets(false);
      setSnippets([]);
    }
  }, [fetchSnippets, authLoading, user]);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    snippets.forEach(snippet => {
      (snippet.tags || []).forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [snippets]);

  const filteredSnippets = useMemo(() => {
    return snippets.filter(snippet => {
      const matchesSearchTerm =
        snippet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        snippet.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (snippet.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTagFilter = selectedTagFilter ? (snippet.tags || []).includes(selectedTagFilter) : true;
      return matchesSearchTerm && matchesTagFilter;
    });
  }, [snippets, searchTerm, selectedTagFilter]);

  const resetFormFields = () => {
    setCurrentSnippetName('');
    setCurrentSnippetLang('');
    setCurrentSnippetCode('');
    setCurrentSnippetTags('');
  };

  const handleOpenModal = (snippet: ClientSnippet | null = null) => {
    if (snippet) {
      setEditingSnippet(snippet);
      setCurrentSnippetName(snippet.name);
      setCurrentSnippetLang(snippet.language);
      setCurrentSnippetCode(snippet.isEncrypted ? "Cannot edit encrypted code directly. Decrypt first." : snippet.code);
      setCurrentSnippetTags((snippet.tags || []).join(', '));
    } else {
      setEditingSnippet(null);
      resetFormFields();
    }
    setIsModalOpen(true);
  };

  const handleSaveSnippet = async () => {
    if (!user || !user.uid) {
      toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!currentSnippetName.trim()) {
         toast({ title: "Error", description: "Snippet name cannot be empty.", variant: "destructive" });
        return;
    }
     if (editingSnippet && editingSnippet.isEncrypted && currentSnippetCode === "Cannot edit encrypted code directly. Decrypt first.") {
      // If editing an encrypted snippet and the code wasn't changed from the placeholder, allow saving name/tags.
    } else if (!currentSnippetCode.trim() && !editingSnippet?.isEncrypted) { // Only check code if not encrypted
       toast({ title: "Error", description: "Snippet code cannot be empty.", variant: "destructive" });
      return;
    }

    if (!currentSnippetLang) {
      toast({ title: "Error", description: "Please select a language.", variant: "destructive" });
      return;
    }

    const tagsArray = currentSnippetTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    try {
      if (editingSnippet) { // Update existing snippet
        const updates: Partial<Omit<SnippetDocument, 'id' | 'createdAt' | 'updatedAt' | 'userId'>> = {
          name: currentSnippetName,
          language: currentSnippetLang,
          tags: tagsArray,
        };
        // Only update code if it was editable (i.e., not encrypted, or encrypted but user decrypted it and changed it)
        if (!editingSnippet.isEncrypted || (editingSnippet.isEncrypted && currentSnippetCode !== "Cannot edit encrypted code directly. Decrypt first.")) {
          updates.code = currentSnippetCode;
        }

        await updateSnippetInFirestore(editingSnippet.id, updates);
        await addActivity("snippet_updated", `Updated snippet: ${currentSnippetName}`, { snippetName: currentSnippetName, userId: user.uid });
        toast({ title: "Snippet Updated", description: `'${currentSnippetName}' has been updated.` });
      } else { // Add new snippet
        const snippetData: Omit<SnippetDocument, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
          name: currentSnippetName,
          language: currentSnippetLang,
          code: currentSnippetCode,
          isEncrypted: false,
          tags: tagsArray,
        };
        const newId = await addSnippetToFirestore(snippetData, user.uid);
        if (newId) {
          await addActivity("snippet_created", `Created snippet: ${currentSnippetName}`, { snippetName: currentSnippetName, userId: user.uid });
          toast({ title: "Snippet Added", description: `'${currentSnippetName}' has been added.` });
        } else {
          throw new Error("Failed to get new snippet ID.");
        }
      }
      triggerActivityRefresh();
      fetchSnippets();
      setIsModalOpen(false);
      resetFormFields();
    } catch (error) {
      console.error("CodeSnippetsPage: Failed to save snippet:", error);
      toast({ title: "Error Saving Snippet", description: (error as Error).message || "Could not save the snippet.", variant: "destructive" });
    }
  };

  const deleteSnippet = async (id: string) => {
    if (!user || !user.uid) return;
    const snippetToDelete = snippets.find(s => s.id === id);
    if (!snippetToDelete) return;

    try {
      await deleteSnippetFromFirestore(id);
      await addActivity("snippet_deleted", `Deleted snippet: ${snippetToDelete.name}`, { snippetName: snippetToDelete.name, userId: user.uid });
      triggerActivityRefresh();
      toast({ title: "Snippet Deleted", description: `'${snippetToDelete.name}' has been removed.` });
      fetchSnippets();
    } catch (error) {
      console.error("CodeSnippetsPage: Failed to delete snippet:", error);
      toast({ title: "Error Deleting Snippet", description: (error as Error).message || "Could not remove the snippet.", variant: "destructive" });
    }
  };

  const copySnippet = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast({ title: "Copied!", description: "Snippet code copied to clipboard." });
    });
  };

  const getKeyMaterial = async (pass: string, salt?: Uint8Array): Promise<[CryptoKey, Uint8Array]> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(pass), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']);
    const currentSalt = salt || window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const key = await window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt: currentSalt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    return [key, currentSalt];
  };

  const encryptSnippet = async (id: string) => {
    if (!user || !user.uid) return;
    const snippet = snippets.find(s => s.id === id);
    if (!snippet || snippet.isEncrypted) return;
    if (!passphrase.trim()) {
      toast({ title: "Error", description: "Passphrase is required for encryption.", variant: "destructive" });
      return;
    }
    try {
      const [key, salt] = await getKeyMaterial(passphrase);
      const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      const encodedCode = new TextEncoder().encode(snippet.code);
      const encryptedCodeBuffer = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedCode);
      const encryptedCode = btoa(String.fromCharCode(...new Uint8Array(encryptedCodeBuffer)));
      const saltString = btoa(String.fromCharCode(...salt));
      const ivString = btoa(String.fromCharCode(...iv));
      const updates: Partial<Omit<SnippetDocument, 'id' | 'createdAt' | 'userId'>> = { code: encryptedCode, isEncrypted: true, iv: ivString, salt: saltString };
      await updateSnippetInFirestore(id, updates);
      await addActivity("snippet_updated", `Encrypted snippet: ${snippet.name}`, { snippetName: snippet.name, userId: user.uid });
      triggerActivityRefresh();
      toast({ title: "Snippet Encrypted", description: `'${snippet.name}' is now encrypted.` });
      fetchSnippets();
    } catch (error) {
      console.error("CodeSnippetsPage: Encryption error:", error);
      toast({ title: "Encryption Failed", description: (error as Error).message, variant: "destructive" });
    }
  };

  const arrayBufferFromBase64 = (base64: string) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) { bytes[i] = binary_string.charCodeAt(i); }
    return bytes.buffer;
  }

  const decryptSnippet = async (id: string) => {
    if (!user || !user.uid) return;
    const snippet = snippets.find(s => s.id === id);
    if (!snippet || !snippet.isEncrypted || !snippet.iv || !snippet.salt) return;
    if (!passphrase.trim()) {
      toast({ title: "Error", description: "Passphrase is required for decryption.", variant: "destructive" });
      return;
    }
    try {
      const saltBytes = new Uint8Array(arrayBufferFromBase64(snippet.salt));
      const [key] = await getKeyMaterial(passphrase, saltBytes);
      const ivBytes = new Uint8Array(arrayBufferFromBase64(snippet.iv));
      const encryptedCodeBuffer = arrayBufferFromBase64(snippet.code);
      const decryptedCodeBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, key, encryptedCodeBuffer);
      const decryptedCode = new TextDecoder().decode(decryptedCodeBuffer);
      const updates: Partial<Omit<SnippetDocument, 'id' | 'createdAt' | 'userId'>> = { code: decryptedCode, isEncrypted: false, iv: deleteField() as unknown as string, salt: deleteField() as unknown as string };
      await updateSnippetInFirestore(id, updates);
      await addActivity("snippet_updated", `Decrypted snippet: ${snippet.name}`, { snippetName: snippet.name, userId: user.uid });
      triggerActivityRefresh();
      toast({ title: "Snippet Decrypted", description: `'${snippet.name}' is now decrypted.` });
      fetchSnippets();
    } catch (error) {
      console.error("CodeSnippetsPage: Decryption error:", error);
      toast({ title: "Decryption Failed", description: "Incorrect passphrase or corrupted data.", variant: "destructive" });
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-24 w-full mb-8" />
          <Skeleton className="h-12 w-1/3 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4 mb-1" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto text-center">
          <UserCog className="mx-auto h-16 w-16 text-primary mb-6" />
          <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You need to be logged in to manage your code snippets.</p>
          <Button asChild><Link href="/login">Login to Continue</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSnippet ? 'Edit Snippet' : 'Add New Snippet'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="modalSnippetName">Snippet Name</Label>
                <Input id="modalSnippetName" value={currentSnippetName} onChange={(e) => setCurrentSnippetName(e.target.value)} placeholder="e.g., React Component" />
              </div>
              <div>
                <Label htmlFor="modalSnippetLang">Language</Label>
                <Select value={currentSnippetLang} onValueChange={setCurrentSnippetLang}>
                  <SelectTrigger id="modalSnippetLang"><SelectValue placeholder="Select language" /></SelectTrigger>
                  <SelectContent>{languageOptions.map(lang => (<SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="mb-0"> {/* Adjusted mb */}
              <Label htmlFor="modalSnippetTags">Tags (comma-separated)</Label>
              <Input id="modalSnippetTags" value={currentSnippetTags} onChange={(e) => setCurrentSnippetTags(e.target.value)} placeholder="e.g., react, util, api" />
            </div>
            <div>
              <Label htmlFor="modalSnippetCode">Code</Label>
              <Textarea id="modalSnippetCode" value={currentSnippetCode} onChange={(e) => setCurrentSnippetCode(e.target.value)} placeholder="Paste your code here..." rows={8} className="font-mono text-sm" disabled={!!(editingSnippet?.isEncrypted && currentSnippetCode === "Cannot edit encrypted code directly. Decrypt first.")} />
              {editingSnippet?.isEncrypted && currentSnippetCode === "Cannot edit encrypted code directly. Decrypt first." && <p className="text-xs text-muted-foreground mt-1">Snippet is encrypted. Decrypt to edit code.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSnippet} disabled={!!(editingSnippet?.isEncrypted && currentSnippetCode === "Cannot edit encrypted code directly. Decrypt first." && !currentSnippetName.trim() )}> {/* Allow saving name/tags for encrypted snippet */}
              <Save className="mr-2 h-4 w-4" /> {editingSnippet ? 'Save Changes' : 'Add Snippet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-4xl mx-auto">
        <Card className="w-full shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Code className="mr-2 h-6 w-6 text-primary" /> My Code Snippets
            </CardTitle>
            <CardDescription>Store, manage, and optionally encrypt your code snippets. Saved to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="passphrase">Encryption Passphrase</Label>
              <div className="flex items-center gap-2">
                <Input id="passphrase" type={showPassphrase ? "text" : "password"} value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="Enter passphrase for encryption/decryption" className="flex-grow" />
                <Button variant="ghost" size="icon" onClick={() => setShowPassphrase(!showPassphrase)} type="button" aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}>{showPassphrase ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">This passphrase is used to encrypt/decrypt snippets. Keep it secure. It is not stored.</p>
            </div>
            <Button onClick={() => handleOpenModal()} className="w-full md:w-auto" type="button">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Snippet
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold">Your Snippets ({filteredSnippets.length})</h2>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search snippets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 w-full"/>
            </div>
            {allTags.length > 0 && (
              <Select value={selectedTagFilter || ""} onValueChange={(value) => setSelectedTagFilter(value === "all" ? null : value)}>
                <SelectTrigger className="w-auto min-w-[150px]" aria-label="Filter by tag"><Filter className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Filter by tag..." /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Tags</SelectItem>{allTags.map(tag => (<SelectItem key={tag} value={tag}>{tag}</SelectItem>))}</SelectContent>
              </Select>
            )}
            <Button variant="outline" size="icon" onClick={fetchSnippets} disabled={isLoadingSnippets} aria-label="Refresh snippets"><RefreshCw className={`h-4 w-4 ${isLoadingSnippets ? 'animate-spin' : ''}`} /></Button>
          </div>
        </div>

        {isLoadingSnippets ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="shadow-md">
                <CardHeader className="bg-muted/30 p-4">
                  <Skeleton className="h-6 w-3/4 mb-1" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="p-4">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredSnippets.length > 0 ? (
          <div className="space-y-4">
            {filteredSnippets.map(snippet => (
              <Card key={snippet.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 bg-card-foreground/5 p-4">
                  <div>
                    <CardTitle className="text-lg">{snippet.name}</CardTitle>
                    <CardDescription>{languageOptions.find(l => l.value === snippet.language)?.label || snippet.language} {snippet.isEncrypted ? "(Encrypted)" : ""}</CardDescription>
                    {snippet.tags && snippet.tags.length > 0 && (<div className="mt-2 flex flex-wrap gap-1">{snippet.tags.map(tag => (<Badge key={tag} variant="secondary" className="text-xs"><Tag className="mr-1 h-3 w-3" />{tag}</Badge>))}</div>)}
                  </div>
                  <div className="flex items-center gap-2 mt-2 md:mt-0 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleOpenModal(snippet)} type="button"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                    {snippet.isEncrypted ? (<Button variant="outline" size="sm" onClick={() => decryptSnippet(snippet.id)} disabled={!passphrase.trim()} type="button"><Unlock className="mr-2 h-4 w-4" /> Decrypt</Button>) : (<Button variant="outline" size="sm" onClick={() => encryptSnippet(snippet.id)} disabled={!passphrase.trim()} type="button"><Lock className="mr-2 h-4 w-4" /> Encrypt</Button>)}
                    <Button variant="ghost" size="icon" onClick={() => copySnippet(snippet.isEncrypted ? "Snippet is encrypted. Decrypt to view/copy." : snippet.code)} title="Copy code" type="button" aria-label="Copy snippet code"><Copy className="h-4 w-4" /></Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete snippet" type="button" aria-label="Delete snippet"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the snippet '{snippet.name}'.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteSnippet(snippet.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {snippet.isEncrypted ? (<p className="text-muted-foreground italic">Snippet content is encrypted. Decrypt to view.</p>) : (
                    <SyntaxHighlighter language={(snippet.language || 'text').toLowerCase()} style={atomDark} customStyle={{ maxHeight: '240px', overflowY: 'auto', borderRadius: '0.375rem', padding: '0.75rem', fontSize: '0.875rem' }} showLineNumbers wrapLines>
                      {String(snippet.code)}
                    </SyntaxHighlighter>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center p-8 border-dashed shadow-sm">
            <ListCollapse className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">
              {searchTerm || selectedTagFilter ? "No Snippets Match Your Filter" : "No Snippets Yet!"}
            </CardTitle>
            <CardDescription className="mb-4">
              {searchTerm || selectedTagFilter ? "Try adjusting your search or filter terms." : "Get started by adding your first code snippet."}
            </CardDescription>
            <Button onClick={() => handleOpenModal()} type="button"><PlusCircle className="mr-2 h-4 w-4" /> Add New Snippet</Button>
            {!(searchTerm || selectedTagFilter) && !isLoadingSnippets && <p className="text-xs text-muted-foreground mt-4">All your saved snippets will appear here.</p>}
          </Card>
        )}
      </div>
    </div>
  );
}

    

    