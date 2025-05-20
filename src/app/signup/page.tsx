
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

interface PasswordStrength {
  level: 0 | 1 | 2 | 3 | 4;
  text: string;
  color: string;
  width: string;
}

const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  if (!password) return { level: 0, text: "Very Weak", color: "bg-destructive", width: "w-1/5" };

  if (password.length >= 8) score++; else score = -5;
  if (password.length >= 12) score++;

  let distinctCharTypes = 0;
  if (/[a-z]/.test(password)) distinctCharTypes++;
  if (/[A-Z]/.test(password)) distinctCharTypes++;
  if (/\d/.test(password)) distinctCharTypes++;
  if (/[^A-Za-z0-9]/.test(password)) distinctCharTypes++;

  if (score < 0) return { level: 0, text: "Very Weak", color: "bg-destructive", width: "w-1/5" };

  if (distinctCharTypes === 1) score += 0;
  else if (distinctCharTypes === 2) score += 1;
  else if (distinctCharTypes === 3) score += 2;
  else if (distinctCharTypes >= 4) score += 3;


  if (score <= 1) return { level: 0, text: "Very Weak", color: "bg-destructive", width: "w-1/5" };
  if (score === 2) return { level: 1, text: "Weak", color: "bg-orange-500", width: "w-2/5" };
  if (score === 3) return { level: 2, text: "Fair", color: "bg-yellow-500", width: "w-3/5" };
  if (score === 4) return { level: 3, text: "Good", color: "bg-lime-500", width: "w-4/5" };
  return { level: 4, text: "Strong", color: "bg-green-500", width: "w-full" };
};


export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/'); 
    }
  }, [user, authLoading, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Signup Failed', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (!username.trim()) {
      toast({ title: 'Signup Failed', description: 'Username cannot be empty.', variant: 'destructive' });
      return;
    }
    const currentStrength = checkPasswordStrength(password);
    if (currentStrength.level < 2) {
        toast({
            title: "Password Too Weak",
            description: "Please choose a stronger password (Fair, Good, or Strong).",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: username,
      });

      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);
        toast({
          title: 'Signup Successful!',
          description: `Welcome, ${username}! A verification email has been sent to ${email}. Please check your inbox (and spam folder) to verify your account.`,
          duration: 7000,
        });
      } else {
        toast({ title: 'Signup Successful', description: `Welcome, ${username}! Please log in.` });
      }
      // Redirect is handled by useEffect
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: 'Signup Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || (!authLoading && user)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 py-12 sm:px-6 lg:px-8">
      <div className="flex w-full max-w-5xl flex-col items-center gap-8 md:gap-12 lg:flex-row lg:gap-16">
        {/* Branding Section - order-1 makes it appear first on mobile (top) and lg (left) */}
        <div className="order-1 flex-1 text-center lg:text-left px-4 sm:px-0">
          <Image
            src="https://lockme.my/assets/img/logo_lockme_highRESver.png"
            alt="LockMe Logo"
            width={320} 
            height={160}
            className="mx-auto mb-4 h-auto w-60 sm:w-72 lg:mx-0 lg:w-80"
            data-ai-hint="brand logo"
            priority
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Create Your LockMe Account
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
            Join LockMe to securely manage your files, enhance your passphrases with AI, and organize your code snippets.
          </p>
        </div>

        {/* Signup Card Section - order-2 makes it appear second on mobile (bottom) and lg (right) */}
        <div className="order-2 w-full max-w-md lg:w-auto lg:flex-shrink-0">
          <Card className="shadow-xl w-full">
            <CardHeader className="text-center">
              <UserPlus className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-primary mb-2 sm:mb-3" />
              <CardTitle className="text-xl sm:text-2xl">Create Account</CardTitle>
              <CardDescription className="text-sm sm:text-base">Join to securely manage your files and snippets.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-3 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
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
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Choose a strong password"
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
                  {passwordStrength && password && (
                    <div className="mt-1">
                      <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                        <span className="text-xs font-medium text-muted-foreground">Strength: {passwordStrength.text}</span>
                      </div>
                      <Progress value={(passwordStrength.level + 1) * 20} className={`h-1 sm:h-1.5 ${passwordStrength.color}`} />
                    </div>
                  )}
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full pt-2" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : 'Sign Up'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-center space-y-2 pt-3 sm:pt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Log in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
