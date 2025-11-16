import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Smartphone, DollarSign, Bitcoin, Trash2, Eye, EyeOff, Plus } from "lucide-react";
import { SiPaypal, SiVenmo } from "react-icons/si";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  type: "card" | "apple_pay" | "paypal" | "venmo" | "bitcoin";
  isDefault: "true" | "false";
  last4?: string | null;
  brand?: string | null;
  expiryMonth?: string | null;
  expiryYear?: string | null;
  email?: string | null;
  walletAddress?: string | null;
  createdAt: string;
  updatedAt: string;
}

function maskCardNumber(last4?: string | null): string {
  if (!last4) return "****";
  return `•••• •••• •••• ${last4}`;
}

function maskEmail(email?: string | null): string {
  if (!email) return "";
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 3) {
    return `${'*'.repeat(localPart.length)}@${domain}`;
  }
  const firstTwo = localPart.substring(0, 2);
  const lastOne = localPart.substring(localPart.length - 1);
  return `${firstTwo}${'*'.repeat(localPart.length - 3)}${lastOne}@${domain}`;
}

function maskWalletAddress(address?: string | null): string {
  if (!address || address.length < 10) return address || "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

function PaymentMethodCard({ 
  method, 
  onSetDefault, 
  onDelete,
  isSettingDefault,
  isDeleting 
}: { 
  method: PaymentMethod;
  onSetDefault: () => void;
  onDelete: () => void;
  isSettingDefault: boolean;
  isDeleting: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getIcon = () => {
    switch (method.type) {
      case "card":
        return <CreditCard className="h-5 w-5" />;
      case "apple_pay":
        return <Smartphone className="h-5 w-5" />;
      case "paypal":
        return <SiPaypal className="h-5 w-5" />;
      case "venmo":
        return <SiVenmo className="h-5 w-5" />;
      case "bitcoin":
        return <Bitcoin className="h-5 w-5" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (method.type) {
      case "card":
        return method.brand ? `${method.brand.charAt(0).toUpperCase()}${method.brand.slice(1)} Card` : "Credit Card";
      case "apple_pay":
        return "Apple Pay";
      case "paypal":
        return "PayPal";
      case "venmo":
        return "Venmo";
      case "bitcoin":
        return "Bitcoin";
      default:
        return "Payment Method";
    }
  };

  const getDetails = () => {
    if (method.type === "card") {
      return showDetails ? maskCardNumber(method.last4) : "•••• •••• •••• ••••";
    } else if (method.type === "paypal" || method.type === "venmo") {
      return showDetails ? (method.email || "") : maskEmail(method.email);
    } else if (method.type === "bitcoin") {
      return showDetails ? (method.walletAddress || "") : maskWalletAddress(method.walletAddress);
    }
    return "";
  };

  const getExpiry = () => {
    if (method.type === "card" && method.expiryMonth && method.expiryYear) {
      return showDetails ? `Expires ${method.expiryMonth}/${method.expiryYear}` : "Expires ••/••";
    }
    return "";
  };

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <CardTitle className="text-base font-medium">{getTitle()}</CardTitle>
        </div>
        {method.isDefault === "true" && (
          <Badge variant="default" data-testid={`badge-default-${method.id}`}>
            Default
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-mono" data-testid={`text-payment-details-${method.id}`}>
                {getDetails()}
              </p>
              {getExpiry() && (
                <p className="text-xs text-muted-foreground">{getExpiry()}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetails(!showDetails)}
              data-testid={`button-toggle-visibility-${method.id}`}
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              {method.isDefault === "false" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSetDefault}
                  disabled={isSettingDefault}
                  data-testid={`button-set-default-${method.id}`}
                >
                  {isSettingDefault && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Set as Default
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                data-testid={`button-delete-${method.id}`}
              >
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Remove
              </Button>
            </div>

            {showDeleteConfirm && (
              <div className="rounded-lg border border-destructive bg-destructive/5 p-3 space-y-2">
                <p className="text-xs font-semibold text-destructive">
                  Remove Payment Method
                </p>
                <p className="text-xs text-muted-foreground">
                  Are you sure you want to remove this payment method? This action cannot be undone.
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      onDelete();
                      setShowDeleteConfirm(false);
                    }}
                    data-testid={`button-confirm-delete-${method.id}`}
                    className="flex-1"
                  >
                    Remove
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    data-testid={`button-cancel-delete-${method.id}`}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddCardForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (setupIntent && setupIntent.payment_method) {
        await apiRequest("POST", "/api/payment-methods", {
          stripePaymentMethodId: setupIntent.payment_method,
          type: "card",
          last4: null,
          brand: null,
          expiryMonth: null,
          expiryYear: null,
        });

        toast({
          title: "Success",
          description: "Payment method added successfully.",
        });

        queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="flex gap-2">
        <Button type="submit" disabled={!stripe || isProcessing} data-testid="button-add-card-submit">
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Card
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel-add-card">
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function BillingPage() {
  const { toast } = useToast();
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const { data: paymentMethods, isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("POST", `/api/payment-methods/${id}/set-default`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({
        title: "Success",
        description: "Default payment method updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update default payment method.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/payment-methods/${id}`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({
        title: "Success",
        description: "Payment method removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove payment method.",
        variant: "destructive",
      });
    },
  });

  const setupIntentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payment-methods/setup-intent", {});
      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setIsAddingCard(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to initialize payment setup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddCard = () => {
    setupIntentMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Payment Methods</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your payment methods securely
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Stripe Configuration Required</CardTitle>
            <CardDescription>
              To enable billing and payment features, you need to configure your Stripe publishable key.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">Setup Instructions:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Stripe Dashboard → API Keys</a></li>
                <li>Make sure you're in <strong>Test mode</strong></li>
                <li>Copy your <strong>Publishable key</strong> (starts with pk_test_)</li>
                <li>Add it as an environment variable: <code className="bg-background px-1 py-0.5 rounded">VITE_STRIPE_PUBLIC_KEY</code></li>
              </ol>
            </div>
            <p className="text-xs text-muted-foreground">
              The publishable key is safe to use in your browser - it's designed to be public and allows secure payment collection.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Payment Methods</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your payment methods securely
        </p>
      </div>

      {!isAddingCard ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Your saved payment methods are encrypted and stored securely. Card details are masked by default.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleAddCard} 
                disabled={setupIntentMutation.isPending}
                data-testid="button-add-payment-method"
              >
                {setupIntentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>

          {paymentMethods && paymentMethods.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {paymentMethods.map((method) => (
                <PaymentMethodCard
                  key={method.id}
                  method={method}
                  onSetDefault={() => setDefaultMutation.mutate(method.id)}
                  onDelete={() => deleteMutation.mutate(method.id)}
                  isSettingDefault={setDefaultMutation.isPending}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No payment methods saved yet. Add a payment method to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Add Payment Method</CardTitle>
            <CardDescription>
              Enter your card details. All information is encrypted and processed securely by Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <AddCardForm onSuccess={() => {
                  setIsAddingCard(false);
                  setClientSecret(null);
                }} />
              </Elements>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
