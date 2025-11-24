import { Text, TextProps, StyleSheet } from 'react-native';
import { typography } from '@/lib/theme';

interface TypographyProps extends TextProps {
  weight?: '400' | '500' | '600' | '700' | 'normal' | 'medium' | 'semibold' | 'bold';
}

/**
 * Typography component that applies Poppins font by default
 * Use this instead of Text for consistent font styling
 */
export default function Typography({ 
  style, 
  weight = '400',
  ...props 
}: TypographyProps) {
  return (
    <Text
      style={[
        { fontFamily: typography.getFontFamily(weight) },
        style,
      ]}
      {...props}
    />
  );
}

