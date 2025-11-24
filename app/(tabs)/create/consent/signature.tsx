import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useConsentFlow } from '@/contexts/ConsentFlowContext';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { createContract } from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { format } from 'date-fns';
import { spacing, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ConsentSignaturePage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { state, hasRequiredData, isHydrated } = useConsentFlow();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [party1Name, setParty1Name] = useState('');
  const [party2Name, setParty2Name] = useState('');
  const [currentSigner, setCurrentSigner] = useState<1 | 2>(1);
  const [signature1, setSignature1] = useState<string | null>(null);
  const [signature2, setSignature2] = useState<string | null>(null);

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
      Alert.alert("Success", "Consent contract created successfully");
      router.replace('/(tabs)/contracts');
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "Failed to create contract");
    },
  });

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

        <Card style={[styles.contractCard, styles.contractCardSpacing]}>
          <ScrollView style={styles.contractText}>
            <Text style={styles.contractTextContent}>{generateContractText()}</Text>
          </ScrollView>
        </Card>

        <Card style={[styles.signatureCard, styles.signatureCardSpacing]}>
          <Text style={styles.signatureTitle}>
            Signer {currentSigner}: {currentSigner === 1 ? party1Name : party2Name}
          </Text>
          <View style={[styles.signatureArea, styles.signatureAreaSpacing]}>
            <Text style={styles.signaturePlaceholder}>
              {currentSigner === 1 && signature1 ? "✓ Signed" : currentSigner === 2 && signature2 ? "✓ Signed" : "Tap to sign"}
            </Text>
          </View>
          <Button
            title={currentSigner === 1 && signature1 ? "Clear & Re-sign" : "Sign"}
            onPress={() => {
              // TODO: Implement signature capture
              if (currentSigner === 1) {
                setSignature1("signature1_data");
              } else {
                setSignature2("signature2_data");
              }
              if (currentSigner === 1) {
                setCurrentSigner(2);
              }
            }}
            style={[styles.signButton, styles.signButtonSpacing]}
          />
        </Card>

        {signature1 && signature2 && (
          <Button
            title={saveMutation.isPending ? "Saving..." : "Complete Contract"}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={[styles.completeButton, styles.completeButtonSpacing]}
          />
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('../lib/theme').getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  contractCardSpacing: {
    marginTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  contractCard: {
    maxHeight: 300,
  },
  contractText: {
    maxHeight: 280,
  },
  contractTextContent: {
    fontSize: typography.size.sm,
    color: colors.text.inverse,
    lineHeight: 20,
  },
  signatureCard: {
  },
  signatureCardSpacing: {
    marginTop: spacing.lg,
  },
  signatureTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  signatureArea: {
    height: 150,
    backgroundColor: colors.background.card,
    borderWidth: 2,
    borderColor: colors.ui.borderDark,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureAreaSpacing: {
    marginTop: spacing.md,
  },
  signaturePlaceholder: {
    fontSize: typography.size.md,
    color: colors.text.tertiary,
  },
  signButton: {
    marginTop: spacing.sm,
  },
  signButtonSpacing: {
    marginTop: spacing.md,
  },
  completeButton: {
    backgroundColor: colors.brand.primary,
    marginTop: spacing.sm,
  },
  completeButtonSpacing: {
    marginTop: spacing.lg,
  },
});

