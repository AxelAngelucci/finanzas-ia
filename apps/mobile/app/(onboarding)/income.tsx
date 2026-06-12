import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';
import { useSettingsStore } from '@/store/settings';
import { api } from '@/lib/api';

// ─── Device credential generation ─────────────────────────────────────────────

function randomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

async function getOrCreateCredentials(): Promise<{ email: string; password: string }> {
  let deviceId = await SecureStore.getItemAsync('device_id');
  if (!deviceId) {
    deviceId = randomString(24);
    await SecureStore.setItemAsync('device_id', deviceId);
  }
  let password = await SecureStore.getItemAsync('device_password');
  if (!password) {
    password = randomString(32);
    await SecureStore.setItemAsync('device_password', password);
  }
  return { email: `${deviceId}@finanzas.local`, password };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function IncomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { register, login } = useAuth();
  const { setMonthlyIncome } = useSettingsStore();

  const [name, setName] = useState('');
  const [incomeRaw, setIncomeRaw] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    const nameClean = name.trim();
    if (!nameClean) { setError('Ingresá tu nombre para continuar'); return; }
    const incomeNum = Number(incomeRaw.replace(/\D/g, ''));
    if (!incomeNum || incomeNum <= 0) { setError('Ingresá un ingreso mensual válido'); return; }

    setIsLoading(true);
    setError('');
    try {
      const creds = await getOrCreateCredentials();
      try {
        await register({ name: nameClean, email: creds.email, password: creds.password });
      } catch (regErr) {
        // 409 = device already registered → try login with same credentials
        if (regErr instanceof ApiError && regErr.status === 409) {
          await login({ email: creds.email, password: creds.password });
        } else {
          throw regErr;
        }
      }
      const incomeCentavos = incomeNum * 100;
      await setMonthlyIncome(incomeCentavos);
      try { await api.patch('/users/me', { monthly_income: incomeCentavos }); } catch { /* non-blocking */ }
      router.push('/(onboarding)/whatsapp');
    } catch (err: unknown) {
      console.error('[income] register error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('connect')) {
        setError('No se pudo conectar al servidor. Verificá que el backend esté corriendo en localhost:3001.');
      } else {
        setError(`Error al registrar: ${msg}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#F0FDF4', '#ECFDF5']}
      locations={[0, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step dots */}
          <View style={styles.dots}>
            <View style={styles.dotDone} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dotInactive} />
          </View>

          {/* Hero */}
          <View style={styles.iconWrap}>
            <Text style={styles.iconEmoji}>🎯</Text>
          </View>

          <Text style={styles.title}>Contanos sobre vos</Text>
          <Text style={styles.subtitle}>
            Con esta info la IA te da consejos más precisos.
          </Text>

          {/* Name */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Tu nombre</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Juan García"
              placeholderTextColor="#9CA3AF"
              value={name}
              onChangeText={(v) => { setName(v); setError(''); }}
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
            />
          </View>

          {/* Income */}
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Ingreso mensual estimado</Text>
            <View style={styles.incomeRow}>
              <Text style={styles.currencySign}>$</Text>
              <TextInput
                style={[styles.textInput, { flex: 1, fontSize: 24, fontWeight: '700' }]}
                placeholder="250.000"
                placeholderTextColor="#9CA3AF"
                value={incomeRaw}
                onChangeText={(v) => { setIncomeRaw(v.replace(/[^0-9]/g, '')); setError(''); }}
                keyboardType="numeric"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
              <Text style={styles.currencyCode}>ARS</Text>
            </View>
            <Text style={styles.fieldHint}>Podés cambiarlo después en Configuración</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleContinue}
            disabled={isLoading}
            style={[styles.btn, isLoading && styles.btnDisabled]}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {isLoading ? 'Configurando...' : 'Continuar'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#059669',
  },
  dotDone: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(5,150,105,0.25)',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(5,150,105,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 42,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E1B4B',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 28,
    lineHeight: 22,
  },
  fieldCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 22,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  textInput: {
    fontSize: 16,
    color: '#1E1B4B',
    padding: 0,
  },
  incomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currencySign: {
    fontSize: 22,
    fontWeight: '600',
    color: '#6B7280',
  },
  currencyCode: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  fieldHint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
  },
  btn: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  btnDisabled: {
    backgroundColor: '#6EE7B7',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
