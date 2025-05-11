"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PassphraseGeneratorSchema, type PassphraseGeneratorFormValues } from '@/lib/schemas';
import { handleGeneratePassphraseAction } from '@/app/actions'; // Already includes logging
import type { GeneratePassphraseOutput } from '@/ai/flows/generate-passphrase';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Copy } from 'lucide-react';
// No need to import logActivityAction separately if handleGeneratePassphraseAction already calls it.

const PassphraseGeneratorForm: FC = () => {
  const [generatedPassphrase, setGeneratedPassphrase] = useState<GeneratePassphraseOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const form = useForm<PassphraseGeneratorFormValues>({
    resolver: zodResolver(PassphraseGeneratorSchema),
    defaultValues: {
      length: 16,
      includeSymbols: true,
      includeNumbers: true,
      customWordInclusion: '',
    },
  });

  const onSubmit = async (values: PassphraseGeneratorFormValues) => {
    setIsGenerating(true);
    setGeneratedPassphrase(null);
    try {
      const result = await handleGeneratePassphraseAction(values); // This action now handles logging
      setGeneratedPassphrase(result);
      toast({
        title: "Passphrase Generated",
        description: "Your new secure passphrase is ready.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message || "Could not generate passphrase.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: `${type} Copied!`,
        description: `${type} has been copied to your clipboard.`,
      });
    }).catch(err => {
      toast({
        title: "Copy Failed",
        description: `Could not copy ${type.toLowerCase()} to clipboard.`,
        variant: "destructive",
      });
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passphrase Length</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 16" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        
        <div className="flex items-center space-x-4">
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

        <Button type="submit" disabled={isGenerating} className="w-full">
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          Generate Passphrase
        </Button>
      </form>

      {generatedPassphrase && (
        <Card className="mt-6 bg-background/50">
          <CardHeader>
            <CardTitle>Your Generated Passphrase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="generatedPassphraseText">Passphrase</Label>
              <div className="flex items-center space-x-2">
                <Input id="generatedPassphraseText" type="text" value={generatedPassphrase.passphrase} readOnly className="font-mono"/>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedPassphrase.passphrase, 'Passphrase')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="recoveryPromptText">Recovery Prompt</Label>
               <div className="flex items-center space-x-2">
                <Textarea id="recoveryPromptText" value={generatedPassphrase.recoveryPrompt} readOnly rows={2} className="font-mono"/>
                 <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedPassphrase.recoveryPrompt, 'Recovery Prompt')}>
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
