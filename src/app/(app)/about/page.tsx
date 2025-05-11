
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Info, User, Zap, ShieldCheck, Linkedin, Github, Globe } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
                At LockMe, the mission is to provide accessible, robust, and user-friendly encryption tools that empower individuals to protect their sensitive information. Privacy is a fundamental right, and securing your data should not be a complex task. LockMe operates entirely in your browser, ensuring your files and passphrases never leave your device.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center justify-center md:justify-start">
                <User className="mr-2 h-5 w-5 text-primary" /> Who I Am
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                LockMe is developed by a passionate individual (me) dedicated to digital privacy and security. I am committed to building tools that are both powerful and simple to use.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center justify-center md:justify-start">
                <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> Our Commitment to Security
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Prioritizing your security above all. LockMe utilizes strong, industry-standard encryption algorithms (like AES-256-GCM) implemented via the Web Crypto API, ensuring that all cryptographic operations happen client-side. Your data's confidentiality is paramount.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 flex items-center justify-center md:justify-start">
                <User className="mr-2 h-5 w-5 text-primary" /> Meet the Developer
              </h2>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-md flex-shrink-0">
                  <Image
                    src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgaAW7cKqJgoJf6fr1HSSZIBN04mDI3bf99kr6LqaHQYM6H3DEDwE9UaFIV4GdaLSfNQp9o5dE9Uc2wm4Os7Vlcllvy8cudw_LfPOtB_nGMpOzujzLXjCJQ4MEHXge1Xfskrc5YasohxFJP1I1nKSgLUJrnUG9oqPkXSLBZoEIiSWRPVKg/s220/azri_cropped.png"
                    alt="Developer Profile"
                    fill
                    className="object-cover"
                    data-ai-hint="profile portrait"
                  />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-medium text-foreground">Muhamad Azri Muhamad Azmir a.k.a. miiyuh</h3>
                  <p className="text-sm text-muted-foreground mb-3">Creator & Developer of LockMe</p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Driven by a passion for privacy and user empowerment, I developed LockMe to provide a simple yet secure solution for everyday encryption needs. My goal is to make digital security accessible to everyone.
                  </p>
                  <div className="flex justify-center md:justify-start space-x-3">
                    <Button variant="outline" size="icon" asChild>
                      <Link href="https://www.linkedin.com/in/miiyuh/" target="_blank" aria-label="LinkedIn Profile">
                        <Linkedin className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link href="https://github.com/miiyuh" target="_blank" aria-label="GitHub Profile">
                        <Github className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link href="https://muhamad-azri.my" target="_blank" aria-label="Personal Website">
                        <Globe className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>


            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Thanks for choosing LockMe!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
