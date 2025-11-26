import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'none',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          animation: 'none',
        }}
      />
      <Stack.Screen name="titleix" />
      <Stack.Screen name="state-laws" />
    </Stack>
  );
}

