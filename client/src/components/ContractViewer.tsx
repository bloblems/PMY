import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import SignatureInput from "@/components/SignatureInput";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CONTRACT_TEXT = `MUTUAL CONSENT AGREEMENT

This agreement is entered into on ${new Date().toLocaleDateString()} between the undersigned parties.

MUTUAL ACKNOWLEDGMENT OF CONSENT

Both parties hereby acknowledge and affirm that:

1. VOLUNTARY PARTICIPATION: Each party enters into this encounter freely and voluntarily, without coercion, duress, or undue influence of any kind.

2. CAPACITY: Each party confirms they are of legal age, possess the mental capacity to consent, and are not under the influence of any substance that would impair judgment or decision-making ability.

3. AFFIRMATIVE CONSENT: Each party provides clear, knowing, and voluntary consent to engage in the activities contemplated by this agreement. This consent is active and ongoing.

4. RIGHT TO WITHDRAW: Each party understands and acknowledges that consent may be withdrawn at any time, and such withdrawal will be immediately respected by the other party.

5. COMMUNICATION: Both parties agree to communicate openly and honestly throughout any encounter, ensuring mutual understanding and respect for boundaries.

6. UNDERSTANDING: Each party has read, understood, and agrees to the terms of this consent agreement.

By signing below, each party affirms their consent and understanding of the above terms.`;

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  savedSignature?: string;
  savedSignatureType?: "draw" | "type" | "upload";
  savedSignatureText?: string;
}

export default function ContractViewer() {
  const [showSignature, setShowSignature] = useState(false);
  const [signature1, setSignature1] = useState<string | null>(null);
  const [signature1Type, setSignature1Type] = useState<"draw" | "type" | "upload" | null>(null);
  const [signature1Text, setSignature1Text] = useState<string | null>(null);
  const [signature2, setSignature2] = useState<string | null>(null);
  const [signature2Type, setSignature2Type] = useState<"draw" | "type" | "upload" | null>(null);
  const [signature2Text, setSignature2Text] = useState<string | null>(null);
  const [shouldSaveSignature, setShouldSaveSignature] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<UserProfile>({
    queryKey: ["/api/auth/me"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { 
      contractText: string; 
      signature1: string; 
      signature2: string;
      shouldSave?: boolean;
      signatureType?: "draw" | "type" | "upload";
      signatureText?: string;
    }) => {
      const response = await apiRequest("POST", "/api/contracts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Contract saved",
        description: "The signed contract has been saved securely.",
      });
      // Reset form
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save contract. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setShowSignature(false);
    setShowPreview(false);
    setSignature1(null);
    setSignature1Type(null);
    setSignature1Text(null);
    setSignature2(null);
    setSignature2Type(null);
    setSignature2Text(null);
    setShouldSaveSignature(false);
  };

  const handleSignature1Complete = (sig: string, type: "draw" | "type" | "upload", text?: string) => {
    setSignature1(sig);
    setSignature1Type(type);
    setSignature1Text(text || null);
  };

  const handleSignature2Complete = (sig: string, type: "draw" | "type" | "upload", text?: string) => {
    setSignature2(sig);
    setSignature2Type(type);
    setSignature2Text(text || null);
  };

  const handlePreview = () => {
    if (!signature1 || !signature2) {
      toast({
        title: "Signatures required",
        description: "Both parties must sign before completing the contract.",
        variant: "destructive",
      });
      return;
    }
    setShowPreview(true);
  };

  const handleFinalSave = () => {
    if (signature1 && signature2) {
      saveMutation.mutate({
        contractText: CONTRACT_TEXT,
        signature1,
        signature2,
        shouldSave: shouldSaveSignature,
        signatureType: signature1Type || "draw",
        signatureText: signature1Text || undefined,
      });
    }
  };

  if (!showSignature) {
    return (
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <ScrollArea className="h-[400px]">
            <div className="p-6 font-serif text-sm leading-relaxed whitespace-pre-wrap">
              {CONTRACT_TEXT}
            </div>
          </ScrollArea>
        </Card>

        <Button
          onClick={() => setShowSignature(true)}
          className="w-full h-12"
          data-testid="button-proceed-to-sign"
        >
          Proceed to Sign
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </div>
            <h3 className="text-lg font-semibold">Your Signature</h3>
            {signature1 && (
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 ml-auto" data-testid="check-signature-1" />
            )}
          </div>
          <SignatureInput
            label=""
            onSignatureComplete={handleSignature1Complete}
            onClear={() => {
              setSignature1(null);
              setSignature1Type(null);
              setSignature1Text(null);
            }}
            savedSignature={user?.savedSignature}
            savedSignatureType={user?.savedSignatureType}
            savedSignatureText={user?.savedSignatureText}
            allowSave={true}
            onSavePreferenceChange={setShouldSaveSignature}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              2
            </div>
            <h3 className="text-lg font-semibold">Partner's Signature</h3>
            {signature2 && (
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 ml-auto" data-testid="check-signature-2" />
            )}
          </div>
          <SignatureInput
            label=""
            onSignatureComplete={handleSignature2Complete}
            onClear={() => {
              setSignature2(null);
              setSignature2Type(null);
              setSignature2Text(null);
            }}
            allowSave={false}
          />
        </div>

        <Card className="p-4 bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            Signed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={resetForm}
            className="flex-1"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePreview}
            disabled={!signature1 || !signature2}
            className="flex-1"
            data-testid="button-preview"
          >
            Preview & Save
          </Button>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Preview</DialogTitle>
            <DialogDescription>
              Review the signed contract before finalizing
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <ScrollArea className="h-[200px] border rounded-lg">
              <div className="p-4 font-serif text-sm leading-relaxed whitespace-pre-wrap">
                {CONTRACT_TEXT}
              </div>
            </ScrollArea>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Your Signature</p>
                <div className="border rounded-lg p-4 bg-background">
                  {signature1 && (
                    <img src={signature1} alt="Your signature" className="max-h-24 mx-auto" />
                  )}
                </div>
                {signature1Text && (
                  <p className="text-xs text-muted-foreground text-center">
                    Typed: {signature1Text}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Partner's Signature</p>
                <div className="border rounded-lg p-4 bg-background">
                  {signature2 && (
                    <img src={signature2} alt="Partner's signature" className="max-h-24 mx-auto" />
                  )}
                </div>
                {signature2Text && (
                  <p className="text-xs text-muted-foreground text-center">
                    Typed: {signature2Text}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Timestamp: {new Date().toLocaleString()}
              </p>
              {shouldSaveSignature && (
                <p className="text-xs text-muted-foreground mt-1">
                  ✓ Your signature will be saved for future use
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              data-testid="button-back-to-edit"
            >
              Back to Edit
            </Button>
            <Button
              onClick={handleFinalSave}
              disabled={saveMutation.isPending}
              data-testid="button-save-contract"
            >
              <Download className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Complete & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
