
"use server";

import { generatePassphrase, type GeneratePassphraseInput, type GeneratePassphraseOutput } from "@/ai/flows/generate-passphrase";
import { enhanceRecoveryPrompt, type EnhanceRecoveryPromptInput, type EnhanceRecoveryPromptOutput } from "@/ai/flows/enhance-recovery-prompt";
import { analyzePassphraseStrength, type AnalyzePassphraseStrengthInput, type AnalyzePassphraseStrengthOutput } from "@/ai/flows/analyze-passphrase-strength";
import { addActivity } from "@/lib/services/firestoreService"; // Keep for AI actions
// logActivityAction is removed as client components will call addActivity service directly

export async function handleGeneratePassphraseAction(
  input: GeneratePassphraseInput,
  userId?: string
): Promise<GeneratePassphraseOutput> {
  console.log("handleGeneratePassphraseAction called with input:", input, "userId:", userId);
  try {
    const result = await generatePassphrase(input);
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      try {
        console.log("handleGeneratePassphraseAction: Attempting to log activity. UserID for logging:", userId);
        await addActivity("generate_passphrase", "Generated a new passphrase.", { userId });
        // Note: triggerActivityRefresh() cannot be called from server action directly
        // Client will call it after this action resolves if needed
      } catch (loggingError) {
        console.warn(`handleGeneratePassphraseAction: Failed to log activity for userId ${userId}. Error:`, (loggingError as Error).message);
      }
    } else {
      console.warn("handleGeneratePassphraseAction: No valid userId provided for logging, activity will not be logged. Received userId:", userId);
    }
    return result;
  } catch (error) {
    console.error("Error in handleGeneratePassphraseAction (main operation):", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate passphrase: ${errorMessage || 'Please try again.'}`);
  }
}

export async function handleEnhanceRecoveryPromptAction(
  input: EnhanceRecoveryPromptInput,
  userId?: string
): Promise<EnhanceRecoveryPromptOutput> {
  console.log("handleEnhanceRecoveryPromptAction called with input:", input, "userId:", userId);
  try {
    const result = await enhanceRecoveryPrompt(input);
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      try {
        console.log("handleEnhanceRecoveryPromptAction: Attempting to log activity. UserID for logging:", userId);
        await addActivity("enhance_prompt", "Enhanced a recovery prompt.", { userId });
      } catch (loggingError) {
        console.warn(`handleEnhanceRecoveryPromptAction: Failed to log activity for userId ${userId}. Error:`, (loggingError as Error).message);
      }
    } else {
      console.warn("handleEnhanceRecoveryPromptAction: No valid userId provided for logging, activity will not be logged. Received userId:", userId);
    }
    return result;
  } catch (error) {
    console.error("Error in handleEnhanceRecoveryPromptAction (main operation):", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to enhance recovery prompt: ${errorMessage || 'Please try again.'}`);
  }
}

export async function handleAnalyzePassphraseStrengthAction(input: AnalyzePassphraseStrengthInput): Promise<AnalyzePassphraseStrengthOutput> {
  try {
    const result = await analyzePassphraseStrength(input);
    return result;
  } catch (error) {
    console.error("Error analyzing passphrase strength:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze passphrase strength: ${errorMessage || 'Please try again.'}`);
  }
}

// Removed logActivityAction
// Client components will now call the addActivity service directly from firestoreService.ts
// This is to ensure that when addActivity (using client SDK) is called,
// it's from a client context where request.auth is correctly populated for Firestore rules.
// Logging attempts from within server actions (like handleGeneratePassphraseAction)
// will still likely fail if rules depend on request.auth, as client SDK's auth state
// isn't typically available to Firestore rules from server action execution context.
// The try-catch blocks within those server actions handle this potential logging failure.
