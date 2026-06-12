import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { api, ApiError } from '@/lib/api';
import type { LoginPayload, RegisterPayload, AuthTokens, User } from '@/types';

// Backend returns tokens flat at root (no "data" wrapper, no "tokens" nesting)
interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// ─── Auth Hook ────────────────────────────────────────────────────────────────

export function useAuth() {
  const store = useAuthStore();

  const login = useCallback(
    async (payload: LoginPayload): Promise<void> => {
      const response = await api.post<AuthResponse>('/auth/login', payload, { noAuth: true });
      const tokens: AuthTokens = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      };
      await store.login(tokens, response.user);
    },
    [store],
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<void> => {
      const response = await api.post<AuthResponse>('/auth/register', payload, { noAuth: true });
      const tokens: AuthTokens = {
        access_token: response.access_token,
        refresh_token: response.refresh_token,
      };
      await store.login(tokens, response.user);
    },
    [store],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the server call fails, we clear the local session
    }
    await store.logout();
  }, [store]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const user = await api.get<User>('/users/me');
      store.setUser(user);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await store.logout();
      }
    }
  }, [store]);

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLocked: store.isLocked,
    isLoadingSession: store.isLoadingSession,
    accessToken: store.accessToken,
    login,
    register,
    logout,
    lock: store.lock,
    unlock: store.unlock,
    loadSession: store.loadSession,
    setUser: store.setUser,
    refreshProfile,
  };
}
