import { Redirect } from 'expo-router';
import { useAuth } from './hooks/useAuth';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from './lib/theme';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>PMY</Text>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
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

