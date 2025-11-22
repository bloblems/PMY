import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { storage } from "@/services/storage";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { US_STATES } from "@/lib/constants";

export interface ConsentFlowState {
  universityId: string;
  universityName: string;
  stateCode: string; // US state code (e.g., "CA", "NY")
  stateName: string; // US state name (e.g., "California")
  selectionMode?: "select-university" | "select-state" | "not-applicable"; // Persist user's explicit selection mode choice
  encounterType: string;
  parties: string[];
  intimateActs: Record<string, "yes" | "no">; // Three states: undefined (unselected), "yes" (green check), "no" (red X)
  contractStartTime?: string; // ISO string for start date/time
  contractDuration?: number; // Duration in minutes
  contractEndTime?: string; // ISO string for end date/time
  method: "signature" | "voice" | "photo" | "biometric" | null;
  draftId?: string; // Track saved draft ID to enable sharing existing drafts
  isCollaborative?: boolean; // Track if draft is collaborative to prevent PATCH on shared drafts
  contractText?: string; // Store generated contract text for resume editing
  // Method-specific fields for full draft fidelity
  signature1?: string; // Base64 signature data URL
  signature2?: string; // Base64 signature data URL
  photoUrl?: string; // Object storage URL for photo method
  credentialId?: string; // WebAuthn credential ID
  credentialPublicKey?: string; // WebAuthn public key
  credentialCounter?: string; // WebAuthn counter
  credentialDeviceType?: string; // WebAuthn device type
  credentialBackedUp?: string; // WebAuthn backup status
  authenticatedAt?: string; // ISO string for biometric authentication timestamp
}

interface ConsentFlowContextType {
  state: ConsentFlowState;
  updateState: (updates: Partial<ConsentFlowState>) => void;
  resetState: () => void;
  hasRequiredData: () => boolean;
  isHydrated: boolean;
}

interface UserPreferences {
  defaultUniversityId: string | null;
  stateOfResidence: string | null;
  defaultEncounterType: string | null;
  defaultContractDuration: number | null;
}

const getDefaultState = (preferences?: UserPreferences): ConsentFlowState => {
  // Lookup state name from state code if provided in preferences
  const stateCode = preferences?.stateOfResidence || "";
  const stateName = stateCode ? (US_STATES.find(s => s.code === stateCode)?.name || "") : "";
  
  return {
    universityId: preferences?.defaultUniversityId || "",
    universityName: "",
    stateCode,
    stateName,
    selectionMode: undefined, // Will be derived on first render or restored from storage
    encounterType: preferences?.defaultEncounterType || "",
    parties: ["", ""],
    intimateActs: {},
    contractStartTime: undefined,
    contractDuration: preferences?.defaultContractDuration || undefined,
    contractEndTime: undefined,
    method: null,
    draftId: undefined,
    isCollaborative: false,
    contractText: undefined,
    signature1: undefined,
    signature2: undefined,
    photoUrl: undefined,
    credentialId: undefined,
    credentialPublicKey: undefined,
    credentialCounter: undefined,
    credentialDeviceType: undefined,
    credentialBackedUp: undefined,
    authenticatedAt: undefined,
  };
};

const STORAGE_KEY = "pmy_consent_flow_state";

const ConsentFlowContext = createContext<ConsentFlowContextType | undefined>(undefined);

export function ConsentFlowProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<ConsentFlowState>(getDefaultState());
  const [isHydrated, setIsHydrated] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Fetch user preferences if authenticated
  const { data: preferences, isFetched: preferencesFetched, isError: preferencesError } = useQuery<UserPreferences>({
    queryKey: ['/api/profile/preferences'],
    enabled: !!user,
  });

  // Track when preferences have loaded (or when user is not authenticated)
  // Wait for auth to be ready, then check if preferences are loaded
  // Treat errors and null responses as "loaded" to prevent hydration hang
  useEffect(() => {
    // Don't proceed until auth state is known
    if (authLoading) return;
    
    // If no user, preferences are "loaded" (none to fetch)
    if (!user) {
      setPreferencesLoaded(true);
      return;
    }
    
    // If user exists, wait for preferences fetch to complete or error
    if (preferencesFetched || preferencesError) {
      setPreferencesLoaded(true);
    }
  }, [authLoading, user, preferencesFetched, preferencesError]);

  // Hydrate state from storage on mount (async) - wait for preferences to load first
  useEffect(() => {
    // Don't hydrate until preferences are loaded (or user is not authenticated)
    if (!preferencesLoaded) return;

    async function loadState() {
      try {
        const saved = await storage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // Validate and merge with default state to handle corrupt/incomplete data
          // Treat blank/empty values as missing to allow preferences to fill them
          const defaultStateWithPrefs = getDefaultState(preferences);
          const validMethods: Array<ConsentFlowState["method"]> = ["signature", "voice", "photo", "biometric", null];
          
          // Determine final stateCode and stateName with normalization
          const finalStateCode = (typeof parsed.stateCode === 'string' && parsed.stateCode !== '') ? parsed.stateCode : defaultStateWithPrefs.stateCode;
          const savedStateName = (typeof parsed.stateName === 'string' && parsed.stateName !== '') ? parsed.stateName : defaultStateWithPrefs.stateName;
          // If we have a stateCode but no stateName, lookup the name
          const finalStateName = finalStateCode && !savedStateName 
            ? (US_STATES.find(s => s.code === finalStateCode)?.name || "") 
            : savedStateName;
          
          // Validate selectionMode
          // null means user explicitly cleared the mode, undefined means not yet set
          // Both should result in auto-derivation on render
          const validModes: Array<ConsentFlowState["selectionMode"] | null> = ["select-university", "select-state", "not-applicable", undefined, null];
          const savedSelectionMode = validModes.includes(parsed.selectionMode) 
            ? (parsed.selectionMode === null ? undefined : parsed.selectionMode)
            : undefined;
          
          const validatedState: ConsentFlowState = {
            // Use saved value only if it's non-empty, otherwise use preference default
            universityId: (typeof parsed.universityId === 'string' && parsed.universityId !== '') ? parsed.universityId : defaultStateWithPrefs.universityId,
            universityName: (typeof parsed.universityName === 'string' && parsed.universityName !== '') ? parsed.universityName : defaultStateWithPrefs.universityName,
            stateCode: finalStateCode,
            stateName: finalStateName,
            selectionMode: savedSelectionMode, // Persist user's explicit selection mode choice
            encounterType: (typeof parsed.encounterType === 'string' && parsed.encounterType !== '') ? parsed.encounterType : defaultStateWithPrefs.encounterType,
            parties: (Array.isArray(parsed.parties) && parsed.parties.length > 0) ? parsed.parties : defaultStateWithPrefs.parties,
            intimateActs: (parsed.intimateActs && typeof parsed.intimateActs === 'object' && !Array.isArray(parsed.intimateActs) && Object.keys(parsed.intimateActs).length > 0) ? parsed.intimateActs : defaultStateWithPrefs.intimateActs,
            contractStartTime: (typeof parsed.contractStartTime === 'string' && parsed.contractStartTime !== '') ? parsed.contractStartTime : defaultStateWithPrefs.contractStartTime,
            contractDuration: (typeof parsed.contractDuration === 'number' && parsed.contractDuration > 0) ? parsed.contractDuration : defaultStateWithPrefs.contractDuration,
            contractEndTime: (typeof parsed.contractEndTime === 'string' && parsed.contractEndTime !== '') ? parsed.contractEndTime : defaultStateWithPrefs.contractEndTime,
            method: validMethods.includes(parsed.method) ? parsed.method : defaultStateWithPrefs.method,
            draftId: (typeof parsed.draftId === 'string' && parsed.draftId !== '') ? parsed.draftId : undefined,
          };
          
          setState(validatedState);
          console.log("[ConsentFlowContext] Restored from storage with preferences fallback:", validatedState);
        } else {
          // No saved flow - use preferences to prepopulate
          const defaultStateWithPrefs = getDefaultState(preferences);
          setState(defaultStateWithPrefs);
          console.log("[ConsentFlowContext] No saved state, using preferences:", defaultStateWithPrefs);
        }
      } catch (e) {
        console.error("[ConsentFlowContext] Failed to restore from storage, using default:", e);
        setState(getDefaultState(preferences));
      } finally {
        setIsHydrated(true);
      }
    }
    loadState();
  }, [preferencesLoaded, preferences]);

  // Persist state to storage whenever it changes (after initial hydration)
  useEffect(() => {
    if (!isHydrated) return; // Don't persist until we've loaded initial state
    
    async function saveState() {
      try {
        await storage.setItem(STORAGE_KEY, JSON.stringify(state));
        console.log("[ConsentFlowContext] Persisted to storage:", state);
      } catch (e) {
        console.error("[ConsentFlowContext] Failed to persist to storage:", e);
      }
    }
    saveState();
  }, [state, isHydrated]);

  const updateState = useCallback((updates: Partial<ConsentFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(async () => {
    // Refetch preferences to get latest values (in case updated in another tab)
    await queryClient.invalidateQueries({ queryKey: ['/api/profile/preferences'] });
    const latestPrefs = queryClient.getQueryData<UserPreferences>(['/api/profile/preferences']);
    
    const defaultStateWithPrefs = getDefaultState(latestPrefs);
    setState(defaultStateWithPrefs);
    try {
      await storage.removeItem(STORAGE_KEY);
      console.log("[ConsentFlowContext] State reset to latest preferences:", defaultStateWithPrefs);
    } catch (e) {
      console.error("[ConsentFlowContext] Failed to clear storage:", e);
    }
  }, []);

  const hasRequiredData = useCallback(() => {
    // Check that we have an encounter type
    if (!state.encounterType || state.encounterType.trim() === "") {
      return false;
    }
    
    // Check that we have at least 2 non-empty party names
    const validParties = state.parties.filter(p => p && p.trim() !== "");
    if (validParties.length < 2) {
      return false;
    }
    
    return true;
  }, [state]);

  return (
    <ConsentFlowContext.Provider value={{ state, updateState, resetState, hasRequiredData, isHydrated }}>
      {children}
    </ConsentFlowContext.Provider>
  );
}

export function useConsentFlow() {
  const context = useContext(ConsentFlowContext);
  if (!context) {
    throw new Error("useConsentFlow must be used within ConsentFlowProvider");
  }
  return context;
}
