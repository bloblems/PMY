import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, useThemeToggle } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { spacing, borderRadius, typography } from '@/lib/theme';

interface SettingsMenuProps {
  onLogout?: () => void;
}

export default function SettingsMenu({ onLogout }: SettingsMenuProps) {
  const { colors, theme } = useTheme();
  const toggleTheme = useThemeToggle();
  const styles = createStyles(colors);
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut();
    onLogout?.();
    router.replace('/login');
  };

  const navigateTo = (path: string) => {
    setIsOpen(false);
    router.push(path as any);
  };

  const handleThemeToggle = () => {
    toggleTheme();
  };

  const menuItems = user
    ? [
        {
          id: 'account',
          icon: 'person-outline' as const,
          label: 'Account',
          onPress: () => navigateTo('/settings/account'),
        },
        {
          id: 'preferences',
          icon: 'options-outline' as const,
          label: 'Preferences',
          onPress: () => navigateTo('/settings/preferences'),
        },
        {
          id: 'billing',
          icon: 'card-outline' as const,
          label: 'Billing',
          onPress: () => navigateTo('/settings/billing'),
        },
        {
          id: 'integrations',
          icon: 'extension-puzzle-outline' as const,
          label: 'Integrations',
          onPress: () => navigateTo('/settings/integrations'),
        },
        { id: 'separator1', type: 'separator' as const },
        {
          id: 'theme',
          icon: theme === 'light' ? 'moon-outline' as const : 'sunny-outline' as const,
          label: theme === 'light' ? 'Dark Mode' : 'Light Mode',
          onPress: handleThemeToggle,
        },
        { id: 'separator2', type: 'separator' as const },
        {
          id: 'logout',
          icon: 'log-out-outline' as const,
          label: 'Log Out',
          onPress: handleLogout,
          destructive: true,
        },
      ]
    : [
        {
          id: 'login',
          icon: 'log-in-outline' as const,
          label: 'Log In',
          onPress: () => navigateTo('/login'),
        },
        { id: 'separator1', type: 'separator' as const },
        {
          id: 'theme',
          icon: theme === 'light' ? 'moon-outline' as const : 'sunny-outline' as const,
          label: theme === 'light' ? 'Dark Mode' : 'Light Mode',
          onPress: handleThemeToggle,
        },
      ];

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={styles.triggerButton}
        onPress={() => setIsOpen(true)}
        accessibilityLabel="Settings"
      >
        <Ionicons name="settings-outline" size={22} color={colors.text.primary} />
      </TouchableOpacity>

      {/* Settings Menu Modal */}
      <Modal
        visible={isOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: colors.background.card }]}>
            {/* User Info Header */}
            {user && (
              <View style={styles.userHeader}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={20} color={colors.brand.primary} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>
            )}

            {/* Menu Items */}
            {menuItems.map((item) => {
              if (item.type === 'separator') {
                return <View key={item.id} style={styles.separator} />;
              }

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.destructive ? colors.status.error : colors.text.primary}
                  />
                  <Text
                    style={[
                      styles.menuItemText,
                      item.destructive && styles.menuItemTextDestructive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) =>
  StyleSheet.create({
    triggerButton: {
      padding: spacing.sm,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-start',
      alignItems: 'flex-end',
      paddingTop: 100,
      paddingRight: spacing.md,
    },
    menuContainer: {
      width: 240,
      borderRadius: borderRadius.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      overflow: 'hidden',
    },
    userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.background.cardBorder,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.brand.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: typography.size.sm,
      fontWeight: '600',
      color: colors.text.primary,
    },
    userEmail: {
      fontSize: typography.size.xs,
      color: colors.text.secondary,
    },
    separator: {
      height: 1,
      backgroundColor: colors.background.cardBorder,
      marginVertical: spacing.xs,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      gap: spacing.sm,
    },
    menuItemText: {
      fontSize: typography.size.sm,
      color: colors.text.primary,
    },
    menuItemTextDestructive: {
      color: colors.status.error,
    },
  });
