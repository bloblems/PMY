import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { storage } from "@/services/storage";

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

const defaultState: ConsentFlowState = {
  universityId: "",
  universityName: "",
  encounterType: "",
  parties: ["", ""],
  intimateActs: {},
  contractStartTime: undefined,
  contractDuration: undefined,
  contractEndTime: undefined,
  method: null,
};

const STORAGE_KEY = "pmy_consent_flow_state";

const ConsentFlowContext = createContext<ConsentFlowContextType | undefined>(undefined);

export function ConsentFlowProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConsentFlowState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate state from storage on mount (async)
  useEffect(() => {
    async function loadState() {
      try {
        const saved = await storage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          // Validate and merge with default state to handle corrupt/incomplete data
          const validMethods: Array<ConsentFlowState["method"]> = ["signature", "voice", "photo", "biometric", null];
          const validatedState: ConsentFlowState = {
            universityId: typeof parsed.universityId === 'string' ? parsed.universityId : defaultState.universityId,
            universityName: typeof parsed.universityName === 'string' ? parsed.universityName : defaultState.universityName,
            encounterType: typeof parsed.encounterType === 'string' ? parsed.encounterType : defaultState.encounterType,
            parties: Array.isArray(parsed.parties) ? parsed.parties : defaultState.parties,
            intimateActs: (parsed.intimateActs && typeof parsed.intimateActs === 'object' && !Array.isArray(parsed.intimateActs)) ? parsed.intimateActs : defaultState.intimateActs,
            contractStartTime: typeof parsed.contractStartTime === 'string' ? parsed.contractStartTime : defaultState.contractStartTime,
            contractDuration: typeof parsed.contractDuration === 'number' ? parsed.contractDuration : defaultState.contractDuration,
            contractEndTime: typeof parsed.contractEndTime === 'string' ? parsed.contractEndTime : defaultState.contractEndTime,
            method: validMethods.includes(parsed.method) ? parsed.method : defaultState.method,
          };
          
          setState(validatedState);
          console.log("[ConsentFlowContext] Restored from storage:", validatedState);
        } else {
          console.log("[ConsentFlowContext] No saved state, using default");
        }
      } catch (e) {
        console.error("[ConsentFlowContext] Failed to restore from storage, using default:", e);
        setState(defaultState);
      } finally {
        setIsHydrated(true);
      }
    }
    loadState();
  }, []);

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
    setState(defaultState);
    try {
      await storage.removeItem(STORAGE_KEY);
      console.log("[ConsentFlowContext] State reset");
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
