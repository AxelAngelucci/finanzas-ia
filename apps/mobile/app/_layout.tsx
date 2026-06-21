import '../global.css';
import React, { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts, DMSans_300Light, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans';
import * as SplashScreen from 'expo-splash-screen';
import Purchases from 'react-native-purchases';
import { configureRevenueCat, refreshCustomerInfo } from '@/lib/purchases';
import { useSubscriptionStore } from '@/store/subscription';

SplashScreen.preventAutoHideAsync();
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/auth';
import { useAuth } from '@/hooks/useAuth';
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
  const { refreshProfile, user } = useAuth();
  const { isActive, isLoading: isSubLoading, paywallDismissed } = useSubscriptionStore();

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthFailure(async () => {
      await logout();
    });
    return unsubscribe;
  }, [logout]);

  // Initialize RevenueCat once we have a user ID
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    configureRevenueCat(user.id);
    refreshCustomerInfo();

    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      useSubscriptionStore.getState().setCustomerInfo(info);
    });
    return () => listener.remove();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (isLoadingSession) return;

    const inOnboarding = segments[0] === '(onboarding)';
    const inPaywall = segments[0] === 'paywall';

    if (!isAuthenticated && !inOnboarding) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    // Gate: `expired` always forces the paywall (no escape). `free` shows it once per
    // session as an upsell, dismissible via the paywall's back arrow / "seguir gratis" link —
    // it must not trap the user in a redirect loop.
    const hasBackendPlan = user?.plan === 'active';
    const trialExpired = user?.plan === 'expired';
    const shouldShowPaywall = trialExpired || !paywallDismissed;
    if (isAuthenticated && !isSubLoading && !isActive && !hasBackendPlan && shouldShowPaywall && !inOnboarding && !inPaywall) {
      router.replace('/paywall');
    }
  }, [isAuthenticated, isLoadingSession, isActive, isSubLoading, paywallDismissed, user?.plan, segments, router]);

  // Restore user profile after session reload (tokens exist but user object is null)
  useEffect(() => {
    if (isAuthenticated && !isLoadingSession && !user) {
      refreshProfile();
    }
  }, [isAuthenticated, isLoadingSession, user]);

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
              <Stack.Screen name="paywall" options={{ headerShown: false, gestureEnabled: false }} />
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
