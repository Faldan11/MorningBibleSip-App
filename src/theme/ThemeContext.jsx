import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ThemeContext = createContext();

const THEME_STORAGE_KEY = 'mbs_user_theme';

const themes = {
  light: {
    background: '#FDFCF8', // Warm off-white
    card: '#FFFFFF',
    text: '#1A1A1A',
    textMuted: '#666666',
    primary: '#D4AF37', // Gold
    secondary: '#2C3E50', // Deep Blue
    border: '#E5E5E5',
    accent: '#E6B800',
    tabBar: '#FFFFFF',
  },
  dark: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    textMuted: '#AAAAAA',
    primary: '#D4AF37', // Gold
    secondary: '#34495E',
    border: '#333333',
    accent: '#FFD700',
    tabBar: '#1E1E1E',
  },
};

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState(systemScheme || 'light');

  // Load saved theme on mount
  useEffect(() => {
    (async () => {
      try {
        const savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (savedTheme) {
          setThemeState(savedTheme);
        }
      } catch (e) {
        console.warn('Failed to load theme from storage');
      }
    })();
  }, []);

  const setTheme = async (newTheme) => {
    setThemeState(newTheme);
    try {
      await SecureStore.setItemAsync(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('Failed to save theme to storage');
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const colors = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeColors() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeColors must be used within a ThemeProvider');
  return context.colors;
}

export function useTheme() {
  return useContext(ThemeContext);
}