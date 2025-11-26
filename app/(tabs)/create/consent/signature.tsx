import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConsentFlow } from '@/contexts/ConsentFlowContext';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContract, getUserProfile, updateUserProfile } from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import SignatureInput from '@/components/SignatureInput';
import { format } from 'date-fns';
import { spacing, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

type SignatureType = 'draw' | 'type' | 'upload' | 'saved';

export default function ConsentSignaturePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, hasRequiredData, isHydrated, resetState } = useConsentFlow();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const styles = createStyles(colors);

  const [party1Name, setParty1Name] = useState('');
  const [party2Name, setParty2Name] = useState('');
  const [currentSigner, setCurrentSigner] = useState<1 | 2>(1);
  const [signature1, setSignature1] = useState<string | null>(null);
  const [signature2, setSignature2] = useState<string | null>(null);
  const [signature1Type, setSignature1Type] = useState<SignatureType | null>(null);
  const [signature1Text, setSignature1Text] = useState<string | null>(null);
  const [saveSignature, setSaveSignature] = useState(false);

  // Fetch user profile for saved signature
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => {
      if (!user) return null;
      return getUserProfile(user.id);
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (isHydrated && state.parties.length >= 2) {
      setParty1Name(state.parties[0] || '');
      setParty2Name(state.parties[1] || '');
    }
  }, [isHydrated, state.parties]);

  useEffect(() => {
    if (isHydrated && !hasRequiredData()) {
      Alert.alert("Missing Information", "Please complete the consent flow from the beginning.");
      router.replace('/(tabs)/create' as `/${string}`);
    }
  }, [isHydrated, hasRequiredData]);

  const generateContractText = () => {
    const encounterLabel = state.encounterType.charAt(0).toUpperCase() + state.encounterType.slice(1);
    const date = format(new Date(), "MMMM d, yyyy");

    const intimateActsList = Object.keys(state.intimateActs).length > 0
      ? Object.keys(state.intimateActs).map(act => {
          const formatted = act.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          return `  - ${formatted}`;
        }).join('\n')
      : '  - Not specified';

    let durationText = '';
    if (state.contractStartTime && state.contractEndTime) {
      const startDate = new Date(state.contractStartTime);
      const endDate = new Date(state.contractEndTime);
      durationText = `\nDURATION:\nStart: ${format(startDate, "MMMM d, yyyy 'at' h:mm a")}\nEnd: ${format(endDate, "MMMM d, yyyy 'at' h:mm a")}`;
    }

    return `TITLE IX CONSENT AGREEMENT

This agreement is made on ${date} between the parties named below.

PARTIES INVOLVED:
Party 1: ${party1Name || "[Name Required]"}
Party 2: ${party2Name || "[Name Required]"}

ENCOUNTER TYPE: ${encounterLabel}
${durationText}

INTIMATE ACTS CONSENTED TO:
${intimateActsList}

${state.universityName ? `INSTITUTION: ${state.universityName}\n` : ''}
CONSENT STATEMENT:
Both parties hereby affirm that:
1. They are willingly and voluntarily entering into this ${state.encounterType} encounter
2. They understand that consent must be clear, knowing, and voluntary
3. They acknowledge that consent is active, not passive, and can be withdrawn at any time
4. They are capable of giving consent and are not under the influence of incapacitating substances
5. They agree to respect each other's boundaries and communicate clearly throughout

This document serves as evidence of mutual consent at the time of signing. Both parties understand that consent is ongoing and can be revoked at any time.

SIGNATURES:
The digital signatures below indicate that both parties have read, understood, and agreed to the terms outlined in this consent agreement.`;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!signature1 || !signature2) {
        throw new Error("Both signatures are required");
      }

      // Save signature to user profile if requested (only signature1 - the current user's)
      if (saveSignature && signature1 && signature1Type) {
        await updateUserProfile(user!.id, {
          saved_signature: signature1,
          saved_signature_type: signature1Type,
          saved_signature_text: signature1Text,
        });
        queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      }

      const contractData = {
        user_id: user!.id,
        universityId: state.universityId || null,
        encounterType: state.encounterType,
        parties: state.parties.filter(p => p.trim()),
        intimateActs: JSON.stringify(state.intimateActs),
        contractStartTime: state.contractStartTime || null,
        contractDuration: state.contractDuration || null,
        contractEndTime: state.contractEndTime || null,
        method: 'signature' as const,
        contractText: generateContractText(),
        signature1,
        signature2,
        status: 'active' as const,
        isCollaborative: 'false' as const,
      };

      return createContract(contractData);
    },
    onSuccess: () => {
      resetState();
      Alert.alert("Success", "Consent contract created successfully!", [
        { text: "View Contracts", onPress: () => router.replace('/(tabs)/contracts') }
      ]);
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to create contract");
    },
  });

  const handleSignature1Change = (signature: string | null, type: SignatureType, text?: string) => {
    setSignature1(signature);
    setSignature1Type(type);
    setSignature1Text(text || null);
  };

  const handleSignature2Change = (signature: string | null, type: SignatureType, text?: string) => {
    setSignature2(signature);
  };

  const handleNextSigner = () => {
    if (signature1) {
      setCurrentSigner(2);
    } else {
      Alert.alert("Signature Required", "Please provide your signature before continuing.");
    }
  };

  const handlePreviousSigner = () => {
    setCurrentSigner(1);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.title}>Digital Signature</Text>
          <View style={{ width: spacing.xl }} />
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, signature1 && styles.progressStepComplete]}>
            <Text style={styles.progressStepText}>1</Text>
          </View>
          <View style={[styles.progressLine, signature1 && styles.progressLineComplete]} />
          <View style={[styles.progressStep, signature2 && styles.progressStepComplete, currentSigner === 2 && styles.progressStepActive]}>
            <Text style={styles.progressStepText}>2</Text>
          </View>
        </View>

        {/* Contract Preview */}
        <Card style={[styles.contractCard, styles.contractCardSpacing]}>
          <Text style={styles.contractLabel}>Contract Preview</Text>
          <ScrollView style={styles.contractText} nestedScrollEnabled>
            <Text style={styles.contractTextContent}>{generateContractText()}</Text>
          </ScrollView>
        </Card>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signerHeader}>
            <Text style={styles.signerTitle}>
              {currentSigner === 1 ? `${party1Name || 'Party 1'}'s Signature` : `${party2Name || 'Party 2'}'s Signature`}
            </Text>
            <View style={styles.signerBadge}>
              <Text style={styles.signerBadgeText}>Signer {currentSigner} of 2</Text>
            </View>
          </View>

          {/* Signature Status Indicators */}
          <View style={styles.signatureStatus}>
            <View style={styles.statusItem}>
              <Ionicons
                name={signature1 ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={signature1 ? colors.brand.primary : colors.text.tertiary}
              />
              <Text style={[styles.statusText, signature1 && styles.statusTextComplete]}>
                {party1Name || 'Party 1'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons
                name={signature2 ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={signature2 ? colors.brand.primary : colors.text.tertiary}
              />
              <Text style={[styles.statusText, signature2 && styles.statusTextComplete]}>
                {party2Name || 'Party 2'}
              </Text>
            </View>
          </View>

          {/* Signature Input */}
          {currentSigner === 1 ? (
            <SignatureInput
              onSignatureChange={handleSignature1Change}
              savedSignature={profile?.saved_signature}
              savedSignatureType={profile?.saved_signature_type}
              savedSignatureText={profile?.saved_signature_text}
              initialSignature={signature1}
              autoPopulate={!!profile?.saved_signature}
              showSaveOption={!profile?.saved_signature}
              onSavePreferenceChange={setSaveSignature}
            />
          ) : (
            <SignatureInput
              onSignatureChange={handleSignature2Change}
              initialSignature={signature2}
              showSaveOption={false}
            />
          )}

          {/* Navigation Buttons */}
          <View style={styles.navigationButtons}>
            {currentSigner === 2 && (
              <Button
                title="Previous Signer"
                onPress={handlePreviousSigner}
                variant="outline"
                style={styles.navButton}
              />
            )}
            {currentSigner === 1 && (
              <Button
                title={signature1 ? "Next Signer" : "Sign First"}
                onPress={handleNextSigner}
                disabled={!signature1}
                style={styles.navButton}
              />
            )}
          </View>
        </View>

        {/* Complete Button */}
        {signature1 && signature2 && (
          <Button
            title={saveMutation.isPending ? "Creating Contract..." : "Complete & Save Contract"}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={styles.completeButton}
          />
        )}

        {/* Help Text */}
        <Text style={styles.helpText}>
          Both parties must sign to complete this consent agreement. Pass the device to each signer when it's their turn.
        </Text>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.ui.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    borderColor: colors.brand.primary,
  },
  progressStepComplete: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  progressStepText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.ui.border,
    marginHorizontal: spacing.sm,
  },
  progressLineComplete: {
    backgroundColor: colors.brand.primary,
  },
  contractCard: {
    maxHeight: 200,
  },
  contractCardSpacing: {
    marginBottom: spacing.lg,
  },
  contractLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contractText: {
    maxHeight: 160,
  },
  contractTextContent: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  signatureSection: {
    marginBottom: spacing.lg,
  },
  signerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  signerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  signerBadge: {
    backgroundColor: colors.brand.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  signerBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.brand.primary,
  },
  signatureStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
  },
  statusTextComplete: {
    color: colors.brand.primary,
    fontWeight: typography.weight.medium,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  navButton: {
    minWidth: 140,
  },
  completeButton: {
    backgroundColor: colors.brand.primary,
    marginBottom: spacing.md,
  },
  helpText: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
