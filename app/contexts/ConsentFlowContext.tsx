import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { storage } from '../services/storage';
import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import { US_STATES } from '../lib/constants';

export interface ConsentFlowState {
  universityId: string;
  universityName: string;
  stateCode: string;
  stateName: string;
  selectionMode?: 'select-university' | 'select-state' | 'not-applicable';
  encounterType: string;
  parties: string[];
  intimateActs: Record<string, 'yes' | 'no'>;
  contractStartTime?: string;
  contractDuration?: number;
  contractEndTime?: string;
  method: 'signature' | 'voice' | 'photo' | 'biometric' | null;
  draftId?: string;
  isCollaborative?: boolean;
  contractText?: string;
  signature1?: string;
  signature2?: string;
  photoUrl?: string;
  credentialId?: string;
  credentialPublicKey?: string;
  credentialCounter?: string;
  credentialDeviceType?: string;
  credentialBackedUp?: string;
  authenticatedAt?: string;
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
  const stateCode = preferences?.stateOfResidence || '';
  const stateName = stateCode ? (US_STATES.find(s => s.code === stateCode)?.name || '') : '';
  
  return {
    universityId: preferences?.defaultUniversityId || '',
    universityName: '',
    stateCode,
    stateName,
    selectionMode: undefined,
    encounterType: preferences?.defaultEncounterType || '',
    parties: ['', ''],
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

const STORAGE_KEY = 'pmy_consent_flow_state';

const ConsentFlowContext = createContext<ConsentFlowContextType | undefined>(undefined);

export function ConsentFlowProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<ConsentFlowState>(getDefaultState());
  const [isHydrated, setIsHydrated] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  const { data: preferences, isFetched: preferencesFetched, isError: preferencesError } = useQuery<UserPreferences | null>({
    queryKey: ['user-preferences', user?.id],
    queryFn: async (): Promise<UserPreferences | null> => {
      if (!user) return null;
      const { getUserPreferences } = await import('../services/api');
      const prefs = await getUserPreferences(user.id);
      return prefs || {
        defaultUniversityId: null,
        stateOfResidence: null,
        defaultEncounterType: null,
        defaultContractDuration: null,
      };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setPreferencesLoaded(true);
      return;
    }
    
    if (preferencesFetched || preferencesError) {
      setPreferencesLoaded(true);
    }
  }, [authLoading, user, preferencesFetched, preferencesError]);

  useEffect(() => {
    if (!preferencesLoaded) return;

    async function loadState() {
      try {
        const saved = await storage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          
          const defaultStateWithPrefs = getDefaultState(preferences || undefined);
          const validMethods: Array<ConsentFlowState['method']> = ['signature', 'voice', 'photo', 'biometric', null];
          
          const finalStateCode = (typeof parsed.stateCode === 'string' && parsed.stateCode !== '') ? parsed.stateCode : defaultStateWithPrefs.stateCode;
          const savedStateName = (typeof parsed.stateName === 'string' && parsed.stateName !== '') ? parsed.stateName : defaultStateWithPrefs.stateName;
          const finalStateName = finalStateCode && !savedStateName 
            ? (US_STATES.find(s => s.code === finalStateCode)?.name || '') 
            : savedStateName;
          
          const validModes: Array<ConsentFlowState['selectionMode'] | null> = ['select-university', 'select-state', 'not-applicable', undefined, null];
          const savedSelectionMode = validModes.includes(parsed.selectionMode) 
            ? (parsed.selectionMode === null ? undefined : parsed.selectionMode)
            : undefined;
          
          const validatedState: ConsentFlowState = {
            universityId: (typeof parsed.universityId === 'string' && parsed.universityId !== '') ? parsed.universityId : defaultStateWithPrefs.universityId,
            universityName: (typeof parsed.universityName === 'string' && parsed.universityName !== '') ? parsed.universityName : defaultStateWithPrefs.universityName,
            stateCode: finalStateCode,
            stateName: finalStateName,
            selectionMode: savedSelectionMode,
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
        } else {
          const defaultStateWithPrefs = getDefaultState(preferences || undefined);
          setState(defaultStateWithPrefs);
        }
      } catch (e) {
        console.error('[ConsentFlowContext] Failed to restore from storage:', e);
        setState(getDefaultState(preferences || undefined));
      } finally {
        setIsHydrated(true);
      }
    }
    loadState();
  }, [preferencesLoaded, preferences]);

  useEffect(() => {
    if (!isHydrated) return;
    
    async function saveState() {
      try {
        await storage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('[ConsentFlowContext] Failed to persist to storage:', e);
      }
    }
    saveState();
  }, [state, isHydrated]);

  const updateState = useCallback((updates: Partial<ConsentFlowState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(async () => {
    if (user) {
      await queryClient.invalidateQueries({ queryKey: ['user-preferences', user.id] });
      const latestPrefs = queryClient.getQueryData<UserPreferences>(['user-preferences', user.id]);
      
      const defaultStateWithPrefs = getDefaultState(latestPrefs);
      setState(defaultStateWithPrefs);
      try {
        await storage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('[ConsentFlowContext] Failed to clear storage:', e);
      }
    } else {
      const defaultStateWithPrefs = getDefaultState();
      setState(defaultStateWithPrefs);
      try {
        await storage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.error('[ConsentFlowContext] Failed to clear storage:', e);
      }
    }
  }, [user]);

  const hasRequiredData = useCallback(() => {
    if (!state.encounterType || state.encounterType.trim() === '') {
      return false;
    }
    
    const validParties = state.parties.filter(p => p && p.trim() !== '');
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
    throw new Error('useConsentFlow must be used within ConsentFlowProvider');
  }
  return context;
}

