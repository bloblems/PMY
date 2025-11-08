import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import SignatureCanvas from "react-signature-canvas";
import { Download, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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

export default function ContractViewer() {
  const [showSignature, setShowSignature] = useState(false);
  const [signature1Complete, setSignature1Complete] = useState(false);
  const [signature2Complete, setSignature2Complete] = useState(false);
  const sig1Ref = useRef<SignatureCanvas>(null);
  const sig2Ref = useRef<SignatureCanvas>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: { contractText: string; signature1: string; signature2: string }) => {
      const response = await apiRequest("POST", "/api/contracts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contract saved",
        description: "The signed contract has been saved securely.",
      });
      // Reset form
      setShowSignature(false);
      setSignature1Complete(false);
      setSignature2Complete(false);
      sig1Ref.current?.clear();
      sig2Ref.current?.clear();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save contract. Please try again.",
        variant: "destructive",
      });
    },
  });

  const clearSignature1 = () => {
    sig1Ref.current?.clear();
    setSignature1Complete(false);
  };

  const clearSignature2 = () => {
    sig2Ref.current?.clear();
    setSignature2Complete(false);
  };

  const handleSignature1End = () => {
    if (sig1Ref.current && !sig1Ref.current.isEmpty()) {
      setSignature1Complete(true);
    }
  };

  const handleSignature2End = () => {
    if (sig2Ref.current && !sig2Ref.current.isEmpty()) {
      setSignature2Complete(true);
    }
  };

  const saveContract = () => {
    if (sig1Ref.current && sig2Ref.current) {
      const signature1 = sig1Ref.current.toDataURL();
      const signature2 = sig2Ref.current.toDataURL();

      saveMutation.mutate({
        contractText: CONTRACT_TEXT,
        signature1,
        signature2,
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
    <div className="space-y-6">
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Your Signature</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSignature1}
              data-testid="button-clear-signature-1"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          <div className="border-2 border-input rounded-lg bg-background">
            <SignatureCanvas
              ref={sig1Ref}
              canvasProps={{
                className: "w-full h-32 touch-none",
              }}
              onEnd={handleSignature1End}
            />
          </div>
          <div className="h-px bg-border" />
          <p className="text-xs text-muted-foreground text-center">Sign above</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Partner's Signature</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSignature2}
              data-testid="button-clear-signature-2"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
          <div className="border-2 border-input rounded-lg bg-background">
            <SignatureCanvas
              ref={sig2Ref}
              canvasProps={{
                className: "w-full h-32 touch-none",
              }}
              onEnd={handleSignature2End}
            />
          </div>
          <div className="h-px bg-border" />
          <p className="text-xs text-muted-foreground text-center">Sign above</p>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-2">
          Signed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </p>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setShowSignature(false)}
          className="flex-1"
          data-testid="button-back-to-contract"
        >
          Back
        </Button>
        <Button
          onClick={saveContract}
          disabled={!signature1Complete || !signature2Complete || saveMutation.isPending}
          className="flex-1"
          data-testid="button-save-contract"
        >
          <Download className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Complete & Save"}
        </Button>
      </div>
    </div>
  );
}
