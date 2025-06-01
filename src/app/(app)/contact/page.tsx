"use client"; // Required for form handling

import { useState } from 'react';

// UI Component imports
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';

// Icons
import { 
  Mail, 
  Send, 
  Building, 
  Phone,
  Clock 
} from 'lucide-react';

// Hooks
import { useToast } from '@/hooks/use-toast';

/**
 * Contact page component with contact form and information
 */
export default function ContactPage() {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  /**
   * Handles contact form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Show success message
    setIsSubmitting(false);
    toast({
      title: "Message Sent!",
      description: "Thank you for contacting us. We'll get back to you shortly. (This is a simulation)",
    });
    
    // Reset form fields
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };
  return (
    <div className="container mx-auto py-8">
      <div className="grid md:grid-cols-2 gap-12 items-start max-w-4xl mx-auto">
        {/* Contact Form Card */}
        <Card className="w-full shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Mail className="mr-2 h-6 w-6 text-primary" />
              Get in Touch
            </CardTitle>
            <CardDescription>
              Have questions or feedback? Fill out the form and we'll get back to you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Jane Doe" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              {/* Subject Field */}
              <div className="space-y-1">
                <Label htmlFor="subject">Subject</Label>
                <Input 
                  id="subject" 
                  type="text" 
                  placeholder="Regarding..." 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  required 
                />
              </div>
              
              {/* Message Field */}
              <div className="space-y-1">
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Your message here..." 
                  rows={5} 
                  value={message} 
                  onChange={(e) => setMessage(e.target.value)} 
                  required 
                />
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-pulse" /> Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" /> Send Message
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>        {/* Contact Information Section */}
        <div className="space-y-8 pt-2">
          {/* Office Information */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
              <Building className="mr-2 h-5 w-5 text-primary" />
              Our (Virtual) Office
            </h3>
            <p className="text-muted-foreground">
              LockMe Headquarters <br />
              123 Privacy Lane <br />
              Secure City, WEB 00000 <br />
            </p>
          </div>
          
          {/* Support Information */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
              <Phone className="mr-2 h-5 w-5 text-primary" />
              Support Channels
            </h3>
            <p className="text-muted-foreground">
              <strong>Email:</strong> support@lockme.my <br />
              <strong>Phone:</strong> +60-19 252 0529 <br />
              For urgent issues, please use the contact form.
            </p>
          </div>
          
          {/* Business Hours */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-3 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              Business Hours
            </h3>
            <p className="text-muted-foreground">
              Monday - Friday: 09:00 - 17:00 (MYT) <br />
              Weekends & Holidays: Closed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
