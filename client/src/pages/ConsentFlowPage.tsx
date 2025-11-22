import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useConsentFlow, type ConsentFlowState } from "@/contexts/ConsentFlowContext";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Users, FileSignature, Mic, Camera, Heart, Coffee, MessageCircle, Film, Music, Utensils, Fingerprint, Stethoscope, Briefcase, Save, Share2, AtSign, Mail, LogIn, UserPlus } from "lucide-react";
import UniversitySelector from "@/components/UniversitySelector";
import UniversityPolicyPreview from "@/components/UniversityPolicyPreview";
import ContractDurationStep from "@/components/ContractDurationStep";
import { UserSearch } from "@/components/UserSearch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { featureFlags } from "@/lib/featureFlags";

type University = {
  id: string;
  name: string;
  state: string;
  titleIXInfo: string;
  titleIXUrl: string | null;
  lastUpdated: string;
  verifiedAt: string | null;
};

interface UserContact {
  id: string;
  userId: string;
  contactUsername: string;
  nickname: string | null;
  createdAt: string;
}

const intimateEncounterType = { id: "intimate", label: "Intimate Encounter", icon: Heart };

const encounterTypes = [
  { id: "date", label: "Date", icon: Coffee },
  { id: "conversation", label: "Textual Matter", icon: MessageCircle },
  { id: "medical", label: "Medical", icon: Stethoscope },
  { id: "professional", label: "Professional", icon: Briefcase },
];

const otherEncounterType = { id: "other", label: "Other", icon: Users };

// Define which encounter types require university selection
const encounterTypesRequiringUniversity = ["intimate", "date"];

const doesEncounterTypeRequireUniversity = (encounterType: string): boolean => {
  return encounterTypesRequiringUniversity.includes(encounterType);
};

const intimateActOptions = [
  "Touching/Caressing",
  "Kissing",
  "Manual Stimulation",
  "Oral Stimulation",
  "Oral Intercourse",
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
  const [location, navigate] = useLocation();
  const { state, updateState: updateFlowState } = useConsentFlow();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  
  // Share dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareMode, setShareMode] = useState<"pmy-user" | "email">("pmy-user");
  const [shareEmail, setShareEmail] = useState("");
  const [selectedPmyUser, setSelectedPmyUser] = useState<{
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  } | null>(null);
  
  // Fetch universities
  const { data: universities = [] } = useQuery<University[]>({
    queryKey: ["/api/universities"],
  });
  
  // Fetch current user data
  const { data: userData } = useQuery<{ 
    user: { id: string; email: string; name: string | null }; 
    profile?: { username?: string } 
  }>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch user saved contacts
  const { data: contacts = [] } = useQuery<UserContact[]>({
    queryKey: ["/api/profile/contacts"],
    enabled: !!user,
  });

  // Load draft for resume editing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resumeDraftId = params.get('resumeDraftId');
    
    if (resumeDraftId) {
      // Fetch the draft and load it into the consent flow context
      fetch(`/api/contracts/${resumeDraftId}`)
        .then(res => res.json())
        .then(draft => {
          // Parse intimateActs from JSON string if needed
          let parsedIntimateActs = {};
          if (typeof draft.intimateActs === 'string') {
            try {
              parsedIntimateActs = JSON.parse(draft.intimateActs);
            } catch (e) {
              console.error('Failed to parse intimateActs:', e);
            }
          } else if (draft.intimateActs) {
            parsedIntimateActs = draft.intimateActs;
          }
          
          // Normalize parties to canonical @username format
          const normalizedParties = (draft.parties || ["", ""]).map((party: string) => {
            const trimmed = party.trim();
            if (!trimmed) return "";
            // If it doesn't start with @, prepend it
            return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
          });

          // Load draft data into consent flow state with full fidelity
          updateFlowState({
            draftId: draft.id,
            universityId: draft.universityId || "",
            universityName: draft.universityName || "",
            encounterType: draft.encounterType || "",
            parties: normalizedParties,
            intimateActs: parsedIntimateActs,
            contractStartTime: draft.contractStartTime || undefined,
            contractDuration: draft.contractDuration || undefined,
            contractEndTime: draft.contractEndTime || undefined,
            method: draft.method || null,
            isCollaborative: draft.isCollaborative === "true",
            contractText: draft.contractText || undefined,
            // Method-specific fields for full draft fidelity
            signature1: draft.signature1 || undefined,
            signature2: draft.signature2 || undefined,
            photoUrl: draft.photoUrl || undefined,
            credentialId: draft.credentialId || undefined,
            credentialPublicKey: draft.credentialPublicKey || undefined,
            credentialCounter: draft.credentialCounter || undefined,
            credentialDeviceType: draft.credentialDeviceType || undefined,
            credentialBackedUp: draft.credentialBackedUp || undefined,
            authenticatedAt: draft.authenticatedAt || undefined,
          });
          
          // Clear the query param from URL
          params.delete('resumeDraftId');
          const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
          window.history.replaceState({}, '', newUrl);
        })
        .catch(err => {
          console.error('Failed to load draft:', err);
          toast({
            title: "Error",
            description: "Failed to load draft for editing",
            variant: "destructive",
          });
        });
    }
  }, []);

  // Save as draft mutation
  const saveAsDraftMutation = useMutation({
    mutationFn: async () => {
      // Check if draft is collaborative - can't save collaborative drafts
      if (state.isCollaborative) {
        throw new Error("Cannot save changes to a collaborative draft. It is in the approval workflow.");
      }
      
      const draftData = {
        contractText: state.contractText || `Consent Contract\n\nEncounter Type: ${state.encounterType}\nParties: ${state.parties.filter(p => p.trim()).join(", ")}\nIntimate Acts: ${Object.keys(state.intimateActs).join(", ")}\nUniversity: ${state.universityName || "N/A"}\n`,
        universityId: state.universityId || null,
        encounterType: state.encounterType,
        parties: state.parties.filter(p => p.trim()),
        intimateActs: state.intimateActs,
        contractStartTime: state.contractStartTime || null,
        contractDuration: state.contractDuration || null,
        contractEndTime: state.contractEndTime || null,
        method: state.method,
        status: "draft",
        isCollaborative: false,
        // Method-specific fields for full draft fidelity
        signature1: state.signature1 || null,
        signature2: state.signature2 || null,
        photoUrl: state.photoUrl || null,
        credentialId: state.credentialId || null,
        credentialPublicKey: state.credentialPublicKey || null,
        credentialCounter: state.credentialCounter || null,
        credentialDeviceType: state.credentialDeviceType || null,
        credentialBackedUp: state.credentialBackedUp || null,
        authenticatedAt: state.authenticatedAt || null,
      };
      
      let response;
      if (state.draftId && !state.isCollaborative) {
        // Update existing non-collaborative draft
        response = await apiRequest("PATCH", `/api/contracts/draft/${state.draftId}`, draftData);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Failed to update draft (${response.status})`);
        }
      } else {
        // Create new draft
        response = await apiRequest("POST", "/api/contracts/draft", draftData);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Failed to create draft (${response.status})`);
        }
      }
      
      return response.json();
    },
    onSuccess: (draft) => {
      // Store draft ID for future updates
      updateFlowState({ draftId: draft.id });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/drafts"] });
      toast({
        title: "Draft saved",
        description: "Your consent contract has been saved as a draft",
      });
      navigate("/files?tab=drafts");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save draft",
        variant: "destructive",
      });
    },
  });

  // Share contract mutation
  const shareContractMutation = useMutation({
    mutationFn: async (email: string) => {
      const draftData = {
        contractText: state.contractText || `Consent Contract\n\nEncounter Type: ${state.encounterType}\nParties: ${state.parties.filter(p => p.trim()).join(", ")}\nIntimate Acts: ${Object.keys(state.intimateActs).join(", ")}\nUniversity: ${state.universityName || "N/A"}\n`,
        universityId: state.universityId || null,
        encounterType: state.encounterType,
        parties: state.parties.filter(p => p.trim()),
        intimateActs: state.intimateActs,
        contractStartTime: state.contractStartTime || null,
        contractDuration: state.contractDuration || null,
        contractEndTime: state.contractEndTime || null,
        method: state.method,
        status: "draft",
        // Keep isCollaborative=false for PATCH (backend will set to true on share)
        isCollaborative: false,
        // Method-specific fields for full draft fidelity
        signature1: state.signature1 || null,
        signature2: state.signature2 || null,
        photoUrl: state.photoUrl || null,
        credentialId: state.credentialId || null,
        credentialPublicKey: state.credentialPublicKey || null,
        credentialCounter: state.credentialCounter || null,
        credentialDeviceType: state.credentialDeviceType || null,
        credentialBackedUp: state.credentialBackedUp || null,
        authenticatedAt: state.authenticatedAt || null,
      };
      
      let draftId;
      if (state.draftId && !state.isCollaborative) {
        // Update existing non-collaborative draft with latest form data before sharing
        const updateResponse = await apiRequest("PATCH", `/api/contracts/draft/${state.draftId}`, draftData);
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(errorText || `Failed to update draft before sharing (${updateResponse.status})`);
        }
        const updated = await updateResponse.json();
        draftId = updated.id;
      } else if (state.draftId && state.isCollaborative) {
        // Draft is already collaborative, cannot update it - just re-share
        draftId = state.draftId;
      } else {
        // Create new draft (will be made collaborative by share endpoint)
        const createResponse = await apiRequest("POST", "/api/contracts/draft", draftData);
        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          throw new Error(errorText || `Failed to create draft (${createResponse.status})`);
        }
        const created = await createResponse.json();
        draftId = created.id;
      }
      
      // Share the draft (backend sets isCollaborative=true and creates invitation)
      const shareResponse = await apiRequest("POST", `/api/contracts/${draftId}/share`, {
        recipientEmail: email,
      });
      if (!shareResponse.ok) {
        const errorText = await shareResponse.text();
        throw new Error(errorText || `Failed to share contract (${shareResponse.status})`);
      }
      return shareResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/drafts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts/invitations"] });
      setShowShareDialog(false);
      setShareEmail("");
      toast({
        title: "Contract shared",
        description: `Invitation sent to ${shareEmail}`,
      });
      
      // Clear draft ID to prevent reuse in new flows
      updateFlowState({ draftId: undefined });
      
      navigate("/files?tab=drafts");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share contract",
        variant: "destructive",
      });
    },
  });

  // Track selected university object for the selector
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  
  // Track whether user selected "Not Applicable" for university
  const [universityNotApplicable, setUniversityNotApplicable] = useState(false);

  // Validate if consent flow has minimum required data for saving/sharing
  const canSaveOrShare = () => {
    // Must have encounter type
    if (!state.encounterType || state.encounterType.trim() === "") {
      return false;
    }
    
    // Must have at least one party name
    const hasParties = state.parties.some(p => p.trim() !== "");
    if (!hasParties) {
      return false;
    }
    
    // Must have selected a method (at final step)
    if (!state.method) {
      return false;
    }
    
    return true;
  };

  // Sync selectedUniversity when universities load or state.universityId changes
  // Only sync if encounter type requires university AND universityId exists in state
  useEffect(() => {
    if (universities.length > 0 && doesEncounterTypeRequireUniversity(state.encounterType) && state.universityId) {
      // If there's a university ID in state, find and select it
      const university = universities.find(u => u.id === state.universityId);
      if (university) {
        setSelectedUniversity(university);
      } else {
        // Invalid universityId - clear it
        setSelectedUniversity(null);
        updateFlowState({
          universityId: "",
          universityName: "",
        });
      }
    }
  }, [universities, state.universityId, state.encounterType]);

  // Update state when university is manually selected
  useEffect(() => {
    if (selectedUniversity && selectedUniversity.id !== state.universityId) {
      updateFlowState({
        universityId: selectedUniversity.id,
        universityName: selectedUniversity.name,
      });
    }
  }, [selectedUniversity]);

  // Pre-fill first participant with logged-in user's name when available
  useEffect(() => {
    if (userData?.profile?.username && state.parties[0] === "") {
      const newParties = [...state.parties];
      newParties[0] = `@${userData.profile.username}`;
      updateFlowState({ parties: newParties });
    }
  }, [userData]);

  // Get dynamic step configuration based on encounter type
  const getFlowSteps = () => {
    const requiresUniversity = doesEncounterTypeRequireUniversity(state.encounterType);
    
    if (requiresUniversity) {
      return {
        encounterType: 1,
        university: 2,
        parties: 3,
        intimateActs: 4,
        duration: 5,
        recordingMethod: 6,
        totalSteps: 6,
      };
    } else {
      return {
        encounterType: 1,
        university: null, // Skip university step
        parties: 2,
        intimateActs: 3,
        duration: 4,
        recordingMethod: 5,
        totalSteps: 5,
      };
    }
  };

  const flowSteps = getFlowSteps();

  // Determine initial step based on state
  const getInitialStep = (fromState: ConsentFlowState) => {
    // For fresh loads without encounter type, always start at step 1
    if (!fromState.encounterType) {
      return 1;
    }
    
    // Calculate steps based on encounter type
    const requiresUniversity = doesEncounterTypeRequireUniversity(fromState.encounterType);
    const steps = requiresUniversity
      ? { encounterType: 1, university: 2, parties: 3, intimateActs: 4, duration: 5, recordingMethod: 6, totalSteps: 6 }
      : { encounterType: 1, university: null, parties: 2, intimateActs: 3, duration: 4, recordingMethod: 5, totalSteps: 5 };
    
    // Work backwards from most complete state to least complete
    // If something is SET, it means we've COMPLETED that step, so return the NEXT step
    if (fromState.method) return steps.recordingMethod; // User has selected method, show recordingMethod step
    if (fromState.contractStartTime || fromState.contractDuration || fromState.contractEndTime) return steps.recordingMethod; // Duration completed, move to recording method
    if (Object.keys(fromState.intimateActs).length > 0) return steps.duration; // Intimate acts completed, move to duration
    if (fromState.parties.some((p: string) => p.trim() !== "")) return steps.intimateActs; // Parties completed, move to intimate acts
    
    // If university is set, we've completed that step, move to parties
    if (fromState.universityId && steps.university) return steps.parties;
    
    // If encounter type is set but nothing else, determine next step
    if (fromState.encounterType) {
      // If this encounter type requires university, go to university step
      // Otherwise go to parties step
      return steps.university || steps.parties;
    }
    
    return 1; // Default to encounter type step
  };

  const [step, setStep] = useState(() => {
    const initialStep = getInitialStep(state);
    console.log('[ConsentFlow] Initializing step:', initialStep, 'flowSteps:', getFlowSteps());
    return initialStep;
  });

  // Handle encounter type changes (must be after step state declaration)
  const prevEncounterTypeRef = useRef(state.encounterType);
  useEffect(() => {
    // Only run when encounter type actually changes (not on initial mount or during selection)
    // Don't auto-advance if we're still on step 1 (encounter type selection)
    if (prevEncounterTypeRef.current && 
        prevEncounterTypeRef.current !== state.encounterType && 
        step !== 1) {
      const newFlowSteps = getFlowSteps();
      
      // Clear all flow state when encounter type changes to ensure clean slate
      updateFlowState({
        universityId: "",
        universityName: "",
        parties: ["", ""],
        intimateActs: {},
      });
      setSelectedUniversity(null);
      
      // Reset to next appropriate step after encounter type
      // This prevents numeric step mismatch between 4-step and 5-step flows
      setStep(newFlowSteps.university || newFlowSteps.parties);
    }
    
    // Update ref for next comparison
    prevEncounterTypeRef.current = state.encounterType;
  }, [state.encounterType, step]);

  const addParty = () => {
    updateFlowState({ parties: [...state.parties, ""] });
  };

  const updateParty = (index: number, value: string) => {
    const newParties = [...state.parties];
    // Normalize to canonical @username format if user enters text
    // Allow @ to be optional during typing, but store with @ prefix
    const trimmedValue = value.trim();
    if (trimmedValue && !trimmedValue.startsWith('@')) {
      newParties[index] = `@${trimmedValue}`;
    } else {
      newParties[index] = trimmedValue;
    }
    updateFlowState({ parties: newParties });
  };

  const removeParty = (index: number) => {
    const newParties = state.parties.filter((_, i) => i !== index);
    updateFlowState({ parties: newParties.length === 0 ? [""] : newParties });
  };

  const addContactAsParty = (contact: UserContact) => {
    // Use canonical username with @ prefix for reliable collaborator matching
    const canonicalUsername = `@${contact.contactUsername}`;
    const displayName = contact.nickname || contact.contactUsername;
    
    // Check if contact already exists in parties list (case-insensitive)
    const alreadyExists = state.parties.some(party => 
      party.toLowerCase() === canonicalUsername.toLowerCase()
    );
    
    if (alreadyExists) {
      toast({
        title: "Contact already added",
        description: `${displayName} is already in the parties list.`,
        variant: "destructive",
      });
      return;
    }
    
    // Find the first empty party slot (excluding index 0 which is user's username)
    const emptyIndex = state.parties.findIndex((party, index) => index > 0 && party.trim() === "");
    
    if (emptyIndex !== -1) {
      // Fill empty slot
      const newParties = [...state.parties];
      newParties[emptyIndex] = canonicalUsername;
      updateFlowState({ parties: newParties });
    } else {
      // Add new party
      updateFlowState({ parties: [...state.parties, canonicalUsername] });
    }
    
    toast({
      title: "Contact added",
      description: `${displayName} has been added to the parties list.`,
    });
  };

  const toggleIntimateAct = (act: string) => {
    const currentState = state.intimateActs[act];
    const newActs = { ...state.intimateActs };
    
    // Cycle through: unselected → yes → no → unselected
    if (!currentState) {
      newActs[act] = "yes";
    } else if (currentState === "yes") {
      newActs[act] = "no";
    } else {
      // Remove from object when going back to unselected
      delete newActs[act];
    }
    
    updateFlowState({ intimateActs: newActs });
  };

  // Dynamic validation based on current step
  const canProceed = () => {
    if (step === flowSteps.encounterType) {
      return state.encounterType !== "";
    } else if (step === flowSteps.university) {
      // Can proceed if university is selected OR "Not Applicable" is chosen
      return state.universityId !== "" || universityNotApplicable;
    } else if (step === flowSteps.parties) {
      return state.parties.some(p => p.trim() !== "");
    } else if (step === flowSteps.intimateActs) {
      return true; // Can proceed even with no acts selected
    } else if (step === flowSteps.duration) {
      // Duration step is optional - can proceed with or without setting duration
      return true;
    } else if (step === flowSteps.recordingMethod) {
      return state.method !== null;
    }
    return false;
  };

  // Helper to build URL with current state
  const buildURLWithState = (): string => {
    const params = new URLSearchParams();
    
    if (state.encounterType) params.set("encounterType", state.encounterType);
    if (state.universityId) {
      params.set("universityId", state.universityId);
      params.set("universityName", state.universityName);
    }
    if (state.parties.some(p => p.trim() !== "")) {
      params.set("parties", JSON.stringify(state.parties.filter(p => p.trim() !== "")));
    }
    if (Object.keys(state.intimateActs).length > 0) {
      params.set("intimateActs", JSON.stringify(state.intimateActs));
    }
    if (state.method) {
      params.set("method", state.method);
    }
    
    return params.toString() ? `?${params.toString()}` : "";
  };

  const handleNext = () => {
    if (!canProceed()) return;

    // For internal step navigation, just use setStep()
    if (step === flowSteps.encounterType) {
      const nextStep = flowSteps.university || flowSteps.parties;
      setStep(nextStep);
    } else if (step === flowSteps.university) {
      setStep(flowSteps.parties);
    } else if (step === flowSteps.parties) {
      setStep(flowSteps.intimateActs);
    } else if (step === flowSteps.intimateActs) {
      setStep(flowSteps.duration);
    } else if (step === flowSteps.duration) {
      setStep(flowSteps.recordingMethod);
    } else if (step === flowSteps.recordingMethod && state.method) {
      // Navigate to recording method page
      const filteredParties = state.parties.filter(p => p.trim() !== "");
      const params = new URLSearchParams();
      
      // Only include university if it exists
      if (state.universityId) {
        params.set("universityId", state.universityId);
        params.set("universityName", state.universityName);
      }
      
      params.set("encounterType", state.encounterType);
      params.set("parties", JSON.stringify(filteredParties));
      params.set("intimateActs", JSON.stringify(state.intimateActs));
      params.set("method", state.method);
      
      // Include duration fields if they exist
      if (state.contractStartTime) {
        params.set("contractStartTime", state.contractStartTime);
      }
      if (state.contractDuration) {
        params.set("contractDuration", state.contractDuration.toString());
      }
      if (state.contractEndTime) {
        params.set("contractEndTime", state.contractEndTime);
      }
      
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
    if (step === flowSteps.parties) {
      // From parties, go back to university (if exists) or encounter type
      setStep(flowSteps.university || flowSteps.encounterType);
    } else if (step === flowSteps.university) {
      setStep(flowSteps.encounterType);
    } else if (step === flowSteps.intimateActs) {
      setStep(flowSteps.parties);
    } else if (step === flowSteps.duration) {
      setStep(flowSteps.intimateActs);
    } else if (step === flowSteps.recordingMethod) {
      setStep(flowSteps.duration);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  // Require authentication for consent flow
  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <LogIn className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to create consent documentation</h2>
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
          You need to be logged in to create and manage consent contracts. This ensures secure and legally binding documentation.
        </p>
        <Button onClick={() => navigate('/auth')} data-testid="button-sign-in">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {step > flowSteps.encounterType && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Create Consent Contract</h1>
          <p className="text-sm text-muted-foreground">{state.universityName}</p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6">
        {Array.from({ length: flowSteps.totalSteps }, (_, i) => i + 1).map((s) => (
          <div
            key={s}
            className={`h-2 rounded-full transition-all ${
              s === step
                ? "w-8 bg-success"
                : s < step
                ? "w-2 bg-success/50"
                : "w-2 bg-muted"
            }`}
            data-testid={`progress-step-${s}`}
          />
        ))}
      </div>

      {step === flowSteps.encounterType && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step {flowSteps.encounterType}: Encounter Type</h2>
            <p className="text-sm text-muted-foreground">What kind of encounter is this consent for?</p>
          </div>
          <Card
            className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${
              state.encounterType === intimateEncounterType.id
                ? "border-success bg-success/5"
                : ""
            }`}
            onClick={() => updateFlowState({ encounterType: intimateEncounterType.id })}
            data-testid={`option-encounter-${intimateEncounterType.id}`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <intimateEncounterType.icon className={`h-6 w-6 ${state.encounterType === intimateEncounterType.id ? "text-success" : ""}`} />
              <span className="text-sm font-medium">{intimateEncounterType.label}</span>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            {encounterTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card
                  key={type.id}
                  className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${
                    state.encounterType === type.id
                      ? "border-success bg-success/5"
                      : ""
                  }`}
                  onClick={() => updateFlowState({ encounterType: type.id })}
                  data-testid={`option-encounter-${type.id}`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <Icon className={`h-6 w-6 ${state.encounterType === type.id ? "text-success" : ""}`} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                </Card>
              );
            })}
          </div>
          <Card
            className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${
              state.encounterType === otherEncounterType.id
                ? "border-success bg-success/5"
                : ""
            }`}
            onClick={() => updateFlowState({ encounterType: otherEncounterType.id })}
            data-testid={`option-encounter-${otherEncounterType.id}`}
          >
            <div className="flex items-center justify-center gap-3">
              <otherEncounterType.icon className={`h-6 w-6 ${state.encounterType === otherEncounterType.id ? "text-success" : ""}`} />
              <span className="text-sm font-medium">{otherEncounterType.label}</span>
            </div>
          </Card>
        </div>
      )}

      {step === flowSteps.university && flowSteps.university !== null && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step {flowSteps.university}: Select Your Institution</h2>
            <p className="text-sm text-muted-foreground">Choose your university to generate a Title IX-compliant consent contract</p>
          </div>
          
          <RadioGroup
            value={universityNotApplicable ? "not-applicable" : "select-university"}
            onValueChange={(value) => {
              const isNotApplicable = value === "not-applicable";
              setUniversityNotApplicable(isNotApplicable);
              if (isNotApplicable) {
                // Clear university selection when "Not Applicable" is chosen
                setSelectedUniversity(null);
                updateFlowState({ universityId: "", universityName: "" });
              }
            }}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="select-university" id="select-university" data-testid="radio-select-university" />
              <Label htmlFor="select-university" className="font-normal cursor-pointer">
                Select My University
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="not-applicable" id="not-applicable" data-testid="radio-not-applicable" />
              <Label htmlFor="not-applicable" className="font-normal cursor-pointer">
                Not Applicable
              </Label>
            </div>
          </RadioGroup>

          {!universityNotApplicable && (
            <>
              <UniversitySelector
                universities={universities}
                selectedUniversity={selectedUniversity}
                onSelect={setSelectedUniversity}
              />
              {selectedUniversity && (
                <UniversityPolicyPreview
                  universityId={selectedUniversity.id}
                  universityName={selectedUniversity.name}
                  titleIXInfo={selectedUniversity.titleIXInfo}
                  titleIXUrl={selectedUniversity.titleIXUrl}
                  lastUpdated={selectedUniversity.lastUpdated}
                  verifiedAt={selectedUniversity.verifiedAt}
                />
              )}
            </>
          )}
        </div>
      )}

      {step === flowSteps.parties && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step {flowSteps.parties}: Parties Involved</h2>
            <p className="text-sm text-muted-foreground">
              Add the names of other participants (in addition to yourself)
            </p>
          </div>

          {contacts.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Quick Add from Contacts</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {contacts.map((contact) => {
                  const canonicalUsername = `@${contact.contactUsername}`;
                  const isAlreadyAdded = state.parties.some(party => 
                    party.toLowerCase() === canonicalUsername.toLowerCase()
                  );
                  
                  return (
                    <Button
                      key={contact.id}
                      variant={isAlreadyAdded ? "outline" : "secondary"}
                      size="sm"
                      className={isAlreadyAdded ? "opacity-50" : ""}
                      onClick={() => addContactAsParty(contact)}
                      disabled={isAlreadyAdded}
                      data-testid={`badge-contact-${contact.id}`}
                    >
                      <UserPlus className="h-3 w-3 mr-1.5" />
                      {contact.nickname || contact.contactUsername}
                      {isAlreadyAdded && " ✓"}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {state.parties.map((party, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder={index === 0 ? "@username (You)" : `@username (Participant ${index + 1})`}
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

      {step === flowSteps.intimateActs && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step {flowSteps.intimateActs}: Intimate Acts</h2>
            <p className="text-sm text-muted-foreground">
              Tap once for YES (green ✓), twice for NO (red ✗), three times to unselect
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {intimateActOptions.map((act) => {
              const actState = state.intimateActs[act];
              const isYes = actState === "yes";
              const isNo = actState === "no";
              
              return (
                <Card
                  key={act}
                  className={`p-3 cursor-pointer hover-elevate active-elevate-2 transition-all ${
                    isYes
                      ? "border-success bg-success/5"
                      : isNo
                      ? "border-destructive bg-destructive/5"
                      : ""
                  }`}
                  onClick={() => toggleIntimateAct(act)}
                  data-testid={`option-act-${act}`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isYes
                        ? "border-success bg-success"
                        : isNo
                        ? "border-destructive bg-destructive"
                        : "border-muted-foreground"
                    }`}>
                      {isYes && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {isNo && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-medium leading-tight">{act}</span>
                  </div>
                </Card>
              );
            })}
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

      {step === flowSteps.duration && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step {flowSteps.duration}: Contract Duration</h2>
            <p className="text-sm text-muted-foreground">Define when consent starts and how long it's valid (optional)</p>
          </div>
          <ContractDurationStep
            contractStartTime={state.contractStartTime}
            contractDuration={state.contractDuration}
            contractEndTime={state.contractEndTime}
            onUpdate={(updates) => updateFlowState(updates)}
          />
        </div>
      )}

      {step === flowSteps.recordingMethod && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step {flowSteps.recordingMethod}: Recording Method</h2>
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
                      ? "border-success bg-success/5"
                      : ""
                  }`}
                  onClick={() => updateFlowState({ method: method.id })}
                  data-testid={`option-method-${method.id}`}
                >
                  <div className="flex items-center gap-4">
                    <Icon className={`h-6 w-6 ${state.method === method.id ? "text-success" : ""}`} />
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

      {/* Action buttons */}
      <div className="space-y-3 pt-4">
        {step === flowSteps.recordingMethod && featureFlags.collaborativeContracts && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (canSaveOrShare()) {
                  saveAsDraftMutation.mutate();
                } else {
                  toast({
                    title: "Incomplete form",
                    description: "Please fill in encounter type, at least one party name, and select a method",
                    variant: "destructive",
                  });
                }
              }}
              disabled={saveAsDraftMutation.isPending || !canSaveOrShare()}
              className="flex-1"
              data-testid="button-save-draft"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (canSaveOrShare()) {
                  setShowShareDialog(true);
                } else {
                  toast({
                    title: "Incomplete form",
                    description: "Please fill in encounter type, at least one party name, and select a method",
                    variant: "destructive",
                  });
                }
              }}
              disabled={shareContractMutation.isPending || !canSaveOrShare()}
              className="flex-1"
              data-testid="button-share"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        )}
        
        <div className="flex gap-3">
          {step > flowSteps.encounterType && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
              data-testid="button-back-footer"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className={step > flowSteps.encounterType ? "flex-1 bg-success hover:bg-success/90" : "w-full bg-success hover:bg-success/90"}
            data-testid="button-next"
          >
            {step === flowSteps.recordingMethod ? "Continue" : "Next"}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent data-testid="dialog-share-contract" className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share Contract for Approval</DialogTitle>
            <DialogDescription>
              Invite another person to review and approve this consent contract.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={shareMode} onValueChange={(v) => setShareMode(v as "pmy-user" | "email")} className="py-4">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="pmy-user" data-testid="tab-pmy-user">
                <AtSign className="h-4 w-4 mr-2" />
                PMY User
              </TabsTrigger>
              <TabsTrigger value="email" data-testid="tab-email">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pmy-user" className="space-y-4" data-testid="content-pmy-user">
              <div className="space-y-2">
                <Label>Find a PMY user to collaborate with</Label>
                <UserSearch
                  onSelectUser={(user) => setSelectedPmyUser(user)}
                  selectedUserId={selectedPmyUser?.id}
                  placeholder="Search by username (e.g., @username)"
                />
                {selectedPmyUser && (
                  <p className="text-sm text-muted-foreground mt-2" data-testid="text-selected-user">
                    Selected: <span className="font-medium">@{selectedPmyUser.username}</span>
                    {selectedPmyUser.firstName && selectedPmyUser.lastName && (
                      <span> ({selectedPmyUser.firstName} {selectedPmyUser.lastName})</span>
                    )}
                  </p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="email" className="space-y-4" data-testid="content-email">
              <div className="space-y-2">
                <Label htmlFor="share-email">Recipient Email</Label>
                <p className="text-sm text-muted-foreground">
                  Send an invitation to someone who doesn't have PMY yet.
                </p>
                <Input
                  id="share-email"
                  type="email"
                  placeholder="partner@example.com"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  data-testid="input-share-email"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowShareDialog(false);
                setShareEmail("");
                setSelectedPmyUser(null);
                setShareMode("pmy-user");
              }}
              data-testid="button-cancel-share"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (shareMode === "pmy-user" && selectedPmyUser) {
                  shareContractMutation.mutate(selectedPmyUser.id);
                } else if (shareMode === "email" && shareEmail) {
                  shareContractMutation.mutate(shareEmail);
                }
              }}
              disabled={
                shareContractMutation.isPending ||
                (shareMode === "pmy-user" && !selectedPmyUser) ||
                (shareMode === "email" && !shareEmail)
              }
              data-testid="button-confirm-share"
            >
              {shareContractMutation.isPending ? "Sharing..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
