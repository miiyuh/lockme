"use server";

import { generatePassphrase, type GeneratePassphraseInput, type GeneratePassphraseOutput } from "@/ai/flows/generate-passphrase";
import { enhanceRecoveryPrompt, type EnhanceRecoveryPromptInput, type EnhanceRecoveryPromptOutput } from "@/ai/flows/enhance-recovery-prompt";

export async function handleGeneratePassphraseAction(input: GeneratePassphraseInput): Promise<GeneratePassphraseOutput> {
  try {
    const result = await generatePassphrase(input);
    return result;
  } catch (error) {
    console.error("Error generating passphrase:", error);
    throw new Error("Failed to generate passphrase. Please try again.");
  }
}

export async function handleEnhanceRecoveryPromptAction(input: EnhanceRecoveryPromptInput): Promise<EnhanceRecoveryPromptOutput> {
  try {
    // In a real app, userData would be handled more securely.
    // For this example, we pass it as is, assuming it's already "encrypted" or appropriately handled by the AI flow.
    const result = await enhanceRecoveryPrompt(input);
    return result;
  } catch (error) {
    console.error("Error enhancing recovery prompt:", error);
    throw new Error("Failed to enhance recovery prompt. Please try again.");
  }
}
