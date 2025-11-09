import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import IconBottomNav from "@/components/IconBottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import InfoPage from "@/pages/InfoPage";
import FilesPage from "@/pages/FilesPage";
import AdminPage from "@/pages/AdminPage";
import CustomPage from "@/pages/CustomPage";
import SharePage from "@/pages/SharePage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={InfoPage} />
      <Route path="/files" component={FilesPage} />
      <Route path="/custom" component={CustomPage} />
      <Route path="/share" component={SharePage} />
      <Route path="/admin" component={AdminPage} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen bg-background">
          <header className="sticky top-0 z-40 bg-card border-b border-card-border">
            <div className="max-w-md mx-auto px-6 h-14 flex items-center justify-between">
              <h1 className="text-lg font-semibold">ConsentGuard</h1>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 pb-20 overflow-auto">
            <div className="max-w-md mx-auto px-6 py-8">
              <Router />
            </div>
          </main>

          <IconBottomNav />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
