import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, Shield, AlertCircle, Clock } from "lucide-react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useToast } from "@/hooks/use-toast";

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface VerificationStatus {
  isVerified: boolean;
  verificationProvider: string | null;
  verifiedAt: string | null;
  verificationLevel: string | null;
  latestAttempt: {
    status: string;
    paymentStatus: string;
    failureReason?: string;
    canRetryAt?: string;
  } | null;
  canRetry: boolean;
  canRetryAt: string | null;
}

function PaymentForm({ 
  clientSecret, 
  onSuccess 
}: { 
  clientSecret: string; 
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        toast({
          title: "Payment Successful",
          description: "Proceeding to identity verification...",
        });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
        data-testid="button-confirm-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay $5 & Continue to Verification"
        )}
      </Button>
    </form>
  );
}

export default function VerificationPage() {
  const { toast } = useToast();
  const [verificationSessionId, setVerificationSessionId] = useState<string | null>(null);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery<VerificationStatus>({
    queryKey: ["/api/account-verification/status"],
  });

  const initiateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/account-verification/initiate", {
        provider: "stripe_identity",
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setVerificationSessionId(data.verificationSessionId);
      setPaymentClientSecret(data.paymentIntentClientSecret);
      
      toast({
        title: "Verification Session Created",
        description: "Please complete the payment to proceed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate verification",
        variant: "destructive",
      });
    },
  });

  const handlePaymentSuccess = () => {
    if (!verificationSessionId) return;
    
    window.location.href = `https://verify.stripe.com/start/${verificationSessionId}`;
  };

  const handleStartVerification = () => {
    initiateMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" data-testid="loader-status" />
      </div>
    );
  }

  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    return (
      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Verification
            </CardTitle>
            <CardDescription>
              Get a verified badge on your profile for $5
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Account verification is temporarily unavailable</p>
                <p className="text-sm text-muted-foreground">
                  This optional feature requires payment processing to be set up. All other PMY features, including consent documentation, work normally.
                </p>
              </AlertDescription>
            </Alert>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>What is account verification?</strong></p>
              <p>
                A one-time identity check that adds a verified badge to your profile, showing that you've confirmed your identity through secure document verification.
              </p>
              <p className="mt-3 text-xs">
                This is an optional feature. You can continue using PMY for consent documentation without verification.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status?.isVerified) {
    return (
      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Account Verified
              </CardTitle>
              <Badge variant="default" className="bg-green-600" data-testid="badge-verified">
                Verified
              </Badge>
            </div>
            <CardDescription>
              Your account has been successfully verified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-medium" data-testid="text-provider">
                  {status.verificationProvider === "stripe_identity" ? "Stripe Identity" : status.verificationProvider}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Verified on:</span>
                <span className="font-medium" data-testid="text-verified-date">
                  {status.verifiedAt ? new Date(status.verifiedAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Level:</span>
                <span className="font-medium" data-testid="text-level">
                  {status.verificationLevel || "Standard"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canRetry = status?.canRetry ?? true;
  const canRetryAt = status?.canRetryAt ? new Date(status.canRetryAt) : null;
  const latestAttempt = status?.latestAttempt;

  if (!canRetry && canRetryAt) {
    const hoursRemaining = Math.ceil((canRetryAt.getTime() - Date.now()) / (1000 * 60 * 60));
    
    return (
      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-orange-600" />
              Retry Cooldown Active
            </CardTitle>
            <CardDescription>
              Please wait before attempting verification again
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your previous verification attempt failed. For security reasons, you must wait {hoursRemaining} hours before retrying.
              </AlertDescription>
            </Alert>
            {latestAttempt?.failureReason && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium">Failure Reason:</p>
                <p className="text-sm text-muted-foreground" data-testid="text-failure-reason">
                  {latestAttempt.failureReason}
                </p>
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              You can retry after: <span className="font-medium">{canRetryAt.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (latestAttempt?.status === "failed" && canRetry) {
    return (
      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-red-600" />
              Verification Failed
            </CardTitle>
            <CardDescription>
              Your previous verification attempt was unsuccessful
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestAttempt.failureReason && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription data-testid="text-failure-reason">
                  {latestAttempt.failureReason}
                </AlertDescription>
              </Alert>
            )}
            <p className="text-sm text-muted-foreground">
              You can try again with a different ID or selfie. The verification fee is $5 per attempt.
            </p>
            <Button 
              onClick={handleStartVerification} 
              disabled={initiateMutation.isPending}
              className="w-full"
              data-testid="button-retry-verification"
            >
              {initiateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Session...
                </>
              ) : (
                "Try Again ($5)"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentClientSecret && stripePromise) {
    return (
      <div className="container max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Complete Payment</CardTitle>
            <CardDescription>
              Pay $5 to begin identity verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentClientSecret,
                appearance: { theme: "stripe" },
              }}
            >
              <PaymentForm 
                clientSecret={paymentClientSecret}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Get Verified
          </CardTitle>
          <CardDescription>
            Verify your identity to unlock premium features and gain trust within the PMY community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Verification Benefits:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span>Verified badge on your profile</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span>Increased trust with partners</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span>Access to advanced features</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                <span>Priority support</span>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-muted rounded-md space-y-2">
            <h4 className="font-semibold text-sm">What You'll Need:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Government-issued ID (driver's license, passport, etc.)</li>
              <li>• Clear selfie for identity matching</li>
              <li>• Payment method for $5 verification fee</li>
            </ul>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Your ID and selfie are securely processed by Stripe Identity and never stored on our servers. 
              Only verification status is saved.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">One-time verification fee:</span>
              <span className="text-2xl font-bold">$5.00</span>
            </div>
          </div>

          <Button
            onClick={handleStartVerification}
            disabled={initiateMutation.isPending}
            className="w-full"
            data-testid="button-start-verification"
          >
            {initiateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Session...
              </>
            ) : (
              "Start Verification ($5)"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
