"use server";

/**
 * Server Actions for LockMe AI Features
 * 
 * This file contains server actions that handle AI-powered features of the LockMe application.
 * Each action wraps a specific AI flow and includes activity logging when applicable.
 */

// AI Flow Imports
import { 
  generatePassphrase, 
  type GeneratePassphraseInput, 
  type GeneratePassphraseOutput 
} from "@/ai/flows/generate-passphrase";

import { 
  enhanceRecoveryPrompt, 
  type EnhanceRecoveryPromptInput, 
  type EnhanceRecoveryPromptOutput 
} from "@/ai/flows/enhance-recovery-prompt";

import { 
  analyzePassphraseStrength, 
  type AnalyzePassphraseStrengthInput, 
  type AnalyzePassphraseStrengthOutput 
} from "@/ai/flows/analyze-passphrase-strength";

// Firebase Admin SDK for activity logging
import { logActivityWithAdmin } from "@/lib/firebaseAdmin";

/**
 * Handles generating a secure passphrase using AI
 * 
 * @param {GeneratePassphraseInput} input - Parameters for passphrase generation
 * @param {string} [userId] - Optional user ID for activity logging
 * @returns {Promise<GeneratePassphraseOutput>} Generated passphrase and related information
 * @throws {Error} If passphrase generation fails
 */
export async function handleGeneratePassphraseAction(
  input: GeneratePassphraseInput,
  userId?: string 
): Promise<GeneratePassphraseOutput> {
  console.log("handleGeneratePassphraseAction called with input:", input, "userId:", userId);
  
  try {
    // Generate passphrase using AI
    const result = await generatePassphrase(input);
    
    // Log activity if user ID is provided
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      console.log("handleGeneratePassphraseAction: Attempting to log activity with Admin SDK. UserID for logging:", userId);
      
      try {
        await logActivityWithAdmin("generate_passphrase", "Generated a new passphrase.", { userId });
      } catch (loggingError) {
        console.warn(
          `handleGeneratePassphraseAction: Admin SDK logging attempt had an issue for userId ${userId}. Error:`, 
          (loggingError as Error).message
        );
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

/**
 * Handles enhancing a recovery prompt using AI
 * 
 * @param {EnhanceRecoveryPromptInput} input - Parameters for prompt enhancement
 * @param {string} [userId] - Optional user ID for activity logging
 * @returns {Promise<EnhanceRecoveryPromptOutput>} Enhanced prompt and related information
 * @throws {Error} If prompt enhancement fails
 */
export async function handleEnhanceRecoveryPromptAction(
  input: EnhanceRecoveryPromptInput,
  userId?: string 
): Promise<EnhanceRecoveryPromptOutput> {
  console.log("handleEnhanceRecoveryPromptAction called with input:", input, "userId:", userId);
  
  try {
    // Enhance recovery prompt using AI
    const result = await enhanceRecoveryPrompt(input);
    
    // Log activity if user ID is provided
    if (userId && typeof userId === 'string' && userId.trim() !== '') {
      console.log("handleEnhanceRecoveryPromptAction: Attempting to log activity with Admin SDK. UserID for logging:", userId);
      
      try {
        await logActivityWithAdmin("enhance_prompt", "Enhanced a recovery prompt.", { userId });
      } catch (loggingError) {
        console.warn(
          `handleEnhanceRecoveryPromptAction: Admin SDK logging attempt had an issue for userId ${userId}. Error:`, 
          (loggingError as Error).message
        );
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

/**
 * Analyzes the strength of a given passphrase using AI
 * 
 * @param {AnalyzePassphraseStrengthInput} input - Parameters for strength analysis
 * @returns {Promise<AnalyzePassphraseStrengthOutput>} Analysis results and recommendations
 * @throws {Error} If passphrase analysis fails
 */
export async function handleAnalyzePassphraseStrengthAction(
  input: AnalyzePassphraseStrengthInput
): Promise<AnalyzePassphraseStrengthOutput> {
  try {
    // Analyze passphrase strength using AI
    const result = await analyzePassphraseStrength(input);
    // This action does not log an activity by default.
    return result;
  } catch (error) {
    console.error("Error analyzing passphrase strength:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to analyze passphrase strength: ${errorMessage || 'Please try again.'}`);
  }
}

