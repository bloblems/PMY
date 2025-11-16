import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import PMYLogo from "@/components/PMYLogo";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function ResetRequestPage() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetRequestMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await apiRequest("POST", "/api/auth/request-reset", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setErrorMessage(null);
      setSuccessMessage(data.message || "Password reset email sent! Check your inbox for instructions.");
      setEmail("");
    },
    onError: (error: any) => {
      let parsedErrorMessage = "Failed to send reset email. Please try again.";
      
      try {
        const match = error.message?.match(/\{.*\}/);
        if (match) {
          const errorData = JSON.parse(match[0]);
          parsedErrorMessage = errorData.error || parsedErrorMessage;
        }
      } catch (e) {
        // If parsing fails, use default message
      }

      setErrorMessage(parsedErrorMessage);
      setSuccessMessage(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setErrorMessage(null);
    setSuccessMessage(null);
    
    if (!email) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    resetRequestMutation.mutate({ email });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-24 h-24 bg-success/10 rounded-2xl flex items-center justify-center">
            <PMYLogo className="text-4xl text-success" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Reset password
          </h1>
          <p className="text-muted-foreground">
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" data-testid="alert-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-success/20 bg-success/10 text-success" data-testid="alert-success">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                data-testid="input-reset-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={resetRequestMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              data-testid="button-send-reset"
              className="w-full"
              disabled={resetRequestMutation.isPending}
            >
              {resetRequestMutation.isPending ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <Link href="/auth?tab=login">
            <Button variant="ghost" data-testid="link-back-to-login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
