import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  File as FileIcon,
  Trash2,
  Download,
  ArrowUpRight,
  Lock,
  Unlock,
  Search,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize, getFileIcon, truncateFileName } from "@/lib/fileUtils";
import type { File } from "@shared/schema";

export default function FileList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const { toast } = useToast();

  // Fetch files
  const { data: files = [], isLoading, error } = useQuery({
    queryKey: ["/api/files"],
    queryFn: async () => {
      const response = await fetch("/api/files");
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      return response.json() as Promise<File[]>;
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: number) => {
      const response = await apiRequest("DELETE", `/api/files/${fileId}`);
      if (!response.ok) {
        throw new Error("Failed to delete file");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File deleted",
        description: "The file has been deleted successfully.",
      });
      setFileToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete file.",
        variant: "destructive",
      });
    },
  });

  // Filter files based on search term
  const filteredFiles = files.filter(
    (file) =>
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Download handler
  const handleDownload = (fileId: number) => {
    window.open(`/api/files/${fileId}/download`, "_blank");
  };

  // Delete handler
  const handleDeleteConfirm = () => {
    if (fileToDelete) {
      deleteMutation.mutate(fileToDelete.id);
    }
  };

  // Render file icon based on file type
  const renderFileIcon = (fileType: string) => {
    const iconName = getFileIcon(fileType);
    return <FileIcon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-pulse">Loading files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center flex-col text-center gap-2">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <h3 className="text-lg font-medium">Failed to load files</h3>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : "Unknown error occurred"}
              </p>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/files"] })}
                variant="outline"
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Your Files</CardTitle>
          <Button asChild size="sm">
            <Link to="/">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <FileIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-2" />
            <h3 className="text-lg font-medium">No files found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {files.length === 0
                ? "Upload files to encrypt or decrypt them"
                : "No files match your search criteria"}
            </p>
            {files.length === 0 && (
              <Button asChild className="mt-4">
                <Link to="/">Upload Files</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      {renderFileIcon(file.fileType)}
                      <span className="truncate max-w-[200px]" title={file.originalName}>
                        {truncateFileName(file.originalName, 25)}
                      </span>
                    </TableCell>
                    <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {file.isEncrypted ? (
                          <Lock className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Unlock className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-xs">
                          {file.isEncrypted ? "Encrypted" : "Decrypted"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(file.id)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setFileToDelete(file)}
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <ConfirmationDialog
          open={!!fileToDelete}
          onOpenChange={(open) => !open && setFileToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete File"
          description={`Are you sure you want to delete "${fileToDelete?.originalName}"? This action cannot be undone.`}
          confirmText="Delete"
          destructive
        />
      </CardContent>
    </Card>
  );
}
