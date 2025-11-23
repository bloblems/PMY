import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useConsentFlow, type ConsentFlowState } from "@/contexts/ConsentFlowContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Save, Share2, AtSign, Mail, LogIn } from "lucide-react";
import ContractDurationStep from "@/components/ContractDurationStep";
import { UserSearch } from "@/components/UserSearch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { featureFlags } from "@/lib/featureFlags";
import { 
  type University, 
  type UserContact,
  doesEncounterTypeRequireUniversity 
} from "@/lib/consentFlowConstants";
import { useConsentFlowValidation } from "@/hooks/useConsentFlowValidation";
import { EncounterTypeStep } from "@/components/consent-flow/EncounterTypeStep";
import { UniversitySelectionStep } from "@/components/consent-flow/UniversitySelectionStep";
import { PartiesStep } from "@/components/consent-flow/PartiesStep";
import { IntimateActsStep } from "@/components/consent-flow/IntimateActsStep";
import { RecordingMethodStep } from "@/components/consent-flow/RecordingMethodStep";

export default function ConsentFlowPage() {
  const [location, navigate] = useLocation();
  const { state, updateState: updateFlowState, isHydrated } = useConsentFlow();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  
  // Validation hook
  const {
    partyErrors,
    normalizeUsername,
    validateUsername,
    validateParty,
    reindexErrors,
    canSaveDraft,
    canSaveOrShare,
  } = useConsentFlowValidation();
  
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
          
          // Normalize parties to canonical @username format (lowercase, clean)
          const normalizedParties = (draft.parties || ["", ""]).map((party: string) => {
            return normalizeUsername(party);
          });

          // Validate all parties and set errors for invalid ones
          const errors: { [key: number]: string } = {};
          normalizedParties.forEach((party: string, index: number) => {
            const error = validateUsername(party);
            if (error) {
              errors[index] = error;
            }
          });
          setPartyErrors(errors);

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
  
  // Track selected state for state selector
  const [selectedState, setSelectedState] = useState<{ code: string; name: string } | null>(null);
  
  // Track selection mode: "select-university", "select-state", or "not-applicable"
  // Initialize from context if available, otherwise default to "select-university"
  const [selectionMode, setSelectionMode] = useState<"select-university" | "select-state" | "not-applicable">(
    state.selectionMode || "select-university"
  );

  // Custom text dialog state
  const [showCustomEncounterDialog, setShowCustomEncounterDialog] = useState(false);
  const [showCustomActsDialog, setShowCustomActsDialog] = useState(false);
  const [customText, setCustomText] = useState("");
  const [isInterpreting, setIsInterpreting] = useState(false);

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
        stateCode: "",
        stateName: "",
      });
    }
  }, [selectedUniversity]);

  // Sync local selectionMode with persisted context value on hydration
  useEffect(() => {
    if (state.selectionMode) {
      // Restore persisted selection mode from context
      setSelectionMode(state.selectionMode);
    } else {
      // No persisted mode - derive from active data
      if (state.universityId) {
        setSelectionMode("select-university");
      } else if (state.stateCode && state.stateName) {
        setSelectionMode("select-state");
      } else {
        setSelectionMode("select-university");
      }
    }
  }, [state.selectionMode, isHydrated]);
  
  // Sync selectedState when state data changes
  useEffect(() => {
    if (state.stateCode && state.stateName) {
      setSelectedState({
        code: state.stateCode,
        name: state.stateName,
      });
    }
  }, [state.stateCode, state.stateName]);

  // Update state when state is manually selected
  useEffect(() => {
    if (selectedState && selectedState.code !== state.stateCode) {
      updateFlowState({
        stateCode: selectedState.code,
        stateName: selectedState.name,
        universityId: "",
        universityName: "",
      });
    }
  }, [selectedState]);

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

  // Use useMemo to ensure flowSteps is recalculated when encounterType changes
  const flowSteps = useMemo(() => getFlowSteps(), [state.encounterType]);

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
    
    // If university or state is set, we've completed that step, move to parties
    if (fromState.universityId && steps.university) return steps.parties;
    if (fromState.stateCode && fromState.stateName && steps.university) return steps.parties;
    
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
    console.log('[ConsentFlow] Initializing step:', initialStep, 'flowSteps:', flowSteps);
    return initialStep;
  });

  // Correct step when flowSteps changes (e.g., after context hydration)
  useEffect(() => {
    // If we're on a university step that no longer exists, move to the appropriate step
    if (step === 2 && flowSteps.university === null) {
      // University step was removed, move to parties
      setStep(flowSteps.parties);
    } else if (step > 1 && step < flowSteps.parties && flowSteps.university === 2 && state.encounterType) {
      // If we should have a university step but we're somehow past it without completing it
      // and we don't have university/state selected, go back to university step
      if (!state.universityId && !state.stateCode && state.selectionMode !== "not-applicable") {
        setStep(flowSteps.university);
      }
    }
  }, [flowSteps, state.encounterType, state.universityId, state.stateCode, state.selectionMode, isHydrated]);

  // Handle encounter type changes (must be after step state declaration)
  const prevEncounterTypeRef = useRef(state.encounterType);
  const prevSelectionModeRef = useRef(state.selectionMode);
  useEffect(() => {
    // Only run when encounter type actually changes (not on initial mount or during selection)
    // Don't auto-advance if we're still on step 1 (encounter type selection)
    // Don't auto-advance if only selectionMode changed (not encounter type)
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
    
    // Update refs for next comparison
    prevEncounterTypeRef.current = state.encounterType;
    prevSelectionModeRef.current = state.selectionMode;
  }, [state.encounterType, state.selectionMode, step]);

  const addParty = () => {
    updateFlowState({ parties: [...state.parties, ""] });
  };

  const updateParty = (index: number, value: string) => {
    const newParties = [...state.parties];
    const normalizedValue = normalizeUsername(value);
    newParties[index] = normalizedValue;
    
    // Validate using hook method
    validateParty(index, normalizedValue);
    
    updateFlowState({ parties: newParties });
  };

  const removeParty = (index: number) => {
    const newParties = state.parties.filter((_, i) => i !== index);
    updateFlowState({ parties: newParties.length === 0 ? [""] : newParties });
    
    // Re-index errors using hook method
    reindexErrors(index);
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

  const handleInterpretCustomText = async (context: "encounterType" | "intimateActs") => {
    if (!customText.trim()) {
      toast({
        title: "Please enter text",
        description: "Describe what you're looking for",
        variant: "destructive",
      });
      return;
    }

    setIsInterpreting(true);
    try {
      const response = await apiRequest("POST", "/api/consent/interpret-custom-text", {
        customText: customText.trim(),
        context,
      });

      if (!response.ok) {
        throw new Error("Failed to interpret custom text");
      }

      const { interpretation } = await response.json();

      if (context === "encounterType") {
        updateFlowState({ 
          encounterType: interpretation.suggestedType,
        });
        toast({
          title: "Encounter type set",
          description: interpretation.label || "Custom encounter type applied",
        });
        setShowCustomEncounterDialog(false);
      } else {
        // intimateActs
        if (interpretation.suggestedActs && interpretation.suggestedActs.length > 0) {
          const newActs = { ...state.intimateActs };
          interpretation.suggestedActs.forEach((act: string) => {
            newActs[act] = "yes";
          });
          updateFlowState({ intimateActs: newActs });
          toast({
            title: "Intimate acts added",
            description: `Added ${interpretation.suggestedActs.length} act(s)`,
          });
        }
        if (interpretation.customDescription) {
          toast({
            title: "Custom description noted",
            description: interpretation.customDescription,
          });
        }
        setShowCustomActsDialog(false);
      }

      setCustomText("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to interpret your input. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInterpreting(false);
    }
  };

  // Dynamic validation based on current step
  const canProceed = () => {
    if (step === flowSteps.encounterType) {
      return state.encounterType !== "";
    } else if (step === flowSteps.university) {
      // Can proceed if university is selected OR state is selected OR "Not Applicable" is chosen
      // Use context state (not local component state) as source of truth
      const allowNotApplicable = state.selectionMode === "not-applicable";
      return state.universityId !== "" || state.stateCode !== "" || allowNotApplicable;
    } else if (step === flowSteps.parties) {
      // Check at least one non-empty party AND no validation errors
      const hasParties = state.parties.some(p => p.trim() !== "");
      const hasErrors = Object.keys(partyErrors).length > 0;
      return hasParties && !hasErrors;
    } else if (step === flowSteps.intimateActs) {
      return true; // Can proceed even with no acts selected
    } else if (step === flowSteps.duration) {
      // Duration step is optional - can proceed with or without setting duration
      // BUT if duration is set, ensure end time is not in the past
      if (state.contractStartTime && state.contractDuration) {
        const startTime = new Date(state.contractStartTime);
        const endTime = new Date(startTime.getTime() + state.contractDuration * 60 * 1000);
        const now = Date.now();
        
        // Prevent proceeding if end time is in the past
        if (endTime.getTime() < now) {
          return false;
        }
      }
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
    if (!canProceed()) {
      // Show specific error message for duration step validation
      if (step === flowSteps.duration && state.contractStartTime && state.contractDuration) {
        const startTime = new Date(state.contractStartTime);
        const endTime = new Date(startTime.getTime() + state.contractDuration * 60 * 1000);
        if (endTime.getTime() < Date.now()) {
          toast({
            title: "Invalid Contract Duration",
            description: "Contract end time is in the past. This would create an already-expired contract. Please adjust the start time or duration.",
            variant: "destructive",
          });
          return;
        }
      }
      return;
    }

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
                ? "border-pink-500/30 bg-gradient-to-br from-pink-500/20 via-rose-500/15 to-purple-500/20 dark:from-pink-500/30 dark:via-rose-500/25 dark:to-purple-500/30"
                : ""
            }`}
            onClick={() => updateFlowState({ encounterType: intimateEncounterType.id })}
            data-testid={`option-encounter-${intimateEncounterType.id}`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <intimateEncounterType.icon className={`h-6 w-6 ${state.encounterType === intimateEncounterType.id ? "text-pink-500" : ""}`} />
              <span className="text-sm font-medium">{intimateEncounterType.label}</span>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-3">
            {encounterTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = state.encounterType === type.id;
              const getGradient = () => {
                switch(type.id) {
                  case "date":
                    return "border-purple-500/30 bg-gradient-to-br from-purple-500/20 via-violet-500/15 to-indigo-500/20 dark:from-purple-500/30 dark:via-violet-500/25 dark:to-indigo-500/30";
                  case "conversation":
                    return "border-emerald-500/30 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-green-500/20 dark:from-emerald-500/30 dark:via-teal-500/25 dark:to-green-500/30";
                  case "medical":
                    return "border-blue-500/30 bg-gradient-to-br from-blue-500/20 via-cyan-500/15 to-teal-500/20 dark:from-blue-500/30 dark:via-cyan-500/25 dark:to-teal-500/30";
                  case "professional":
                    return "border-amber-500/30 bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-yellow-500/20 dark:from-amber-500/30 dark:via-orange-500/25 dark:to-yellow-500/30";
                  default:
                    return "";
                }
              };
              const getIconColor = () => {
                switch(type.id) {
                  case "date": return "text-purple-500";
                  case "conversation": return "text-emerald-500";
                  case "medical": return "text-blue-500";
                  case "professional": return "text-amber-500";
                  default: return "";
                }
              };
              return (
                <Card
                  key={type.id}
                  className={`p-4 cursor-pointer hover-elevate active-elevate-2 transition-all ${
                    isSelected ? getGradient() : ""
                  }`}
                  onClick={() => updateFlowState({ encounterType: type.id })}
                  data-testid={`option-encounter-${type.id}`}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <Icon className={`h-6 w-6 ${isSelected ? getIconColor() : ""}`} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                </Card>
              );
            })}
          </div>
          <Card
            className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-all"
            onClick={() => setShowCustomEncounterDialog(true)}
            data-testid="option-encounter-custom"
          >
            <div className="flex items-center justify-center gap-3">
              <otherEncounterType.icon className="h-6 w-6" />
              <span className="text-sm font-medium">Other (Custom)</span>
            </div>
          </Card>
        </div>
      )}

      {step === flowSteps.university && flowSteps.university !== null && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step {flowSteps.university}: Select Your State or Institution</h2>
            <p className="text-sm text-muted-foreground">Choose your state or university for compliance information</p>
          </div>
          
          <RadioGroup
            value={selectionMode}
            onValueChange={(value: "select-university" | "select-state" | "not-applicable") => {
              setSelectionMode(value);
              
              // Update persisted selectionMode in context immediately
              if (value === "not-applicable") {
                // Persist "not-applicable" choice
                updateFlowState({ 
                  selectionMode: value,
                  universityId: "", 
                  universityName: "",
                  stateCode: "",
                  stateName: "",
                });
                // Clear UI selections
                setSelectedUniversity(null);
                setSelectedState(null);
              } else if (value === "select-university") {
                // Persist "select-university" and clear state selection
                setSelectedState(null);
                updateFlowState({ 
                  selectionMode: value,
                  stateCode: "",
                  stateName: "",
                });
              } else if (value === "select-state") {
                // Persist "select-state" and clear university selection
                setSelectedUniversity(null);
                updateFlowState({ 
                  selectionMode: value,
                  universityId: "", 
                  universityName: "",
                });
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
              <RadioGroupItem value="select-state" id="select-state" data-testid="radio-select-state" />
              <Label htmlFor="select-state" className="font-normal cursor-pointer">
                Select My State
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem 
                value="not-applicable" 
                id="not-applicable" 
                data-testid="radio-not-applicable"
              />
              <Label 
                htmlFor="not-applicable" 
                className="font-normal cursor-pointer"
              >
                Not Applicable
              </Label>
            </div>
          </RadioGroup>

          {selectionMode === "select-university" && (
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

          {selectionMode === "select-state" && (
            <StateSelector
              selectedState={selectedState}
              onSelect={setSelectedState}
            />
          )}

          {/* Informative tool tiles based on selection mode */}
          {selectionMode === "select-university" && (
            <Card className="mt-6 border-primary/20 bg-primary/5" data-testid="card-title-ix-tool">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Need to research Title IX policies?</CardTitle>
                    <CardDescription className="text-sm">
                      Access our comprehensive Title IX information tool
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/title-ix-info")}
                  data-testid="button-goto-title-ix"
                >
                  View Title IX Tool
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {selectionMode === "select-state" && (
            <Card className="mt-6 border-primary/20 bg-primary/5" data-testid="card-state-law-tool">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">Need to research state consent laws?</CardTitle>
                    <CardDescription className="text-sm">
                      Access detailed consent law information for all 50 states
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/state-laws")}
                  data-testid="button-goto-state-laws"
                >
                  View State Laws Tool
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {step === flowSteps.parties && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Step {flowSteps.parties}: Parties Involved</h2>
            <p className="text-sm text-muted-foreground">
              Add participants by legal name or search PMY users with @username
            </p>
          </div>

          <Card className="bg-muted/30 border-muted" data-testid="card-party-help">
            <CardContent className="p-3 text-sm text-muted-foreground">
              <div className="flex gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <strong>Legal name</strong>: For partners without PMY accounts (e.g., "Jane Smith")<br />
                  <strong>@username</strong>: Search our network of PMY users (e.g., "@jane_smith")
                </div>
              </div>
            </CardContent>
          </Card>

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
              <div key={index} className="space-y-1">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder={index === 0 ? "@username (You)" : `Legal name or @username`}
                      value={party}
                      onChange={(e) => updateParty(index, e.target.value)}
                      data-testid={`input-party-${index}`}
                      className={partyErrors[index] ? "border-destructive" : ""}
                      disabled={index === 0}
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
                {partyErrors[index] && (
                  <p className="text-sm text-destructive" data-testid={`error-party-${index}`}>
                    {partyErrors[index]}
                  </p>
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

          {/* Incentive message when external participants are added */}
          {state.parties.some(party => party.trim() && !party.startsWith('@')) && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" data-testid="card-external-participant-incentive">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Enhanced Digital Verification Available
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Invite your partner to create a PMY account for digital signatures, biometric verification, and collaborative contract features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
            onClick={() => setShowCustomActsDialog(true)}
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
        {/* Save & Exit button - available on all steps after Step 1 */}
        {step > flowSteps.encounterType && (
          <Button
            variant="outline"
            onClick={() => {
              if (canSaveDraft(state, step)) {
                saveAsDraftMutation.mutate();
              } else {
                toast({
                  title: "Cannot save yet",
                  description: "Please select an encounter type before saving",
                  variant: "destructive",
                });
              }
            }}
            disabled={saveAsDraftMutation.isPending || !canSaveDraft(state, step)}
            className="w-full"
            data-testid="button-save-exit"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveAsDraftMutation.isPending ? "Saving..." : "Save & Exit"}
          </Button>
        )}

        {step === flowSteps.recordingMethod && featureFlags.collaborativeContracts && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (canSaveOrShare(state)) {
                  saveAsDraftMutation.mutate();
                } else {
                  toast({
                    title: "Incomplete form",
                    description: "Please fill in encounter type, at least one party name, and select a method",
                    variant: "destructive",
                  });
                }
              }}
              disabled={saveAsDraftMutation.isPending || !canSaveOrShare(state)}
              className="flex-1"
              data-testid="button-save-draft"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (canSaveOrShare(state)) {
                  setShowShareDialog(true);
                } else {
                  toast({
                    title: "Incomplete form",
                    description: "Please fill in encounter type, at least one party name, and select a method",
                    variant: "destructive",
                  });
                }
              }}
              disabled={shareContractMutation.isPending || !canSaveOrShare(state)}
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

      {/* Custom Encounter Type Dialog */}
      <Dialog open={showCustomEncounterDialog} onOpenChange={setShowCustomEncounterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Describe Your Encounter Type</DialogTitle>
            <DialogDescription>
              Tell us about your encounter in your own words, and our AI will help categorize it appropriately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-encounter-text">Description</Label>
              <textarea
                id="custom-encounter-text"
                className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Example: 'A romantic dinner date followed by watching a movie together'"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                data-testid="textarea-custom-encounter"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomEncounterDialog(false);
                setCustomText("");
              }}
              data-testid="button-cancel-custom-encounter"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleInterpretCustomText("encounterType")}
              disabled={isInterpreting || !customText.trim()}
              data-testid="button-submit-custom-encounter"
            >
              {isInterpreting ? "Interpreting..." : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Intimate Acts Dialog */}
      <Dialog open={showCustomActsDialog} onOpenChange={setShowCustomActsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Advanced Options</DialogTitle>
            <DialogDescription>
              Describe intimate acts in your own words, and our AI will help identify appropriate consent terms.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="custom-acts-text">Description</Label>
              <textarea
                id="custom-acts-text"
                className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Example: 'We plan to hold hands and kiss goodnight'"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                data-testid="textarea-custom-acts"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCustomActsDialog(false);
                setCustomText("");
              }}
              data-testid="button-cancel-custom-acts"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleInterpretCustomText("intimateActs")}
              disabled={isInterpreting || !customText.trim()}
              data-testid="button-submit-custom-acts"
            >
              {isInterpreting ? "Interpreting..." : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
