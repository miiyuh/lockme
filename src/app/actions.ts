
"use server";

import { generatePassphrase, type GeneratePassphraseInput, type GeneratePassphraseOutput } from "@/ai/flows/generate-passphrase";
import { enhanceRecoveryPrompt, type EnhanceRecoveryPromptInput, type EnhanceRecoveryPromptOutput } from "@/ai/flows/enhance-recovery-prompt";
import { analyzePassphraseStrength, type AnalyzePassphraseStrengthInput, type AnalyzePassphraseStrengthOutput } from "@/ai/flows/analyze-passphrase-strength";
import { logActivityWithAdmin } from "@/lib/firebaseAdmin"; 

export async function handleGeneratePassphraseAction(
  input: GeneratePassphraseInput,
  userId?: string 
): Promise<GeneratePassphraseOutput> {
  console.log("handleGeneratePassphraseAction called with input:", input, "userId:", userId);
  try {
    const result = await generatePassphrase(input);
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      console.log("handleGeneratePassphraseAction: Attempting to log activity with Admin SDK. UserID for logging:", userId);
      try {
        await logActivityWithAdmin("generate_passphrase", "Generated a new passphrase.", { userId });
      } catch (loggingError) {
        console.warn(`handleGeneratePassphraseAction: Admin SDK logging attempt had an issue for userId ${userId}. Error:`, (loggingError as Error).message);
        // Do not re-throw here to allow main AI function to succeed even if logging fails.
      }
    } else {
      console.warn("handleGeneratePassphraseAction: No valid userId provided for Admin SDK logging, activity will not be logged. Received userId:", userId);
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
      console.log("handleEnhanceRecoveryPromptAction: Attempting to log activity with Admin SDK. UserID for logging:", userId);
      try {
        await logActivityWithAdmin("enhance_prompt", "Enhanced a recovery prompt.", { userId });
      } catch (loggingError) {
        console.warn(`handleEnhanceRecoveryPromptAction: Admin SDK logging attempt had an issue for userId ${userId}. Error:`, (loggingError as Error).message);
        // Do not re-throw here.
      }
    } else {
       console.warn("handleEnhanceRecoveryPromptAction: No valid userId provided for Admin SDK logging, activity will not be logged. Received userId:", userId);
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
    // This action does not log an activity by default.
    return result;
  } catch (error) {
    console.error("Error analyzing passphrase strength:", error);
    const errorMessage = error instanceof Error ? error.message : String(error); // Completed ternary
    throw new Error(`Failed to analyze passphrase strength: ${errorMessage || 'Please try again.'}`);
  }
}

