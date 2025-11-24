/**
 * Design System / Theme Constants
 * Centralized colors, spacing, typography, and other design tokens
 */

// Light theme colors
const lightColors = {
  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F5F5F5',
    dark: '#FFFFFF',
    card: '#FFFFFF',
    cardBorder: '#E5E5EA',
  },
  
  // Text
  text: {
    primary: '#000000',
    secondary: '#666666',
    tertiary: '#999999',
    inverse: '#000000',
    error: '#FF3B30',
  },
  
  // UI Elements
  ui: {
    border: '#E5E5EA',
    borderDark: '#E5E5EA',
    divider: '#E5E5EA',
  },
  
  // Brand/Actions
  brand: {
    primary: '#34C759', // Green (primary action)
    secondary: '#007AFF', // Blue
    accent: '#5856D6', // Purple
  },
  
  // Status
  status: {
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#007AFF',
  },
  
  // Encounter Type Colors
  encounter: {
    date: '#A855F7',
    conversation: '#10B981',
    medical: '#3B82F6',
    professional: '#F59E0B',
    intimate: '#FF3B9D',
  },
} as const;

// Dark theme colors
const darkColors = {
  // Backgrounds
  background: {
    primary: '#000000',
    secondary: '#1C1C1E',
    dark: '#000000',
    card: '#1C1C1E',
    cardBorder: '#2C2C2E',
  },
  
  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#999999',
    tertiary: '#666666',
    inverse: '#FFFFFF',
    error: '#FF3B30',
  },
  
  // UI Elements
  ui: {
    border: '#2C2C2E',
    borderDark: '#2C2C2E',
    divider: '#2C2C2E',
  },
  
  // Brand/Actions
  brand: {
    primary: '#34C759', // Green (primary action)
    secondary: '#007AFF', // Blue
    accent: '#5856D6', // Purple
  },
  
  // Status
  status: {
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#007AFF',
  },
  
  // Encounter Type Colors
  encounter: {
    date: '#A855F7',
    conversation: '#10B981',
    medical: '#3B82F6',
    professional: '#F59E0B',
    intimate: '#FF3B9D',
  },
} as const;

// Export function to get colors based on theme
export const getColors = (isDark: boolean) => {
  return isDark ? darkColors : lightColors;
};

// Export default (dark) colors for backwards compatibility
export const colors = darkColors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const typography = {
  // Font Family
  fontFamily: {
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
  },
  
  // Font Sizes
  size: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },
  
  // Font Weights
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Helper function to get font family based on weight
  getFontFamily: (weight: '400' | '500' | '600' | '700' | 'normal' | 'medium' | 'semibold' | 'bold' = '400') => {
    const weightMap: Record<string, string> = {
      '400': typography.fontFamily.regular,
      'normal': typography.fontFamily.regular,
      '500': typography.fontFamily.medium,
      'medium': typography.fontFamily.medium,
      '600': typography.fontFamily.semibold,
      'semibold': typography.fontFamily.semibold,
      '700': typography.fontFamily.bold,
      'bold': typography.fontFamily.bold,
    };
    return weightMap[weight] || typography.fontFamily.regular;
  },
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const layout = {
  headerHeight: 56,
  bottomNavHeight: 64,
  cardPadding: spacing.lg,
  screenPadding: spacing.xl,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

