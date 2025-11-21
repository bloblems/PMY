import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { storage } from "@/services/storage";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";

export interface ConsentFlowState {
  universityId: string;
  universityName: string;
  encounterType: string;
  parties: string[];
  intimateActs: Record<string, "yes" | "no">; // Three states: undefined (unselected), "yes" (green check), "no" (red X)
  contractStartTime?: string; // ISO string for start date/time
  contractDuration?: number; // Duration in minutes
  contractEndTime?: string; // ISO string for end date/time
  method: "signature" | "voice" | "photo" | "biometric" | null;
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

const getDefaultState = (preferences?: UserPreferences): ConsentFlowState => ({
  universityId: preferences?.defaultUniversityId || "",
  universityName: "",
  encounterType: preferences?.defaultEncounterType || "",
  parties: ["", ""],
  intimateActs: {},
  contractStartTime: undefined,
  contractDuration: preferences?.defaultContractDuration || undefined,
  contractEndTime: undefined,
  method: null,
});

const STORAGE_KEY = "pmy_consent_flow_state";

const ConsentFlowContext = createContext<ConsentFlowContextType | undefined>(undefined);

export function ConsentFlowProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<ConsentFlowState>(getDefaultState());
  const [isHydrated, setIsHydrated] = useState(false);

  // Fetch user preferences if authenticated
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ['/api/profile/preferences'],
    enabled: !!user,
  });

  // Hydrate state from storage on mount (async)
  useEffect(() => {
    async function loadState() {
      try {
        const saved = await storage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // Validate and merge with default state to handle corrupt/incomplete data
          const defaultStateWithPrefs = getDefaultState(preferences);
          const validMethods: Array<ConsentFlowState["method"]> = ["signature", "voice", "photo", "biometric", null];
          const validatedState: ConsentFlowState = {
            universityId: typeof parsed.universityId === 'string' ? parsed.universityId : defaultStateWithPrefs.universityId,
            universityName: typeof parsed.universityName === 'string' ? parsed.universityName : defaultStateWithPrefs.universityName,
            encounterType: typeof parsed.encounterType === 'string' ? parsed.encounterType : defaultStateWithPrefs.encounterType,
            parties: Array.isArray(parsed.parties) ? parsed.parties : defaultStateWithPrefs.parties,
            intimateActs: (parsed.intimateActs && typeof parsed.intimateActs === 'object' && !Array.isArray(parsed.intimateActs)) ? parsed.intimateActs : defaultStateWithPrefs.intimateActs,
            contractStartTime: typeof parsed.contractStartTime === 'string' ? parsed.contractStartTime : defaultStateWithPrefs.contractStartTime,
            contractDuration: typeof parsed.contractDuration === 'number' ? parsed.contractDuration : defaultStateWithPrefs.contractDuration,
            contractEndTime: typeof parsed.contractEndTime === 'string' ? parsed.contractEndTime : defaultStateWithPrefs.contractEndTime,
            method: validMethods.includes(parsed.method) ? parsed.method : defaultStateWithPrefs.method,
          };
          
          setState(validatedState);
          console.log("[ConsentFlowContext] Restored from storage:", validatedState);
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
  }, [preferences]);

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
    const defaultStateWithPrefs = getDefaultState(preferences);
    setState(defaultStateWithPrefs);
    try {
      await storage.removeItem(STORAGE_KEY);
      console.log("[ConsentFlowContext] State reset to preferences:", defaultStateWithPrefs);
    } catch (e) {
      console.error("[ConsentFlowContext] Failed to clear storage:", e);
    }
  }, [preferences]);

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
