// Next.js imports
import Link from 'next/link';
import Image from 'next/image';

// UI Component imports
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';

// Icon imports
import { 
  Info, 
  User, 
  Zap, 
  ShieldCheck, 
  Linkedin, 
  Github, 
  Globe 
} from 'lucide-react';

/**
 * About page component displaying information about the app and developer
 */
export default function AboutPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <Card className="w-full shadow-xl">
          {/* Header with Logo and Title */}
          <CardHeader className="items-center text-center">
            <div className="relative w-36 h-36 inline-block mb-4 overflow-hidden bg-transparent">
              <Image
                src="https://lockme.my/assets/img/logo_lockme_highRESver.png"
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
          </CardHeader>          <CardContent className="space-y-8 text-center md:text-left">
            {/* Mission Statement Section */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center justify-center md:justify-start">
                <Zap className="mr-2 h-5 w-5 text-primary" /> 
                Our Mission
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                At LockMe, the mission is to provide accessible, robust, and user-friendly 
                encryption tools that empower individuals to protect their sensitive information. 
                Privacy is a fundamental right, and securing your data should not be a complex task. 
                LockMe operates entirely in your browser, ensuring your files and passphrases 
                never leave your device.
              </p>
            </section>

            {/* Who We Are Section */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center justify-center md:justify-start">
                <User className="mr-2 h-5 w-5 text-primary" /> 
                Who I Am
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                LockMe is developed by a passionate individual dedicated to digital privacy 
                and security. I am committed to building tools that are both powerful and 
                simple to use.
              </p>
            </section>

            {/* Security Commitment Section */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2 flex items-center justify-center md:justify-start">
                <ShieldCheck className="mr-2 h-5 w-5 text-primary" /> 
                Our Commitment to Security
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Prioritizing your security above all. LockMe utilizes strong, industry-standard 
                encryption algorithms (like AES-256-GCM) implemented via the Web Crypto API, 
                ensuring that all cryptographic operations happen client-side. Your data's 
                confidentiality is paramount.
              </p>
            </section>            {/* Developer Profile Section */}
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 flex items-center justify-center md:justify-start">
                <User className="mr-2 h-5 w-5 text-primary" /> 
                Meet the Developer
              </h2>
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Developer Profile Image */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-md flex-shrink-0">
                  <Image
                    src="https://miiyuh.com/assets/img/azri_cropped.png"
                    alt="Developer Profile"
                    fill
                    className="object-cover"
                    data-ai-hint="profile portrait"
                  />
                </div>
                
                {/* Developer Bio and Social Links */}
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-medium text-foreground">
                    Muhamad Azri a.k.a. miiyuh
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Creator and Developer of LockMe
                  </p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Driven by a passion for privacy and user empowerment, I developed LockMe 
                    to provide a simple yet secure solution for everyday encryption needs. 
                    My goal is to make digital security accessible to everyone.
                  </p>
                  
                  {/* Social Media Links */}
                  <div className="flex justify-center md:justify-start space-x-3">
                    <Button variant="outline" size="icon" asChild>
                      <Link 
                        href="https://www.linkedin.com/in/miiyuh/" 
                        target="_blank" 
                        aria-label="LinkedIn Profile"
                      >
                        <Linkedin className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link 
                        href="https://github.com/miiyuh" 
                        target="_blank" 
                        aria-label="GitHub Profile"
                      >
                        <Github className="h-5 w-5" />
                      </Link>
                    </Button>
                    <Button variant="outline" size="icon" asChild>
                      <Link 
                        href="https://muhamad-azri.my" 
                        target="_blank" 
                        aria-label="Personal Website"
                      >
                        <Globe className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>            {/* Footer Thank You Note */}
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
