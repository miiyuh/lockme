import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { encryptionMethods } from "@shared/schema";
import type { EncryptionMethod } from "@shared/schema";

const ENCRYPTION_METHOD_LABELS: Record<EncryptionMethod, string> = {
  "aes-256-cbc": "AES-256 (CBC) - Strongest",
  "aes-192-cbc": "AES-192 (CBC) - Strong",
  "aes-128-cbc": "AES-128 (CBC) - Standard",
  "aes-256-gcm": "AES-256 (GCM) - Strongest + Auth",
  "aes-192-gcm": "AES-192 (GCM) - Strong + Auth",
  "aes-128-gcm": "AES-128 (GCM) - Standard + Auth",
};

interface EncryptionMethodSelectProps {
  value: EncryptionMethod;
  onChange: (value: EncryptionMethod) => void;
  className?: string;
}

export function EncryptionMethodSelect({
  value,
  onChange,
  className,
}: EncryptionMethodSelectProps) {
  return (
    <Select value={value} onValueChange={onChange as (value: string) => void}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select encryption method" />
      </SelectTrigger>
      <SelectContent>
        {encryptionMethods.map((method) => (
          <SelectItem key={method} value={method}>
            {ENCRYPTION_METHOD_LABELS[method]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}