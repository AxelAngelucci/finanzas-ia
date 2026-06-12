import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const BULLETS = [
  {
    icon: '💬',
    title: 'Registrá gastos por WhatsApp',
    desc: 'Mandá un mensaje y la IA lo clasifica automáticamente.',
  },
  {
    icon: '📊',
    title: 'Entendé a dónde va tu plata',
    desc: 'Reportes, presupuestos y alertas por categoría.',
  },
  {
    icon: '⚡',
    title: 'IA que te habla en argentino',
    desc: 'Consejos, metas e insights adaptados a tu realidad.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#EEF2FF', '#F5F3FF']}
      locations={[0, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 40 }]}
    >
      {/* Step dots */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dotInactive} />
        <View style={styles.dotInactive} />
      </View>

      {/* Hero icon */}
      <View style={styles.iconWrap}>
        <Text style={styles.iconEmoji}>💬</Text>
      </View>

      <Text style={styles.title}>Finanzas sin fricción</Text>
      <Text style={styles.subtitle}>Tu asistente financiero personal</Text>

      {/* Bullets */}
      <View style={styles.bullets}>
        {BULLETS.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletIcon}>
              <Text style={{ fontSize: 18 }}>{b.icon}</Text>
            </View>
            <View style={styles.bulletText}>
              <Text style={styles.bulletTitle}>{b.title}</Text>
              <Text style={styles.bulletDesc}>{b.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(onboarding)/income')}
        style={styles.btn}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Empezar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push('/(onboarding)/wa-login')}
        style={styles.waBtn}
        activeOpacity={0.7}
      >
        <Text style={styles.waBtnText}>💬  Ya uso Finanzas IA por WhatsApp</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 26,
    backgroundColor: '#6366F1',
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(99,102,241,0.25)',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 42,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1E1B4B',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 36,
    lineHeight: 22,
  },
  bullets: {
    flex: 1,
    gap: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  bulletIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E1B4B',
    marginBottom: 3,
  },
  bulletDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  btn: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  waBtn: {
    marginTop: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  waBtnText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '500',
  },
});
