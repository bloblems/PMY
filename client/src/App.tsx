import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import ThemeToggle from "@/components/ThemeToggle";
import InfoPage from "@/pages/InfoPage";
import RecordPage from "@/pages/RecordPage";
import ContractPage from "@/pages/ContractPage";
import FilesPage from "@/pages/FilesPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={InfoPage} />
      <Route path="/record" component={RecordPage} />
      <Route path="/contract" component={ContractPage} />
      <Route path="/files" component={FilesPage} />
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

          <BottomNav />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
