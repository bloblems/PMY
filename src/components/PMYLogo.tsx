import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { typography } from '@/lib/theme';

interface PMYLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export default function PMYLogo({ size = 'medium', showText = true }: PMYLogoProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors, size);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>PMY</Text>
      </View>
      {showText && (
        <Text style={styles.subtitle}>Press Means Yes</Text>
      )}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof import('@/lib/theme').getColors>, size: string) => {
  const sizes = {
    small: { logo: 32, text: 14, subtitle: 10 },
    medium: { logo: 48, text: 20, subtitle: 12 },
    large: { logo: 64, text: 28, subtitle: 14 },
  };

  const sizeConfig = sizes[size as keyof typeof sizes];

  return StyleSheet.create({
    container: {
      alignItems: 'center',
    },
    logoContainer: {
      width: sizeConfig.logo,
      height: sizeConfig.logo,
      borderRadius: sizeConfig.logo / 4,
      backgroundColor: colors.brand.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoText: {
      fontSize: sizeConfig.text,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: -1,
    },
    subtitle: {
      fontSize: sizeConfig.subtitle,
      color: colors.text.secondary,
      marginTop: 4,
    },
  });
};
