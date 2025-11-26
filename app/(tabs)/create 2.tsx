import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConsentFlow, type ConsentFlowState } from '@/contexts/ConsentFlowContext';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useConsentFlowValidation } from '@/hooks/useConsentFlowValidation';
import { getAllUniversities, getUserContacts, getUserProfile, createContract, getContract, updateContract } from '@/services/api';
import { doesEncounterTypeRequireUniversity, type UserContact, type University } from '@/lib/consentFlowConstants';
import { EncounterTypeStep } from '@/components/consent-flow/EncounterTypeStep';
import { UniversitySelectionStep } from '@/components/consent-flow/UniversitySelectionStep';
import { PartiesStep } from '@/components/consent-flow/PartiesStep';
import { IntimateActsStep } from '@/components/consent-flow/IntimateActsStep';
import { RecordingMethodStep } from '@/components/consent-flow/RecordingMethodStep';
import ContractDurationStep from '@/components/consent-flow/ContractDurationStep';
import Button from '@/components/Button';
import { ShareDialog } from '@/components/ShareDialog';
import { CustomEncounterDialog } from '@/components/CustomEncounterDialog';
import { AdvancedActsDialog } from '@/components/AdvancedActsDialog';
import { Alert } from 'react-native';
import { colors, spacing } from '@/lib/theme';

export default function ConsentFlowPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { state, updateState: updateFlowState, resetState, isHydrated } = useConsentFlow();
  const queryClient = useQueryClient();

  const {
    partyErrors,
    normalizeUsername,
    validateParty,
    reindexErrors,
    canSaveDraft,
    canSaveOrShare,
  } = useConsentFlowValidation();

  // Fetch universities
  const { data: universities = [] } = useQuery<University[]>({
    queryKey: ['universities'],
    queryFn: getAllUniversities,
  });

  // Fetch user contacts
  const { data: contacts = [] } = useQuery({
    queryKey: ['user-contacts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const apiContacts = await getUserContacts(user.id);
      // Map to local UserContact type
      return apiContacts.map(contact => ({
        id: contact.id,
        userId: contact.userId,
        contactUsername: contact.username || contact.name || '',
        nickname: null,
        createdAt: contact.createdAt,
      }));
    },
    enabled: !!user,
  });

  // Fetch current user data for pre-fill
  const { data: userData } = useQuery<{ 
    id: string; 
    email: string; 
    username?: string;
    firstName?: string;
    lastName?: string;
  } | null>({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const profile = await getUserProfile(user.id);
      return profile ? {
        id: profile.id,
        email: '', // Email not in profile
        username: profile.username,
        firstName: profile.firstName || undefined,
        lastName: profile.lastName || undefined,
      } : null;
    },
    enabled: !!user,
  });

  // Dialog state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCustomEncounterDialog, setShowCustomEncounterDialog] = useState(false);
  const [showCustomActsDialog, setShowCustomActsDialog] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);

  // Track selected university and state
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [selectedState, setSelectedState] = useState<{ code: string; name: string } | null>(null);
  const [selectionMode, setSelectionMode] = useState<"select-university" | "select-state" | "not-applicable">(
    state.selectionMode || "select-university"
  );

  // Get dynamic step configuration
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
        university: null,
        parties: 2,
        intimateActs: 3,
        duration: 4,
        recordingMethod: 5,
        totalSteps: 5,
      };
    }
  };

  const flowSteps = useMemo(() => getFlowSteps(), [state.encounterType]);

  // Determine initial step
  const getInitialStep = (fromState: ConsentFlowState) => {
    // If no draftId, always start at step 1 (fresh start)
    // This prevents preferences from causing us to skip steps
    if (!fromState.draftId) {
      return 1;
    }
    
    // Only advance steps if we're resuming a draft
    if (!fromState.encounterType) return 1;
    
    const requiresUniversity = doesEncounterTypeRequireUniversity(fromState.encounterType);
    const steps = requiresUniversity
      ? { encounterType: 1, university: 2, parties: 3, intimateActs: 4, duration: 5, recordingMethod: 6, totalSteps: 6 }
      : { encounterType: 1, university: null, parties: 2, intimateActs: 3, duration: 4, recordingMethod: 5, totalSteps: 5 };
    
    if (fromState.method) return steps.recordingMethod;
    if (fromState.contractStartTime || fromState.contractDuration) return steps.recordingMethod;
    if (Object.keys(fromState.intimateActs).length > 0) return steps.duration;
    if (fromState.parties.some((p: string) => p.trim() !== "")) return steps.intimateActs;
    if (fromState.universityId && steps.university) return steps.parties;
    if (fromState.stateCode && fromState.stateName && steps.university) return steps.parties;
    if (fromState.encounterType) return steps.university || steps.parties;
    
    return 1;
  };

  // Use a ref to track if we've initialized to prevent reset on navigation
  const stepRef = useRef<number | null>(null);
  const [step, setStep] = useState(() => {
    const initialStep = getInitialStep(state);
    stepRef.current = initialStep;
    return initialStep;
  });
  
  // Only update step on initial hydration, preserve it when navigating
  useEffect(() => {
    if (isHydrated && stepRef.current === null) {
      const currentStep = getInitialStep(state);
      stepRef.current = currentStep;
      setStep(currentStep);
    }
  }, [isHydrated]);

  // Sync selected university
  useEffect(() => {
    if (universities.length > 0 && doesEncounterTypeRequireUniversity(state.encounterType) && state.universityId) {
      const university = universities.find(u => u.id === state.universityId);
      if (university) {
        setSelectedUniversity(university);
      }
    }
  }, [universities, state.universityId, state.encounterType]);

  // Sync selected state
  useEffect(() => {
    if (state.stateCode && state.stateName) {
      setSelectedState({ code: state.stateCode, name: state.stateName });
    }
  }, [state.stateCode, state.stateName]);

  // Pre-fill first participant with logged-in user's username
  useEffect(() => {
    if (userData?.username && state.parties[0] === "" && isHydrated) {
      const newParties = [...state.parties];
      newParties[0] = `@${userData.username}`;
      updateFlowState({ parties: newParties });
    }
  }, [userData?.username, state.parties, isHydrated, updateFlowState]);

  // Ensure we start at step 1 when navigating fresh (no draftId)
  // Only run once on initial mount, not on every step change
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!isHydrated || hasInitializedRef.current) return;
    
    const resumeDraftId = params.resumeDraftId as string | undefined;
    
    // If no draft ID, ensure we start at step 1
    // This handles the case where preferences might have pre-filled data
    if (!resumeDraftId && !state.draftId) {
      setStep(1);
      hasInitializedRef.current = true;
    } else if (resumeDraftId || state.draftId) {
      // If we have a draft, mark as initialized so we don't interfere
      hasInitializedRef.current = true;
    }
  }, [isHydrated, params.resumeDraftId, state.draftId]);

  // Load draft for resume editing
  useEffect(() => {
    if (!isHydrated || !user) return;
    
    const resumeDraftId = params.resumeDraftId as string | undefined;
    
    if (resumeDraftId) {
      getContract(resumeDraftId, user.id)
        .then(draft => {
          if (!draft) return;
          
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
          
          const normalizedParties = (draft.parties || ["", ""]).map((party: string) => {
            return normalizeUsername(party);
          });

          normalizedParties.forEach((party: string, index: number) => {
            validateParty(index, party);
          });

          updateFlowState({
            draftId: draft.id,
            universityId: (draft as any).universityId || "",
            universityName: (draft as any).universityName || "",
            encounterType: draft.encounterType || "",
            parties: normalizedParties,
            intimateActs: parsedIntimateActs,
            contractStartTime: (draft as any).contractStartTime || undefined,
            contractDuration: (draft as any).contractDuration || undefined,
            contractEndTime: (draft as any).contractEndTime || undefined,
            method: (draft as any).method as ConsentFlowState['method'] || null,
            isCollaborative: (draft as any).isCollaborative === true,
            contractText: draft.contractText || undefined,
            signature1: (draft as any).signature1 || undefined,
            signature2: (draft as any).signature2 || undefined,
            photoUrl: (draft as any).photoUrl || undefined,
          });
        })
        .catch(err => {
          console.error('Failed to load draft:', err);
          Alert.alert("Error", "Failed to load draft for editing");
        });
    }
  }, [isHydrated, user, params.resumeDraftId, normalizeUsername, validateParty, updateFlowState]);

  // Party management
  const addParty = () => {
    updateFlowState({ parties: [...state.parties, ""] });
  };

  const updateParty = (index: number, value: string) => {
    const newParties = [...state.parties];
    const normalizedValue = normalizeUsername(value);
    newParties[index] = normalizedValue;
    validateParty(index, normalizedValue);
    updateFlowState({ parties: newParties });
  };

  const removeParty = (index: number) => {
    const newParties = state.parties.filter((_, i) => i !== index);
    updateFlowState({ parties: newParties.length === 0 ? [""] : newParties });
    reindexErrors(index);
  };

  const addContactAsParty = (contact: UserContact) => {
    const canonicalUsername = `@${contact.contactUsername}`;
    const alreadyExists = state.parties.some(party => 
      party.toLowerCase() === canonicalUsername.toLowerCase()
    );
    
    if (alreadyExists) return;
    
    const emptyIndex = state.parties.findIndex((party, index) => index > 0 && party.trim() === "");
    if (emptyIndex !== -1) {
      const newParties = [...state.parties];
      newParties[emptyIndex] = canonicalUsername;
      updateFlowState({ parties: newParties });
    } else {
      updateFlowState({ parties: [...state.parties, canonicalUsername] });
    }
  };

  const toggleIntimateAct = (act: string) => {
    const currentState = state.intimateActs[act];
    const newActs = { ...state.intimateActs };
    
    if (!currentState) {
      newActs[act] = "yes";
    } else if (currentState === "yes") {
      newActs[act] = "no";
    } else {
      delete newActs[act];
    }
    
    updateFlowState({ intimateActs: newActs });
  };

  // Save as draft mutation
  const saveAsDraftMutation = useMutation({
    mutationFn: async () => {
      if (state.isCollaborative) {
        throw new Error("Cannot save changes to a collaborative draft.");
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
        signature1: state.signature1 || null,
        signature2: state.signature2 || null,
        photoUrl: state.photoUrl || null,
      };
      
      if (state.draftId && !state.isCollaborative) {
        const updated = await updateContract(state.draftId, user!.id, draftData);
        return { id: state.draftId, ...draftData } as any;
      } else {
        const created = await createContract({
          ...draftData,
          user_id: user!.id,
        });
        return created;
      }
    },
    onSuccess: (draft) => {
      updateFlowState({ draftId: draft.id });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      Alert.alert("Draft saved", "Your consent contract has been saved as a draft");
      router.push('/(tabs)/contracts');
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to save draft");
    },
  });

  // Share contract mutation
  const shareContractMutation = useMutation({
    mutationFn: async (recipient: string) => {
      // TODO: Implement share API call
      throw new Error("Share functionality not yet implemented");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setShowShareDialog(false);
      Alert.alert("Contract shared", "Invitation sent successfully");
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to share contract");
    },
  });

  // AI interpretation handler
  const handleInterpretCustomText = async (context: "encounterType" | "intimateActs") => {
    if (!customText.trim()) {
      Alert.alert("Please enter text", "Describe what you're looking for");
      return;
    }

    setIsInterpreting(true);
    try {
      // TODO: Implement AI interpretation API call
      // For now, just show an alert
      Alert.alert("AI Interpretation", "AI interpretation feature coming soon");
      setShowCustomEncounterDialog(false);
      setShowCustomActsDialog(false);
      setCustomText("");
    } catch (error) {
      Alert.alert("Error", "Failed to interpret your input. Please try again.");
    } finally {
      setIsInterpreting(false);
    }
  };

  // Validation
  const canProceed = () => {
    if (step === flowSteps.encounterType) {
      return state.encounterType !== "";
    } else if (step === flowSteps.university) {
      return state.universityId !== "" || state.stateCode !== "" || state.selectionMode === "not-applicable";
    } else if (step === flowSteps.parties) {
      const hasParties = state.parties.some(p => p.trim() !== "");
      const hasErrors = Object.keys(partyErrors).length > 0;
      return hasParties && !hasErrors;
    } else if (step === flowSteps.intimateActs) {
      return true;
    } else if (step === flowSteps.duration) {
      return true;
    } else if (step === flowSteps.recordingMethod) {
      return state.method !== null;
    }
    return false;
  };

  const handleNext = () => {
    if (!canProceed()) return;

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
      const params = new URLSearchParams();
      if (state.universityId) {
        params.set("universityId", state.universityId);
        params.set("universityName", state.universityName);
      }
      params.set("encounterType", state.encounterType);
      params.set("parties", JSON.stringify(state.parties.filter(p => p.trim() !== "")));
      params.set("intimateActs", JSON.stringify(state.intimateActs));
      params.set("method", state.method);
      
      if (state.method === "signature") {
        router.push(`/consent/signature?${params.toString()}`);
      } else if (state.method === "voice") {
        router.push(`/consent/voice?${params.toString()}`);
      } else if (state.method === "photo") {
        router.push(`/consent/photo?${params.toString()}`);
      } else if (state.method === "biometric") {
        router.push(`/consent/biometric?${params.toString()}`);
      }
    }
  };

  const handleBack = () => {
    if (step === flowSteps.parties) {
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

  if (authLoading || !isHydrated) {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </View>
    );
  }

  if (!user) {
    router.replace('/auth');
    return null;
  }

  return (
    <View style={styles.container}>
        <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {Array.from({ length: flowSteps.totalSteps }, (_, i) => i + 1).map((s) => (
            <View
              key={s}
              style={[
                styles.progressDot,
                s > 1 && styles.progressDotSpacing,
                s === step && styles.progressDotActive,
                s < step && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Step Content */}
        <View style={styles.stepContentWrapper}>
          {step === flowSteps.encounterType && (
            <EncounterTypeStep
              selectedEncounterType={state.encounterType}
              stepNumber={step}
              onSelect={(encounterType) => updateFlowState({ encounterType })}
              onShowCustomDialog={() => setShowCustomEncounterDialog(true)}
            />
          )}

        {step === flowSteps.university && flowSteps.university !== null && (
          <UniversitySelectionStep
            stepNumber={step}
            selectionMode={selectionMode}
            selectedUniversity={selectedUniversity}
            selectedState={selectedState}
            universities={universities}
            onSelectionModeChange={(mode) => {
              setSelectionMode(mode);
              if (mode === "not-applicable") {
                updateFlowState({ 
                  selectionMode: mode,
                  universityId: "", 
                  universityName: "",
                  stateCode: "",
                  stateName: "",
                });
              } else if (mode === "select-university") {
                updateFlowState({ selectionMode: mode, stateCode: "", stateName: "" });
              } else if (mode === "select-state") {
                updateFlowState({ selectionMode: mode, universityId: "", universityName: "" });
              }
            }}
            onUniversitySelect={(university) => {
              if (university) {
                setSelectedUniversity(university);
                updateFlowState({
                  universityId: university.id,
                  universityName: university.name,
                  stateCode: "",
                  stateName: "",
                });
              }
            }}
            onStateSelect={(state) => {
              if (state) {
                setSelectedState(state);
                updateFlowState({
                  stateCode: state.code,
                  stateName: state.name,
                  universityId: "",
                  universityName: "",
                });
              }
            }}
            onNavigateToTitleIX={() => router.push('/(tabs)/tools/titleix')}
            onNavigateToStateLaws={() => router.push('/(tabs)/tools/state-laws')}
          />
        )}

        {step === flowSteps.parties && (
          <PartiesStep
            stepNumber={step}
            parties={state.parties}
            partyErrors={partyErrors}
            contacts={contacts}
            onUpdateParty={updateParty}
            onRemoveParty={removeParty}
            onAddParty={addParty}
            onAddContactAsParty={addContactAsParty}
          />
        )}

        {step === flowSteps.intimateActs && (
          <IntimateActsStep
            stepNumber={step}
            intimateActs={state.intimateActs}
            onToggle={toggleIntimateAct}
            onShowAdvancedOptions={() => setShowCustomActsDialog(true)}
          />
        )}

        {step === flowSteps.duration && (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Step {step}: Contract Duration</Text>
              <Text style={styles.stepSubtitle}>Define when consent starts and how long it's valid (optional)</Text>
            </View>
            <ContractDurationStep
              contractStartTime={state.contractStartTime}
              contractDuration={state.contractDuration}
              contractEndTime={state.contractEndTime}
              onUpdate={(updates) => updateFlowState(updates)}
            />
          </View>
        )}

        {step === flowSteps.recordingMethod && (
          <RecordingMethodStep
            selectedMethod={state.method}
            stepNumber={step}
            onSelect={(method) => updateFlowState({ method })}
          />
        )}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {/* Save & Exit button - available on all steps after Step 1 */}
          {step > flowSteps.encounterType && (
            <Button
              title={saveAsDraftMutation.isPending ? "Saving..." : "Save & Exit"}
              onPress={() => {
                if (canSaveDraft(state, step)) {
                  saveAsDraftMutation.mutate();
                } else {
                  Alert.alert("Cannot save yet", "Please select an encounter type before saving");
                }
              }}
              disabled={saveAsDraftMutation.isPending || !canSaveDraft(state, step)}
              variant="outline"
              style={styles.saveButton}
            />
          )}
          {(step === flowSteps.recordingMethod || step > flowSteps.encounterType) && (
            <View style={styles.actionsSpacing} />
          )}

          {/* Share button on recording method step */}
          {step === flowSteps.recordingMethod && (
            <View style={styles.shareRow}>
              <Button
                title="Save as Draft"
                onPress={() => {
                  if (canSaveOrShare(state)) {
                    saveAsDraftMutation.mutate();
                  } else {
                    Alert.alert("Incomplete form", "Please fill in encounter type, at least one party name, and select a method");
                  }
                }}
                disabled={saveAsDraftMutation.isPending || !canSaveOrShare(state)}
                variant="outline"
                style={styles.shareButton}
              />
              <Button
                title="Share"
                onPress={() => {
                  if (canSaveOrShare(state)) {
                    setShowShareDialog(true);
                  } else {
                    Alert.alert("Incomplete form", "Please fill in encounter type, at least one party name, and select a method");
                  }
                }}
                disabled={shareContractMutation.isPending || !canSaveOrShare(state)}
                variant="outline"
                style={[styles.shareButton, styles.shareButtonSpacing]}
              />
            </View>
          )}

          {/* Navigation buttons */}
          {step > flowSteps.encounterType && (
            <View style={styles.buttonRow}>
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
                style={styles.backButtonFooter}
              />
              <Button
                title={step === flowSteps.recordingMethod ? "Continue" : "Next"}
                onPress={handleNext}
                disabled={!canProceed()}
                style={[styles.nextButton, styles.nextButtonSpacing]}
              />
            </View>
          )}
          {step === flowSteps.encounterType && (
            <Button
              title="Next"
              onPress={handleNext}
              disabled={!canProceed()}
              style={styles.nextButtonFull}
            />
          )}
        </View>
      </ScrollView>

      {/* Dialogs */}
      <ShareDialog
        visible={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        onShare={(recipient, mode) => shareContractMutation.mutate(recipient)}
        loading={shareContractMutation.isPending}
      />

      <CustomEncounterDialog
        visible={showCustomEncounterDialog}
        onClose={() => {
          setShowCustomEncounterDialog(false);
          setCustomText('');
        }}
        onSubmit={(text) => {
          setCustomText(text);
          handleInterpretCustomText('encounterType');
        }}
        loading={isInterpreting}
      />

      <AdvancedActsDialog
        visible={showCustomActsDialog}
        onClose={() => {
          setShowCustomActsDialog(false);
          setCustomText('');
        }}
        onSubmit={(text) => {
          setCustomText(text);
          handleInterpretCustomText('intimateActs');
        }}
        loading={isInterpreting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 100, // Space for bottom nav if needed, though Tabs handles it
  },
  stepContentWrapper: {
    marginTop: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  progressDotSpacing: {
    marginLeft: 8,
  },
  progressDotActive: {
    width: 32,
    backgroundColor: '#34C759',
  },
  progressDotCompleted: {
    backgroundColor: '#34C75980',
  },
  actions: {
    paddingTop: 16,
  },
  actionsSpacing: {
    marginTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  nextButtonSpacing: {
    marginLeft: 12,
  },
  backButtonFooter: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#34C759',
  },
  nextButtonFull: {
    width: '100%',
    backgroundColor: '#34C759',
  },
  saveButton: {
    width: '100%',
    marginBottom: 8,
  },
  shareRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  shareButton: {
    flex: 1,
  },
  shareButtonSpacing: {
    marginLeft: 12,
  },
  stepContainer: {
    marginTop: 16,
  },
  stepHeader: {
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    color: '#fff',
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#999',
  },
});

