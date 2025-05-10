
"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, PlusCircle, Trash2, Copy, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Snippet {
  id: string;
  name: string;
  language: string;
  code: string;
  isEncrypted: boolean;
  iv?: string; // Store IV for decryption
  salt?: string; // Store salt for decryption
}

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const PBKDF2_ITERATIONS = 100000;

export default function CodeSnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [newSnippetName, setNewSnippetName] = useState('');
  const [newSnippetLang, setNewSnippetLang] = useState('javascript');
  const [newSnippetCode, setNewSnippetCode] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const { toast } = useToast();

  const addSnippet = () => {
    if (!newSnippetName.trim() || !newSnippetCode.trim()) {
      toast({ title: "Error", description: "Snippet name and code cannot be empty.", variant: "destructive" });
      return;
    }
    const newId = Date.now().toString();
    setSnippets([...snippets, { id: newId, name: newSnippetName, language: newSnippetLang, code: newSnippetCode, isEncrypted: false }]);
    setNewSnippetName('');
    setNewSnippetCode('');
    toast({ title: "Snippet Added", description: `'${newSnippetName}' has been added.` });
  };

  const deleteSnippet = (id: string) => {
    setSnippets(snippets.filter(s => s.id !== id));
    toast({ title: "Snippet Deleted", description: "The snippet has been removed." });
  };

  const copySnippet = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast({ title: "Copied!", description: "Snippet code copied to clipboard." });
    });
  };

  const getKeyMaterial = async (pass: string, salt?: Uint8Array): Promise<[CryptoKey, Uint8Array]> => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw', enc.encode(pass), { name: 'PBKDF2' }, false, ['deriveBits', 'deriveKey']
    );
    const currentSalt = salt || window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const key = await window.crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: currentSalt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']
    );
    return [key, currentSalt];
  };

  const encryptSnippet = async (id: string) => {
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

      setSnippets(snippets.map(s => s.id === id ? { ...s, code: encryptedCode, isEncrypted: true, iv: ivString, salt: saltString } : s));
      toast({ title: "Snippet Encrypted", description: `'${snippet.name}' is now encrypted.` });
    } catch (error) {
      console.error("Encryption error:", error);
      toast({ title: "Encryption Failed", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const arrayBufferFromBase64 = (base64: string) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  const decryptSnippet = async (id: string) => {
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

      setSnippets(snippets.map(s => s.id === id ? { ...s, code: decryptedCode, isEncrypted: false, iv: undefined, salt: undefined } : s));
      toast({ title: "Snippet Decrypted", description: `'${snippet.name}' is now decrypted.` });
    } catch (error) {
      console.error("Decryption error:", error);
      toast({ title: "Decryption Failed", description: "Incorrect passphrase or corrupted data.", variant: "destructive" });
    }
  };


  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="w-full shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Code className="mr-2 h-6 w-6 text-primary" />
              Code Snippet Manager
            </CardTitle>
            <CardDescription>
              Store, manage, and optionally encrypt your code snippets locally.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="passphrase">Encryption Passphrase</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="passphrase" 
                  type={showPassphrase ? "text" : "password"} 
                  value={passphrase} 
                  onChange={(e) => setPassphrase(e.target.value)} 
                  placeholder="Enter passphrase for encryption/decryption"
                  className="flex-grow"
                />
                <Button variant="ghost" size="icon" onClick={() => setShowPassphrase(!showPassphrase)}>
                  {showPassphrase ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">This passphrase is used to encrypt/decrypt snippets. Keep it secure.</p>
            </div>

            <Card className="p-4 bg-muted/30">
              <h3 className="text-lg font-medium mb-2">Add New Snippet</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="snippetName">Snippet Name</Label>
                  <Input id="snippetName" value={newSnippetName} onChange={(e) => setNewSnippetName(e.target.value)} placeholder="e.g., React Component" />
                </div>
                <div>
                  <Label htmlFor="snippetLang">Language</Label>
                  <Select value={newSnippetLang} onValueChange={setNewSnippetLang}>
                    <SelectTrigger id="snippetLang">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="css">CSS</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                      <SelectItem value="php">PHP</SelectItem>
                      <SelectItem value="typescript">TypeScript</SelectItem>
                       <SelectItem value="text">Plain Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="snippetCode">Code</Label>
                <Textarea id="snippetCode" value={newSnippetCode} onChange={(e) => setNewSnippetCode(e.target.value)} placeholder="Paste your code here..." rows={6} className="font-mono text-sm" />
              </div>
              <Button onClick={addSnippet} className="mt-4 w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Snippet
              </Button>
            </Card>
          </CardContent>
        </Card>

        {snippets.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Snippets</h2>
            {snippets.map(snippet => (
              <Card key={snippet.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-card-foreground/5 p-4">
                  <div>
                    <CardTitle className="text-lg">{snippet.name}</CardTitle>
                    <CardDescription>{snippet.language} {snippet.isEncrypted ? "(Encrypted)" : ""}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {snippet.isEncrypted ? (
                      <Button variant="outline" size="sm" onClick={() => decryptSnippet(snippet.id)} disabled={!passphrase.trim()}>
                        <Unlock className="mr-2 h-4 w-4" /> Decrypt
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => encryptSnippet(snippet.id)} disabled={!passphrase.trim()}>
                        <Lock className="mr-2 h-4 w-4" /> Encrypt
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => copySnippet(snippet.isEncrypted ? "Snippet is encrypted. Decrypt to view/copy." : snippet.code)} title="Copy code">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteSnippet(snippet.id)} className="text-destructive hover:text-destructive" title="Delete snippet">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  {snippet.isEncrypted ? (
                    <p className="text-muted-foreground italic">Snippet content is encrypted. Decrypt to view.</p>
                  ) : (
                    <pre className="bg-muted p-3 rounded-md overflow-x-auto text-sm font-mono max-h-60">
                      <code>{snippet.code}</code>
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
         {snippets.length === 0 && (
           <Card className="text-center p-8 border-dashed">
             <Code className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No Snippets Yet</CardTitle>
            <CardDescription>Add your first code snippet using the form above to get started!</CardDescription>
          </Card>
        )}
      </div>
    </div>
  );
}

