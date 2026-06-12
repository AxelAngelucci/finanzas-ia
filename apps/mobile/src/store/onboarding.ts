import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@finanzas_ia_onboarding_done';

interface OnboardingStore {
  isCompleted: boolean;
  isLoaded: boolean;
  load: () => Promise<void>;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  isCompleted: false,
  isLoaded: false,

  load: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      set({ isCompleted: value === '1', isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },

  complete: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    set({ isCompleted: true });
  },

  reset: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ isCompleted: false });
  },
}));
