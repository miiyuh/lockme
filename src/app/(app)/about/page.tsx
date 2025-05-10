
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info, Users, Zap, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <Card className="w-full shadow-xl">
          <CardHeader className="items-center text-center">
            <div className="relative w-36 h-36 inline-block mb-4 overflow-hidden bg-transparent">
               <Image
                src="https://lockme.my/logo_lockme_highRESver.png" 
                alt="LockMe Logo"
                fill
                className="object-contain" 
                data-ai-hint="brand logo"
              />
            </div>
            <CardTitle className="flex items-center justify-center text-3xl">
              <Info className="mr-3 h-8 w-8 text-primary" />
              About LockMe
            </CardTitle>
            <CardDescription className="text-lg">
              Secure your digital life with ease and confidence.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 text-center md:text-left">

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center justify-center md:justify-start">
                <Zap className="mr-2 h-5 w-5 text-primary" /> Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                At LockMe, our mission is to provide accessible, robust, and user-friendly encryption tools that empower individuals to protect their sensitive information. We believe privacy is a fundamental right, and securing your data should not be a complex task. LockMe operates entirely in your browser, ensuring your files and passphrases never leave your device.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center justify-center md:justify-start">
                <Users className="mr-2 h-5 w-5 text-primary" /> Who We Are
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                LockMe is developed by a passionate team dedicated to digital privacy and security. We are committed to building tools that are both powerful and simple to use. (This is a simulated project, but in a real scenario, you'd detail your team or organization here.)
              </p>
              <div className="mt-4 flex justify-center md:justify-start">
                <Image
                  src="https://picsum.photos/seed/team/300/150"
                  alt="Our Team Placeholder"
                  width={300}
                  height={150}
                  className="rounded-lg shadow-md"
                  data-ai-hint="team collaboration"
                />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center justify-center md:justify-start">
                <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Our Commitment to Security
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We prioritize your security above all. LockMe utilizes strong, industry-standard encryption algorithms (like AES-256-GCM) implemented via the Web Crypto API, ensuring that all cryptographic operations happen client-side. Your data's confidentiality is paramount.
              </p>
            </section>

            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Thank you for choosing LockMe.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

