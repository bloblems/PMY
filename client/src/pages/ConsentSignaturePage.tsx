import { useState, useRef, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import SignatureCanvas from "react-signature-canvas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Check, FileSignature } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface University {
  id: string;
  name: string;
  state: string;
  titleIXInfo: string;
  titleIXUrl: string | null;
}

export default function ConsentSignaturePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(window.location.search);
  
  const universityId = params.get("universityId") || "";
  const universityName = params.get("universityName") || "";
  const encounterType = params.get("encounterType") || "";
  const parties = JSON.parse(params.get("parties") || "[]") as string[];

  const { data: university } = useQuery<University>({
    queryKey: ["/api/universities", universityId],
    enabled: !!universityId,
  });

  const [party1Name, setParty1Name] = useState("");
  const [party2Name, setParty2Name] = useState(parties[0] || "");
  const [currentSigner, setCurrentSigner] = useState<1 | 2>(1);
  const [signature1, setSignature1] = useState<string | null>(null);
  const [signature2, setSignature2] = useState<string | null>(null);
  
  const sigCanvas = useRef<SignatureCanvas>(null);

  const generateContractText = () => {
    if (!university) return "";

    const encounterLabel = encounterType.charAt(0).toUpperCase() + encounterType.slice(1);
    const date = new Date().toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });

    const policyExcerpt = university.titleIXInfo.length > 200 
      ? university.titleIXInfo.substring(0, 200) + "..." 
      : university.titleIXInfo;

    return `TITLE IX CONSENT AGREEMENT

This agreement is made on ${date} between the parties named below.

PARTIES INVOLVED:
Party 1: ${party1Name || "[Name Required]"}
Party 2: ${party2Name || "[Name Required]"}

ENCOUNTER TYPE: ${encounterLabel}

INSTITUTION: ${university.name}

CONSENT STATEMENT:
The undersigned parties affirm that they have reviewed and understand the Title IX policies of ${university.name}, which state:

"${policyExcerpt}"

Both parties hereby affirm that:
1. They are willingly and voluntarily entering into this ${encounterType} encounter
2. They understand that consent must be clear, knowing, and voluntary
3. They acknowledge that consent is active, not passive, and can be withdrawn at any time
4. They are capable of giving consent and are not under the influence of incapacitating substances
5. They agree to respect each other's boundaries and communicate clearly throughout

This document serves as evidence of mutual consent at the time of signing. Both parties understand that consent is ongoing and can be revoked at any time.

SIGNATURES:
The digital signatures below indicate that both parties have read, understood, and agreed to the terms outlined in this consent agreement in accordance with Title IX requirements.`;
  };

  const contractText = useMemo(() => generateContractText(), [university, party1Name, party2Name, encounterType]);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const saveSignature = () => {
    if (sigCanvas.current?.isEmpty()) {
      toast({
        title: "Signature Required",
        description: "Please provide a signature before continuing.",
        variant: "destructive",
      });
      return;
    }

    const dataUrl = sigCanvas.current?.toDataURL();
    if (currentSigner === 1) {
      setSignature1(dataUrl || null);
      setCurrentSigner(2);
      clearSignature();
      toast({
        title: "Signature Saved",
        description: "Now waiting for the second party to sign.",
      });
    } else {
      setSignature2(dataUrl || null);
      toast({
        title: "Second Signature Saved",
        description: "Both signatures collected. Ready to submit.",
      });
    }
  };

  const createContractMutation = useMutation({
    mutationFn: async () => {
      if (!signature1 || !signature2 || !party1Name || !party2Name) {
        throw new Error("All fields required");
      }

      const response = await fetch("/api/consent-contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId,
          encounterType,
          parties,
          method: "signature",
          contractText,
          signature1,
          signature2,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create contract");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consent-contracts"] });
      toast({
        title: "Contract Created",
        description: "Your consent contract has been saved successfully.",
      });
      navigate("/files");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create contract",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!party1Name || !party2Name) {
      toast({
        title: "Names Required",
        description: "Please enter names for both parties.",
        variant: "destructive",
      });
      return;
    }

    if (!signature1 || !signature2) {
      toast({
        title: "Signatures Required",
        description: "Both parties must sign the contract.",
        variant: "destructive",
      });
      return;
    }

    createContractMutation.mutate();
  };

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
              method: "signature",
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
          <h1 className="text-2xl font-bold tracking-tight">Contract Signature</h1>
          <p className="text-sm text-muted-foreground">{universityName}</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="party1">Party 1 Name (You)</Label>
            <Input
              id="party1"
              value={party1Name}
              onChange={(e) => setParty1Name(e.target.value)}
              placeholder="Enter your full name"
              disabled={currentSigner !== 1 || !!signature1}
              data-testid="input-party1-name"
            />
          </div>
          <div>
            <Label htmlFor="party2">Party 2 Name</Label>
            <Input
              id="party2"
              value={party2Name}
              onChange={(e) => setParty2Name(e.target.value)}
              placeholder="Enter full name"
              disabled={currentSigner !== 1 || !!signature1}
              data-testid="input-party2-name"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Consent Contract</h2>
          </div>
          <div className="bg-muted p-4 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
            {contractText}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {currentSigner === 1 ? "Party 1 Signature" : "Party 2 Signature"}
            </h3>
            {currentSigner === 1 && signature1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSignature1(null);
                  setCurrentSigner(1);
                }}
                data-testid="button-edit-signature1"
              >
                Edit
              </Button>
            )}
            {currentSigner === 2 && signature2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSignature2(null);
                }}
                data-testid="button-edit-signature2"
              >
                Edit
              </Button>
            )}
          </div>

          {currentSigner === 1 && signature1 ? (
            <div className="border-2 border-green-600 dark:border-green-400 rounded-lg p-4 bg-green-600/5 dark:bg-green-400/5">
              <img src={signature1} alt="Party 1 signature" className="max-h-32 mx-auto" />
              <p className="text-sm text-center text-green-600 dark:text-green-400 mt-2 font-medium">
                <Check className="w-4 h-4 inline mr-1" />
                Signature Saved
              </p>
            </div>
          ) : currentSigner === 2 && signature2 ? (
            <div className="border-2 border-green-600 dark:border-green-400 rounded-lg p-4 bg-green-600/5 dark:bg-green-400/5">
              <img src={signature2} alt="Party 2 signature" className="max-h-32 mx-auto" />
              <p className="text-sm text-center text-green-600 dark:text-green-400 mt-2 font-medium">
                <Check className="w-4 h-4 inline mr-1" />
                Signature Saved
              </p>
            </div>
          ) : (
            <>
              <div className="border-2 border-dashed rounded-lg bg-card" data-testid={`canvas-signature-${currentSigner}`}>
                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{
                    className: "w-full h-48 cursor-crosshair",
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={clearSignature}
                  className="flex-1"
                  data-testid="button-clear-signature"
                >
                  Clear
                </Button>
                <Button
                  onClick={saveSignature}
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500"
                  data-testid="button-save-signature"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Save Signature
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      {signature1 && signature2 && (
        <Card className="p-4 bg-muted">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">Both signatures collected</p>
              <p className="text-muted-foreground">Ready to create contract</p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={createContractMutation.isPending}
              className="bg-green-600 hover:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500"
              data-testid="button-create-contract"
            >
              {createContractMutation.isPending ? "Creating..." : "Create Contract"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
