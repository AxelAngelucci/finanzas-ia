import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ─── Config ──────────────────────────────────────────────────────────────────

function resolveApiUrl(): string {
  // Explicit override wins (prod or custom env)
  const explicit =
    (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
    process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit;

  // In dev, derive the host IP from the Expo dev-server URI so it works on
  // Android emulators (10.0.2.2) and physical devices (real LAN IP) alike.
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081"
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:3001/v1`;
    }
    // Android emulator fallback — localhost is unreachable from the emulator
    if (Platform.OS === 'android') return 'http://10.0.2.2:3001/v1';
  }

  return 'http://localhost:3001/v1';
}

const BASE_URL = resolveApiUrl();

const SECURE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
  noAuth?: boolean;
}

// ─── Token Management ────────────────────────────────────────────────────────

let refreshPromise: Promise<string | null> | null = null;

async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
  } catch {
    return null;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) return null;

      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
        return null;
      }

      const json = await res.json();
      const newAccessToken: string = json.data?.access_token ?? json.access_token;

      if (newAccessToken) {
        await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, newAccessToken);
      }

      if (json.data?.refresh_token ?? json.refresh_token) {
        await SecureStore.setItemAsync(
          SECURE_KEYS.REFRESH_TOKEN,
          json.data?.refresh_token ?? json.refresh_token,
        );
      }

      return newAccessToken ?? null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── Core Request ─────────────────────────────────────────────────────────────

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const buildUrl = (): string => {
    const url = new URL(`${BASE_URL}${path}`);
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }
    return url.toString();
  };

  const buildHeaders = async (accessToken: string | null): Promise<HeadersInit> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (accessToken && !options?.noAuth) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
  };

  const doRequest = async (token: string | null): Promise<Response> => {
    const headers = await buildHeaders(token);
    return fetch(buildUrl(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal,
    });
  };

  let token = options?.noAuth ? null : await getAccessToken();
  let response = await doRequest(token);

  // Handle 401 by refreshing once
  if (response.status === 401 && !options?.noAuth) {
    token = await refreshAccessToken();
    if (token) {
      response = await doRequest(token);
    } else {
      // Emit auth failure event for the auth store to handle
      authFailureCallbacks.forEach((cb) => cb());
      throw new ApiError(401, 'Sesión expirada. Por favor iniciá sesión nuevamente.');
    }
  }

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const errJson = await response.json();
      message = errJson.message ?? errJson.error ?? message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(response.status, message);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const json = await response.json();
  return json as T;
}

// ─── Auth Failure Callbacks ───────────────────────────────────────────────────

const authFailureCallbacks: Array<() => void> = [];

export function onAuthFailure(cb: () => void): () => void {
  authFailureCallbacks.push(cb);
  return () => {
    const idx = authFailureCallbacks.indexOf(cb);
    if (idx !== -1) authFailureCallbacks.splice(idx, 1);
  };
}

// ─── API Error ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('GET', path, undefined, options);
  },

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('POST', path, body, options);
  },

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PUT', path, body, options);
  },

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return request<T>('PATCH', path, body, options);
  },

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>('DELETE', path, undefined, options);
  },
};

export { SECURE_KEYS, BASE_URL };
