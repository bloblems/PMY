import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Switch, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserProfile, updateUserProfile, getUserPreferences, getUnreadNotificationCount } from '@/services/api';
import Card from '@/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { spacing, layout, typography, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsScreen() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isDark, setTheme, colors } = useTheme();

  // Fetch user profile for notification settings
  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => {
      if (!user) return null;
      return getUserProfile(user.id);
    },
    enabled: !!user,
    staleTime: 60000,
  });

  // Fetch user preferences
  const { data: preferences } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: () => {
      if (!user) return null;
      return getUserPreferences(user.id);
    },
    enabled: !!user,
  });

  // Fetch unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: () => {
      if (!user) return 0;
      return getUnreadNotificationCount(user.id);
    },
    enabled: !!user,
  });

  // Update email notifications mutation
  const updateEmailNotificationsMutation = useMutation({
    mutationFn: (enabled: boolean) => updateUserProfile(user!.id, { emailNotificationsEnabled: enabled ? 'true' : 'false' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
    },
  });

  const handleToggleEmailNotifications = (value: boolean) => {
    updateEmailNotificationsMutation.mutate(value);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth');
          },
        },
      ]
    );
  };

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
  const emailNotificationsEnabled = profile?.emailNotificationsEnabled === 'true' || false;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
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

      {/* Account Section */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/profile/edit')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="person-outline" size={20} color={colors.brand.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Edit Profile</Text>
              <Text style={styles.settingDescription}>Update your name, username, and bio</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </Card>

      {/* Notifications Section */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="mail-outline" size={20} color={colors.brand.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Email Notifications</Text>
              <Text style={styles.settingDescription}>Receive emails for important updates</Text>
            </View>
          </View>
          <Switch
            value={emailNotificationsEnabled}
            onValueChange={handleToggleEmailNotifications}
            trackColor={{ false: colors.ui.borderDark, true: colors.brand.secondary }}
            thumbColor={colors.text.inverse}
          />
        </View>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/profile/notifications')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={20} color={colors.brand.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Notification Inbox</Text>
              <Text style={styles.settingDescription}>View and manage your notifications</Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
          </View>
        </TouchableOpacity>
      </Card>

      {/* Contract Preferences Section */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Contract Preferences</Text>
        <Text style={styles.sectionDescription}>
          These defaults are used when creating new consent contracts.
        </Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => router.push('/(tabs)/profile/preferences')}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="options-outline" size={20} color={colors.brand.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Default Settings</Text>
              <Text style={styles.settingDescription}>
                {preferences?.default_encounter_type
                  ? `${preferences.default_encounter_type}${preferences.state_of_residence ? `, ${preferences.state_of_residence}` : ''}`
                  : 'Configure your defaults'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </Card>

      {/* Appearance Section */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name={isDark ? "moon-outline" : "sunny-outline"} size={20} color={colors.brand.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingText}>Dark Mode</Text>
              <Text style={styles.settingDescription}>Use dark theme throughout the app</Text>
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

      {/* Legal & Compliance Section */}
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

      {/* Data Retention Section */}
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

      {/* About Section */}
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

      {/* Sign Out Section */}
      <Card style={styles.card}>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

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
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
    color: colors.text.inverse,
  },
  sectionDescription: {
    fontSize: typography.size.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.md,
    lineHeight: 18,
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
    flex: 1,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingText: {
    fontSize: typography.size.md,
    color: colors.text.inverse,
    marginLeft: spacing.md,
  },
  settingTextContainer: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingDescription: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  settingValue: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
  },
  badge: {
    backgroundColor: colors.status.error,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
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
    backgroundColor: colors.brand.primary + '30',
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
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  signOutText: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.status.error,
  },
});
