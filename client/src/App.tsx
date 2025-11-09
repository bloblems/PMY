import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import IconBottomNav from "@/components/IconBottomNav";
import SettingsMenu from "@/components/SettingsMenu";
import InfoPage from "@/pages/InfoPage";
import FilesPage from "@/pages/FilesPage";
import AdminPage from "@/pages/AdminPage";
import CustomPage from "@/pages/CustomPage";
import SharePage from "@/pages/SharePage";
import ConsentFlowPage from "@/pages/ConsentFlowPage";
import ConsentSignaturePage from "@/pages/ConsentSignaturePage";
import ConsentVoicePage from "@/pages/ConsentVoicePage";
import ConsentPhotoPage from "@/pages/ConsentPhotoPage";
import ConsentBiometricPage from "@/pages/ConsentBiometricPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={InfoPage} />
      <Route path="/files" component={FilesPage} />
      <Route path="/custom" component={CustomPage} />
      <Route path="/share" component={SharePage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/consent/flow" component={ConsentFlowPage} />
      <Route path="/consent/signature" component={ConsentSignaturePage} />
      <Route path="/consent/voice" component={ConsentVoicePage} />
      <Route path="/consent/photo" component={ConsentPhotoPage} />
      <Route path="/consent/biometric" component={ConsentBiometricPage} />
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
              <h1 className="text-lg font-semibold">PMY</h1>
              <SettingsMenu />
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
