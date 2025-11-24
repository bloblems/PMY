import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing, borderRadius } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function Card({ children, style }: CardProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  return <View style={[styles.card, style]}>{children}</View>;
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.background.cardBorder,
  },
});

