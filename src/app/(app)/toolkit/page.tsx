
"use client";

// Form components
import PassphraseGeneratorForm from '@/components/forms/PassphraseGeneratorForm';
import RecoveryPromptEnhancerForm from '@/components/forms/RecoveryPromptEnhancerForm';

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import { KeyRound, Sparkles, Wand2 } from 'lucide-react';

/**
 * AI Security Toolkit Page Component
 * 
 * Provides users with AI-powered tools for security enhancement:
 * - Passphrase Generator - Creates strong and memorable passphrases
 * - Recovery Enhancer - Improves recovery prompts for better security and memorability
 */
export default function AiToolkitPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Sparkles className="mr-2 h-6 w-6 text-primary" />
              AI Security Toolkit
            </CardTitle>
            <CardDescription>
              Leverage AI to create strong passphrases and enhance your recovery methods.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Toolkit Tabs */}
            <Tabs defaultValue="passphrase-generator" className="w-full">
              {/* Tab Navigation */}
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="passphrase-generator">
                  <Wand2 className="mr-2 h-4 w-4" /> 
                  Passphrase Generator
                </TabsTrigger>
                <TabsTrigger value="recovery-enhancer">
                  <Sparkles className="mr-2 h-4 w-4" /> 
                  Recovery Enhancer
                </TabsTrigger>
              </TabsList>
              
              {/* Passphrase Generator Tab Content */}
              <TabsContent value="passphrase-generator">
                <PassphraseGeneratorForm />
              </TabsContent>
              
              {/* Recovery Enhancer Tab Content */}
              <TabsContent value="recovery-enhancer">
                <RecoveryPromptEnhancerForm />
              </TabsContent>
            </Tabs>
          </CardContent>        </Card>
      </div>
    </div>
  );
}
