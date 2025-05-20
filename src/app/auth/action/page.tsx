
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { auth } from '@/lib/firebase';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PasswordResetActionSchema, type PasswordResetActionFormValues } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle, Eye, EyeOff, KeyRound, MailCheck } from 'lucide-react';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

function AuthActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [mode, setMode] = useState<string | null>(null);
  const [actionCode, setActionCode] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>("Verifying action...");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailForPasswordReset, setEmailForPasswordReset] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordResetForm = useForm<PasswordResetActionFormValues>({
    resolver: zodResolver(PasswordResetActionSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    const currentMode = searchParams.get('mode');
    const currentActionCode = searchParams.get('oobCode');

    if (currentMode) setMode(currentMode);
    if (currentActionCode) setActionCode(currentActionCode);

    if (!currentMode || !currentActionCode) {
      setErrorMessage("Invalid action link. Required parameters are missing.");
      setLoadingMessage(null);
      return;
    }

    switch (currentMode) {
      case 'verifyEmail':
        setLoadingMessage("Verifying your email address...");
        handleVerifyEmail(currentActionCode);
        break;
      case 'resetPassword':
        setLoadingMessage("Verifying password reset code...");
        handleVerifyPasswordReset(currentActionCode);
        break;
      default:
        setErrorMessage(`Unsupported action mode: ${currentMode}.`);
        setLoadingMessage(null);
    }
  }, [searchParams]);

  const handleVerifyEmail = async (code: string) => {
    try {
      await applyActionCode(auth, code);
      setSuccessMessage("Your email address has been successfully verified! You can now log in.");
      toast({ title: "Email Verified!", description: "You can now proceed to login." });
    } catch (error: any) {
      console.error("Email verification error:", error);
      setErrorMessage(error.message || "Failed to verify email. The link may be invalid or expired.");
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleVerifyPasswordReset = async (code: string) => {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      setEmailForPasswordReset(email); // Store email to show to user
      setLoadingMessage(null); // Ready for password input
      // Now the form for new password will be shown
    } catch (error: any) {
      console.error("Password reset code verification error:", error);
      setErrorMessage(error.message || "Invalid or expired password reset link.");
      toast({ title: "Invalid Link", description: error.message, variant: "destructive" });
      setLoadingMessage(null);
    }
  };

  const onPasswordResetSubmit: SubmitHandler<PasswordResetActionFormValues> = async (data) => {
    if (!actionCode) {
      setErrorMessage("Action code is missing. Cannot reset password.");
      return;
    }
    setLoadingMessage("Resetting your password...");
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await confirmPasswordReset(auth, actionCode, data.newPassword);
      setSuccessMessage("Your password has been successfully reset! You can now log in with your new password.");
      toast({ title: "Password Reset Successful!", description: "You can now login." });
      passwordResetForm.reset();
      setEmailForPasswordReset(null); // Clear sensitive state
    } catch (error: any) {
      console.error("Password reset confirmation error:", error);
      setErrorMessage(error.message || "Failed to reset password. Please try again.");
      toast({ title: "Password Reset Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoadingMessage(null);
    }
  };

  const renderContent = () => {
    if (loadingMessage) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">{loadingMessage}</p>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg text-destructive mb-4">Action Failed</p>
          <p className="text-muted-foreground mb-6">{errorMessage}</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      );
    }

    if (successMessage) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-lg text-green-500 mb-4">Success!</p>
          <p className="text-muted-foreground mb-6">{successMessage}</p>
          <Button asChild>
            <Link href="/login">Proceed to Login</Link>
          </Button>
        </div>
      );
    }

    if (mode === 'resetPassword' && emailForPasswordReset && !successMessage) {
      return (
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <KeyRound className="mx-auto h-10 w-10 text-primary mb-3" />
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>Enter a new password for {emailForPasswordReset}.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordResetForm}>
              <form onSubmit={passwordResetForm.handleSubmit(onPasswordResetSubmit)} className="space-y-6">
                <FormField
                  control={passwordResetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            {...field}
                            className="pr-10"
                            disabled={!!loadingMessage}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                            disabled={!!loadingMessage}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordResetForm.control}
                  name="confirmNewPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            {...field}
                            className="pr-10"
                             disabled={!!loadingMessage}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            tabIndex={-1}
                             disabled={!!loadingMessage}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={!!loadingMessage || passwordResetForm.formState.isSubmitting}>
                  {passwordResetForm.formState.isSubmitting || loadingMessage ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Set New Password
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      );
    }

    return (
         <div className="flex flex-col items-center justify-center text-center p-6">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <p className="text-lg text-muted-foreground">Invalid or unrecognized action.</p>
             <Button asChild className="mt-6">
                <Link href="/">Go to Homepage</Link>
            </Button>
        </div>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 py-12 sm:px-6 lg:px-8">
        <header className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 sm:p-6">
            <Link href="/" className="flex items-center gap-2">
                 <Image
                    src="https://lockme.my/assets/img/logo_lockme_highRESver.png"
                    alt="LockMe Logo"
                    width={120} 
                    height={60} 
                    className="h-10 w-auto"
                    priority
                    data-ai-hint="logo"
                />
            </Link>
            <ThemeToggleButton />
        </header>
        
        <div className="w-full max-w-lg">
            {renderContent()}
        </div>

        <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} LockMe. Secure your digital life.
        </footer>
    </div>
  );
}


export default function AuthActionPage() {
  // Suspense is necessary because useSearchParams() can suspend during SSR.
  return (
    <Suspense fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading action handler...</p>
        </div>
    }>
      <AuthActionContent />
    </Suspense>
  );
}

    