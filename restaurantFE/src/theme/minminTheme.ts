import type { Theme as NavigationTheme } from '@react-navigation/native';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
// import { Mobile } from '@minmin/theme';

const mobileTheme = {
  light: {
    bg: '#f9fafb',
    surface: '#ffffff',
    text: '#1f2937',
    primary: '#73b661',
    accent: '#ffb72b',
  },
  dark: {
    bg: '#0b0f16',
    surface: '#111827',
    text: '#f3f4f6',
    primary: '#8cd489',
    accent: '#ffd27f',
  },
};

export const paperLightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 16,
  colors: {
    ...MD3LightTheme.colors,
    primary: mobileTheme.light.primary,
    onPrimary: '#ffffff',
    secondary: mobileTheme.light.accent,
    onSecondary: '#2b1d14',
    background: mobileTheme.light.bg,
    surface: mobileTheme.light.surface,
    surfaceVariant: '#f3f4f6',
    outline: '#d1d5db',
    onSurface: mobileTheme.light.text,
    onSurfaceVariant: '#4b5563',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level2: '#ffffff',
    },
  },
};

export const paperDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 16,
  colors: {
    ...MD3DarkTheme.colors,
    primary: mobileTheme.dark.primary,
    onPrimary: '#102616',
    secondary: mobileTheme.dark.accent,
    background: mobileTheme.dark.bg,
    surface: mobileTheme.dark.surface,
    surfaceVariant: '#1f2937',
    outline: '#374151',
    onSurface: mobileTheme.dark.text,
    onSurfaceVariant: '#9ca3af',
  },
};

export const navigationLightTheme: NavigationTheme = {
  ...NavigationDefaultTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    primary: mobileTheme.light.primary,
    background: mobileTheme.light.bg,
    card: mobileTheme.light.surface,
    text: mobileTheme.light.text,
    border: '#d1d5db',
    notification: mobileTheme.light.accent,
  },
};

export const navigationDarkTheme: NavigationTheme = {
  ...NavigationDarkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    primary: mobileTheme.dark.primary,
    background: mobileTheme.dark.bg,
    card: mobileTheme.dark.surface,
    text: mobileTheme.dark.text,
    border: '#243244',
    notification: mobileTheme.dark.accent,
  },
};
