
import type { ReactNode } from 'react';
import Link from 'next/link';
import { PanelLeft } from 'lucide-react';
import Image from 'next/image';
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
  SidebarRail // Added SidebarRail
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { categorizedNavLinks, type NavLink } from '@/lib/nav-links';
import { ThemeToggleButton } from '@/components/ThemeToggleButton';

interface AppLayoutProps {
  children: ReactNode;
}

const renderNavLinks = (links: NavLink[]) => {
  return links.map((link) => (
    <SidebarMenuItem key={link.href}>
      <SidebarMenuButton
        asChild
        tooltip={{ children: link.label, side: 'right', align: 'center' }}
      >
        <Link href={link.href}>
          <link.icon size={18} />
          <span className="group-data-[collapsible=icon]:hidden">{link.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));
};


export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center justify-start text-lg font-semibold"> {/* Changed justify-center to justify-start and removed gap-2 */}
            <Image
              src="https://lockme.my/assets/img/logo_lockme_highRESver.png"
              alt="LockMe Logo"
              width={64} // Increased width
              height={32} // Increased height
              className="h-8 w-auto group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 object-contain" // Increased size
              data-ai-hint="brand logo"
            />

          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2 flex-grow">
          <SidebarMenu className="flex-grow">
            <SidebarGroup className="p-0">
              {renderNavLinks(categorizedNavLinks.main)}
            </SidebarGroup>

            <SidebarSeparator className="my-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:my-2" />

            <SidebarGroup className="p-0">
               <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs text-muted-foreground px-2 py-1">Support</SidebarGroupLabel>
              {renderNavLinks(categorizedNavLinks.secondary)}
            </SidebarGroup>

            <SidebarSeparator className="my-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:my-2" />

            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden text-xs text-muted-foreground px-2 py-1">Legal</SidebarGroupLabel>
              {renderNavLinks(categorizedNavLinks.legal)}
            </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t mt-auto">
           <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            &copy; {new Date().getFullYear()} LockMe
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarRail /> {/* Added SidebarRail here */}
      <SidebarInset className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-4">
          <SidebarTrigger className="md:hidden">
             <PanelLeft />
             <span className="sr-only">Toggle Menu</span>
          </SidebarTrigger>
          <div className="ml-auto">
            <ThemeToggleButton />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
         <footer className="py-6 px-6 mt-auto text-center text-xs text-muted-foreground border-t">
            Privacy shouldn't be a luxury.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
