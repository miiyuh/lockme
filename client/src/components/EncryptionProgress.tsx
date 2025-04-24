import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, XCircle } from "lucide-react";

type ProgressStatus = "idle" | "processing" | "success" | "error";

interface EncryptionProgressProps {
  status: ProgressStatus;
  progress: number;
  operation: "encryption" | "decryption";
  error?: string;
}

export function EncryptionProgress({
  status,
  progress,
  operation,
  error,
}: EncryptionProgressProps) {
  const getStatusIndicator = () => {
    switch (status) {
      case "idle":
        return <Shield className="h-6 w-6 text-gray-400" />;
      case "processing":
        return <Shield className="h-6 w-6 text-primary animate-pulse" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "error":
        return <XCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusMessage = () => {
    const operationName = operation === "encryption" ? "encryption" : "decryption";
    
    switch (status) {
      case "idle":
        return `Ready for ${operationName}`;
      case "processing":
        return `${operationName.charAt(0).toUpperCase() + operationName.slice(1)} in progress...`;
      case "success":
        return `${operationName.charAt(0).toUpperCase() + operationName.slice(1)} completed successfully!`;
      case "error":
        return error || `${operationName.charAt(0).toUpperCase() + operationName.slice(1)} failed. Please try again.`;
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          {getStatusIndicator()}
          <span 
            className={`text-sm font-medium ${
              status === "error" ? "text-red-500" : 
              status === "success" ? "text-green-500" : 
              "text-gray-700"
            }`}
          >
            {getStatusMessage()}
          </span>
        </div>
        
        {status === "processing" && (
          <span className="text-xs font-medium text-gray-500">{progress}%</span>
        )}
      </div>
      
      {status === "processing" && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );
}
