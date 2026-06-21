import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { getOfferings, purchasePackage, restorePurchases } from '@/lib/purchases';
import { useSubscriptionStore } from '@/store/subscription';
import { useAuth } from '@/hooks/useAuth';

const WA_TRIAL_LINK = 'https://wa.me/000000000000?text=Quiero%20activar%20Premium';

const TIMELINE = [
  { day: 'Hoy', label: '$0', icon: 'gift' as const },
  { day: 'Día 5', label: 'Te avisamos', icon: 'notifications' as const },
  { day: 'Día 7', label: 'Primer cobro', icon: 'card' as const },
];

const FEATURES = [
  { icon: 'chatbubbles' as const, title: 'Asistente que aconseja', desc: 'No solo anota: te dice cuándo frenar' },
  { icon: 'people' as const, title: 'Grupos ilimitados', desc: 'Asados, depto, viajes — separado y claro' },
  { icon: 'pie-chart' as const, title: 'Presupuestos inteligentes', desc: 'Se ajustan solos con la inflación' },
  { icon: 'sparkles' as const, title: 'Recap mensual', desc: 'Tu mes en formato resumen, con IA' },
];

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isActive, dismissPaywall } = useSubscriptionStore();
  const { user } = useAuth();
  const hasBackendPlan = user?.plan === 'active';

  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (isActive || hasBackendPlan) {
      router.replace('/(tabs)');
      return;
    }
    loadOfferings();
  }, [isActive, hasBackendPlan]);

  async function loadOfferings() {
    try {
      const current = await getOfferings();
      setOffering(current);
      const annual = current?.availablePackages.find((p) => p.packageType === 'ANNUAL');
      const monthly = current?.availablePackages.find((p) => p.packageType === 'MONTHLY');
      setSelectedPkg(annual ?? monthly ?? current?.availablePackages[0] ?? null);
    } catch (err) {
      console.error('[Paywall] Error cargando offerings:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    dismissPaywall();
    router.replace('/(tabs)');
  }

  async function handlePurchase() {
    if (!selectedPkg) return;
    setPurchasing(true);
    try {
      const success = await purchasePackage(selectedPkg);
      if (success) router.replace('/(tabs)');
    } catch (err: unknown) {
      const e = err as { userCancelled?: boolean; message?: string };
      if (!e.userCancelled) {
        Alert.alert('Error', 'No pudimos completar la compra. Intentá de nuevo.');
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setPurchasing(true);
    try {
      const success = await restorePurchases();
      if (success) {
        router.replace('/(tabs)');
      } else {
        Alert.alert('Sin suscripción activa', 'No encontramos ninguna compra activa asociada a tu cuenta.');
      }
    } catch {
      Alert.alert('Error', 'No pudimos restaurar tus compras. Intentá de nuevo.');
    } finally {
      setPurchasing(false);
    }
  }

  const monthlyPkg = useMemo(
    () => offering?.availablePackages.find((p) => p.packageType === 'MONTHLY') ?? null,
    [offering]
  );
  const annualPkg = useMemo(
    () => offering?.availablePackages.find((p) => p.packageType === 'ANNUAL') ?? null,
    [offering]
  );

  const discountPct = useMemo(() => {
    if (!monthlyPkg || !annualPkg) return null;
    const monthlyPrice = monthlyPkg.product.price;
    const annualMonthlyEquivalent = annualPkg.product.price / 12;
    if (!monthlyPrice) return null;
    return Math.round((1 - annualMonthlyEquivalent / monthlyPrice) * 100);
  }, [monthlyPkg, annualPkg]);

  const firstChargeDate = useMemo(() => {
    const date = addDays(new Date(), 7);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }, []);

  const pkg = selectedPkg;
  const ctaPriceNote = pkg
    ? `$0 hoy · primer cobro el ${firstChargeDate} (${pkg.product.priceString}${pkg.packageType === 'ANNUAL' ? '/año' : '/mes'}) · cancelás en 2 taps`
    : '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient colors={['#1B1B3A', '#08080F']} style={StyleSheet.absoluteFill} />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleDismiss} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.trialBadge}>
          <Text style={styles.trialBadgeText}>7 DÍAS GRATIS</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          Probá Premium.{'\n'}Una semana, <Text style={styles.titleAccent}>sin cargo</Text>.
        </Text>

        {/* Timeline */}
        <View style={styles.timeline}>
          {TIMELINE.map((step, idx) => (
            <React.Fragment key={step.day}>
              <View style={styles.timelineStep}>
                <View style={[styles.timelineIcon, idx === 0 && styles.timelineIconActive]}>
                  <Ionicons name={step.icon} size={16} color={idx === 0 ? '#fff' : '#8B8FA8'} />
                </View>
                <Text style={[styles.timelineDay, idx === 0 && styles.timelineDayActive]}>{step.day}</Text>
                <Text style={styles.timelineLabel}>{step.label}</Text>
              </View>
              {idx < TIMELINE.length - 1 ? <View style={styles.timelineLine} /> : null}
            </React.Fragment>
          ))}
        </View>

        {/* Feature grid */}
        <View style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <Ionicons name={f.icon} size={18} color="#A78BFA" style={{ marginBottom: 8 }} />
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        {/* Plan toggle */}
        {loading ? (
          <ActivityIndicator color="#8B5CF6" style={{ marginVertical: 32 }} />
        ) : monthlyPkg || annualPkg ? (
          <View style={styles.planRow}>
            {monthlyPkg ? (
              <TouchableOpacity
                onPress={() => setSelectedPkg(monthlyPkg)}
                style={[styles.planBtn, pkg?.identifier === monthlyPkg.identifier && styles.planBtnActive]}
              >
                <Text style={[styles.planBtnLabel, pkg?.identifier === monthlyPkg.identifier && styles.planBtnLabelActive]}>
                  Mensual
                </Text>
                <Text style={[styles.planBtnPrice, pkg?.identifier === monthlyPkg.identifier && styles.planBtnLabelActive]}>
                  {monthlyPkg.product.priceString}/mes
                </Text>
              </TouchableOpacity>
            ) : null}
            {annualPkg ? (
              <TouchableOpacity
                onPress={() => setSelectedPkg(annualPkg)}
                style={[styles.planBtn, pkg?.identifier === annualPkg.identifier && styles.planBtnActive]}
              >
                {discountPct ? (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>-{discountPct}%</Text>
                  </View>
                ) : null}
                <Text style={[styles.planBtnLabel, pkg?.identifier === annualPkg.identifier && styles.planBtnLabelActive]}>
                  Anual
                </Text>
                <Text style={[styles.planBtnPrice, pkg?.identifier === annualPkg.identifier && styles.planBtnLabelActive]}>
                  {annualPkg.product.pricePerMonthString ?? annualPkg.product.priceString}/mes
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <TouchableOpacity onPress={() => Linking.openURL(WA_TRIAL_LINK)} style={styles.webLink}>
            <Text style={styles.webLinkText}>No pudimos cargar los planes — reintentar →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity
          style={[styles.ctaButton, (purchasing || !pkg) && styles.ctaDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || !pkg}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaText}>Empezar mis 7 días gratis</Text>
          )}
        </TouchableOpacity>

        {pkg ? <Text style={styles.ctaNote}>{ctaPriceNote}</Text> : null}

        <TouchableOpacity onPress={() => Linking.openURL(WA_TRIAL_LINK)} style={styles.waLink}>
          <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
          <Text style={styles.waLinkText}>Prefiero activarlo desde WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestore} disabled={purchasing} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restaurar compras</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDismiss} style={styles.skipBtn}>
          <Text style={styles.skipText}>Seguir con el plan gratis</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center',
  },
  trialBadge: {
    backgroundColor: 'rgba(139,92,246,0.25)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  trialBadgeText: { fontSize: 11.5, fontFamily: 'DMSans_700Bold', color: '#C4B5FD', letterSpacing: 0.3 },

  scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16 },
  title: {
    fontSize: 26, fontFamily: 'DMSans_700Bold', color: '#FFFFFF',
    lineHeight: 32, marginBottom: 22,
  },
  titleAccent: { color: '#A78BFA' },

  timeline: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 16, marginBottom: 16,
  },
  timelineStep: { alignItems: 'center', flex: 1, gap: 4 },
  timelineLine: { height: 1, flex: 0.5, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 16 },
  timelineIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  timelineIconActive: { backgroundColor: '#8B5CF6' },
  timelineDay: { fontSize: 12.5, fontFamily: 'DMSans_700Bold', color: '#8B8FA8' },
  timelineDayActive: { color: '#A78BFA' },
  timelineLabel: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: '#6F6F8E', textAlign: 'center' },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  featureCard: {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  featureTitle: { fontSize: 13.5, fontFamily: 'DMSans_700Bold', color: '#FFFFFF', marginBottom: 3 },
  featureDesc: { fontSize: 11.5, fontFamily: 'DMSans_400Regular', color: '#8B8FA8', lineHeight: 16 },

  planRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  planBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  planBtnActive: { backgroundColor: 'rgba(139,92,246,0.18)', borderColor: '#8B5CF6' },
  planBtnLabel: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: '#8B8FA8', marginBottom: 4 },
  planBtnLabelActive: { color: '#FFFFFF' },
  planBtnPrice: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#8B8FA8' },
  discountBadge: {
    position: 'absolute', top: 10, right: 10, backgroundColor: '#34D399',
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  discountBadgeText: { fontSize: 10.5, fontFamily: 'DMSans_700Bold', color: '#06231A' },

  webLink: { alignItems: 'center', paddingVertical: 16 },
  webLinkText: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: '#A78BFA' },

  footer: { paddingHorizontal: 20, paddingTop: 8, gap: 10 },
  ctaButton: {
    backgroundColor: '#7C3AED', borderRadius: 16,
    paddingVertical: 17, alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#FFFFFF' },
  ctaNote: { fontSize: 11.5, fontFamily: 'DMSans_400Regular', color: '#6F6F8E', textAlign: 'center' },

  waLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(37,211,102,0.1)', borderRadius: 12, paddingVertical: 10, marginTop: 4,
  },
  waLinkText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: '#25D366' },

  restoreBtn: { alignItems: 'center', paddingVertical: 2 },
  restoreText: { fontSize: 12.5, fontFamily: 'DMSans_400Regular', color: '#6F6F8E' },
  skipBtn: { alignItems: 'center', paddingVertical: 4 },
  skipText: { fontSize: 12.5, fontFamily: 'DMSans_400Regular', color: '#8B8FA8', textDecorationLine: 'underline' },
});
