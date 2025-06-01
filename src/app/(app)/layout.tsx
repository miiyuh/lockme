
"use client";

// React and Next.js imports
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// UI Components
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// Custom components
import { ThemeToggleButton } from '@/components/ThemeToggleButton';
import AuthButton from '@/components/AuthButton';
import CurrentDateTime from '@/components/CurrentDateTime';

// Data and context
import { categorizedNavLinks, type NavLink } from '@/lib/nav-links';
import { useAuth } from '@/contexts/AuthContext';

// Icons
import { PanelLeft, Settings, Loader2 } from 'lucide-react';

/**
 * Props for the AppLayout component
 */
interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Renders navigation links with icons and tooltips
 * 
 * @param links - Array of navigation links with icons
 * @returns JSX elements for the sidebar menu
 */
const renderNavLinks = (links: NavLink[]) => {
  return links.map((link) => (
    <SidebarMenuItem key={link.href}>
      <SidebarMenuButton
        asChild
        tooltip={{ 
          children: link.label, 
          side: 'right', 
          align: 'center' 
        }}
      >
        <Link href={link.href}>
          <link.icon size={18} />
          <span className="group-data-[collapsible=icon]:hidden">
            {link.label}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));
};

/**
 * Main application layout component with sidebar navigation
 * 
 * Handles authentication state and redirects unauthenticated users to login
 */
export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Additional loading state during redirect
  if (!user) { 
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      {/* Main Sidebar */}
      <Sidebar className="border-r" collapsible="icon">
        {/* Logo Header */}
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center justify-start text-lg font-semibold">
            <Image
              src="https://lockme.my/assets/img/logo_lockme_highRESver.png"
              alt="LockMe Logo"
              width={64}
              height={32}
              className="h-8 w-auto group-data-[collapsible=icon]:h-12 group-data-[collapsible=icon]:w-12 object-contain"
              data-ai-hint="brand logo"
            />
          </Link>
        </SidebarHeader>        {/* Sidebar Navigation Menu */}
        <SidebarContent className="p-2 flex-grow">
          <SidebarMenu className="flex-grow">
            {/* Main Navigation Links */}
            <SidebarGroup className="p-0">
              {renderNavLinks(categorizedNavLinks.main)}
            </SidebarGroup>

            <SidebarSeparator className="my-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:my-2" />

            {/* Support Links */}
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs text-muted-foreground px-2 py-1">
                Support
              </SidebarGroupLabel>
              {renderNavLinks(categorizedNavLinks.secondary)}
            </SidebarGroup>
            
            <SidebarSeparator className="my-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:my-2" />

            {/* Legal Links */}
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs text-muted-foreground px-2 py-1">
                Legal
              </SidebarGroupLabel>
              {renderNavLinks(categorizedNavLinks.legal)}
            </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>        {/* Sidebar Footer */}
        <SidebarFooter className="flex items-center justify-between p-2 border-t group-data-[collapsible=icon]:justify-center">
          {/* Copyright Notice */}
          <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            &copy; {new Date().getFullYear()} LockMe
          </p>
          
          {/* Settings Button with Tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-md p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:aspect-square group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
                >
                  <Link href="/settings" aria-label="Settings">
                    <Settings className="h-5 w-5 flex-shrink-0" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                Settings
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SidebarFooter>
      </Sidebar>      {/* Sidebar Rail for visual separation */}
      <SidebarRail />
      
      {/* Main Content Container */}
      <SidebarInset className="flex flex-col min-h-screen">
        {/* App Header with Toggle and Controls */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          {/* Mobile Menu Toggle */}
          <SidebarTrigger className="md:hidden">
            <PanelLeft />
            <span className="sr-only">Toggle Menu</span>
          </SidebarTrigger>
          
          {/* Header Controls */}
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggleButton />
            <AuthButton />
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
        
        {/* App Footer */}
        <footer className="flex flex-col sm:flex-row items-center justify-between py-4 px-6 mt-auto text-xs text-muted-foreground border-t gap-2 sm:gap-4">
          <p>Privacy shouldn't be a luxury.</p>
          <CurrentDateTime />
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
