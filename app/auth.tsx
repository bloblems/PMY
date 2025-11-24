import { useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth } from './hooks/useAuth';
import { View, ActivityIndicator, Text, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { supabase } from './lib/supabase';
import Button from './components/Button';
import Input from './components/Input';
import Card from './components/Card';
import { spacing, typography, borderRadius } from './lib/theme';
import { useTheme } from './contexts/ThemeContext';

export default function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(colors);

  if (authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleAuth = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if Supabase is configured
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_PROJECT_URL;
      const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_PUBLIC;
      
      if (!supabaseUrl || !supabaseKey) {
        setError('Supabase is not configured. Please check your .env file.');
        setLoading(false);
        return;
      }

      // Validate URL format
      if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
        setError('Invalid Supabase URL format. Should be: https://xxxxx.supabase.co');
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          // Log full error for debugging
          console.error('Sign up error:', signUpError);
          const errorMessage = signUpError.message || signUpError.toString();
          
          // Handle specific error types
          if (errorMessage.includes('JSON') || errorMessage.includes('parse') || errorMessage.includes('Unexpected')) {
            setError('Invalid server response. Check your Supabase URL and anon key in .env file.');
          } else if (errorMessage.includes('Invalid API key')) {
            setError('Invalid Supabase API key. Please check your EXPO_PUBLIC_SUPABASE_ANON_PUBLIC in .env file.');
          } else if (errorMessage.includes('fetch')) {
            setError('Network error. Please check your internet connection.');
          } else {
            setError(errorMessage);
          }
          return;
        }
        setError(null);
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          // Log full error for debugging
          console.error('Sign in error:', signInError);
          const errorMessage = signInError.message || signInError.toString();
          
          // Handle specific error types
          if (errorMessage.includes('JSON') || errorMessage.includes('parse') || errorMessage.includes('Unexpected')) {
            setError('Invalid server response. Check your Supabase URL and anon key in .env file.');
          } else if (errorMessage.includes('Invalid API key')) {
            setError('Invalid Supabase API key. Please check your EXPO_PUBLIC_SUPABASE_ANON_PUBLIC in .env file.');
          } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
            setError('Network error. Please check your internet connection.');
          } else if (errorMessage.includes('Invalid login credentials')) {
            setError('Invalid email or password.');
          } else {
            setError(errorMessage);
          }
          return;
        }
        router.replace('/(tabs)' as `/${string}`);
      }
    } catch (err: any) {
      // Catch any unexpected errors including JSON parse errors
      console.error('Auth error (catch block):', err);
      const errorMessage = err?.message || err?.toString() || 'Authentication failed';
      
      if (errorMessage.includes('JSON') || errorMessage.includes('parse') || errorMessage.includes('Unexpected')) {
        setError('Invalid server response. Verify your Supabase configuration in .env file.');
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

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
            Title IX Consent Documentation
          </Text>
        </View>

        <Card>
          <Text style={styles.title}>
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isSignUp ? 'password-new' : 'password'}
            editable={!loading}
          />

          <Button
            title={isSignUp ? 'Sign Up' : 'Sign In'}
            onPress={handleAuth}
            loading={loading}
            disabled={loading}
            style={styles.signInButton}
          />

          <Button
            title={isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            variant="outline"
            size="small"
            style={styles.toggleButton}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof import('./lib/theme').getColors>) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.size.md,
    color: colors.text.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
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
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: colors.text.primary,
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
  signInButton: {
    marginTop: spacing.sm,
  },
  toggleButton: {
    marginTop: spacing.md,
  },
});

