/**
 * Form Validation Schemas
 * 
 * Collection of Zod validation schemas used throughout the LockMe application
 * for consistent form validation and type safety.
 * 
 * Features:
 * - Centralized validation rules for all forms
 * - Consistent error messages
 * - TypeScript type inference for form values
 * - Custom validation logic for complex validations
 */

import { z } from 'zod';

/**
 * Passphrase Generator Form Schema
 * 
 * Validates form input for generating secure passphrases.
 */
export const PassphraseGeneratorSchema = z.object({
  /** Length of generated passphrase (8-128 characters) */
  length: z.coerce
    .number()
    .min(8, "Minimum length is 8")
    .max(128, "Maximum length is 128")
    .default(16),
  
  /** Whether to include special symbols in generated passphrase */
  includeSymbols: z.boolean().default(true),
  
  /** Whether to include numbers in generated passphrase */
  includeNumbers: z.boolean().default(true),
  
  /** Optional custom word to include in passphrase */
  customWordInclusion: z.string().optional(),
});

/** Type for Passphrase Generator form values */
export type PassphraseGeneratorFormValues = z.infer<typeof PassphraseGeneratorSchema>;

/**
 * Recovery Prompt Enhancement Schema
 * 
 * Validates form input for enhancing password recovery prompts.
 */
export const EnhanceRecoveryPromptSchema = z.object({
  /** Base recovery prompt to enhance */
  recoveryPrompt: z.string().min(1, "Recovery prompt cannot be empty."),
  
  /** Optional user-specific data for personalized prompts */
  userData: z.string()
    .min(1, "User data cannot be empty. This is used for personalization.")
    .optional(),
});

/** Type for Recovery Prompt Enhancement form values */
export type EnhanceRecoveryPromptFormValues = z.infer<typeof EnhanceRecoveryPromptSchema>;

/**
 * File Encryption Schema
 * 
 * Validates form input for file encryption operations.
 */
export const FileEncryptionSchema = z.object({
  /** Passphrase used for encryption/decryption */
  passphrase: z.string().min(1, "Passphrase cannot be empty."),
});

/** Type for File Encryption form values */
export type FileEncryptionFormValues = z.infer<typeof FileEncryptionSchema>;

/**
 * Password Reset Schema
 * 
 * Validates form input for password reset operations with confirmation matching.
 */
export const PasswordResetActionSchema = z.object({
  /** New password (minimum 8 characters) */
  newPassword: z.string().min(8, "Password must be at least 8 characters long."),
  
  /** Password confirmation for verification */
  confirmNewPassword: z.string(),
}).refine(
  data => data.newPassword === data.confirmNewPassword, 
  {
    message: "Passwords do not match.",
    path: ["confirmNewPassword"],
  }
);

/** Type for Password Reset form values */
export type PasswordResetActionFormValues = z.infer<typeof PasswordResetActionSchema>;

/**
 * User Profile Settings Schema
 * 
 * Validates form input for user profile settings.
 */
export const SettingsProfileFormSchema = z.object({
  /** User's display name (1-50 characters) */
  displayName: z.string()
    .min(1, "Display name cannot be empty.")
    .max(50, "Display name is too long."),
});

/** Type for Profile Settings form values */
export type SettingsProfileFormValues = z.infer<typeof SettingsProfileFormSchema>;