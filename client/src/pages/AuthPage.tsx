import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import PMYLogo from "@/components/PMYLogo";
import { AlertCircle } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";

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
      if (mode === "login") {
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) throw error;
        return authData;
      } else {
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name,
            },
          },
        });

        if (error) throw error;

        if (authData.user && data.name) {
          await apiRequest("POST", "/api/user-profile", {
            name: data.name,
          });
        }

        return authData;
      }
    },
    onSuccess: () => {
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      const successType = mode === "login" ? "login" : "signup";
      navigate(`/?success=${successType}`);
    },
    onError: (error: any) => {
      let parsedErrorMessage = "Please check your credentials and try again.";
      
      if (error.message) {
        parsedErrorMessage = error.message;
      }

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
          <div className="mx-auto w-24 h-24 bg-success/10 rounded-2xl flex items-center justify-center">
            <PMYLogo className="text-4xl text-success" />
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

        {/* Social Login - Only show for login mode */}
        {mode === "login" && (
          <Card className="p-8">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => window.location.href = "/api/login"}
                  variant="outline"
                  className="h-12 font-semibold"
                  data-testid="button-login-google"
                >
                  <SiGoogle className="mr-2 h-5 w-5" />
                  Google
                </Button>
                <Button
                  onClick={() => window.location.href = "/api/login"}
                  variant="outline"
                  className="h-12 font-semibold"
                  data-testid="button-login-apple"
                >
                  <SiApple className="mr-2 h-5 w-5" />
                  Apple
                </Button>
                <Button
                  onClick={() => window.location.href = "/api/login"}
                  variant="outline"
                  className="h-12 font-semibold"
                  data-testid="button-login-x"
                >
                  <FaXTwitter className="mr-2 h-5 w-5" />
                  X
                </Button>
              </div>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <Link href="/auth/reset-request">
                    <button
                      type="button"
                      className="text-sm text-success hover:underline"
                      data-testid="link-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </Link>
                )}
              </div>
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
              className="w-full h-12 bg-success hover:bg-success/90 font-semibold"
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
