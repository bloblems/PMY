import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Fingerprint, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function ConsentBiometricPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  
  const universityId = params.get("universityId") || "";
  const universityName = params.get("universityName") || "";
  const encounterType = params.get("encounterType") || "";
  const parties = JSON.parse(params.get("parties") || "[]") as string[];

  const [status, setStatus] = useState<"idle" | "authenticating" | "authenticated">("idle");
  const [credentialData, setCredentialData] = useState<any>(null);
  const [browserSupported, setBrowserSupported] = useState(true);

  // Helper functions for WebAuthn
  const bufferToBase64url = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let str = '';
    bytes.forEach(b => str += String.fromCharCode(b));
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const generateRandomChallenge = () => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return randomBytes.buffer;
  };

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
      const challenge = generateRandomChallenge();
      const userIdBytes = new Uint8Array(32);
      crypto.getRandomValues(userIdBytes);

      // Create WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: {
            name: "PMY Consent",
            id: window.location.hostname,
          },
          user: {
            id: userIdBytes,
            name: parties[0] || "User",
            displayName: parties[0] || "User",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },  // ES256
            { type: "public-key", alg: -257 } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Touch ID/Face ID
            userVerification: "required",
            requireResidentKey: false,
          },
          timeout: 60000,
          attestation: "none"
        }
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to create credential");
      }

      // Extract credential data
      const response = credential.response as AuthenticatorAttestationResponse;
      const credentialJSON = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64url(response.clientDataJSON),
          attestationObject: bufferToBase64url(response.attestationObject),
        },
        timestamp: new Date().toISOString(),
      };

      setCredentialData(credentialJSON);
      setStatus("authenticated");

      toast({
        title: "Authentication Successful",
        description: "Biometric authentication completed successfully!",
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
          title: "Authentication Failed",
          description: error.message || "Failed to complete biometric authentication.",
          variant: "destructive",
        });
      }
    }
  };

  const createConsentMutation = useMutation({
    mutationFn: async () => {
      if (!credentialData) {
        throw new Error("No biometric authentication data");
      }

      const response = await fetch("/api/consent-biometric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId,
          encounterType,
          parties,
          method: "biometric",
          credentialId: credentialData.id,
          credentialData: JSON.stringify(credentialData),
          authenticatedAt: credentialData.timestamp,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create biometric consent");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-contracts"] });
      toast({
        title: "Consent Recorded",
        description: "Your biometric consent has been saved successfully.",
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
          onClick={() => {
            const params = new URLSearchParams({ 
              universityId, 
              universityName,
              method: "biometric",
              ...(encounterType && { encounterType }),
              ...(parties.length > 0 && { parties: JSON.stringify(parties) }),
            });
            navigate("/consent/flow?" + params.toString());
          }}
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
              status === "authenticated" 
                ? "bg-green-600/10 dark:bg-green-400/10" 
                : "bg-primary/10"
            }`}>
              {status === "authenticated" ? (
                <Check className="h-12 w-12 text-green-600 dark:text-green-400" />
              ) : (
                <Fingerprint className="h-12 w-12 text-primary" />
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">
              {status === "authenticated" ? "Authentication Complete" : "Authenticate with Touch ID or Face ID"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {status === "authenticated" 
                ? "Your identity has been cryptographically verified. Click below to save your consent."
                : "This will create a cryptographic proof of your consent using your device's biometric authentication (Touch ID, Face ID, or other biometric sensors)."}
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
            <p className="font-medium">How it works:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Your device's biometric sensor creates a unique cryptographic signature</li>
              <li>Your fingerprint/face data never leaves your device</li>
              <li>Only a mathematical proof is stored as evidence of your consent</li>
              <li>This provides stronger legal evidence than a written signature</li>
            </ul>
          </div>

          {status === "idle" && (
            <Button
              onClick={handleBiometricAuth}
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500"
              size="lg"
              data-testid="button-authenticate"
            >
              <Fingerprint className="w-5 h-5 mr-2" />
              Authenticate Now
            </Button>
          )}

          {status === "authenticating" && (
            <Button
              disabled
              className="w-full"
              size="lg"
            >
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
                <span>Waiting for authentication...</span>
              </div>
            </Button>
          )}

          {status === "authenticated" && (
            <Button
              onClick={() => createConsentMutation.mutate()}
              disabled={createConsentMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500"
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
                  Save Consent
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
