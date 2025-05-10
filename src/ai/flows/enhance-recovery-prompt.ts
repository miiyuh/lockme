'use server';
/**
 * @fileOverview AI-powered recovery prompt enhancement.
 *
 * This file defines a Genkit flow that takes user data and a recovery prompt as input,
 * and enhances the recovery prompt using the user data in a privacy-preserving manner.
 *
 * @exports enhanceRecoveryPrompt - The main function to enhance the recovery prompt.
 * @exports EnhanceRecoveryPromptInput - The input type for the enhanceRecoveryPrompt function.
 * @exports EnhanceRecoveryPromptOutput - The output type for the enhanceRecoveryPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceRecoveryPromptInputSchema = z.object({
  userData: z
    .string()
    .describe('Encrypted user data to enhance the recovery prompt.'),
  recoveryPrompt: z
    .string()
    .describe('The original recovery prompt provided by the user.'),
});
export type EnhanceRecoveryPromptInput = z.infer<typeof EnhanceRecoveryPromptInputSchema>;

const EnhanceRecoveryPromptOutputSchema = z.object({
  enhancedPrompt: z
    .string()
    .describe('The AI-enhanced recovery prompt.'),
});
export type EnhanceRecoveryPromptOutput = z.infer<typeof EnhanceRecoveryPromptOutputSchema>;

export async function enhanceRecoveryPrompt(input: EnhanceRecoveryPromptInput): Promise<EnhanceRecoveryPromptOutput> {
  return enhanceRecoveryPromptFlow(input);
}

const enhanceRecoveryPromptPrompt = ai.definePrompt({
  name: 'enhanceRecoveryPromptPrompt',
  input: {schema: EnhanceRecoveryPromptInputSchema},
  output: {schema: EnhanceRecoveryPromptOutputSchema},
  prompt: `You are an AI assistant designed to enhance recovery prompts based on encrypted user data.

  Your goal is to make the recovery prompt more personalized and memorable for the user, without revealing the underlying data.

  Here is the user's original recovery prompt:
  {{recoveryPrompt}}

  Here is the encrypted user data:
  {{userData}}

  Enhance the recovery prompt using the user data to make it more effective for password recovery, while maintaining privacy.
  The enhanced prompt should be easy to remember, and related to the user data.
  Return only the enhanced prompt.
  `,
});

const enhanceRecoveryPromptFlow = ai.defineFlow(
  {
    name: 'enhanceRecoveryPromptFlow',
    inputSchema: EnhanceRecoveryPromptInputSchema,
    outputSchema: EnhanceRecoveryPromptOutputSchema,
  },
  async input => {
    const {output} = await enhanceRecoveryPromptPrompt(input);
    return output!;
  }
);
