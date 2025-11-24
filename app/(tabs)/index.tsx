import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';

export default function HomeScreen() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#34C759" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  // Redirect to tools tab as the default home
  return <Redirect href="/(tabs)/tools" />;
}

