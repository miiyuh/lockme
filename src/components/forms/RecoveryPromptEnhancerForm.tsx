
"use client";

/**
 * RecoveryPromptEnhancerForm Component
 * 
 * This component provides a user interface for enhancing recovery prompts using AI.
 * It allows users to input an original recovery prompt and optional personalization data
 * to make the prompt more memorable, secure, and personalized.
 * 
 * Features:
 * - AI-powered enhancement of recovery prompts
 * - Optional personalization based on user data
 * - One-click copy to clipboard functionality
 * - Activity logging for authenticated users
 * - Secure handling of sensitive information
 */

import type { FC } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EnhanceRecoveryPromptSchema, type EnhanceRecoveryPromptFormValues } from '@/lib/schemas';
import { handleEnhanceRecoveryPromptAction } from '@/app/actions';
import type { EnhanceRecoveryPromptOutput } from '@/ai/flows/enhance-recovery-prompt';

// Contexts & Hooks
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useToast } from '@/hooks/use-toast';

// UI Components
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

// Icons
import { Loader2, Sparkles, Copy, AlertCircle } from 'lucide-react';

/**
 * RecoveryPromptEnhancerForm Component
 * 
 * A form component that allows users to enhance recovery prompts with AI
 * to make them more memorable and secure.
 */
const RecoveryPromptEnhancerForm: FC = () => {
  // Context and state management
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivity();
  const [enhancedPrompt, setEnhancedPrompt] = useState<EnhanceRecoveryPromptOutput | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  /**
   * Initialize form with zod schema validation and default values
   */
  const form = useForm<EnhanceRecoveryPromptFormValues>({
    resolver: zodResolver(EnhanceRecoveryPromptSchema),
    defaultValues: {
      recoveryPrompt: '',
      userData: '',
    },
  });

  /**
   * Form submission handler
   * 
   * Processes the prompt enhancement request, handles authentication checks,
   * and manages the enhancement state and feedback.
   * 
   * @param values - Form values containing original prompt and personalization data
   */
  const onSubmit = async (values: EnhanceRecoveryPromptFormValues) => {
    // Authentication check
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to enhance prompts and log activity.",
        variant: "destructive",
      });
      return;
    }

    // Start enhancement process
    setIsEnhancing(true);
    setEnhancedPrompt(null);
    
    try {
      // Call server action to enhance prompt
      const result = await handleEnhanceRecoveryPromptAction({
        recoveryPrompt: values.recoveryPrompt,
        userData: values.userData || "No specific user data provided for enhancement.",
      }, user.uid);
      
      setEnhancedPrompt(result);
      
      // Show success notification
      toast({
        title: "Prompt Enhanced",
        description: "Your recovery prompt has been enhanced.",
      });
      
      // Refresh activity logs
      triggerActivityRefresh();
    } catch (error) {
      console.error("Error in RecoveryPromptEnhancerForm onSubmit:", error);
      
      // Show error notification
      toast({
        title: "Error Enhancing Prompt",
        description: (error as Error).message || "Could not enhance recovery prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  /**
   * Copy text to clipboard utility function
   * 
   * Provides user feedback via toast notifications for successful or failed copy operations.
   * 
   * @param text - The text to copy to clipboard
   */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Enhanced prompt copied to clipboard.",
        });
      })
      .catch(err => {
        toast({
          title: "Copy Failed",
          description: `Could not copy to clipboard. Error: ${(err as Error).message}`,
          variant: "destructive",
        });
      });
  };
  return (
    <Form {...form}>
      {/* Recovery Prompt Enhancement Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Original Recovery Prompt Field */}
        <FormField
          control={form.control}
          name="recoveryPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Original Recovery Prompt</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="e.g., What was my first pet's name?" 
                  {...field} 
                  rows={3} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* User Personalization Data Field */}
        <FormField
          control={form.control}
          name="userData"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Data for Personalization (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="e.g., Favorite color is blue, born in Paris. This data helps AI personalize the prompt. It will be handled securely." 
                  {...field} 
                  rows={3} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Authentication Warning */}
        {!user && (
          <div className="flex items-center p-3 text-sm text-destructive border border-destructive/50 bg-destructive/10 rounded-md">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>Please log in to enhance prompts and save activity.</span>
          </div>
        )}

        {/* Enhance Button */}
        <Button type="submit" disabled={isEnhancing || !user} className="w-full">
          {isEnhancing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Enhance Prompt
        </Button>
      </form>

      {/* Enhanced Prompt Results Card */}
      {enhancedPrompt && (
        <Card className="mt-6 bg-background/50">
          <CardHeader>
            <CardTitle>Enhanced Recovery Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="enhancedPromptText">Your Enhanced Prompt</Label>
            <div className="flex items-center space-x-2">
              <Textarea 
                id="enhancedPromptText" 
                value={enhancedPrompt.enhancedPrompt} 
                readOnly 
                rows={3} 
                className="font-mono"
              />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => copyToClipboard(enhancedPrompt.enhancedPrompt)} 
                aria-label="Copy enhanced prompt"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </Form>
  );
};

export default RecoveryPromptEnhancerForm;
