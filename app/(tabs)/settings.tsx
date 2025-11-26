import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, useRouter } from 'expo-router';
import Card from '@/components/Card';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, layout } from '@/lib/theme';

export default function SettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  console.log('SettingsScreen rendered', { user: !!user });

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
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

const styles = StyleSheet.create({
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
});

