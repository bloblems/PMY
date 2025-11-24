import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { spacing, borderRadius, typography } from '@/lib/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

export default function Input({
  label,
  error,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={colors.text.tertiary}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>) => StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.semibold,
    fontWeight: typography.weight.semibold,
    color: colors.text.inverse,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.ui.borderDark,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.size.md,
    fontFamily: typography.fontFamily.regular,
    backgroundColor: colors.background.card,
    color: colors.text.inverse,
  },
  inputError: {
    borderColor: colors.status.error,
  },
  errorText: {
    color: colors.status.error,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xs,
  },
});

