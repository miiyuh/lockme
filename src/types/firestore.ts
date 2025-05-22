import type { Timestamp } from "firebase/firestore";

export interface Activity {
  id?: string;
  type: "encrypt" | "decrypt" | "generate_passphrase" | "enhance_prompt" | "snippet_created" | "snippet_updated" | "snippet_deleted";
  description: string;
  timestamp: Timestamp;
  userId?: string;
}

export interface SnippetDocument {
  id?: string;
  name: string;
  language: string;
  code: string;
  isEncrypted: boolean;
  iv?: string;
  salt?: string;
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId?: string;
}
