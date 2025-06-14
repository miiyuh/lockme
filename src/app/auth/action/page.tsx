"use client";

/**
 * Authentication Action Page
 * 
 * This page handles various authentication actions triggered by email links:
 * - Email verification
 * - Password reset
 * 
 * The component processes URL parameters to determine the action type and
 * manages the appropriate authentication flow.
 */

// React and Next.js imports
import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Form handling
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PasswordResetActionSchema, type PasswordResetActionFormValues } from '@/lib/schemas';

// Firebase authentication
import { auth } from '@/lib/firebase';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

// Icons
import { Loader2, CheckCircle, AlertTriangle, Eye, EyeOff, KeyRound, MailCheck } from 'lucide-react';

// Hooks
import { useToast } from '@/hooks/use-toast';

/**
 * Auth Action Content Component
 * 
 * Handles the core functionality for email verification and password reset flows
 * based on parameters in the URL.
 * 
 * @returns {JSX.Element} The rendered authentication action interface
 */
function AuthActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Extract action parameters from URL
  const mode = React.useMemo(() => searchParams.get('mode'), [searchParams]);
  const actionCode = React.useMemo(() => searchParams.get('oobCode'), [searchParams]);

  // Component state
  const [actionProcessed, setActionProcessed] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailForPasswordReset, setEmailForPasswordReset] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password reset form
  const passwordResetForm = useForm<PasswordResetActionFormValues>({
    resolver: zodResolver(PasswordResetActionSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
    mode: 'onChange',
  });

  /**
   * Handles email verification process
   * 
   * @param {string} code - The verification code from the URL
   */
  const handleVerifyEmail = useCallback(async (code: string) => {
    setLoadingMessage("Verifying your email address...");
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
      setActionProcessed(true);
    }
  }, [toast, setActionProcessed, setErrorMessage, setLoadingMessage, setSuccessMessage]);

  /**
   * Handles password reset verification
   * 
   * @param {string} code - The password reset code from the URL
   */
  const handleVerifyPasswordReset = useCallback(async (code: string) => {
    setLoadingMessage("Verifying password reset code...");
    try {
      const email = await verifyPasswordResetCode(auth, code);
      setEmailForPasswordReset(email);
      setLoadingMessage(null); // Ready for password input
    } catch (error: any) {
      console.error("Password reset code verification error:", error);
      setErrorMessage(error.message || "Invalid or expired password reset link.");
      toast({ title: "Invalid Link", description: error.message, variant: "destructive" });
      setLoadingMessage(null);
      setActionProcessed(true); // Mark as processed if initial verification fails
    }
  }, [toast, setEmailForPasswordReset, setErrorMessage, setLoadingMessage, setActionProcessed]);

  /**
   * Handles password reset form submission
   * 
   * @param {PasswordResetActionFormValues} data - Form data with new password
   */
  const onPasswordResetSubmit: SubmitHandler<PasswordResetActionFormValues> = useCallback(async (data) => {
    if (!actionCode) {
      setErrorMessage("Action code is missing. Cannot reset password.");
      setActionProcessed(true);
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
      setEmailForPasswordReset(null);
    } catch (error: any) {
      console.error("Password reset confirmation error:", error);
      setErrorMessage(error.message || "Failed to reset password. Please try again.");
      toast({ title: "Password Reset Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoadingMessage(null);
      setActionProcessed(true);
    }
  }, [actionCode, toast, passwordResetForm, setEmailForPasswordReset, setActionProcessed, setErrorMessage, setLoadingMessage, setSuccessMessage]);

  /**
   * Effect to process the authentication action based on URL parameters
   */
  useEffect(() => {
    // Handle missing parameters
    if (!mode || !actionCode) {
      // Only set error if not already in a loading/success/error state from a previous attempt or initial load
      if (!actionProcessed && !loadingMessage && !successMessage && !errorMessage) {
        setErrorMessage("Invalid action link. Required parameters (mode or oobCode) are missing.");
        setLoadingMessage(null);
        setActionProcessed(true); // Mark this path as "handled"
      }
      return;
    }

    // Skip if action already processed
    if (actionProcessed) {
      return;
    }

    // Process action based on mode
    switch (mode) {
      case 'verifyEmail':
        handleVerifyEmail(actionCode);
        break;
      case 'resetPassword':
        handleVerifyPasswordReset(actionCode);
        break;
      default:
        setErrorMessage(`Unsupported action mode: ${mode}.`);
        setLoadingMessage(null);
        setActionProcessed(true);
    }
  }, [mode, actionCode, actionProcessed, handleVerifyEmail, handleVerifyPasswordReset, errorMessage, loadingMessage, successMessage]);

  /**
   * Renders the appropriate content based on the current state
   * 
   * @returns {JSX.Element} The content to display
   */
  const renderContent = () => {
    // Loading state
    if (loadingMessage) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">{loadingMessage}</p>
        </div>
      );
    }

    // Error state
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

    // Success state
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

    // Password reset form state
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
                {/* New Password Field */}
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

                {/* Confirm Password Field */}
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

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!!loadingMessage || passwordResetForm.formState.isSubmitting}
                >
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

    // Initial loading state (before processing URL parameters)
    if (!mode || !actionCode) {
      return (
        <div className="flex flex-col items-center justify-center text-center p-6">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading action...</p>
        </div>
      );
    }

    // Fallback for unrecognized actions
    return (
      <div className="flex flex-col items-center justify-center text-center p-6">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <p className="text-lg text-muted-foreground">
          Invalid or unrecognized action. Please check the link or try again.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Go to Homepage</Link>
        </Button>
      </div>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background p-4 py-12 sm:px-6 lg:px-8">
      {/* Header with Logo and Theme Toggle */}
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
      
      {/* Main Content */}
      <div className="w-full max-w-lg">
        {renderContent()}
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LockMe. Secure your digital life.
      </footer>
    </div>
  );
}

/**
 * Auth Action Page Component
 * 
 * Wraps the AuthActionContent component in a Suspense boundary to handle
 * the potential suspension during SSR when using useSearchParams().
 * 
 * @returns {JSX.Element} The rendered page with Suspense handling
 */
export default function AuthActionPage() {
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

