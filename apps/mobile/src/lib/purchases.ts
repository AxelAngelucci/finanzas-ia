import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useSubscriptionStore } from '@/store/subscription';

const RC_IOS_KEY     = (Constants.expoConfig?.extra?.rcIosKey as string)     ?? 'appl_YOUR_KEY_HERE';
const RC_ANDROID_KEY = (Constants.expoConfig?.extra?.rcAndroidKey as string) ?? 'goog_YOUR_KEY_HERE';

export function configureRevenueCat(userId: string): void {
  const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey, appUserID: userId });
}

export async function refreshCustomerInfo(): Promise<void> {
  const { setCustomerInfo, setLoading } = useSubscriptionStore.getState();
  try {
    setLoading(true);
    const info = await Purchases.getCustomerInfo();
    setCustomerInfo(info);
  } finally {
    setLoading(false);
  }
}

export async function getOfferings() {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const { setCustomerInfo } = useSubscriptionStore.getState();
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  setCustomerInfo(customerInfo);
  return customerInfo.entitlements.active['premium'] !== undefined;
}

export async function restorePurchases(): Promise<boolean> {
  const { setCustomerInfo } = useSubscriptionStore.getState();
  const info = await Purchases.restorePurchases();
  setCustomerInfo(info);
  return info.entitlements.active['premium'] !== undefined;
}
