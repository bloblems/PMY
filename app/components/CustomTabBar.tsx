import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { spacing, layout, typography, borderRadius, shadows } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface CustomTabBarProps extends Partial<BottomTabBarProps> {
  isAbsolute?: boolean; // When true, use absolute positioning (for consent pages)
}

export default function CustomTabBar({ isAbsolute = false, state, descriptors, navigation, ...props }: CustomTabBarProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Get active route from React Navigation state (for tabs inside the navigator)
  const activeRouteName = state?.routes?.[state.index]?.name || null;

  const navItems = [
    { 
      path: '/(tabs)/create', 
      routeName: 'create',
      icon: 'add-circle', 
      label: 'Create',
      // Match /create and any nested routes like /create/consent/signature
      match: (currentPath: string) => 
        currentPath === '/(tabs)/create' || 
        currentPath === '/create' || 
        currentPath?.startsWith('/(tabs)/create/'),
    },
    { 
      path: '/(tabs)/tools', 
      routeName: 'tools',
      icon: 'construct', 
      label: 'Tools',
      // Match /tools and any nested routes like /tools/titleix
      match: (currentPath: string) => 
        currentPath === '/(tabs)/tools' || 
        currentPath === '/tools' || 
        currentPath?.startsWith('/(tabs)/tools/'),
    },
    { 
      path: '/(tabs)/contracts', 
      routeName: 'contracts',
      icon: 'folder', 
      label: 'Contracts',
      // Match /contracts and any nested routes like /contracts/[id]
      match: (currentPath: string) => 
        currentPath === '/(tabs)/contracts' || 
        currentPath === '/contracts' || 
        currentPath?.startsWith('/(tabs)/contracts/'),
    },
    { 
      path: '/(tabs)/profile', 
      routeName: 'profile',
      icon: 'person', 
      label: 'Profile',
      // Match /profile and any nested routes like /profile/edit
      match: (currentPath: string) => 
        currentPath === '/(tabs)/profile' || 
        currentPath === '/profile' || 
        currentPath?.startsWith('/(tabs)/profile/'),
    },
  ];

  const styles = createStyles(colors);

  const containerStyle = [
    styles.container,
    // When absolutely positioned (consent pages), add positioning and safe area
    isAbsolute && {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: insets.bottom,
    },
    // When used as tabBar prop, React Navigation handles positioning but we need safe area padding
    !isAbsolute && {
      paddingBottom: insets.bottom,
    },
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.tabBar}>
        {navItems.map((item) => {
          // Determine active state:
          // - For tabs in navigator: use React Navigation state
          // - For nested routes: use the match function
          const isActive = activeRouteName === item.routeName || 
            (item.match && item.match(pathname || ''));

          // Always use Expo Router for navigation
          const handlePress = () => {
            if (isActive) return; // Don't navigate if already active
            
            // Use router.replace for the 'create' tab to reset its stack,
            // and router.push for other tabs to maintain history within their stack.
            if (item.routeName === 'create') {
              router.replace(item.path as `/${string}`);
            } else {
              router.push(item.path as `/${string}`);
            }
          };

          return (
            <TouchableOpacity
              key={item.path}
              onPress={handlePress}
              style={styles.tabItem}
              activeOpacity={0.6}
            >
              <View style={[styles.tabContent, isActive && styles.tabContentActive]}>
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={isActive ? colors.brand.primary : colors.text.tertiary}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {item.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
    borderTopWidth: 1,
    borderTopColor: colors.ui.borderDark,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: layout.bottomNavHeight,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    minWidth: 64,
    transition: 'all 0.2s ease',
  },
  tabContentActive: {
    backgroundColor: colors.brand.primary + '12',
  },
  tabLabel: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: colors.brand.primary,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.weight.semibold,
  },
});

