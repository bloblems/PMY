import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConsentFlowProvider } from "@/contexts/ConsentFlowContext";
import { useAuth } from "@/hooks/useAuth";
import IconBottomNav from "@/components/IconBottomNav";
import SettingsMenu from "@/components/SettingsMenu";
import PMYLogo from "@/components/PMYLogo";
import InfoPage from "@/pages/InfoPage";
import FilesPage from "@/pages/FilesPage";
import AdminPage from "@/pages/AdminPage";
import CustomPage from "@/pages/CustomPage";
import SharePage from "@/pages/SharePage";
import ToolsPage from "@/pages/ToolsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import AccountSettingsPage from "@/pages/AccountSettingsPage";
import BillingPage from "@/pages/BillingPage";
import ConsentFlowPage from "@/pages/ConsentFlowPage";
import ConsentSignaturePage from "@/pages/ConsentSignaturePage";
import ConsentVoicePage from "@/pages/ConsentVoicePage";
import ConsentPhotoPage from "@/pages/ConsentPhotoPage";
import ConsentBiometricPage from "@/pages/ConsentBiometricPage";
import AuthPage from "@/pages/AuthPage";
import ResetRequestPage from "@/pages/ResetRequestPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ProfilePage from "@/pages/ProfilePage";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/reset-request" component={ResetRequestPage} />
      <Route path="/auth/reset-password" component={ResetPasswordPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/" component={ConsentFlowPage} />
      <Route path="/titleix" component={InfoPage} />
      <Route path="/files" component={FilesPage} />
      <Route path="/custom" component={CustomPage} />
      <Route path="/share" component={SharePage} />
      <Route path="/tools" component={ToolsPage} />
      <Route path="/settings/integrations" component={IntegrationsPage} />
      <Route path="/settings/account" component={AccountSettingsPage} />
      <Route path="/settings/billing" component={BillingPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/consent/signature" component={ConsentSignaturePage} />
      <Route path="/consent/voice" component={ConsentVoicePage} />
      <Route path="/consent/photo" component={ConsentPhotoPage} />
      <Route path="/consent/biometric" component={ConsentBiometricPage} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const { loading } = useAuth();
  const isAuthPage = location === "/auth" || location.startsWith("/auth/reset");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConsentFlowProvider>
          {loading ? (
            <div className="flex items-center justify-center min-h-screen bg-background">
              <div className="text-center">
                <PMYLogo className="text-4xl text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col min-h-screen bg-background">
              {!isAuthPage && (
                <header className="sticky top-0 z-40 bg-card border-b border-card-border">
                  <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <PMYLogo className="text-2xl text-foreground" />
                    <SettingsMenu />
                  </div>
                </header>
              )}

              <main className={`flex-1 overflow-auto ${!isAuthPage ? "pb-20" : ""}`}>
                <div className={`w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto ${!isAuthPage ? "px-4 sm:px-6 py-8" : ""}`}>
                  <Router />
                </div>
              </main>

              {!isAuthPage && <IconBottomNav />}
            </div>
          )}
          <Toaster />
        </ConsentFlowProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
