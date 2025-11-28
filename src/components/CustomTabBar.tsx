import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { spacing, layout, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useConsentFlow } from '@/contexts/ConsentFlowContext';

interface CustomTabBarProps extends Partial<BottomTabBarProps> {
  isAbsolute?: boolean;
}

export default function CustomTabBar({ isAbsolute = false, state }: CustomTabBarProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { resetIfStale } = useConsentFlow();

  const activeRouteName = state?.routes?.[state.index]?.name || null;

  const navItems = [
    {
      path: '/(tabs)/create',
      routeName: 'create',
      icon: 'add-circle-outline',
      iconActive: 'add-circle',
      match: (currentPath: string) =>
        currentPath === '/(tabs)/create' ||
        currentPath === '/create' ||
        currentPath?.startsWith('/(tabs)/create/'),
    },
    {
      path: '/(tabs)/tools',
      routeName: 'tools',
      icon: 'grid-outline',
      iconActive: 'grid',
      match: (currentPath: string) =>
        currentPath === '/(tabs)/tools' ||
        currentPath === '/tools' ||
        currentPath?.startsWith('/(tabs)/tools/'),
    },
    {
      path: '/(tabs)/contracts',
      routeName: 'contracts',
      icon: 'document-text-outline',
      iconActive: 'document-text',
      match: (currentPath: string) =>
        currentPath === '/(tabs)/contracts' ||
        currentPath === '/contracts' ||
        currentPath?.startsWith('/(tabs)/contracts/'),
    },
    {
      path: '/(tabs)/profile',
      routeName: 'profile',
      icon: 'person-outline',
      iconActive: 'person',
      match: (currentPath: string) =>
        currentPath === '/(tabs)/profile' ||
        currentPath === '/profile' ||
        currentPath?.startsWith('/(tabs)/profile/'),
    },
  ];

  const styles = createStyles(colors);

  const containerStyle = [
    styles.container,
    isAbsolute && {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: insets.bottom,
    },
    !isAbsolute && {
      paddingBottom: insets.bottom,
    },
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.tabBar}>
        {navItems.map((item) => {
          const isActive = activeRouteName === item.routeName ||
            (item.match && item.match(pathname || ''));

          const handlePress = async () => {
            if (isActive) return;

            // Reset consent flow if navigating to create
            if (item.routeName === 'create') {
              await resetIfStale();
            }

            // Use replace for all tab navigation to avoid back stack buildup
            router.replace(item.path as `/${string}`);
          };

          return (
            <TouchableOpacity
              key={item.path}
              onPress={handlePress}
              style={styles.tabItem}
              activeOpacity={0.6}
            >
              <Ionicons
                name={(isActive ? item.iconActive : item.icon) as any}
                size={26}
                color={isActive ? colors.text.inverse : colors.text.tertiary}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderTopWidth: 0.5,
    borderTopColor: colors.ui.border,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    minHeight: 50,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
});
