import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Fingerprint, Check, AlertCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { startRegistration } from "@simplewebauthn/browser";
import { useConsentFlow } from "@/contexts/ConsentFlowContext";

export default function ConsentBiometricPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { state, hasRequiredData, isHydrated } = useConsentFlow();
  
  // Defensive routing: redirect if required state is missing (after hydration)
  useEffect(() => {
    if (isHydrated && !hasRequiredData()) {
      toast({
        title: "Missing Information",
        description: "Please complete the consent flow from the beginning.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isHydrated, hasRequiredData, navigate, toast]);
  
  const { universityId, universityName, encounterType, parties, intimateActs } = state;

  const [status, setStatus] = useState<"idle" | "authenticating" | "verifying" | "verified">("idle");
  const [verifiedCredential, setVerifiedCredential] = useState<any>(null);
  const [browserSupported, setBrowserSupported] = useState(true);

  const handleBiometricAuth = async () => {
    // Check browser support
    if (!window.PublicKeyCredential) {
      setBrowserSupported(false);
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support biometric authentication. Please use Safari 14+ on iOS or Chrome on Android.",
        variant: "destructive",
      });
      return;
    }

    setStatus("authenticating");

    try {
      // Step 1: Request challenge from server
      const challengeResponse = await fetch("/api/webauthn/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: parties[0] || "User",
        }),
      });

      if (!challengeResponse.ok) {
        throw new Error("Failed to get authentication challenge");
      }

      const { sessionId, options } = await challengeResponse.json();

      // Step 2: Perform WebAuthn ceremony with server challenge
      const attestationResponse = await startRegistration(options);

      setStatus("verifying");

      // Step 3: Send attestation to server for verification
      const verificationResponse = await fetch("/api/webauthn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          attestationResponse,
        }),
      });

      if (!verificationResponse.ok) {
        const error = await verificationResponse.json();
        throw new Error(error.error || "Verification failed");
      }

      const verificationResult = await verificationResponse.json();

      if (!verificationResult.verified) {
        throw new Error("Biometric verification failed");
      }

      // Step 4: Store verified credential data
      setVerifiedCredential(verificationResult);
      setStatus("verified");

      toast({
        title: "Verification Successful",
        description: "Your biometric authentication has been cryptographically verified by the server.",
      });

    } catch (error: any) {
      setStatus("idle");
      
      if (error.name === 'NotAllowedError') {
        toast({
          title: "Authentication Cancelled",
          description: "You cancelled the biometric authentication.",
          variant: "destructive",
        });
      } else if (error.name === 'NotSupportedError') {
        toast({
          title: "Not Supported",
          description: "Biometric authentication is not available on this device.",
          variant: "destructive",
        });
      } else {
        console.error("WebAuthn error:", error);
        toast({
          title: "Verification Failed",
          description: error.message || "Failed to verify biometric authentication.",
          variant: "destructive",
        });
      }
    }
  };

  const createConsentMutation = useMutation({
    mutationFn: async () => {
      if (!verifiedCredential) {
        throw new Error("No verified biometric data");
      }

      const response = await apiRequest("POST", "/api/consent-biometric", {
        universityId: universityId || null,
        encounterType,
        parties,
        credentialId: verifiedCredential.credentialId,
        credentialPublicKey: verifiedCredential.publicKey,
        credentialCounter: verifiedCredential.counter?.toString(),
        credentialDeviceType: verifiedCredential.credentialDeviceType,
        credentialBackedUp: verifiedCredential.credentialBackedUp?.toString(),
      });

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Consent Recorded",
        description: "Your cryptographically verified biometric consent has been saved successfully.",
      });
      navigate("/files");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save biometric consent.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Biometric Authentication</h1>
          <p className="text-sm text-muted-foreground">{universityName}</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className={`rounded-full p-4 ${
              status === "verified" 
                ? "bg-success/10" 
                : "bg-primary/10"
            }`}>
              {status === "verified" ? (
                <Shield className="h-12 w-12 text-success" />
              ) : (
                <Fingerprint className="h-12 w-12 text-primary" />
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">
              {status === "verified" ? "Verification Complete" : 
               status === "verifying" ? "Verifying..." :
               status === "authenticating" ? "Authenticating..." :
               "Authenticate with Touch ID or Face ID"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {status === "verified" 
                ? "Your identity has been cryptographically verified by the server. Click below to save your consent."
                : status === "verifying"
                ? "The server is verifying your biometric authentication..."
                : status === "authenticating"
                ? "Complete the biometric authentication on your device..."
                : "This creates a cryptographically secure proof of consent using your device's biometric sensor and server verification."}
            </p>
          </div>

          {!browserSupported && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-destructive">Browser Not Supported</p>
                  <p className="text-muted-foreground mt-1">
                    Please use Safari 14+ on iPhone/iPad, Chrome on Android, or a desktop browser that supports WebAuthn.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-muted p-4 rounded-lg text-xs text-left space-y-2">
            <p className="font-medium">Secure WebAuthn Flow:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Server generates cryptographic challenge</li>
              <li>Your device creates unique credential with Touch ID/Face ID</li>
              <li>Server verifies the attestation cryptographically</li>
              <li>Verified public key is stored as proof of consent</li>
              <li>Your biometric data never leaves your device</li>
            </ul>
          </div>

          {status === "idle" && (
            <Button
              onClick={handleBiometricAuth}
              className="w-full bg-success hover:bg-success/90"
              size="lg"
              data-testid="button-authenticate"
            >
              <Fingerprint className="w-5 h-5 mr-2" />
              Authenticate Now
            </Button>
          )}

          {(status === "authenticating" || status === "verifying") && (
            <Button
              disabled
              className="w-full"
              size="lg"
            >
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                <span>
                  {status === "authenticating" ? "Waiting for authentication..." : "Verifying with server..."}
                </span>
              </div>
            </Button>
          )}

          {status === "verified" && (
            <Button
              onClick={() => createConsentMutation.mutate()}
              disabled={createConsentMutation.isPending}
              className="w-full bg-success hover:bg-success/90"
              size="lg"
              data-testid="button-save-consent"
            >
              {createConsentMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                  <span>Saving...</span>
                </div>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Save Verified Consent
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      <Card className="p-4 bg-muted">
        <div className="text-xs space-y-2">
          <p className="font-medium">Parties Involved:</p>
          <ul className="list-disc list-inside text-muted-foreground">
            {parties.map((party, i) => (
              <li key={i}>{party}</li>
            ))}
          </ul>
          <p className="font-medium mt-3">Encounter Type:</p>
          <p className="text-muted-foreground capitalize">{encounterType}</p>
        </div>
      </Card>
    </div>
  );
}
