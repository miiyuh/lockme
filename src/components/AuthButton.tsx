
"use client";

/**
 * AuthButton Component
 * 
 * A dynamic authentication button that changes based on user authentication state.
 * Provides login functionality for unauthenticated users and a dropdown menu with
 * user information and actions for authenticated users.
 * 
 * Features:
 * - Displays login button for unauthenticated users
 * - Shows user avatar with dropdown menu when authenticated
 * - Provides navigation to settings and logout functionality
 * - Handles loading state during authentication checks
 */

// Next.js Imports
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Firebase Imports
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Hooks & Contexts
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

// UI Components
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Icons
import { LogIn, LogOut, UserCircle, Loader2, Settings } from 'lucide-react';

/**
 * AuthButton Component
 * 
 * Renders a context-aware authentication button that adapts to the user's login state.
 * 
 * @returns {JSX.Element} Authentication UI component based on current auth state
 */
export default function AuthButton() {
  // Get authentication state and router
  const { user, loading } = useAuth();
  const router = useRouter();

  /**
   * Debug effect to monitor avatar image URL changes
   * Tracks when the user's photo URL updates to help diagnose rendering issues
   */
  useEffect(() => {
    if (user?.photoURL) {
      console.log("AuthButton: user context updated, new photoURL:", user.photoURL);
    } else if (user) {
      console.log("AuthButton: user context updated, no photoURL or photoURL is null/undefined.");
    }
  }, [user, user?.photoURL]);

  /**
   * Handles user logout functionality
   * Signs out from Firebase and redirects to login page
   */
  const handleLogout = async () => {
    try {
      // Sign out from Firebase authentication
      await signOut(auth);
      // Redirect to login page after successful logout
      router.push('/login');
    } catch (error) {
      console.error("Logout error:", error);
      // Optionally show a toast message for logout error
    }
  };
  // Show loading state while checking authentication
  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <Loader2 className="h-5 w-5 animate-spin" />
      </Button>
    );
  }

  // Render authenticated user dropdown
  if (user) {
    return (
      <DropdownMenu>
        {/* Avatar Button Trigger */}
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                key={user.photoURL} 
                src={user.photoURL || undefined} 
                alt={user.displayName || user.email || "User"} 
              />
              <AvatarFallback>
                {user.displayName 
                  ? user.displayName.charAt(0).toUpperCase() 
                  : (user.email 
                    ? user.email.charAt(0).toUpperCase() 
                    : <UserCircle className="h-5 w-5"/>)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        
        {/* User Dropdown Menu */}
        <DropdownMenuContent className="w-56" align="end" forceMount>
          {/* User Information */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.displayName || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Navigation Options */}
          <DropdownMenuItem 
            onClick={() => router.push('/settings')} 
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          
          {/* Commented out for future implementation
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            Profile (TODO)
          </DropdownMenuItem> 
          */}
          
          <DropdownMenuSeparator />
          
          {/* Logout Option */}
          <DropdownMenuItem 
            onClick={handleLogout} 
            className="cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Render login button for unauthenticated users
  return (
    <Button asChild variant="outline">
      <Link href="/login">
        <LogIn className="mr-2 h-4 w-4" /> Login
      </Link>
    </Button>
  );
}

