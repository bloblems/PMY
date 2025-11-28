import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { getUnreadNotificationCount } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { spacing, typography, layout, borderRadius } from '@/lib/theme';
import CustomTabBar from './CustomTabBar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();

  const isAuthPage = pathname === '/auth' || pathname?.startsWith('/auth');
  const isConsentPage = pathname?.startsWith('/(tabs)/create/consent/') || pathname?.startsWith('/create/consent/');
  const isProfilePage = pathname?.includes('/profile');
  const isSettingsPage = pathname === '/settings';

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: () => {
      if (!user) return 0;
      return getUnreadNotificationCount(user.id);
    },
    enabled: !!user && !isAuthPage,
    refetchInterval: 30000,
  });

  // Don't show AppLayout for auth pages
  if (isAuthPage) {
    return <>{children}</>;
  }

  const styles = createStyles(colors);

  const handleCreatePress = () => {
    router.push('/(tabs)/create');
  };

  const handleNotificationsPress = () => {
    router.push('/(tabs)/profile/notifications');
  };

  const handleSettingsPress = () => {
    if (isSettingsPage) return;
    router.push('/settings' as `/${string}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Left section */}
        <View style={styles.headerSide}>
          <TouchableOpacity onPress={handleCreatePress} style={styles.headerButton}>
            <Ionicons name="add" size={28} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>

        {/* Center: Logo (absolutely centered) */}
        <View style={styles.headerCenter}>
          <Text style={styles.logo}>PMY</Text>
        </View>

        {/* Right section */}
        <View style={[styles.headerSide, styles.headerSideRight]}>
          <TouchableOpacity onPress={handleNotificationsPress} style={styles.headerButton}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.text.inverse} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {isProfilePage && (
            <TouchableOpacity onPress={handleSettingsPress} style={styles.headerButton}>
              <Ionicons name="menu-outline" size={26} color={colors.text.inverse} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {children}
      </View>

      {/* Custom Tab Bar for consent pages */}
      {isConsentPage && <CustomTabBar isAbsolute={true} />}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: layout.headerHeight,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.ui.border,
  },
  headerSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSideRight: {
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  headerButton: {
    padding: spacing.sm,
    position: 'relative',
  },
  logo: {
    fontSize: typography.size.xl,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
    letterSpacing: 1,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.status.error,
    borderRadius: borderRadius.full,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.weight.bold,
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});
