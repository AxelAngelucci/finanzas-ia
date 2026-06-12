import type { ColorSchemeName } from 'react-native';

export const lightColors = {
  bg:           '#F4F5FA',
  surface:      '#FFFFFF',
  surface2:     '#ECEEF6',
  primary:      '#6366F1',
  primaryLight: '#EEF2FF',
  primaryDark:  '#4F46E5',
  text:         '#1E1B4B',
  text2:        '#6B7280',
  text3:        '#9CA3AF',
  border:       '#E8EAF0',
  success:      '#059669',
  successLight: '#ECFDF5',
  danger:       '#DC2626',
  dangerLight:  '#FEF2F2',
  warning:      '#D97706',
  warningLight: '#FFFBEB',
  cardShadow:   'rgba(99,102,241,0.07)',
  shadow:       '#1E1B4B',
} as const;

export const darkColors = {
  bg:           '#0C0C1A',
  surface:      '#14142A',
  surface2:     '#1D1D36',
  primary:      '#818CF8',
  primaryLight: '#1E1B4B',
  primaryDark:  '#6366F1',
  text:         '#EEEEFF',
  text2:        '#9CA3AF',
  text3:        '#6B7280',
  border:       '#2A2A4A',
  success:      '#34D399',
  successLight: '#064E3B',
  danger:       '#F87171',
  dangerLight:  '#450A0A',
  warning:      '#FCD34D',
  warningLight: '#451A03',
  cardShadow:   'rgba(0,0,0,0.35)',
  shadow:       '#000000',
} as const;

export type AppColors = typeof lightColors;

export function resolveColors(
  mode: 'light' | 'dark' | 'system',
  systemScheme: ColorSchemeName,
): AppColors {
  if (mode === 'dark') return darkColors;
  if (mode === 'light') return lightColors;
  return systemScheme === 'dark' ? darkColors : lightColors;
}
