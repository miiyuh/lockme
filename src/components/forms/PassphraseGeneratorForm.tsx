"use client";

/**
 * PassphraseGeneratorForm Component
 * 
 * This component provides a user interface for generating secure passphrases with 
 * customizable options like length, symbols, numbers, and custom word inclusion.
 * It leverages AI generation and provides copy functionality for the results.
 * 
 * Features:
 * - Customizable passphrase length
 * - Optional symbol and number inclusion
 * - Custom word incorporation
 * - One-click copy to clipboard functionality
 * - Recovery prompt generation
 * - Activity logging (for authenticated users)
 */

import type { FC } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PassphraseGeneratorSchema, type PassphraseGeneratorFormValues } from '@/lib/schemas';
import { handleGeneratePassphraseAction } from '@/app/actions';
import type { GeneratePassphraseOutput } from '@/ai/flows/generate-passphrase';

// Contexts & Hooks
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// Icons
import { Loader2, Wand2, Copy, AlertCircle } from 'lucide-react';

/**
 * PassphraseGeneratorForm Component
 * 
 * A form component that allows users to generate secure, memorable passphrases
 * with customizable options and provides instant feedback.
 */
const PassphraseGeneratorForm: FC = () => {
  // Context and state management
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivity();
  const [generatedPassphrase, setGeneratedPassphrase] = useState<GeneratePassphraseOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  /**
   * Initialize form with zod schema validation and default values
   */
  const form = useForm<PassphraseGeneratorFormValues>({
    resolver: zodResolver(PassphraseGeneratorSchema),
    defaultValues: {
      length: 16,
      includeSymbols: true,
      includeNumbers: true,
      customWordInclusion: '',
    },
  });

  /**
   * Form submission handler
   * 
   * Processes the passphrase generation request, handles authentication checks,
   * and manages the generation state and feedback.
   * 
   * @param values - Form values containing passphrase generation options
   */
  const onSubmit = async (values: PassphraseGeneratorFormValues) => {
    // Authentication check
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to generate passphrases and log activity.",
        variant: "destructive",
      });
      return;
    }

    // Start generation process
    setIsGenerating(true);
    setGeneratedPassphrase(null);
    
    try {
      // Call server action to generate passphrase
      const result = await handleGeneratePassphraseAction(values, user.uid);
      setGeneratedPassphrase(result);
      
      // Show success notification
      toast({
        title: "Passphrase Generated",
        description: "Your new secure passphrase is ready.",
      });
      
      // Refresh activity logs
      triggerActivityRefresh(); 
    } catch (error) {
      console.error("Error in PassphraseGeneratorForm onSubmit:", error);
      
      // Show error notification
      toast({
        title: "Error Generating Passphrase",
        description: (error as Error).message || "Could not generate passphrase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Copy text to clipboard utility function
   * 
   * Provides user feedback via toast notifications for successful or failed copy operations.
   * 
   * @param text - The text to copy to clipboard
   * @param type - The type of content being copied (for notification purposes)
   */
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: `${type} Copied!`,
          description: `${type} has been copied to your clipboard.`,
        });
      })
      .catch(err => {
        toast({
          title: "Copy Failed",
          description: `Could not copy ${type.toLowerCase()} to clipboard. Error: ${(err as Error).message}`,
          variant: "destructive",
        });
      });
  };

  return (
    <Form {...form}>
      {/* Passphrase Generator Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Input Fields - Length and Custom Words */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Passphrase Length Field */}
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passphrase Length</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g., 16" 
                    {...field} 
                    onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Custom Words Field */}
          <FormField
            control={form.control}
            name="customWordInclusion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Words (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., coffee sun music" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Checkbox Options - Symbols and Numbers */}
        <div className="flex items-center space-x-4">
          {/* Include Symbols Checkbox */}
          <FormField
            control={form.control}
            name="includeSymbols"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow bg-card/50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Include Symbols (e.g., @#$%)</FormLabel>
                </div>
              </FormItem>
            )}
          />

          {/* Include Numbers Checkbox */}
          <FormField
            control={form.control}
            name="includeNumbers"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow bg-card/50">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Include Numbers (e.g., 123)</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Authentication Warning */}
        {!user && (
          <div className="flex items-center p-3 text-sm text-destructive border border-destructive/50 bg-destructive/10 rounded-md">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>Please log in to generate passphrases and save activity.</span>
          </div>
        )}

        {/* Generate Button */}
        <Button type="submit" disabled={isGenerating || !user} className="w-full">
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Generate Passphrase
        </Button>
      </form>

      {/* Generated Passphrase Results Card */}
      {generatedPassphrase && (
        <Card className="mt-6 bg-background/50">
          <CardHeader>
            <CardTitle>Your Generated Passphrase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Passphrase Display with Copy Button */}
            <div>
              <Label htmlFor="generatedPassphraseText">Passphrase</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="generatedPassphraseText" 
                  type="text" 
                  value={generatedPassphrase.passphrase} 
                  readOnly 
                  className="font-mono"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => copyToClipboard(generatedPassphrase.passphrase, 'Passphrase')} 
                  aria-label="Copy passphrase"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Recovery Prompt Display with Copy Button */}
            <div>
              <Label htmlFor="recoveryPromptText">Recovery Prompt</Label>
              <div className="flex items-center space-x-2">
                <Textarea 
                  id="recoveryPromptText" 
                  value={generatedPassphrase.recoveryPrompt} 
                  readOnly 
                  rows={2} 
                  className="font-mono"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => copyToClipboard(generatedPassphrase.recoveryPrompt, 'Recovery Prompt')} 
                  aria-label="Copy recovery prompt"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </Form>
  );
};

export default PassphraseGeneratorForm;
