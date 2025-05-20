
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, app } from '@/lib/firebase'; // Ensure app is imported if not already for AuthContext initialization elsewhere
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Eye, EyeOff, Loader2, ArrowLeft, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      // Redirect is handled by the useEffect above
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: `If an account exists for ${email}, an email has been sent with instructions.`,
      });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast({
        title: 'Error Sending Reset Email',
        description: error.message || 'Could not send password reset email.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 py-12 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:gap-16">
        {/* Branding Section */}
        <div className="order-2 flex-1 text-center lg:order-1 lg:text-left">
          <Image
            src="https://lockme.my/assets/img/logo_lockme_highRESver.png"
            alt="LockMe Logo"
            width={380}
            height={192}
            className="mx-auto mb-6 lg:mx-0"
            data-ai-hint="brand logo"
            priority
          />
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome Back to LockMe
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Secure your files with ease and confidence. Log in to access your dashboard and tools.
          </p>
        </div>

        {/* Login Card Section */}
        <div className="order-1 w-full max-w-md lg:order-2 lg:w-auto lg:flex-shrink-0">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <LogIn className="mx-auto h-10 w-10 text-primary mb-3" />
              <CardTitle className="text-2xl">Login to LockMe</CardTitle>
              <CardDescription>Access your secure dashboard and tools.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs text-primary hover:underline"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                    >
                       <HelpCircle className="mr-1 h-3 w-3" /> Forgot Password?
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : 'Login'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
