"use server";

import { generatePassphrase, type GeneratePassphraseInput, type GeneratePassphraseOutput } from "@/ai/flows/generate-passphrase";
import { enhanceRecoveryPrompt, type EnhanceRecoveryPromptInput, type EnhanceRecoveryPromptOutput } from "@/ai/flows/enhance-recovery-prompt";
import { addActivity } from "@/lib/services/firestoreService";
import type { Activity } from "@/types/firestore";

export async function handleGeneratePassphraseAction(input: GeneratePassphraseInput): Promise<GeneratePassphraseOutput> {
  try {
    const result = await generatePassphrase(input);
    await addActivity("generate_passphrase", "Generated a new passphrase.");
    return result;
  } catch (error) {
    console.error("Error generating passphrase:", error);
    throw new Error("Failed to generate passphrase. Please try again.");
  }
}

export async function handleEnhanceRecoveryPromptAction(input: EnhanceRecoveryPromptInput): Promise<EnhanceRecoveryPromptOutput> {
  try {
    const result = await enhanceRecoveryPrompt(input);
    await addActivity("enhance_prompt", "Enhanced a recovery prompt.");
    return result;
  } catch (error) {
    console.error("Error enhancing recovery prompt:", error);
    throw new Error("Failed to enhance recovery prompt. Please try again.");
  }
}

export async function logActivityAction(
  type: Activity['type'],
  description: string,
  details?: { fileName?: string; snippetName?: string; userId?: string }
): Promise<void> {
  try {
    await addActivity(type, description, details);
  } catch (error) {
    console.error("Error logging activity via server action:", error);
    // Optionally, re-throw or handle as appropriate for the client
  }
}
