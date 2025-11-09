import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Users, FileSignature, Mic, Camera, Heart, Coffee, MessageCircle, Film, Music, Utensils, Fingerprint, Stethoscope, Briefcase } from "lucide-react";

interface ConsentFlowState {
  universityId: string;
  universityName: string;
  encounterType: string;
  parties: string[];
  intimateActs: string[];
  method: "signature" | "voice" | "photo" | "biometric" | null;
}

const encounterTypes = [
  { id: "intimate", label: "Intimate Encounter", icon: Heart },
  { id: "date", label: "Date", icon: Coffee },
  { id: "social", label: "Social Gathering", icon: Users },
  { id: "conversation", label: "Private Conversation", icon: MessageCircle },
  { id: "medical", label: "Medical", icon: Stethoscope },
  { id: "professional", label: "Professional", icon: Briefcase },
];

const otherEncounterType = { id: "other", label: "Other", icon: Users };

const intimateActOptions = [
  "Touching/Caressing",
  "Kissing",
  "Oral Contact",
  "Manual Stimulation",
  "Use of Barrier Protection",
  "Penetrative Intercourse",
  "Photography/Video Recording",
  "Other Acts (Specify in Contract)",
];

const recordingMethods = [
  { 
    id: "signature" as const, 
    label: "Contract Signature", 
    icon: FileSignature,
    description: "Digital signatures on consent contract"
  },
  { 
    id: "voice" as const, 
    label: "Voice Recording", 
    icon: Mic,
    description: "Record verbal consent from both parties"
  },
  { 
    id: "photo" as const, 
    label: "Dual Selfie", 
    icon: Camera,
    description: "Upload a photo showing mutual agreement"
  },
  { 
    id: "biometric" as const, 
    label: "Authenticate with TouchID/FaceID", 
    icon: Fingerprint,
    description: "Cryptographic proof using device biometrics"
  },
];

export default function ConsentFlowPage() {
  const [, navigate] = useLocation();
  
  // Fetch current user data
  const { data: userData } = useQuery<{ user: { id: string; email: string; name: string | null } }>({
    queryKey: ["/api/auth/me"],
  });
  
  // Initialize state and step from URL parameters
  const [state, setState] = useState<ConsentFlowState>(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEncounterType = params.get("encounterType") || "";
    const urlParties = params.get("parties");
    const urlIntimateActs = params.get("intimateActs");
    const urlMethod = params.get("method") as "signature" | "voice" | "photo" | "biometric" | null;
    
    const parsedParties = urlParties ? JSON.parse(urlParties) : ["", ""];
    const parsedIntimateActs = urlIntimateActs ? JSON.parse(urlIntimateActs) : [];
    
    return {
      universityId: params.get("universityId") || "",
      universityName: params.get("universityName") || "",
      encounterType: urlEncounterType,
      parties: parsedParties,
      intimateActs: parsedIntimateActs,
      method: urlMethod,
    };
  });

  // Pre-fill first participant with logged-in user's name when available
  useEffect(() => {
    if (userData?.user?.name && state.parties[0] === "") {
      const newParties = [...state.parties];
      newParties[0] = userData.user.name;
      updateState({ parties: newParties });
    }
  }, [userData]);

  // Determine initial step based on state
  const getInitialStep = () => {
    if (state.method) return 4;
    if (state.intimateActs.length > 0) return 3;
    if (state.parties.some(p => p.trim() !== "")) return 2;
    if (state.encounterType) return 2;
    return 1;
  };

  const [step, setStep] = useState(getInitialStep());

  const updateState = (updates: Partial<ConsentFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const addParty = () => {
    updateState({ parties: [...state.parties, ""] });
  };

  const updateParty = (index: number, value: string) => {
    const newParties = [...state.parties];
    newParties[index] = value;
    updateState({ parties: newParties });
  };

  const removeParty = (index: number) => {
    const newParties = state.parties.filter((_, i) => i !== index);
    updateState({ parties: newParties.length === 0 ? [""] : newParties });
  };

  const toggleIntimateAct = (act: string) => {
    const newActs = state.intimateActs.includes(act)
      ? state.intimateActs.filter(a => a !== act)
      : [...state.intimateActs, act];
    updateState({ intimateActs: newActs });
  };

  const canProceedFromStep1 = state.encounterType !== "";
  const canProceedFromStep2 = state.parties.some(p => p.trim() !== "");
  const canProceedFromStep3 = true; // Can proceed even with no acts selected
  const canProceedFromStep4 = state.method !== null;

  const handleNext = () => {
    if (step === 1 && canProceedFromStep1) {
      setStep(2);
    } else if (step === 2 && canProceedFromStep2) {
      setStep(3);
    } else if (step === 3 && canProceedFromStep3) {
      setStep(4);
    } else if (step === 4 && canProceedFromStep4) {
      const filteredParties = state.parties.filter(p => p.trim() !== "");
      const params = new URLSearchParams({
        universityId: state.universityId,
        universityName: state.universityName,
        encounterType: state.encounterType,
        parties: JSON.stringify(filteredParties),
        intimateActs: JSON.stringify(state.intimateActs),
        method: state.method!,
      });
      
      if (state.method === "signature") {
        navigate(`/consent/signature?${params.toString()}`);
      } else if (state.method === "voice") {
        navigate(`/consent/voice?${params.toString()}`);
      } else if (state.method === "photo") {
        navigate(`/consent/photo?${params.toString()}`);
      } else if (state.method === "biometric") {
        navigate(`/consent/biometric?${params.toString()}`);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          data-testid="button-back"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Create Consent Contract</h1>
          <p className="text-sm text-muted-foreground">{state.universityName}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${
              s === step
                ? "w-8 bg-green-600 dark:bg-green-400"
                : s < step
                ? "w-2 bg-green-600/50 dark:bg-green-400/50"
                : "w-2 bg-muted"
            }`}
            data-testid={`progress-step-${s}`}
          />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step 1: Encounter Type</h2>
            <p className="text-sm text-muted-foreground">What kind of encounter is this consent for?</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {encounterTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${
                    state.encounterType === type.id
                      ? "border-green-600 dark:border-green-400 bg-green-600/5 dark:bg-green-400/5"
                      : ""
                  }`}
                  onClick={() => updateState({ encounterType: type.id })}
                  data-testid={`option-encounter-${type.id}`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <Icon className={`h-6 w-6 ${state.encounterType === type.id ? "text-green-600 dark:text-green-400" : ""}`} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                </Card>
              );
            })}
          </div>
          <Card
            className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${
              state.encounterType === otherEncounterType.id
                ? "border-green-600 dark:border-green-400 bg-green-600/5 dark:bg-green-400/5"
                : ""
            }`}
            onClick={() => updateState({ encounterType: otherEncounterType.id })}
            data-testid={`option-encounter-${otherEncounterType.id}`}
          >
            <div className="flex items-center justify-center gap-3">
              <otherEncounterType.icon className={`h-6 w-6 ${state.encounterType === otherEncounterType.id ? "text-green-600 dark:text-green-400" : ""}`} />
              <span className="text-sm font-medium">{otherEncounterType.label}</span>
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step 2: Parties Involved</h2>
            <p className="text-sm text-muted-foreground">
              Add the names of other participants (in addition to yourself)
            </p>
          </div>
          <div className="space-y-3">
            {state.parties.map((party, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={index === 0 ? "Your name (Participant 1)" : `Participant ${index + 1} name`}
                    value={party}
                    onChange={(e) => updateParty(index, e.target.value)}
                    data-testid={`input-party-${index}`}
                  />
                </div>
                {state.parties.length > 1 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeParty(index)}
                    data-testid={`button-remove-party-${index}`}
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addParty}
              className="w-full"
              data-testid="button-add-party"
            >
              + Add Another Participant
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step 3: Intimate Acts</h2>
            <p className="text-sm text-muted-foreground">Select which activities require documented consent (optional)</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {intimateActOptions.map((act) => (
              <Card
                key={act}
                className={`p-3 cursor-pointer hover-elevate active-elevate-2 transition-all ${
                  state.intimateActs.includes(act)
                    ? "border-green-600 dark:border-green-400 bg-green-600/5 dark:bg-green-400/5"
                    : ""
                }`}
                onClick={() => toggleIntimateAct(act)}
                data-testid={`option-act-${act}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    state.intimateActs.includes(act)
                      ? "border-green-600 dark:border-green-400 bg-green-600 dark:bg-green-400"
                      : "border-muted-foreground"
                  }`}>
                    {state.intimateActs.includes(act) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-medium leading-tight">{act}</span>
                </div>
              </Card>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full"
            data-testid="button-advanced"
          >
            Advanced Options
          </Button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step 4: Recording Method</h2>
            <p className="text-sm text-muted-foreground">How would you like to document consent?</p>
          </div>
          <div className="space-y-3">
            {recordingMethods.map((method) => {
              const Icon = method.icon;
              return (
                <Card
                  key={method.id}
                  className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${
                    state.method === method.id
                      ? "border-green-600 dark:border-green-400 bg-green-600/5 dark:bg-green-400/5"
                      : ""
                  }`}
                  onClick={() => updateState({ method: method.id })}
                  data-testid={`option-method-${method.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={`h-6 w-6 ${state.method === method.id ? "text-green-600 dark:text-green-400" : ""}`} />
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{method.label}</div>
                      <div className="text-xs text-muted-foreground">{method.description}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex-1"
          data-testid="button-back-footer"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={
            (step === 1 && !canProceedFromStep1) ||
            (step === 2 && !canProceedFromStep2) ||
            (step === 3 && !canProceedFromStep3) ||
            (step === 4 && !canProceedFromStep4)
          }
          className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-400 dark:hover:bg-green-500"
          data-testid="button-next"
        >
          {step === 4 ? "Continue" : "Next"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
