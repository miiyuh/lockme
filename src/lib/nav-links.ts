/**
 * Navigation Links Configuration
 * 
 * Defines the navigation structure for the LockMe application.
 * Organizes links into logical categories (main, secondary, legal)
 * and provides standardized data structure for navigation components.
 * 
 * Features:
 * - Consistent icon and label pairing
 * - Logical grouping by content type
 * - Support for visual separators in menus
 * - Multiple export formats for different UI components
 */

// Icon imports
import { 
  LayoutDashboard, 
  ShieldCheck, 
  ShieldOff, 
  Sparkles, 
  Settings, 
  HelpCircle, 
  Info, 
  FileText, 
  Mail, 
  Code 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Navigation link interface
 * Defines the structure for all navigation items in the application
 */
export interface NavLink {
  /** Target URL for the navigation link */
  href: string;
  
  /** Display text for the navigation item */
  label: string;
  
  /** Lucide icon component to display with the link */
  icon: LucideIcon;
  
  /** Whether to show a separator above this item in menus */
  separator?: boolean;
}

/**
 * Main navigation links
 * 
 * Primary navigation items for core application features.
 * These appear prominently in the main navigation bar.
 */
export const mainNavLinks: NavLink[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/encrypt',
    label: 'Encrypt File',
    icon: ShieldCheck,
  },
  {
    href: '/decrypt',
    label: 'Decrypt File',
    icon: ShieldOff,
  },
  {
    href: '/toolkit',
    label: 'AI Toolkit',
    icon: Sparkles,
  },
  {
    href: '/snippets',
    label: 'Code Snippets',
    icon: Code,
  },
];

/**
 * Secondary navigation links
 * 
 * Support and help-related navigation items.
 * These typically appear in secondary menus or footers.
 */
export const secondaryNavLinks: NavLink[] = [
  {
    href: '/help',
    label: 'Help/FAQ',
    icon: HelpCircle,
  },
  {
    href: '/contact',
    label: 'Contact Us',
    icon: Mail,
  },
];

/**
 * Legal navigation links
 * 
 * Company information and legal document links.
 * These typically appear in the footer or settings areas.
 */
export const legalNavLinks: NavLink[] = [
  {
    href: '/about',
    label: 'About LockMe',
    icon: Info,
    separator: true,
  },
  {
    href: '/privacy',
    label: 'Privacy Policy',
    icon: FileText,
  },
  {
    href: '/terms',
    label: 'Terms of Service',
    icon: FileText,
  },
];

/**
 * Combined navigation links
 * 
 * All navigation links in a single array for components
 * that need to display the complete navigation structure.
 */
export const navLinks: NavLink[] = [
  ...mainNavLinks, 
  ...secondaryNavLinks, 
  ...legalNavLinks
];

/**
 * Categorized navigation links
 * 
 * Navigation links organized by category for components
 * that need to display different sections separately.
 */
export const categorizedNavLinks = {
  main: mainNavLinks,
  secondary: secondaryNavLinks,
  legal: legalNavLinks,
};
