import type { Timestamp } from "firebase/firestore";

export interface Activity {
  id?: string;
  type: "encrypt" | "decrypt" | "generate_passphrase" | "enhance_prompt" | "snippet_created" | "snippet_updated" | "snippet_deleted";
  description: string;
  timestamp: Timestamp;
  fileName?: string; // For encrypt/decrypt
  snippetName?: string; // For snippet actions
  userId?: string; // For user-specific logging
}

export interface SnippetDocument {
  id?: string; // Firestore document ID
  name: string;
  language: string;
  code: string;
  isEncrypted: boolean;
  iv?: string;
  salt?: string;
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  userId?: string; // For user-specific snippets
}
