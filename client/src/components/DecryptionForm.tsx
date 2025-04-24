import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Unlock, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileDropzone } from "./FileDropzone";
import { PasswordInput } from "./PasswordInput";
import { EncryptionProgress } from "./EncryptionProgress";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { File } from "@shared/schema";

// Form schema
const decryptionSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

type DecryptionFormValues = z.infer<typeof decryptionSchema>;

export function DecryptionForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileCreated, setFileCreated] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Form setup
  const form = useForm<DecryptionFormValues>({
    resolver: zodResolver(decryptionSchema),
    defaultValues: {
      password: "",
    },
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
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

  // Decryption mutation
  const decryptMutation = useMutation({
    mutationFn: async ({ fileId, password }: { fileId: number; password: string }) => {
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
      
      const response = await apiRequest("POST", `/api/files/${fileId}/decrypt`, { password });
      
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
        title: "File decrypted",
        description: "Your file has been decrypted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Decryption failed",
        description: error.message || "Failed to decrypt file. Check if your password is correct.",
        variant: "destructive",
      });
    },
  });

  // Handle file selection
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFileCreated(null);
    uploadMutation.mutate(file);
  };

  // Handle form submission
  const onSubmit = (values: DecryptionFormValues) => {
    if (!fileCreated) {
      toast({
        title: "No file selected",
        description: "Please select a file to decrypt.",
        variant: "destructive",
      });
      return;
    }
    
    decryptMutation.mutate({
      fileId: fileCreated.id,
      password: values.password,
    });
  };

  // Download handler
  const handleDownload = () => {
    if (!fileCreated) return;
    
    window.open(`/api/files/${fileCreated.id}/download`, "_blank");
  };

  // Determine progress status
  const getProgressStatus = () => {
    if (decryptMutation.isPending) return "processing";
    if (decryptMutation.isError) return "error";
    if (decryptMutation.isSuccess) return "success";
    return "idle";
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Unlock className="h-5 w-5 text-primary" />
          <span>Decrypt File</span>
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
                    <FormLabel>Decryption Password</FormLabel>
                    <FormControl>
                      <PasswordInput
                        id="decryption-password"
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Enter the password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(uploadMutation.isPending || decryptMutation.isPending || decryptMutation.isSuccess) && (
                <div className="my-4">
                  <EncryptionProgress
                    status={getProgressStatus()}
                    progress={progress}
                    operation="decryption"
                    error={decryptMutation.error?.message}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={
                    !fileCreated || 
                    decryptMutation.isPending || 
                    decryptMutation.isSuccess
                  }
                >
                  {decryptMutation.isPending ? (
                    "Decrypting..."
                  ) : decryptMutation.isSuccess ? (
                    "Decrypted"
                  ) : (
                    <>
                      Decrypt <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                {decryptMutation.isSuccess && (
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
