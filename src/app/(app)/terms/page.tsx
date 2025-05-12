
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, AlertTriangle } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <FileText className="mr-2 h-6 w-6 text-primary" />
              Terms of Service
            </CardTitle>
            <CardDescription>
              Last Updated: {new Date().toISOString().split('T')[0]}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-foreground leading-relaxed">
              Welcome to LockMe! These Terms of Service ("Terms") govern your use of the LockMe application ("Service") provided by LockMe Team ("we", "us", or "our"). By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6">1. Use of Service</h2>
              <p className="text-foreground leading-relaxed mb-3">
                LockMe provides client-side file encryption and decryption services, along with AI-powered tools for passphrase generation and recovery prompt enhancement. You agree to use the Service in compliance with all applicable laws and regulations and not for any unlawful purpose.
              </p>
              <p className="text-foreground leading-relaxed">
                You are solely responsible for the passphrases you create and use. <strong>We do not store your passphrases, and if you lose your passphrase, we cannot recover it or your encrypted files.</strong>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6">2. No Warranty</h2>
              <p className="flex items-start text-foreground leading-relaxed">
                <AlertTriangle className="mr-2 mt-1 h-5 w-5 text-destructive flex-shrink-0" />
                <span>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, regarding the operation or availability of the Service, or the information, content, materials, or products included therein. To the fullest extent permissible by applicable law, we disclaim all warranties, express or implied, including, but not limited to, implied warranties of merchantability and fitness for a particular purpose. We do not warrant that the Service, its servers, or e-mail sent from us are free of viruses or other harmful components.</span>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6">3. Limitation of Liability</h2>
               <p className="flex items-start text-foreground leading-relaxed mb-3">
                <AlertTriangle className="mr-2 mt-1 h-5 w-5 text-destructive flex-shrink-0" />
                <span>In no event shall LockMe Team, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage, and even if a remedy set forth herein is found to have failed of its essential purpose.</span>
              </p>
              <p className="text-foreground leading-relaxed">
                You acknowledge that the security of your encrypted data depends critically on the strength and confidentiality of your passphrase.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6">4. AI Toolkit</h2>
              <p className="text-foreground leading-relaxed">
                The AI Security Toolkit features utilize third-party AI models. While we strive to provide useful and secure suggestions, we make no guarantees about the absolute security or suitability of AI-generated passphrases or prompts for every individual's needs. Users are responsible for evaluating and using these suggestions appropriately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6">5. Intellectual Property</h2>
              <p className="text-foreground leading-relaxed">
                The Service and its original content (excluding content provided by users), features, and functionality are and will remain the exclusive property of LockMe Team and its licensors.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6">6. Changes to Terms</h2>
              <p className="text-foreground leading-relaxed mb-3">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
              <p className="text-foreground leading-relaxed">
                By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6">7. Contact Us</h2>
              <p className="text-foreground leading-relaxed">
                If you have any questions about these Terms, please <a href="/contact" className="text-primary hover:underline">contact us</a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
