import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@/lib/theme';
import { useState, useEffect } from 'react';

export default function Index() {
  const { user, loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  // Delay redirect slightly to allow navigation to initialize
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>PMY</Text>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)/create" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.dark,
  },
  loadingText: {
    fontSize: typography.size['2xl'],
    marginBottom: spacing.lg,
    color: colors.text.inverse,
  },
});

