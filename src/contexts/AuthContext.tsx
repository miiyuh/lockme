"use client";

/**
 * AuthContext
 *
 * A React context for Firebase authentication that manages user authentication state
 * and provides authentication-related functionality throughout the application.
 *
 * Features:
 * - User authentication state management
 * - Loading state handling with skeleton UI
 * - Automatic Firebase auth state synchronization
 * - Custom hook for easy access from any component
 */

// Type imports
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import type { User } from 'firebase/auth';

// React imports
import { createContext, useContext, useEffect, useState } from 'react';

// Firebase imports
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// UI Components
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Interface defining the shape of the AuthContext
 */
interface AuthContextType {
  /** Current authenticated user or null if not authenticated */
  user: User | null;

  /** Indicates whether authentication is currently being checked */
  loading: boolean;

  /** Function to manually update the user state if needed */
  setUser: Dispatch<SetStateAction<User | null>>;
}

// Create context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 *
 * Provides authentication context to its child components and handles
 * the authentication state synchronization with Firebase.
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to auth context
 * @returns {JSX.Element} Provider component or loading skeleton
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show loading skeleton while authentication state is being determined
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        {/* User avatar skeleton */}
        <Skeleton className="h-12 w-12 rounded-full mb-4" />

        {/* User name skeleton */}
        <Skeleton className="h-6 w-48 mb-2" />

        {/* Additional information skeleton */}
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  // Provide authentication context to children
  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access the AuthContext
 *
 * Provides a convenient way to access authentication functionality
 * from any component within the AuthProvider tree.
 *
 * @throws {Error} If used outside of an AuthProvider
 * @returns {AuthContextType} The authentication context value
 */
export function useAuth() {
  const context = useContext(AuthContext);

  // Ensure the hook is used within a provider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
