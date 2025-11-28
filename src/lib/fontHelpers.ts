/**
 * Font Helper Utilities
 * Makes it easy to apply Poppins font family to text styles
 */

import { typography } from './theme';

/**
 * Returns a text style object with the appropriate Poppins font family
 * based on the font weight
 */
export function getTextStyle(weight: '400' | '500' | '600' | '700' | 'normal' | 'medium' | 'semibold' | 'bold' = '400') {
  return {
    fontFamily: typography.getFontFamily(weight),
  };
}

/**
 * Helper to add fontFamily to an existing text style object
 */
export function withPoppins<T extends { fontWeight?: string | number }>(
  style: T,
  weight?: '400' | '500' | '600' | '700' | 'normal' | 'medium' | 'semibold' | 'bold'
): T & { fontFamily: string } {
  const fontWeight = weight || 
    (style.fontWeight === '400' || style.fontWeight === 'normal' ? '400' :
     style.fontWeight === '500' || style.fontWeight === 'medium' ? '500' :
     style.fontWeight === '600' || style.fontWeight === 'semibold' ? '600' :
     style.fontWeight === '700' || style.fontWeight === 'bold' ? '700' : '400');
  
  return {
    ...style,
    fontFamily: typography.getFontFamily(fontWeight),
  };
}

