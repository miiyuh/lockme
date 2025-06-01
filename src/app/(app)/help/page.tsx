

// UI Component imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';

// Icons
import { HelpCircle, Search, ExternalLink } from 'lucide-react';

/**
 * Frequently asked questions data
 * Each item contains a question and its corresponding answer
 */
const faqs = [
  {
    question: "How do I encrypt a file?",
    answer: "Navigate to the 'Encrypt File' page. Drag and drop your file or click to select it. Enter a strong passphrase, and click 'Encrypt File'. Your encrypted file will be downloaded with a '.lockme' extension."
  },
  {
    question: "How do I decrypt a file?",
    answer: "Go to the 'Decrypt File' page. Select your '.lockme' encrypted file. Enter the exact passphrase used for encryption, and click 'Decrypt File'. The original file will be downloaded."
  },
  {
    question: "What is the AI Security Toolkit?",
    answer: "The AI Security Toolkit helps you generate strong, memorable passphrases and enhance your recovery prompts using AI. This can improve your overall security posture."
  },
  {
    question: "Is my data uploaded to any server?",
    answer: "No, LockMe performs all encryption and decryption operations locally in your browser using Web Crypto API. Your files and passphrases are not sent to any server, ensuring maximum privacy."
  },
  {
    question: "What happens if I forget my passphrase?",
    answer: "If you forget the passphrase used to encrypt a file, there is no way to recover the file. LockMe does not store your passphrases. It is crucial to use a memorable passphrase or store it securely."
  },
  {
    question: "What file types and sizes are supported?",
    answer: "LockMe supports all file types. The maximum file size for encryption/decryption is currently 100MB. This is a browser limitation to ensure performance."
  },
  {
    question: "How secure is the encryption?",
    answer: "LockMe uses strong, industry-standard encryption algorithms like AES-256-GCM. The security of your encrypted file heavily depends on the strength of the passphrase you choose."
  }
];

/**
 * Help Page Component
 * 
 * Displays a searchable FAQ section and provides a link to contact support
 * 
 * @returns {JSX.Element} The help page component
 */
export default function HelpPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto">
        <Card className="w-full shadow-xl">
          {/* Header Section */}
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <HelpCircle className="mr-2 h-6 w-6 text-primary" />
              Help & FAQ
            </CardTitle>
            <CardDescription>
              Find answers to common questions about LockMe.
            </CardDescription>
          </CardHeader>

          {/* Content Section */}
          <CardContent className="space-y-8">
            {/* Search Bar */}
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" 
              />
              <Input 
                type="search" 
                placeholder="Search FAQs..." 
                className="pl-10" 
              />
            </div>

            {/* FAQ Accordion */}
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  value={`item-${index}`} 
                  key={index}
                >
                  <AccordionTrigger className="text-left hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Support Link */}
            <div className="text-center pt-6">
              <p className="text-muted-foreground mb-2">
                Can't find what you're looking for?
              </p>
              <Button>
                <ExternalLink className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
