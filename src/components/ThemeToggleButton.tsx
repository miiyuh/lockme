"use client"

/**
 * ThemeToggleButton Component
 *
 * A dropdown button that allows users to switch between light, dark, and system themes.
 * Provides visual feedback with animated sun/moon icons that transition based on the current theme.
 *
 * Features:
 * - Animated theme indicator icons (sun/moon)
 * - Dropdown menu with theme options
 * - Accessible design with screen reader support
 * - Seamless integration with next-themes provider
 */

import * as React from "react"

// Icons
import { Moon, Sun } from "lucide-react"

// Hooks
import { useTheme } from "next-themes"

// UI Components
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * ThemeToggleButton Component
 *
 * Renders a button with a dropdown menu for theme selection.
 * Shows an animated sun/moon icon that changes based on the current theme.
 *
 * @returns {JSX.Element} A theme toggle button with dropdown options
 */
export function ThemeToggleButton() {
  // Access theme context from next-themes
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      {/* Button with animated theme icons */}
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          {/* Sun icon - visible in light mode, animates away in dark mode */}
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />

          {/* Moon icon - visible in dark mode, animates away in light mode */}
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />

          {/* Accessible label for screen readers */}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>

      {/* Theme selection dropdown */}
      <DropdownMenuContent align="end">
        {/* Light theme option */}
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>

        {/* Dark theme option */}
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>

        {/* System preference option */}
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
