
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EnhanceRecoveryPromptSchema, type EnhanceRecoveryPromptFormValues } from '@/lib/schemas';
import { handleEnhanceRecoveryPromptAction } from '@/app/actions';
import type { EnhanceRecoveryPromptOutput } from '@/ai/flows/enhance-recovery-prompt';
import { useAuth } from '@/contexts/AuthContext'; // Added

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Copy, AlertCircle } from 'lucide-react';
import { useActivity } from '@/contexts/ActivityContext';

const RecoveryPromptEnhancerForm: FC = () => {
  const { user } = useAuth();
  const { triggerActivityRefresh } = useActivity();
  const [enhancedPrompt, setEnhancedPrompt] = useState<EnhanceRecoveryPromptOutput | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const { toast } = useToast();

  const form = useForm<EnhanceRecoveryPromptFormValues>({
    resolver: zodResolver(EnhanceRecoveryPromptSchema),
    defaultValues: {
      recoveryPrompt: '',
      userData: '',
    },
  });

  const onSubmit = async (values: EnhanceRecoveryPromptFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to enhance prompts and log activity.",
        variant: "destructive",
      });
      return;
    }
    setIsEnhancing(true);
    setEnhancedPrompt(null);
    try {
      const result = await handleEnhanceRecoveryPromptAction({
        recoveryPrompt: values.recoveryPrompt,
        userData: values.userData || "No specific user data provided for enhancement.",
      }, user.uid);
      setEnhancedPrompt(result);
      toast({
        title: "Prompt Enhanced",
        description: "Your recovery prompt has been enhanced.",
      });
      triggerActivityRefresh(); // Refresh activity logs
    } catch (error) {
      console.error("Error in RecoveryPromptEnhancerForm onSubmit:", error);
      toast({
        title: "Error Enhancing Prompt",
        description: (error as Error).message || "Could not enhance recovery prompt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Enhanced prompt copied to clipboard.",
      });
    }).catch(err => {
      toast({
        title: "Copy Failed",
        description: `Could not copy to clipboard. Error: ${(err as Error).message}`,
        variant: "destructive",
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="recoveryPrompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Original Recovery Prompt</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., What was my first pet's name?" {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="userData"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Data for Personalization (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Favorite color is blue, born in Paris. This data helps AI personalize the prompt. It will be handled securely." {...field} rows={3} />
              </FormControl>
               <FormMessage />
            </FormItem>
          )}
        />

        {!user && (
          <div className="flex items-center p-3 text-sm text-destructive border border-destructive/50 bg-destructive/10 rounded-md">
            <AlertCircle className="mr-2 h-4 w-4" />
            <span>Please log in to enhance prompts and save activity.</span>
          </div>
        )}

        <Button type="submit" disabled={isEnhancing || !user} className="w-full">
          {isEnhancing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Enhance Prompt
        </Button>
      </form>

      {enhancedPrompt && (
        <Card className="mt-6 bg-background/50">
          <CardHeader>
            <CardTitle>Enhanced Recovery Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="enhancedPromptText">Your Enhanced Prompt</Label>
             <div className="flex items-center space-x-2">
              <Textarea id="enhancedPromptText" value={enhancedPrompt.enhancedPrompt} readOnly rows={3} className="font-mono"/>
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(enhancedPrompt.enhancedPrompt)} aria-label="Copy enhanced prompt">
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
