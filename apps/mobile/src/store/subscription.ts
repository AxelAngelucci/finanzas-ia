import { create } from 'zustand';
import { CustomerInfo } from 'react-native-purchases';

export const ENTITLEMENT_ID = 'premium';

interface SubscriptionState {
  customerInfo: CustomerInfo | null;
  isActive: boolean;
  isLoading: boolean;
  // Tracks whether the free-plan user dismissed the paywall this session,
  // so the auth gate doesn't bounce them back into a closed loop.
  paywallDismissed: boolean;
  setCustomerInfo: (info: CustomerInfo) => void;
  setLoading: (loading: boolean) => void;
  dismissPaywall: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  customerInfo: null,
  isActive: false,
  isLoading: true,
  paywallDismissed: false,
  setCustomerInfo: (info) =>
    set({
      customerInfo: info,
      isActive: info.entitlements.active[ENTITLEMENT_ID] !== undefined,
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  dismissPaywall: () => set({ paywallDismissed: true }),
}));
