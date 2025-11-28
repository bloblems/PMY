import { SafeAreaView as RNSafeAreaView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/theme';

export default function SafeAreaView({ children, style }: { children: React.ReactNode; style?: any }) {
  const insets = useSafeAreaInsets();
  return (
    <RNSafeAreaView style={[styles.container, { paddingTop: insets.top }, style]}>
      {children}
    </RNSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
});

