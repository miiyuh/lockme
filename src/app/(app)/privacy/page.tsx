
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, ShieldAlert, Server, Sparkles, Shield, Cookie, RefreshCw, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <FileText className="mr-2 h-6 w-6 text-primary" />
              Privacy Policy
            </CardTitle>
            <CardDescription>
              Last Updated: {new Date().toISOString().split('T')[0]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-foreground leading-relaxed">
              Welcome to LockMe! This Privacy Policy explains how we handle your information when you use our application.
              <strong>Your privacy is critically important to us. LockMe is designed with privacy as a core principle.</strong>
            </p>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 flex items-center">
                <ShieldAlert className="mr-2 h-5 w-5 text-primary" /> Information We Do Not Collect
              </h2>
              <p className="text-foreground leading-relaxed mb-3">
                LockMe operates entirely client-side, meaning all encryption and decryption processes happen directly in your web browser. We <strong>do not</strong>:
              </p>
              <ul className="list-disc list-inside mb-3 text-foreground space-y-1 pl-4">
                <li>Collect, store, or transmit your files.</li>
                <li>Collect, store, or transmit your passphrases.</li>
                <li>Track your usage of the application in a way that identifies you personally.</li>
                <li>Require you to create an account to use the core encryption/decryption features.</li>
                <li>Store any personal data on our servers related to the files you process.</li>
              </ul>
              <p className="text-foreground leading-relaxed">
                The files you select and the passphrases you enter remain on your device and are processed locally.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 flex items-center">
                <Server className="mr-2 h-5 w-5 text-primary" /> Information We Might Collect (Hypothetical for Future Features)
              </h2>
              <p className="text-foreground leading-relaxed">
                Currently, LockMe does not collect personal information. If, in the future, we introduce features that require data collection (e.g., user accounts for premium services, feedback forms), this policy will be updated. Any such collection would be opt-in and transparent.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-primary" /> AI Toolkit Features
              </h2>
              <p className="text-foreground leading-relaxed mb-3">
                The AI Security Toolkit features (Passphrase Generator, Recovery Prompt Enhancer) communicate with AI models to provide their services.
              </p>
              <ul className="list-disc list-inside mb-3 text-foreground space-y-1 pl-4">
                <li><strong>Passphrase Generator:</strong> The criteria you set (length, inclusion of symbols/numbers, custom words) are sent to the AI model to generate a passphrase and recovery prompt. This data is used solely for this purpose and is not stored by LockMe.</li>
                <li><strong>Recovery Prompt Enhancer:</strong> The original recovery prompt and any optional user data you provide are sent to the AI model to generate an enhanced prompt. This data is used solely for this purpose and is not stored by LockMe.</li>
              </ul>
              <p className="text-foreground leading-relaxed">
                We use third-party AI services (e.g., Google AI). Their use of data is governed by their respective privacy policies. We endeavor to use these services in a way that respects your privacy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 flex items-center">
                <Shield className="mr-2 h-5 w-5 text-primary" /> Web Crypto API
              </h2>
              <p className="text-foreground leading-relaxed">
                LockMe utilizes the Web Crypto API, a standard browser feature, for all cryptographic operations. This ensures that sensitive operations are performed securely within the browser's trusted environment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 flex items-center">
                <Cookie className="mr-2 h-5 w-5 text-primary" /> Cookies and Local Storage
              </h2>
              <p className="text-foreground leading-relaxed">
                LockMe may use local storage or cookies for essential application settings, such as theme preferences or sidebar state. These do not store personal information or track you across other sites.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 flex items-center">
                <RefreshCw className="mr-2 h-5 w-5 text-primary" /> Changes to This Privacy Policy
              </h2>
              <p className="text-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 flex items-center">
                <Mail className="mr-2 h-5 w-5 text-primary" /> Contact Us
              </h2>
              <p className="text-foreground leading-relaxed">
                If you have any questions about this Privacy Policy, please <a href="/contact" className="text-primary hover:underline">contact us</a>.
              </p>
            </section>

            <p className="text-xs text-muted-foreground pt-4">
              This is a sample Privacy Policy for a simulated application. For a real application, consult with a legal professional.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

