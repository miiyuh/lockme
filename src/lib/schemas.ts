import { z } from 'zod';

export const PassphraseGeneratorSchema = z.object({
  length: z.coerce.number().min(8, "Minimum length is 8").max(128, "Maximum length is 128").default(16),
  includeSymbols: z.boolean().default(true),
  includeNumbers: z.boolean().default(true),
  customWordInclusion: z.string().optional(),
});
export type PassphraseGeneratorFormValues = z.infer<typeof PassphraseGeneratorSchema>;


export const EnhanceRecoveryPromptSchema = z.object({
  recoveryPrompt: z.string().min(1, "Recovery prompt cannot be empty."),
  userData: z.string().min(1, "User data cannot be empty. This is used for personalization.").optional(),
});
export type EnhanceRecoveryPromptFormValues = z.infer<typeof EnhanceRecoveryPromptSchema>;

export const FileEncryptionSchema = z.object({
  passphrase: z.string().min(1, "Passphrase cannot be empty."),
});
export type FileEncryptionFormValues = z.infer<typeof FileEncryptionSchema>;

export const PasswordResetActionSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long."),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match.",
  path: ["confirmNewPassword"], // path of error
});
export type PasswordResetActionFormValues = z.infer<typeof PasswordResetActionSchema>;

export const SettingsProfileFormSchema = z.object({
  displayName: z.string().min(1, "Display name cannot be empty.").max(50, "Display name is too long."),
});
export type SettingsProfileFormValues = z.infer<typeof SettingsProfileFormSchema>;