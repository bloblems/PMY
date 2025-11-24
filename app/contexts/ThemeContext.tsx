import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getColors } from '@/lib/theme';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => Promise<void>;
  colors: ReturnType<typeof getColors>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark
  const [isHydrated, setIsHydrated] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system')) {
          setThemeState(storedTheme as Theme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsHydrated(true);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: Theme) => {
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Determine if we should use dark mode
  const isDark = theme === 'dark' || (theme === 'system' && systemColorScheme === 'dark');
  
  // Get theme-aware colors
  const themeColors = getColors(isDark);

  if (!isHydrated) {
    return null; // Or return a loading indicator
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, colors: themeColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

