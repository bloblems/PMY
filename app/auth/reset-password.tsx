import { useState, useEffect } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionValid, setSessionValid] = useState(false);
  const styles = createStyles(colors);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionValid(true);
        } else {
          // Try to exchange the token if present in URL params
          const accessToken = params.access_token as string;
          const refreshToken = params.refresh_token as string;

          if (accessToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            if (!error) {
              setSessionValid(true);
            } else {
              setError('Invalid or expired reset link. Please request a new one.');
            }
          } else {
            // No session and no tokens - might be direct navigation
            // Allow user to try anyway, will fail on submit if no session
            setSessionValid(true);
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError('Failed to verify reset link');
      } finally {
        setVerifying(false);
      }
    };

    checkSession();
  }, [params]);

  const handleResetPassword = async () => {
    if (!password) {
      setError('Please enter a new password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        console.error('Update password error:', updateError);
        if (updateError.message.includes('session')) {
          setError('Your reset link has expired. Please request a new one.');
        } else {
          setError(updateError.message);
        }
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={styles.verifyingText}>Verifying reset link...</Text>
      </View>
    );
  }

  if (success) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={colors.brand.primary} />
              </View>
              <Text style={styles.successTitle}>Password Reset!</Text>
              <Text style={styles.successText}>
                Your password has been successfully reset. You can now sign in with your new password.
              </Text>
              <Button
                title="Sign In"
                onPress={() => router.replace('/login')}
                style={styles.signInButton}
              />
            </View>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logo}>PMY</Text>
          <Text style={styles.subtitle}>
            Create New Password
          </Text>
        </View>

        <Card>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.description}>
            Enter your new password below. Make sure it's at least 6 characters long.
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              {error.includes('expired') && (
                <Button
                  title="Request New Link"
                  onPress={() => router.replace('/auth/reset-request')}
                  variant="outline"
                  size="small"
                  style={styles.retryButton}
                />
              )}
            </View>
          )}

          <Input
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            editable={!loading}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            editable={!loading}
          />

          <Button
            title="Reset Password"
            onPress={handleResetPassword}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          />

          <Button
            title="Back to Sign In"
            onPress={() => router.replace('/login')}
            variant="outline"
            size="small"
            style={styles.cancelButton}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  verifyingText: {
    marginTop: spacing.md,
    fontSize: typography.size.md,
    color: colors.text.secondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logo: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
    textAlign: 'center',
    color: colors.text.primary,
  },
  description: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: colors.status.error + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.size.sm,
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  cancelButton: {
    marginTop: spacing.md,
  },
  successContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  successText: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  signInButton: {
    marginTop: spacing.xl,
    minWidth: 200,
  },
});
