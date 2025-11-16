import { useState, useEffect } from "react";
import { useLocation, Link, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import PMYLogo from "@/components/PMYLogo";
import { AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  const token = new URLSearchParams(searchParams).get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMessage("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/reset-password", data);
      return await response.json();
    },
    onSuccess: (data) => {
      setErrorMessage(null);
      setSuccessMessage(data.message || "Password reset successful! You can now login with your new password.");
      setPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        navigate("/auth?tab=login");
      }, 3000);
    },
    onError: (error: any) => {
      let parsedErrorMessage = "Failed to reset password. Please try again.";
      
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
    
    if (!password || !confirmPassword) {
      setErrorMessage("Please enter your new password.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!token) {
      setErrorMessage("Invalid reset link. Please request a new password reset.");
      return;
    }

    resetPasswordMutation.mutate({ token, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-24 h-24 bg-success/10 rounded-2xl flex items-center justify-center">
            <PMYLogo className="text-4xl text-success" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Set new password
          </h1>
          <p className="text-muted-foreground">
            Enter your new password below
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
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                data-testid="input-new-password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={resetPasswordMutation.isPending || !token}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                data-testid="input-confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={resetPasswordMutation.isPending || !token}
              />
            </div>

            <Button
              type="submit"
              data-testid="button-reset-password"
              className="w-full"
              disabled={resetPasswordMutation.isPending || !token}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
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
