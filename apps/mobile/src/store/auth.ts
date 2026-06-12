import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { SECURE_KEYS } from '@/lib/api';
import type { User, AuthTokens } from '@/types';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  isLoadingSession: boolean;
}

interface AuthActions {
  login: (tokens: AuthTokens, user: User) => Promise<void>;
  logout: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
  setUser: (user: User) => void;
  loadSession: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLocked: false,
  isLoadingSession: true,

  // ── Actions ──────────────────────────────────────────────────────────────

  login: async (tokens: AuthTokens, user: User) => {
    await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, tokens.access_token);
    await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    set({
      user,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      isAuthenticated: true,
      isLocked: false,
    });
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    } catch {
      // Ignore secure store errors on logout
    }
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLocked: false,
    });
  },

  lock: () => {
    const { isAuthenticated } = get();
    if (isAuthenticated) {
      set({ isLocked: true });
    }
  },

  unlock: () => {
    set({ isLocked: false });
  },

  setUser: (user: User) => {
    set({ user });
  },

  loadSession: async () => {
    set({ isLoadingSession: true });
    try {
      const [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN),
        SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN),
      ]);

      if (accessToken && refreshToken) {
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLocked: true, // Lock by default on app resume — biometric required
        });
      } else {
        set({
          isAuthenticated: false,
          isLocked: false,
        });
      }
    } catch {
      set({ isAuthenticated: false, isLocked: false });
    } finally {
      set({ isLoadingSession: false });
    }
  },
}));
