
import { LayoutDashboard, ShieldCheck, ShieldOff, Sparkles, Settings, HelpCircle, Info, FileText, Mail, Code } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  separator?: boolean;
}

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

export const navLinks: NavLink[] = [...mainNavLinks, ...secondaryNavLinks, ...legalNavLinks];

// Combined and categorized for easier management in layout
export const categorizedNavLinks = {
  main: mainNavLinks,
  secondary: secondaryNavLinks,
  legal: legalNavLinks,
};
