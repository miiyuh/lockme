'use server';
/**
 * @fileOverview An AI agent for analyzing passphrase strength.
 *
 * - analyzePassphraseStrength - A function that handles the passphrase strength analysis.
 * - AnalyzePassphraseStrengthInput - The input type for the analyzePassphraseStrength function.
 * - AnalyzePassphraseStrengthOutput - The return type for the analyzePassphraseStrength function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePassphraseStrengthInputSchema = z.object({
  passphrase: z.string().describe('The passphrase to analyze.'),
});
export type AnalyzePassphraseStrengthInput = z.infer<typeof AnalyzePassphraseStrengthInputSchema>;

const AnalyzePassphraseStrengthOutputSchema = z.object({
  strengthLevel: z
    .number()
    .min(0)
    .max(4)
    .describe('A numerical strength score from 0 (very weak) to 4 (very strong).'),
  feedback: z.string().describe('A concise textual summary of the passphrase strength.'),
  suggestions: z
    .array(z.string())
    .describe('An array of short, actionable suggestions if the passphrase can be improved. Empty if no suggestions.'),
});
export type AnalyzePassphraseStrengthOutput = z.infer<typeof AnalyzePassphraseStrengthOutputSchema>;

export async function analyzePassphraseStrength(input: AnalyzePassphraseStrengthInput): Promise<AnalyzePassphraseStrengthOutput> {
  return analyzePassphraseStrengthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePassphraseStrengthPrompt',
  input: {schema: AnalyzePassphraseStrengthInputSchema},
  output: {schema: AnalyzePassphraseStrengthOutputSchema},
  prompt: `You are a security expert specializing in passphrase strength analysis.
Analyze the provided passphrase: '{{passphrase}}'.

Evaluate its strength based on the following criteria:
- Length (ideal: 12+ characters)
- Character variety (presence of uppercase letters, lowercase letters, numbers, and symbols)
- Presence of common dictionary words or easily guessable patterns (e.g., 'password123', 'qwerty', '12345678').
- Uniqueness and randomness.

Return your analysis in the specified JSON format.
For 'strengthLevel':
  - 0: Very Weak (e.g., less than 8 chars, only one character type, very common)
  - 1: Weak (e.g., 8-11 chars, limited character types, somewhat common)
  - 2: Fair (e.g., meets length, 2-3 character types, not obviously common)
  - 3: Good (e.g., 12+ chars, 3-4 character types, appears random)
  - 4: Strong (e.g., 16+ chars, all 4 character types, high entropy, no discernible patterns)

For 'feedback': Provide a brief, user-friendly summary.
For 'suggestions': Offer specific, actionable advice if improvements can be made. If the passphrase is very strong, suggestions can be an empty array.

Example for a weak passphrase like "password":
{
  "strengthLevel": 0,
  "feedback": "Very weak. Uses a common dictionary word and lacks character variety.",
  "suggestions": ["Increase length to at least 12 characters.", "Include uppercase letters.", "Include numbers.", "Include symbols."]
}

Example for a strong passphrase like "R#8!zLpW@3qX$*7%":
{
  "strengthLevel": 4,
  "feedback": "Strong. Excellent length and mix of character types.",
  "suggestions": []
}

Analyze this passphrase: {{passphrase}}
`,
});

const analyzePassphraseStrengthFlow = ai.defineFlow(
  {
    name: 'analyzePassphraseStrengthFlow',
    inputSchema: AnalyzePassphraseStrengthInputSchema,
    outputSchema: AnalyzePassphraseStrengthOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    // Ensure suggestions is always an array, even if AI returns null or undefined
    if (output && !Array.isArray(output.suggestions)) {
        output.suggestions = [];
    }
    return output!;
  }
);
