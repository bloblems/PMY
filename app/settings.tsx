import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Switch, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import Card from '@/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { spacing, layout, typography } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, isDark, setTheme, colors } = useTheme();

  if (loading) {
    const tempStyles = createStyles(colors);
    return (
      <View style={[tempStyles.container, { backgroundColor: colors.background.dark }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          // Navigate back to profile or previous screen
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/profile');
          }
        }}>
          <Ionicons name="chevron-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/profile/edit')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="person-outline" size={20} color={colors.brand.primary} />
            <Text style={[styles.settingText, styles.settingTextSpacing]}>Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/profile/preferences')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="settings-outline" size={20} color={colors.brand.primary} />
            <Text style={styles.settingText}>Preferences</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/profile/notifications')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.brand.primary} />
            <Text style={styles.settingText}>Notification Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="color-palette-outline" size={20} color={colors.brand.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Use dark theme</Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
            trackColor={{ false: colors.ui.borderDark, true: colors.brand.secondary }}
            thumbColor={colors.text.inverse}
          />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Legal & Compliance</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            Alert.alert('Coming Soon', 'Privacy policy page coming soon!');
          }}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="document-text-outline" size={20} color={colors.brand.primary} />
            <Text style={styles.settingText}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => {
            Alert.alert('Coming Soon', 'Terms of service page coming soon!');
          }}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="scale-outline" size={20} color={colors.brand.primary} />
            <Text style={styles.settingText}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Data Retention</Text>
        <View style={styles.retentionContent}>
          <View style={styles.retentionHeader}>
            <View style={styles.retentionIconContainer}>
              <Ionicons name="time-outline" size={16} color={colors.brand.secondary} />
            </View>
            <Text style={styles.retentionTitle}>Data Retention Policy</Text>
          </View>
          <View style={styles.retentionTextContainer}>
            <Text style={styles.retentionText}>
              <Text style={styles.retentionBold}>Active Account:</Text> Your consent contracts and recordings are stored securely for as long as your account remains active.
            </Text>
            <Text style={styles.retentionText}>
              <Text style={styles.retentionBold}>Deletion:</Text> You may delete individual contracts or recordings at any time through the Contracts page.
            </Text>
            <Text style={styles.retentionText}>
              <Text style={styles.retentionBold}>Account Closure:</Text> Upon account deletion, all personal data, contracts, and recordings are permanently removed from our servers within 30 days, unless required by law to retain certain information.
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="information-circle-outline" size={20} color={colors.brand.primary} />
            <Text style={styles.settingText}>App Version</Text>
          </View>
          <Text style={styles.settingValue}>1.0.0</Text>
        </View>
      </Card>
    </ScrollView>
  );
}

// Styles need to be created as a function to access theme colors
const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: layout.bottomNavHeight + spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.text.inverse,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.borderDark,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: colors.text.inverse,
  },
  settingTextSpacing: {
    marginLeft: spacing.md,
  },
  settingValue: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  settingTextContainer: {
    marginLeft: spacing.md,
  },
  settingDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  retentionContent: {
    paddingVertical: spacing.xs,
  },
  retentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  retentionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  retentionTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
  retentionTextContainer: {
    marginTop: spacing.xs,
  },
  retentionText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  retentionBold: {
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
  },
});

