import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import FileUpload from "@/pages/FileUpload";
import FileList from "@/pages/FileList";
import { ThemeToggle } from "@/components/ThemeToggle";

function Router() {
  const [location] = useLocation();
  
  return (
    <Switch>
      <Route path="/" component={Home}/>
      <Route path="/upload" component={FileUpload}/>
      <Route path="/files" component={FileList}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="fixed top-4 right-4 z-50">
              <ThemeToggle />
            </div>
            <div className="w-full max-w-4xl">
              <Router />
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
