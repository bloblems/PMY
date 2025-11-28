import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
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
import { spacing, layout, typography } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConsentFlowPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { state, updateState: updateFlowState, resetState, isHydrated } = useConsentFlow();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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

  // Fetch user contacts (Supabase returns snake_case)
  const { data: contacts = [] } = useQuery({
    queryKey: ['user-contacts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const apiContacts = await getUserContacts(user.id);
      return apiContacts.map((contact: any) => ({
        id: contact.id,
        userId: contact.user_id,
        contactUsername: contact.username || contact.name || '',
        nickname: null,
        createdAt: contact.created_at,
      }));
    },
    enabled: !!user,
  });

  // Fetch current user data for pre-fill
  const { data: userData } = useQuery<{ 
    id: string; 
    email: string; 
    username?: string;
  } | null>({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const profile = await getUserProfile(user.id);
      return profile ? {
        id: profile.id,
        email: '',
        username: profile.username,
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
    if (!fromState.draftId) {
      return 1;
    }
    
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

  // Initialize step - start at 1 for new flows, or resume from draft
  const [step, setStep] = useState(1);
  
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!isHydrated || hasInitializedRef.current) return;
    
    const resumeDraftId = params.resumeDraftId as string | undefined;
    
    // Always start at step 1 for new flows, use getInitialStep for drafts
    if (!resumeDraftId && !state.draftId) {
      setStep(1);
      hasInitializedRef.current = true;
    } else if (resumeDraftId || state.draftId) {
      // For drafts, use getInitialStep to determine where to resume
      const resumeStep = getInitialStep(state);
      setStep(resumeStep);
      hasInitializedRef.current = true;
    }
  }, [isHydrated, params.resumeDraftId, state.draftId, state]);

  useEffect(() => {
    if (universities.length > 0 && doesEncounterTypeRequireUniversity(state.encounterType) && state.universityId) {
      const university = universities.find(u => u.id === state.universityId);
      if (university) {
        setSelectedUniversity(university);
      }
    }
  }, [universities, state.universityId, state.encounterType]);

  useEffect(() => {
    if (state.stateCode && state.stateName) {
      setSelectedState({ code: state.stateCode, name: state.stateName });
    }
  }, [state.stateCode, state.stateName]);

  useEffect(() => {
    if (userData?.username && state.parties[0] === "" && isHydrated) {
      const newParties = [...state.parties];
      newParties[0] = `@${userData.username}`;
      updateFlowState({ parties: newParties });
    }
  }, [userData?.username, state.parties, isHydrated, updateFlowState]);

  // Load draft for resume editing
  useEffect(() => {
    if (!isHydrated || !user) return;
    
    const resumeDraftId = params.resumeDraftId as string | undefined;
    
    if (resumeDraftId) {
      getContract(resumeDraftId, user.id)
        .then(draft => {
          if (!draft) return;
          
          // Supabase returns snake_case column names
          const draftData = draft as any;
          let parsedIntimateActs = {};
          const intimateActsRaw = draftData.intimate_acts;
          if (typeof intimateActsRaw === 'string') {
            try {
              parsedIntimateActs = JSON.parse(intimateActsRaw);
            } catch (e) {
              console.error('Failed to parse intimate_acts:', e);
            }
          } else if (intimateActsRaw) {
            parsedIntimateActs = intimateActsRaw;
          }

          const normalizedParties = (draft.parties || ["", ""]).map((party: string) => {
            return normalizeUsername(party);
          });

          normalizedParties.forEach((party: string, index: number) => {
            validateParty(index, party);
          });

          updateFlowState({
            draftId: draft.id,
            universityId: draftData.university_id || "",
            universityName: draftData.university_name || "",
            encounterType: draftData.encounter_type || "",
            parties: normalizedParties,
            intimateActs: parsedIntimateActs,
            contractStartTime: draftData.contract_start_time || undefined,
            contractDuration: draftData.contract_duration || undefined,
            contractEndTime: draftData.contract_end_time || undefined,
            method: draftData.method as ConsentFlowState['method'] || null,
            isCollaborative: draftData.is_collaborative === 'true',
            contractText: draftData.contract_text || undefined,
            signature1: draftData.signature_1 || undefined,
            signature2: draftData.signature_2 || undefined,
            photoUrl: draftData.photo_url || undefined,
          });
        })
        .catch(err => {
          console.error('Failed to load draft:', err);
          Alert.alert("Error", "Failed to load draft for editing");
        });
    }
  }, [isHydrated, user, params.resumeDraftId, normalizeUsername, validateParty, updateFlowState]);

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

  const saveAsDraftMutation = useMutation({
    mutationFn: async () => {
      if (state.isCollaborative) {
        throw new Error("Cannot save changes to a collaborative draft.");
      }

      // Use snake_case column names for Supabase
      const draftData = {
        contract_text: state.contractText || `Consent Contract\n\nEncounter Type: ${state.encounterType}\nParties: ${state.parties.filter(p => p.trim()).join(", ")}\nIntimate Acts: ${Object.keys(state.intimateActs).join(", ")}\nUniversity: ${state.universityName || "N/A"}\n`,
        university_id: state.universityId || null,
        encounter_type: state.encounterType,
        parties: state.parties.filter(p => p.trim()),
        intimate_acts: JSON.stringify(state.intimateActs),
        contract_start_time: state.contractStartTime || null,
        contract_duration: state.contractDuration || null,
        contract_end_time: state.contractEndTime || null,
        method: state.method,
        status: "draft",
        is_collaborative: 'false' as const,
        signature_1: state.signature1 || null,
        signature_2: state.signature2 || null,
        photo_url: state.photoUrl || null,
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

  const shareContractMutation = useMutation({
    mutationFn: async (recipient: string) => {
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

  const handleInterpretCustomText = async (context: "encounterType" | "intimateActs") => {
    if (!customText.trim()) {
      Alert.alert("Please enter text", "Describe what you're looking for");
      return;
    }

    setIsInterpreting(true);
    try {
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

  const canProceed = () => {
    if (step === flowSteps.encounterType) {
      return state.encounterType !== "";
    } else if (step === flowSteps.university) {
      return state.universityId !== "" || state.stateCode !== "" || state.selectionMode === "not-applicable";
    } else if (step === flowSteps.parties) {
      // Require at least 2 valid parties (both fields filled)
      const validParties = state.parties.filter(p => p.trim() !== "");
      const hasEnoughParties = validParties.length >= 2;
      const hasErrors = Object.keys(partyErrors).length > 0;
      return hasEnoughParties && !hasErrors;
    } else if (step === flowSteps.intimateActs) {
      // Require at least one intimate act to be selected
      const hasSelectedActs = Object.keys(state.intimateActs).length > 0;
      return hasSelectedActs;
    } else if (step === flowSteps.duration) {
      return true; // Duration is optional
    } else if (step === flowSteps.recordingMethod) {
      return state.method !== null;
    }
    return false;
  };

  // Get validation message for current step
  const getValidationMessage = () => {
    if (step === flowSteps.encounterType && !state.encounterType) {
      return "Please select an encounter type";
    } else if (step === flowSteps.university) {
      if (state.selectionMode !== "not-applicable" && !state.universityId && !state.stateCode) {
        return "Please select a university, state, or mark as not applicable";
      }
    } else if (step === flowSteps.parties) {
      const validParties = state.parties.filter(p => p.trim() !== "");
      if (validParties.length < 2) {
        return "Please enter names for both parties";
      }
      if (Object.keys(partyErrors).length > 0) {
        return "Please fix the errors in party names";
      }
    } else if (step === flowSteps.intimateActs) {
      if (Object.keys(state.intimateActs).length === 0) {
        return "Please select at least one intimate act";
      }
    } else if (step === flowSteps.recordingMethod && !state.method) {
      return "Please select a recording method";
    }
    return null;
  };

  const handleNext = () => {
    if (!canProceed()) {
      const message = getValidationMessage();
      if (message) {
        Alert.alert("Required Information", message);
      }
      return;
    }

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
        router.push(`/(tabs)/create/consent/signature?${params.toString()}` as `/${string}`);
      } else if (state.method === "voice") {
        router.push(`/(tabs)/create/consent/voice?${params.toString()}` as `/${string}`);
      } else if (state.method === "photo") {
        router.push(`/(tabs)/create/consent/photo?${params.toString()}` as `/${string}`);
      } else if (state.method === "biometric") {
        router.push(`/(tabs)/create/consent/biometric?${params.toString()}` as `/${string}`);
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

  const styles = createStyles(colors, insets);

  if (authLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.dark }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </View>
    );
  }

  if (!isHydrated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.dark }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    router.replace('/auth');
    return (
      <View style={[styles.container, { backgroundColor: colors.background.dark }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Header with Progress & Save */}
        <View style={styles.headerRow}>
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
          {step > flowSteps.encounterType && (
            <TouchableOpacity
              onPress={() => {
                if (canSaveDraft(state, step)) {
                  saveAsDraftMutation.mutate();
                } else {
                  Alert.alert("Cannot save yet", "Please select an encounter type before saving");
                }
              }}
              disabled={saveAsDraftMutation.isPending || !canSaveDraft(state, step)}
              style={[
                styles.saveExitButton,
                (saveAsDraftMutation.isPending || !canSaveDraft(state, step)) && styles.saveExitButtonDisabled
              ]}
            >
              <Text style={styles.saveExitText}>
                {saveAsDraftMutation.isPending ? "Saving..." : "Save & Exit"}
              </Text>
            </TouchableOpacity>
          )}
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
              // Defer state update to avoid updating during render
              setTimeout(() => {
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
              }, 0);
            }}
            onUniversitySelect={(university) => {
              if (university) {
                setSelectedUniversity(university);
                // Defer state update to avoid updating during render
                setTimeout(() => {
                  updateFlowState({
                    universityId: university.id,
                    universityName: university.name,
                    stateCode: "",
                    stateName: "",
                  });
                }, 0);
              }
            }}
            onStateSelect={(state) => {
              if (state) {
                setSelectedState(state);
                // Defer state update to avoid updating during render
                setTimeout(() => {
                  updateFlowState({
                    stateCode: state.code,
                    stateName: state.name,
                    universityId: "",
                    universityName: "",
                  });
                }, 0);
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
      </View>

      {/* Bottom fixed area */}
      <View style={styles.bottomArea}>
        {/* Validation Message */}
        {!canProceed() && getValidationMessage() && (
          <View style={styles.validationMessage}>
            <Ionicons name="information-circle" size={18} color={colors.status.warning} />
            <Text style={styles.validationMessageText}>{getValidationMessage()}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
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
                style={[styles.shareButton, styles.shareButtonSpacing] as any}
              />
            </View>
          )}

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
                style={[
                  styles.nextButton,
                  styles.nextButtonSpacing,
                  !canProceed() && styles.buttonDisabledStyle
                ]}
              />
            </View>
          )}
          {step === flowSteps.encounterType && (
            <Button
              title="Next"
              onPress={handleNext}
              style={[
                styles.nextButtonFull,
                !canProceed() && styles.buttonDisabledStyle
              ]}
            />
          )}
        </View>
      </View>

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

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>, insets: { bottom: number }) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  stepContentWrapper: {
    flex: 1,
    marginTop: spacing.md,
  },
  bottomArea: {
    paddingHorizontal: spacing.lg,
    paddingBottom: insets.bottom + spacing.sm,
    backgroundColor: colors.background.dark,
  },
  headerRow: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveExitButton: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background.card,
  },
  saveExitButtonDisabled: {
    opacity: 0.5,
  },
  saveExitText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.ui.borderDark,
  },
  progressDotSpacing: {
    marginLeft: spacing.sm,
  },
  progressDotActive: {
    width: 32,
    backgroundColor: colors.brand.primary,
  },
  progressDotCompleted: {
    backgroundColor: colors.brand.primary + '80',
  },
  actions: {
    paddingTop: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  nextButtonSpacing: {
    marginLeft: spacing.md,
  },
  backButtonFooter: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
    backgroundColor: colors.brand.primary,
  },
  nextButtonFull: {
    width: '100%',
    backgroundColor: colors.brand.primary,
  },
  buttonDisabledStyle: {
    opacity: 0.5,
  },
  validationMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.warning + '15',
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  validationMessageText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.status.warning,
    fontWeight: typography.weight.medium,
  },
  shareRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  shareButton: {
    flex: 1,
  },
  shareButtonSpacing: {
    marginLeft: spacing.md,
  },
  stepContainer: {
    marginTop: spacing.md,
  },
  stepHeader: {
    marginBottom: spacing.md,
  },
  stepTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
    color: colors.text.inverse,
  },
  stepSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
});

