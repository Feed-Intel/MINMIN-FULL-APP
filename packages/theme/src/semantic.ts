import { brand, neutral, signal } from './tokens';

export const light = {
  bg: neutral[50],
  surface: neutral[0],
  text: neutral[800],
  mutedText: neutral[500],
  border: neutral[200],
  primary: brand.primary[500],
  primaryFg: '#ffffff',
  accent: brand.accent[500],
  success: signal.success[500],
  warning: signal.warning[500],
  danger: signal.danger[500],
  info: signal.info[500],
};

export const dark = {
  bg: neutral[1000],
  surface: neutral[900],
  text: neutral[100],
  mutedText: neutral[400],
  border: '#243244',
  primary: brand.primary[400],
  primaryFg: '#ffffff',
  accent: brand.accent[400],
  success: '#22c55e',
  warning: '#fbbf24',
  danger: '#ef4444',
  info: '#3b82f6',
};

export type SemanticMode = 'light' | 'dark';
