import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Linking } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, createVerificationSession, checkVerificationStatus } from '@/services/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';

export default function VerificationScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => user ? getUserProfile(user.id) : null,
    enabled: !!user,
  });

  const { data: verificationStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['verification-status', user?.id],
    queryFn: checkVerificationStatus,
    enabled: !!user,
    refetchInterval: (data) => {
      // Poll more frequently if verification is in progress
      if (data?.status === 'pending' || data?.status === 'processing') {
        return 5000; // 5 seconds
      }
      return false;
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: createVerificationSession,
    onSuccess: (data) => {
      setIsStarting(false);
      // Open the Stripe Identity verification URL
      if (data.verification_session_url) {
        Linking.openURL(data.verification_session_url);
      }
      refetchStatus();
    },
    onError: (error: any) => {
      setIsStarting(false);
      Alert.alert('Error', error.message || 'Failed to start verification');
    },
  });

  const styles = createStyles(colors);

  const isVerified = profile?.is_verified === 'true';
  const isPending = verificationStatus?.status === 'pending' || verificationStatus?.status === 'processing';
  const hasFailed = verificationStatus?.status === 'failed';

  // Invalidate profile cache when verification status changes to verified
  useEffect(() => {
    if (verificationStatus?.status === 'verified' || isVerified) {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    }
  }, [verificationStatus?.status, isVerified, queryClient]);

  const handleStartVerification = () => {
    Alert.alert(
      'Identity Verification',
      'You will be charged $4.99 for identity verification. This is a one-time fee.\n\nYou will need:\n• A valid government ID (passport, driver\'s license, or ID card)\n• A clear selfie for face matching\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            setIsStarting(true);
            createSessionMutation.mutate();
          },
        },
      ]
    );
  };

  const handleRetryVerification = () => {
    Alert.alert(
      'Retry Verification',
      'Your previous verification attempt failed. Would you like to try again?\n\nYou will be charged $4.99 again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Try Again',
          onPress: () => {
            setIsStarting(true);
            createSessionMutation.mutate();
          },
        },
      ]
    );
  };

  if (profileLoading || statusLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background.dark }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={isVerified ? ['#1DA1F2', '#0A84FF'] : ['#6366F1', '#8B5CF6']}
            style={styles.iconGradient}
          >
            <Ionicons 
              name={isVerified ? 'checkmark-circle' : 'shield-checkmark'} 
              size={48} 
              color="#fff" 
            />
          </LinearGradient>
        </View>
        <Text style={styles.title}>
          {isVerified ? 'You\'re Verified!' : 'Get Verified'}
        </Text>
        <Text style={styles.subtitle}>
          {isVerified 
            ? 'Your identity has been verified. You have a blue checkmark on your profile.'
            : 'Verify your identity to get a blue checkmark and build trust with other users.'}
        </Text>
      </View>

      {/* Status Card */}
      {isVerified ? (
        <Card style={styles.statusCard}>
          <LinearGradient
            colors={['#1DA1F2', '#0A84FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusGradient}
          />
          <View style={styles.statusContent}>
            <View style={styles.statusRow}>
              <View style={[styles.statusIconContainer, { backgroundColor: 'rgba(29, 161, 242, 0.2)' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#1DA1F2" />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Identity Verified</Text>
                <Text style={styles.statusSubtitle}>
                  Verified on {profile?.verified_at 
                    ? new Date(profile.verified_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })
                    : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      ) : isPending ? (
        <Card style={styles.statusCard}>
          <LinearGradient
            colors={['#F59E0B', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusGradient}
          />
          <View style={styles.statusContent}>
            <View style={styles.statusRow}>
              <View style={[styles.statusIconContainer, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                <ActivityIndicator size="small" color="#F59E0B" />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Verification In Progress</Text>
                <Text style={styles.statusSubtitle}>
                  {verificationStatus?.status === 'processing' 
                    ? 'Your documents are being reviewed...'
                    : 'Complete your verification in the browser window'}
                </Text>
              </View>
            </View>
            <Button
              title="Check Status"
              onPress={() => refetchStatus()}
              variant="outline"
              style={styles.checkButton}
            />
          </View>
        </Card>
      ) : hasFailed ? (
        <Card style={styles.statusCard}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.statusGradient}
          />
          <View style={styles.statusContent}>
            <View style={styles.statusRow}>
              <View style={[styles.statusIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              </View>
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Verification Failed</Text>
                <Text style={styles.statusSubtitle}>
                  {verificationStatus?.failure_reason || 'Please try again with clearer documents'}
                </Text>
              </View>
            </View>
            <Button
              title="Try Again"
              onPress={handleRetryVerification}
              variant="primary"
              style={styles.retryButton}
              loading={isStarting}
            />
          </View>
        </Card>
      ) : null}

      {/* Benefits Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>VERIFICATION BENEFITS</Text>

        <Card style={styles.benefitCard}>
          <View style={styles.benefitRow}>
            <View style={[styles.benefitIcon, { backgroundColor: 'rgba(29, 161, 242, 0.2)' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#1DA1F2" />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Blue Checkmark</Text>
              <Text style={styles.benefitDescription}>
                Show others you're a real, verified person
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.benefitCard}>
          <View style={styles.benefitRow}>
            <View style={[styles.benefitIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Increased Trust</Text>
              <Text style={styles.benefitDescription}>
                Build confidence when creating consent contracts
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.benefitCard}>
          <View style={styles.benefitRow}>
            <View style={[styles.benefitIcon, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <Ionicons name="document-text" size={20} color="#8B5CF6" />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Legal Validity</Text>
              <Text style={styles.benefitDescription}>
                Stronger evidence of identity in consent records
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.benefitCard}>
          <View style={styles.benefitRow}>
            <View style={[styles.benefitIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
              <Ionicons name="star" size={20} color="#F59E0B" />
            </View>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Premium Features</Text>
              <Text style={styles.benefitDescription}>
                Access to exclusive verified-only features
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HOW IT WORKS</Text>

        <Card style={styles.stepsCard}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Pay Verification Fee</Text>
              <Text style={styles.stepDescription}>
                One-time payment of $4.99 via Stripe
              </Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Upload ID Document</Text>
              <Text style={styles.stepDescription}>
                Take a photo of your passport, driver's license, or ID card
              </Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Take a Selfie</Text>
              <Text style={styles.stepDescription}>
                We'll match your face to your ID photo
              </Text>
            </View>
          </View>

          <View style={styles.stepDivider} />

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Get Verified</Text>
              <Text style={styles.stepDescription}>
                Receive your blue checkmark within minutes
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Privacy Note */}
      <Card style={styles.privacyCard}>
        <View style={styles.privacyRow}>
          <Ionicons name="lock-closed" size={20} color={colors.text.secondary} />
          <Text style={styles.privacyText}>
            Your ID documents are processed securely by Stripe and are not stored by Press Means Yes. 
            We only receive verification status, not your personal documents.
          </Text>
        </View>
      </Card>

      {/* CTA Button */}
      {!isVerified && !isPending && (
        <Button
          title={hasFailed ? 'Try Again - $4.99' : 'Get Verified - $4.99'}
          onPress={hasFailed ? handleRetryVerification : handleStartVerification}
          variant="primary"
          style={styles.ctaButton}
          loading={isStarting}
          icon={<Ionicons name="shield-checkmark" size={20} color="#fff" />}
        />
      )}

      {isPending && (
        <Button
          title="Continue Verification"
          onPress={() => {
            if (verificationStatus?.verification?.session_id) {
              // Re-open the verification session
              setIsStarting(true);
              createSessionMutation.mutate();
            }
          }}
          variant="primary"
          style={styles.ctaButton}
          loading={isStarting}
        />
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background.dark,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl * 2,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    iconContainer: {
      marginBottom: spacing.lg,
    },
    iconGradient: {
      width: 100,
      height: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: typography.size['2xl'],
      fontWeight: '700',
      color: colors.text.inverse,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: typography.size.md,
      color: colors.text.secondary,
      textAlign: 'center',
      lineHeight: 22,
      paddingHorizontal: spacing.lg,
    },
    statusCard: {
      marginBottom: spacing.xl,
      overflow: 'hidden',
    },
    statusGradient: {
      height: 4,
      width: '100%',
    },
    statusContent: {
      padding: spacing.md,
      backgroundColor: colors.background.card,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    statusTextContainer: {
      flex: 1,
    },
    statusTitle: {
      fontSize: typography.size.md,
      fontWeight: '600',
      color: colors.text.inverse,
      marginBottom: 4,
    },
    statusSubtitle: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    checkButton: {
      marginTop: spacing.md,
    },
    retryButton: {
      marginTop: spacing.md,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: typography.size.xs,
      fontWeight: '600',
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: spacing.md,
    },
    benefitCard: {
      marginBottom: spacing.sm,
      padding: spacing.md,
    },
    benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    benefitIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    benefitText: {
      flex: 1,
    },
    benefitTitle: {
      fontSize: typography.size.md,
      fontWeight: '600',
      color: colors.text.inverse,
      marginBottom: 2,
    },
    benefitDescription: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
    },
    stepsCard: {
      padding: spacing.md,
    },
    step: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.brand.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    stepNumberText: {
      fontSize: typography.size.sm,
      fontWeight: '700',
      color: '#fff',
    },
    stepContent: {
      flex: 1,
      paddingTop: 2,
    },
    stepTitle: {
      fontSize: typography.size.md,
      fontWeight: '600',
      color: colors.text.inverse,
      marginBottom: 4,
    },
    stepDescription: {
      fontSize: typography.size.sm,
      color: colors.text.secondary,
      lineHeight: 18,
    },
    stepDivider: {
      width: 2,
      height: 20,
      backgroundColor: colors.brand.primary + '40',
      marginLeft: 13,
      marginVertical: spacing.sm,
    },
    privacyCard: {
      padding: spacing.md,
      marginBottom: spacing.xl,
      backgroundColor: colors.background.card,
    },
    privacyRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    privacyText: {
      flex: 1,
      fontSize: typography.size.xs,
      color: colors.text.secondary,
      marginLeft: spacing.sm,
      lineHeight: 18,
    },
    ctaButton: {
      marginBottom: spacing.lg,
    },
  });

