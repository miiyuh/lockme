import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: text("file_type").notNull(),
  isEncrypted: boolean("is_encrypted").notNull().default(false),
  encryptionMethod: text("encryption_method"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").references(() => users.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFileSchema = createInsertSchema(files).omit({ 
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

// Available encryption methods
export const encryptionMethods = [
  "aes-256-cbc",
  "aes-192-cbc",
  "aes-128-cbc",
  "aes-256-gcm",
  "aes-192-gcm",
  "aes-128-gcm"
] as const;

export const encryptionMethodSchema = z.enum(encryptionMethods);
export type EncryptionMethod = z.infer<typeof encryptionMethodSchema>;

// Password validation schema
export const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  encryptionMethod: encryptionMethodSchema.default("aes-256-cbc")
});

export type PasswordInput = z.infer<typeof passwordSchema>;
