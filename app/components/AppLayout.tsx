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
  const isConsentPage = pathname?.startsWith('/(tabs)/create/consent/');
  const isSettingsPage = pathname === '/settings';

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications', user?.id],
    queryFn: () => {
      if (!user) return 0;
      return getUnreadNotificationCount(user.id);
    },
    enabled: !!user && !isAuthPage,
    refetchInterval: 30000, // Refetch every 30 seconds
  });


  // Don't show AppLayout for auth pages
  if (isAuthPage) {
    return <>{children}</>;
  }

  const styles = createStyles(colors);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header - show on all pages except auth */}
        <View style={styles.header}>
          <Text style={styles.logo}>PMY</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              onPress={() => router.push('/(tabs)/profile/notifications')}
              style={styles.notificationButton}
            >
            <Ionicons name="notifications-outline" size={24} color={colors.text.inverse} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              if (isSettingsPage) return; // Don't navigate if already on settings
              // Use replace to avoid navigation stack issues
              router.replace('/settings' as `/${string}`);
            }}
          >
            <Ionicons name="settings-outline" size={24} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {children}
      </View>

      {/* Custom Tab Bar - Only show for pages outside tabs (like consent pages) */}
      {/* For tab pages, the tab bar is rendered via the tabBar prop in (tabs)/_layout.tsx */}
      {isConsentPage && <CustomTabBar isAbsolute={true} />}
    </View>
  );
}

// Styles need to be created as a function to access theme colors
const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: layout.headerHeight,
    backgroundColor: colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.ui.borderDark,
  },
  logo: {
    fontSize: typography.size.xl,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.weight.bold,
    color: colors.text.inverse,
  },
  headerIcons: {
    flexDirection: 'row',
    marginLeft: spacing.lg,
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    marginRight: spacing.lg,
  },
  notificationBadge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    backgroundColor: colors.status.error,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: colors.background.card,
  },
  notificationBadgeText: {
    color: colors.text.inverse,
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.weight.bold,
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.background.dark,
    // paddingBottom is conditionally applied for consent pages only
  },
});
