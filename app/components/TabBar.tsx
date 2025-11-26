import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, layout, borderRadius, shadows } from '@/lib/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          let iconName = 'help-circle';
          let label = 'Tab';

          if (route.name === 'index') return null; // Hide index if it's just a redirect or not needed in bar
          // Wait, index is Home? Or is it just a redirect? In tabs/_layout it was Home.
          // If we want Home tab:
          if (route.name === 'index') { iconName = 'home'; label = 'Home'; }
          
          // Based on design requirements:
          if (route.name === 'create') { iconName = 'add-circle'; label = 'Create'; }
          if (route.name === 'tools') { iconName = 'construct'; label = 'Tools'; }
          if (route.name === 'contracts') { iconName = 'folder'; label = 'Contracts'; }
          if (route.name === 'profile') { iconName = 'person'; label = 'Profile'; }
          if (route.name === 'settings') return null; // Hide settings from tab bar

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
                <Ionicons 
                  name={iconName as any} 
                  size={24} 
                  color={isFocused ? colors.text.inverse : colors.text.tertiary} 
                />
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E', // Card color
    borderTopWidth: 0,
    ...shadows.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20,
  },
  tabBar: {
    flexDirection: 'row',
    height: layout.bottomNavHeight,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: 2,
  },
  iconContainerActive: {
    // Optional active background
  },
  label: {
    fontSize: 10,
    fontWeight: typography.weight.medium,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  labelActive: {
    color: colors.text.inverse,
    fontWeight: typography.weight.semibold,
  },
});

