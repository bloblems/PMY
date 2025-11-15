import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
  const [state, setState] = useState<ConsentFlowState>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log("[ConsentFlowContext] Restored from sessionStorage:", parsed);
        return parsed;
      }
    } catch (e) {
      console.error("[ConsentFlowContext] Failed to restore from sessionStorage:", e);
    }
    console.log("[ConsentFlowContext] Using default state");
    return defaultState;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log("[ConsentFlowContext] Persisted to sessionStorage:", state);
    } catch (e) {
      console.error("[ConsentFlowContext] Failed to persist to sessionStorage:", e);
    }
  }, [state]);

  const updateState = (updates: Partial<ConsentFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetState = () => {
    setState(defaultState);
    sessionStorage.removeItem(STORAGE_KEY);
    console.log("[ConsentFlowContext] State reset");
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
