import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/settings';
import { resolveColors, type AppColors } from '@/lib/theme';

export interface ThemeResult {
  colors: AppColors;
  isDark: boolean;
}

export function useTheme(): ThemeResult {
  const systemScheme = useColorScheme();
  const mode = useSettingsStore((s) => s.theme);
  const colors = resolveColors(mode, systemScheme);
  const isDark = colors.bg === '#0C0C1A';
  return { colors, isDark };
}
