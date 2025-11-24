import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/CustomTabBar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Preserve state when navigating away and back
        // @ts-ignore - unmountOnBlur is a valid React Navigation prop but not in types
        unmountOnBlur: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          href: null, // Hide from tab bar (we handle it in CustomTabBar)
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Contracts',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

