"use client"

/**
 * ThemeProvider Component
 * 
 * A wrapper around next-themes' ThemeProvider that enables theme switching functionality
 * throughout the application. This component handles theme persistence and provides
 * theme-related context to all child components.
 * 
 * Features:
 * - Seamless dark/light mode switching
 * - Theme persistence between sessions
 * - System theme detection and preference matching
 * 
 * @param {ThemeProviderProps} props - Theme provider configuration from next-themes
 * @param {React.ReactNode} props.children - Child components that will have access to theme context
 * @returns {JSX.Element} The theme provider component with its children
 */

import type { ThemeProviderProps } from "next-themes/dist/types";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * ThemeProvider Component
 * 
 * Wraps application content with theming context to enable
 * theme switching and persistence.
 * 
 * @param props - Component properties including children and theme options
 * @returns A themed context provider component
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}
