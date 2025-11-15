import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { storage } from "@/services/storage";

export interface ConsentFlowState {
  universityId: string;
  universityName: string;
  encounterType: string;
  parties: string[];
  intimateActs: string[];
  method: "signature" | "voice" | "photo" | "biometric" | null;
}

interface ConsentFlowContextType {
  state: ConsentFlowState;
  updateState: (updates: Partial<ConsentFlowState>) => void;
  resetState: () => void;
  hasRequiredData: () => boolean;
}

const defaultState: ConsentFlowState = {
  universityId: "",
  universityName: "",
  encounterType: "",
  parties: ["", ""],
  intimateActs: [],
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
          setState(parsed);
          console.log("[ConsentFlowContext] Restored from storage:", parsed);
        } else {
          console.log("[ConsentFlowContext] No saved state, using default");
        }
      } catch (e) {
        console.error("[ConsentFlowContext] Failed to restore from storage:", e);
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

  const updateState = (updates: Partial<ConsentFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetState = async () => {
    setState(defaultState);
    try {
      await storage.removeItem(STORAGE_KEY);
      console.log("[ConsentFlowContext] State reset");
    } catch (e) {
      console.error("[ConsentFlowContext] Failed to clear storage:", e);
    }
  };

  const hasRequiredData = () => {
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
  };

  return (
    <ConsentFlowContext.Provider value={{ state, updateState, resetState, hasRequiredData }}>
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
