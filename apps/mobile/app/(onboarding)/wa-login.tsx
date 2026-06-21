import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: any;
}

export default function WaLoginScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const store   = useAuthStore();

  const [step,      setStep]      = useState<'phone' | 'code'>('phone');
  const [phone,     setPhone]     = useState('');
  const [code,      setCode]      = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState('');
  const codeRef = useRef<TextInput>(null);

  const normalizedPhone = phone.startsWith('+') ? phone.replace(/\s/g, '') : `+${phone.replace(/\s/g, '')}`;

  const handleSendCode = async () => {
    if (phone.replace(/\D/g, '').length < 8) {
      setError('Ingresá un número de teléfono válido');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/wa-claim', { phone: normalizedPhone }, { noAuth: true });
      setStep('code');
      setTimeout(() => codeRef.current?.focus(), 300);
    } catch {
      setError('No se pudo enviar el código. Verificá que el número sea correcto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) { setError('El código tiene 6 dígitos'); return; }
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post<AuthResponse>('/auth/wa-verify', { phone: normalizedPhone, code }, { noAuth: true });
      await store.login(
        { access_token: res.access_token, refresh_token: res.refresh_token },
        res.user,
      );
      router.replace('/(tabs)');
    } catch {
      setError('Código incorrecto o expirado. Intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#F0FDF4', '#ECFDF5']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 48,
            paddingBottom: insets.bottom + 40,
            paddingHorizontal: 28,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => step === 'code' ? setStep('phone') : router.back()} style={styles.back}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>

          {/* Hero */}
          <View style={styles.iconWrap}>
            <Text style={styles.iconEmoji}>💬</Text>
          </View>

          {step === 'phone' ? (
            <>
              <Text style={styles.title}>Accedé con WhatsApp</Text>
              <Text style={styles.subtitle}>
                Si ya usás Finia por WhatsApp, te mandamos un código para entrar.
              </Text>

              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>Número de WhatsApp</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="+54 9 11 1234 5678"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={(v) => { setPhone(v); setError(''); }}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSendCode}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                onPress={handleSendCode}
                disabled={isLoading}
                style={[styles.btn, isLoading && styles.btnDisabled]}
                activeOpacity={0.85}
              >
                {isLoading
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.btnText}>Enviar código</Text>
                }
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>Ingresá el código</Text>
              <Text style={styles.subtitle}>
                Te enviamos un código de 6 dígitos a {normalizedPhone}.
              </Text>

              <View style={styles.fieldCard}>
                <Text style={styles.fieldLabel}>Código de verificación</Text>
                <TextInput
                  ref={codeRef}
                  style={[styles.textInput, styles.codeInput]}
                  placeholder="123456"
                  placeholderTextColor="#9CA3AF"
                  value={code}
                  onChangeText={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                  keyboardType="number-pad"
                  maxLength={6}
                  returnKeyType="done"
                  onSubmitEditing={handleVerify}
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                onPress={handleVerify}
                disabled={isLoading || code.length !== 6}
                style={[styles.btn, (isLoading || code.length !== 6) && styles.btnDisabled]}
                activeOpacity={0.85}
              >
                {isLoading
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.btnText}>Verificar</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setCode(''); handleSendCode(); }} style={styles.resendBtn}>
                <Text style={styles.resendText}>Reenviar código</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  back: { marginBottom: 32 },
  backText: { fontSize: 15, color: '#059669', fontWeight: '500' },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(37,211,102,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: { fontSize: 38 },
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
  codeInput: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 6,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    marginBottom: 14,
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  btn: {
    backgroundColor: '#25D366',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  btnDisabled: {
    backgroundColor: '#A7F3C9',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: { color: 'white', fontSize: 16, fontWeight: '600' },
  resendBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  resendText: { color: '#6B7280', fontSize: 14 },
});
