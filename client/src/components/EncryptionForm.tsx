import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Lock, ArrowRight, Download, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { FileDropzone } from "./FileDropzone";
import { PasswordInput } from "./PasswordInput";
import { EncryptionProgress } from "./EncryptionProgress";
import { EncryptionMethodSelect } from "./EncryptionMethodSelect";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { File } from "@shared/schema";
import { encryptionMethodSchema } from "@shared/schema";

// Form schema
const encryptionSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
  encryptionMethod: encryptionMethodSchema.default("aes-256-cbc"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type EncryptionFormValues = z.infer<typeof encryptionSchema>;

export function EncryptionForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCreated, setFileCreated] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Form setup
  const form = useForm<EncryptionFormValues>({
    resolver: zodResolver(encryptionSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
      encryptionMethod: "aes-256-cbc",
    },
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: globalThis.File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json() as Promise<File>;
    },
    onSuccess: (data) => {
      setFileCreated(data);
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File uploaded",
        description: "Your file has been uploaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file.",
        variant: "destructive",
      });
    },
  });

  // Encryption mutation
  const encryptMutation = useMutation({
    mutationFn: async ({ 
      fileId, 
      password,
      encryptionMethod 
    }: { 
      fileId: number; 
      password: string;
      encryptionMethod: string;
    }) => {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(interval);
            return 100;
          }
          return newProgress;
        });
      }, 200);
      
      const response = await apiRequest("POST", `/api/files/${fileId}/encrypt`, { 
        password, 
        encryptionMethod 
      });
      
      clearInterval(interval);
      setProgress(100);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json() as Promise<File>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File encrypted",
        description: "Your file has been encrypted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Encryption failed",
        description: error.message || "Failed to encrypt file.",
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileSelect = (file: globalThis.File) => {
    setSelectedFile(null);
    setFileCreated(null);
    uploadMutation.mutate(file);
  };

  // Handle form submission
  const onSubmit = (values: EncryptionFormValues) => {
    if (!fileCreated) {
      toast({
        title: "No file selected",
        description: "Please select a file to encrypt.",
        variant: "destructive",
      });
      return;
    }
    
    encryptMutation.mutate({
      fileId: fileCreated.id,
      password: values.password,
      encryptionMethod: values.encryptionMethod,
    });
  };

  // Download handler
  const handleDownload = () => {
    if (!fileCreated) return;
    
    window.open(`/api/files/${fileCreated.id}/download`, "_blank");
  };

  // Determine progress status
  const getProgressStatus = () => {
    if (encryptMutation.isPending) return "processing";
    if (encryptMutation.isError) return "error";
    if (encryptMutation.isSuccess) return "success";
    return "idle";
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <span>Encrypt File</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="mb-4">
            <FileDropzone onFileSelect={handleFileSelect} />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Encryption Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        id="encryption-password"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter a strong password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        id="confirm-password"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Confirm your password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="encryptionMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Encryption Method</FormLabel>
                    <FormControl>
                      <EncryptionMethodSelect
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      <div className="flex items-center gap-1 mt-1 text-xs">
                        <ShieldAlert className="h-3 w-3" />
                        <span>Higher bits provide stronger encryption but can be slower</span>
                      </div>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(uploadMutation.isPending || encryptMutation.isPending || encryptMutation.isSuccess) && (
                <div className="my-4">
                  <EncryptionProgress
                    status={getProgressStatus()}
                    progress={progress}
                    operation="encryption"
                    error={encryptMutation.error?.message}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    !fileCreated || 
                    encryptMutation.isPending || 
                    encryptMutation.isSuccess
                  }
                >
                  {encryptMutation.isPending ? (
                    "Encrypting..."
                  ) : encryptMutation.isSuccess ? (
                    "Encrypted"
                  ) : (
                    <>
                      Encrypt <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                {encryptMutation.isSuccess && (
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
