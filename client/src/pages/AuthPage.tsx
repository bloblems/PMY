import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import PMYLogo from "@/components/PMYLogo";
import { AlertCircle } from "lucide-react";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const authMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name?: string }) => {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const response = await apiRequest("POST", endpoint, data);
      return await response.json();
    },
    onSuccess: (data) => {
      // Clear any error messages
      setErrorMessage(null);
      
      // Set the user data directly instead of invalidating/refetching
      queryClient.setQueryData(["/api/auth/me"], data);
      
      // Navigate immediately with success parameter
      const successType = mode === "login" ? "login" : "signup";
      navigate(`/?success=${successType}`);
    },
    onError: (error: any) => {
      // Parse the error message from the backend
      let parsedErrorMessage = "Please check your credentials and try again.";
      
      try {
        // Error format from apiRequest is: "400: {"error":"Email already exists"}"
        const match = error.message?.match(/\{.*\}/);
        if (match) {
          const errorData = JSON.parse(match[0]);
          parsedErrorMessage = errorData.error || parsedErrorMessage;
        }
      } catch (e) {
        // If parsing fails, use default message
      }

      // Display error inline instead of toast
      setErrorMessage(parsedErrorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrorMessage(null);
    
    if (!email || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    if (mode === "signup" && !name) {
      setErrorMessage("Please enter your name.");
      return;
    }

    authMutation.mutate({
      email,
      password,
      ...(mode === "signup" && { name }),
    });
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setEmail("");
    setPassword("");
    setName("");
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-24 h-24 bg-green-600/10 dark:bg-green-400/10 rounded-2xl flex items-center justify-center">
            <PMYLogo className="text-4xl text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-muted-foreground">
            {mode === "login" 
              ? "Sign in to continue documenting consent" 
              : "Get started with Title IX consent documentation"}
          </p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" data-testid="alert-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* OIDC Login - Only show for login mode */}
        {mode === "login" && (
          <Card className="p-8">
            <div className="space-y-4">
              <Button
                onClick={() => window.location.href = "/api/login"}
                className="w-full h-12 font-semibold"
                variant="default"
                data-testid="button-login-replit"
              >
                Log in with Replit
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={authMutation.isPending}
                  data-testid="input-name"
                  className="h-12"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={authMutation.isPending}
                data-testid="input-email"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={authMutation.isPending}
                data-testid="input-password"
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              disabled={authMutation.isPending}
              className="w-full h-12 bg-green-600 hover:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500 font-semibold"
              data-testid="button-submit"
            >
              {authMutation.isPending 
                ? (mode === "login" ? "Signing in..." : "Creating account...") 
                : (mode === "login" ? "Sign in" : "Create account")}
            </Button>
          </form>
        </Card>

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
          </p>
          <Button
            variant="ghost"
            onClick={toggleMode}
            disabled={authMutation.isPending}
            data-testid="button-toggle-mode"
            className="font-semibold"
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground leading-relaxed">
          By continuing, you agree to document consent in accordance with Title IX requirements and institutional policies.
        </p>
      </div>
    </div>
  );
}
