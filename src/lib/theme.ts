/**
 * Design System / Theme Constants
 * Centralized colors, spacing, typography, and other design tokens
 */

// Brand Colors - Green used sparingly as accent
const brandColors = {
  green: '#34C759',   // Accent green (softer, used sparingly)
  white: '#FFFFFF',   // Standard white
  black: '#000000',   // Standard black
} as const;

// Light theme colors
const lightColors = {
  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#F2F2F7',
    dark: '#F2F2F7',
    card: '#FFFFFF',
    cardBorder: '#E5E5EA',
  },

  // Text
  text: {
    primary: '#000000',
    secondary: '#6B6B6B',
    tertiary: '#8E8E93',
    inverse: '#000000',
    error: '#FF3B30',
  },

  // UI Elements
  ui: {
    border: '#E5E5EA',
    borderDark: '#C7C7CC',
    divider: '#E5E5EA',
    accent: '#8E8E93',       // Subtle accent for icons/interactive elements
    accentLight: '#E5E5EA',  // Light accent for backgrounds
  },

  // Brand/Actions - Green used sparingly for CTAs only
  brand: {
    primary: brandColors.green,  // Primary CTA color (green) - use sparingly!
    secondary: '#5856D6',  // Secondary (purple)
    accent: '#007AFF',  // Accent blue
  },

  // Status
  status: {
    error: '#FF3B30',
    success: brandColors.green,
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

// Dark theme colors (default)
const darkColors = {
  // Backgrounds
  background: {
    primary: '#000000',
    secondary: '#1C1C1E',
    dark: '#000000',
    card: '#1C1C1E',
    cardBorder: '#38383A',
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#ABABAB',
    tertiary: '#8E8E93',
    inverse: '#FFFFFF',
    error: '#FF453A',
  },

  // UI Elements
  ui: {
    border: '#38383A',
    borderDark: '#48484A',
    divider: '#38383A',
    accent: '#636366',       // Subtle accent for icons/interactive elements
    accentLight: '#48484A',  // Light accent for backgrounds
  },

  // Brand/Actions - Green used sparingly for CTAs only
  brand: {
    primary: brandColors.green,  // Primary CTA color (green) - use sparingly!
    secondary: '#5E5CE6',  // Secondary (purple)
    accent: '#0A84FF',  // Accent blue
  },

  // Status
  status: {
    error: '#FF453A',
    success: brandColors.green,
    warning: '#FF9F0A',
    info: '#0A84FF',
  },

  // Encounter Type Colors
  encounter: {
    date: '#BF5AF2',
    conversation: '#30D158',
    medical: '#64D2FF',
    professional: '#FFD60A',
    intimate: '#FF375F',
  },
} as const;

// Export brand colors for direct access if needed
export { brandColors };

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
