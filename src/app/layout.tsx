/**
 * Root Layout
 * 
 * This is the main layout component for the LockMe application.
 * It sets up the base HTML structure, theme provider, authentication,
 * activity tracking, and global styles.
 */

// Next.js imports
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';

// Global styles
import './globals.css';

// UI Components
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';

// Context Providers
import { AuthProvider } from '@/contexts/AuthContext';
import { ActivityProvider } from '@/contexts/ActivityContext';

/**
 * JetBrains Mono font configuration
 * Modern, monospaced font optimized for code display and readability
 */
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jetbrains-mono'
});

/**
 * Metadata for the application
 * Used by Next.js for SEO and page information
 */
export const metadata: Metadata = {
  title: 'LockMe - Secure File Encryption',
  description: 'Securely encrypt and decrypt your files with LockMe. AI-powered passphrase generation and recovery prompt enhancement.',
};

/**
 * Root Layout Component
 * 
 * Wraps all pages in the application with necessary providers:
 * - Theme (dark/light mode)
 * - Authentication
 * - Activity tracking
 * - Toast notifications
 * 
 * @param props - Component properties
 * @param props.children - Child components to render within the layout
 * @returns The root layout structure
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${jetbrainsMono.variable} font-mono`} 
      suppressHydrationWarning
    >
      <body className="antialiased">
        {/* Theme Provider - Controls light/dark mode */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Authentication Provider - Manages user sessions */}
          <AuthProvider>
            {/* Activity Provider - Tracks user activities */}
            <ActivityProvider>
              {children}
            </ActivityProvider>
          </AuthProvider>

          {/* Toast Notifications System */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
