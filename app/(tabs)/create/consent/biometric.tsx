import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useConsentFlow } from '@/contexts/ConsentFlowContext';
import { useAuth } from '@/hooks/useAuth';
import { useMutation } from '@tanstack/react-query';
import { createContract } from '@/services/api';
import Button from '@/components/Button';
import Card from '@/components/Card';
import HoldToConfirmButton from '@/components/HoldToConfirmButton';
import { spacing, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ConsentBiometricPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { state, hasRequiredData, isHydrated } = useConsentFlow();
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const [status, setStatus] = useState<'idle' | 'authenticating' | 'verified'>('idle');
  const [biometricType, setBiometricType] = useState<string>('');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (isHydrated && !hasRequiredData()) {
      Alert.alert("Missing Information", "Please complete the consent flow from the beginning.");
      router.replace('/(tabs)/create' as `/${string}`);
    }

    checkBiometricSupport();
  }, [isHydrated, hasRequiredData]);

  const checkBiometricSupport = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    setIsSupported(hasHardware && isEnrolled);

    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      setBiometricType('Face ID');
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      setBiometricType('Touch ID');
    } else {
      setBiometricType('Biometric');
    }
  };

  const handleBiometricAuth = async () => {
    if (!isSupported) {
      Alert.alert("Not Supported", "Biometric authentication is not available on this device.");
      return;
    }

    setStatus('authenticating');

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate for consent',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        setStatus('verified');
      } else {
        setStatus('idle');
        if (result.error !== 'user_cancel') {
          Alert.alert("Authentication Failed", "Please try again.");
        }
      }
    } catch (error) {
      setStatus('idle');
      Alert.alert("Error", "Authentication failed. Please try again.");
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (status !== 'verified') {
        throw new Error("Biometric authentication required");
      }

      const contractData = {
        user_id: user!.id,
        university_id: state.universityId || null,
        encounter_type: state.encounterType,
        parties: state.parties.filter(p => p.trim()),
        intimate_acts: JSON.stringify(state.intimateActs),
        contract_start_time: state.contractStartTime || null,
        contract_duration: state.contractDuration || null,
        contract_end_time: state.contractEndTime || null,
        method: 'biometric' as const,
        contract_text: `Biometric consent authenticated via ${biometricType}`,
        authenticated_at: new Date().toISOString(),
        status: 'active' as const,
        is_collaborative: 'false' as const,
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
          <Text style={styles.title}>Biometric Authentication</Text>
          <View style={{ width: spacing.xl }} />
        </View>

        <Card style={[styles.infoCard, styles.infoCardSpacing]}>
          <View style={styles.iconContainer}>
            <Ionicons name="finger-print" size={64} color={colors.brand.primary} />
          </View>
          <Text style={[styles.infoTitle, styles.infoTitleSpacing]}>Secure Authentication</Text>
          <Text style={[styles.infoText, styles.infoTextSpacing]}>
            Use {biometricType} to cryptographically verify your consent. This provides the highest level of security and legal validity.
          </Text>
        </Card>

        {!isSupported && (
          <Card style={[styles.warningCard, styles.warningCardSpacing]}>
            <Ionicons name="warning" size={24} color={colors.status.warning} />
            <Text style={[styles.warningText, styles.warningTextSpacing]}>
              Biometric authentication is not available on this device. Please use a different method.
            </Text>
          </Card>
        )}

        {status === 'idle' && isSupported && (
          <Button
            title={`Authenticate with ${biometricType}`}
            onPress={handleBiometricAuth}
            style={[styles.authButton, styles.authButtonSpacing]}
          />
        )}

        {status === 'authenticating' && (
          <View style={[styles.authenticatingContainer, styles.authenticatingContainerSpacing]}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
            <Text style={[styles.authenticatingText, styles.authenticatingTextSpacing]}>Authenticating...</Text>
          </View>
        )}

        {status === 'verified' && (
          <>
            <Card style={[styles.verifiedCard, styles.verifiedCardSpacing]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.brand.primary} />
              <Text style={[styles.verifiedTitle, styles.verifiedTitleSpacing]}>Authentication Successful</Text>
              <Text style={[styles.verifiedText, styles.verifiedTextSpacing]}>
                Your {biometricType} has been verified
              </Text>
            </Card>
            <HoldToConfirmButton
              onConfirm={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              subtitle="Biometric verified"
            />
          </>
        )}
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
  },
  infoCardSpacing: {
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
  infoCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  infoTitleSpacing: {
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoTextSpacing: {
    marginTop: spacing.md,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.status.warning + '20',
    borderColor: colors.status.warning,
    borderWidth: 1,
  },
  warningCardSpacing: {
    marginTop: spacing.lg,
  },
  warningText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.status.warning,
  },
  warningTextSpacing: {
    marginLeft: spacing.md,
  },
  authButton: {
    backgroundColor: colors.brand.primary,
  },
  authButtonSpacing: {
    marginTop: spacing.lg,
  },
  authenticatingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  authenticatingContainerSpacing: {
    marginTop: spacing.lg,
  },
  authenticatingText: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
  },
  authenticatingTextSpacing: {
    marginTop: spacing.md,
  },
  verifiedCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.brand.primary + '20',
    borderColor: colors.brand.primary,
  },
  verifiedCardSpacing: {
    marginTop: spacing.lg,
  },
  verifiedTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  verifiedTitleSpacing: {
    marginTop: spacing.md,
  },
  verifiedText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  verifiedTextSpacing: {
    marginTop: spacing.md,
  },
  completeButton: {
    backgroundColor: colors.brand.primary,
    marginTop: spacing.sm,
  },
  completeButtonSpacing: {
    marginTop: spacing.md,
  },
});

