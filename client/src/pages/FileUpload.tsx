import { useState } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EncryptionForm } from "@/components/EncryptionForm";
import { DecryptionForm } from "@/components/DecryptionForm";
import { FileIcon, UnlockIcon, LockIcon, ListIcon } from "lucide-react";

export default function FileUpload() {
  const [activeTab, setActiveTab] = useState("encrypt");

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      <div className="w-full mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileIcon className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">LockMe</h2>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/files">
            <ListIcon className="mr-2 h-4 w-4" />
            View Files
          </Link>
        </Button>
      </div>

      <Card className="w-full mb-6">
        <CardContent className="p-4 text-center">
          <h3 className="font-medium mb-2">Secure File Encryption</h3>
          <p className="text-sm text-muted-foreground">
            Encrypt your sensitive files with AES-256 encryption. Your files remain private and secure.
          </p>
        </CardContent>
      </Card>

      <Tabs 
        defaultValue="encrypt" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="encrypt" className="flex items-center gap-2">
            <LockIcon className="h-4 w-4" />
            Encrypt
          </TabsTrigger>
          <TabsTrigger value="decrypt" className="flex items-center gap-2">
            <UnlockIcon className="h-4 w-4" />
            Decrypt
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="encrypt">
          <EncryptionForm />
        </TabsContent>
        
        <TabsContent value="decrypt">
          <DecryptionForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
