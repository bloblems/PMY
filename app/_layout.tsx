import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ConsentFlowProvider } from './contexts/ConsentFlowContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppLayout from './components/AppLayout';
import { useFonts } from 'expo-font';
import { Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { ActivityIndicator, View } from 'react-native';

function ThemedStack() {
  const { colors } = useTheme();
  
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, 
        animation: 'none',
        // Preserve state when navigating between tabs and root routes
        // @ts-ignore - detachPreviousScreen is a valid React Navigation prop but not in types
        detachPreviousScreen: false,
        // Set background color to prevent white flash
        contentStyle: { backgroundColor: colors.background.dark },
      }} 
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000000' }}>
        <ActivityIndicator size="large" color="#34C759" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
          <ConsentFlowProvider>
            <AppLayout>
                <ThemedStack />
            </AppLayout>
          </ConsentFlowProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

