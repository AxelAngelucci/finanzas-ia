import '../global.css';
import React, { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, DMSans_300Light, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/auth';
import { useSettingsStore } from '@/store/settings';
import { useOnboardingStore } from '@/store/onboarding';
import { LockScreen } from '@/components/lock/LockScreen';
import { onAuthFailure } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

// ─── Refetch on app foreground (React Native AppState) ───────────────────────

AppState.addEventListener('change', (status) => {
  focusManager.setFocused(status === 'active');
});

// ─── Query Client ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ─── Auth Guard ───────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoadingSession, loadSession, logout } = useAuthStore();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthFailure(async () => {
      await logout();
    });
    return unsubscribe;
  }, [logout]);

  useEffect(() => {
    if (isLoadingSession) return;

    const inOnboarding = segments[0] === '(onboarding)';

    if (!isAuthenticated && !inOnboarding) {
      router.replace('/(onboarding)/welcome');
    }
  }, [isAuthenticated, isLoadingSession, segments, router]);

  return <>{children}</>;
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const { isLocked, isAuthenticated } = useAuthStore();
  const { loadSettings } = useSettingsStore();
  const { load: loadOnboarding } = useOnboardingStore();

  const [fontsLoaded] = useFonts({
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  });

  useEffect(() => {
    loadSettings();
    loadOnboarding();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemedStatusBar />
          <AuthGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>

            {/* Lock Screen overlay — shown on top after biometric challenge */}
            {isAuthenticated && isLocked ? (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9999,
                }}
              >
                <LockScreen />
              </View>
            ) : null}
          </AuthGuard>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
