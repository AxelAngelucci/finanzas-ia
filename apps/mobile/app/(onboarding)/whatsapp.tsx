import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect } from 'react-native-svg';
import { useOnboardingStore } from '@/store/onboarding';
import { api } from '@/lib/api';

interface WaQrToken { token: string; url: string; expires_at: string }
interface WaStatus { linked: boolean; phone: string | null }

// Fake QR code pattern using SVG rects
function QRCode() {
  const size = 160;
  const cell = 10;
  const grid = size / cell;
  const pattern = [
    [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],
    [1,0],[1,6],[2,0],[2,2],[2,3],[2,4],[2,6],
    [3,0],[3,2],[3,3],[3,4],[3,6],[4,0],[4,2],[4,3],[4,4],[4,6],
    [5,0],[5,6],[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],
    [8,2],[8,4],[8,7],[9,1],[9,3],[9,5],[9,8],
    [10,0],[10,4],[10,6],[10,8],[11,2],[11,3],[11,7],
    [12,0],[12,1],[12,4],[12,6],[13,2],[13,5],[13,8],
    [14,0],[14,2],[14,4],[14,7],[15,1],[15,3],[15,5],
    [0,8],[0,9],[0,10],[0,11],[0,12],[0,13],[0,14],
    [1,8],[1,14],[2,8],[2,10],[2,11],[2,12],[2,14],
    [3,8],[3,10],[3,11],[3,12],[3,14],[4,8],[4,14],
    [5,8],[5,14],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
  ];
  return (
    <Svg width={size} height={size}>
      {pattern.map(([r, c], i) => (
        <Rect key={i} x={c * cell} y={r * cell} width={cell - 1} height={cell - 1} fill="#1E1B4B" rx={1} />
      ))}
    </Svg>
  );
}

export default function WhatsAppScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { complete } = useOnboardingStore();
  const [waLink, setWaLink] = useState<string | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const [isLoadingLink, setIsLoadingLink] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStart = useRef<number>(Date.now());
  const POLL_MAX_MS = 5 * 60 * 1000;

  useEffect(() => {
    api.get<WaQrToken>('/users/me/qr-token')
      .then((res) => setWaLink(res.url))
      .catch(() => {})
      .finally(() => setIsLoadingLink(false));
  }, []);

  useEffect(() => {
    if (!waLink) return;
    pollRef.current = setInterval(async () => {
      if (Date.now() - pollStart.current > POLL_MAX_MS) { clearInterval(pollRef.current!); return; }
      try {
        const res = await api.get<WaStatus>('/users/me/wa-status');
        if (res.linked) { clearInterval(pollRef.current!); setIsLinked(true); await handleFinish(); }
      } catch { /* ignore */ }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [waLink]);

  const handleFinish = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    await complete();
    router.replace('/(tabs)');
  };

  return (
    <LinearGradient
      colors={['#FFF7ED', '#FFFBEB']}
      locations={[0, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 40 }]}
    >
      {/* Step dots */}
      <View style={styles.dots}>
        <View style={styles.dotDone} />
        <View style={styles.dotDone} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      {/* Icon */}
      <View style={styles.iconWrap}>
        <Text style={styles.iconEmoji}>📲</Text>
      </View>

      <Text style={styles.title}>Vinculá WhatsApp</Text>
      <Text style={styles.subtitle}>
        Registrá gastos mandando un mensaje. La IA los clasifica y los suma automáticamente.
      </Text>

      {/* QR / State */}
      <View style={styles.qrCard}>
        {isLinked ? (
          <View style={styles.successWrap}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={styles.successText}>¡WhatsApp vinculado!</Text>
          </View>
        ) : isLoadingLink ? (
          <ActivityIndicator color="#D97706" size="large" />
        ) : waLink ? (
          <>
            <QRCode />
            <Text style={styles.qrHint}>Escaneá con WhatsApp o tocá el botón</Text>
          </>
        ) : (
          <View style={styles.qrPlaceholder}>
            <QRCode />
            <Text style={styles.qrHint}>Vinculación disponible próximamente</Text>
          </View>
        )}
      </View>

      {waLink && !isLinked ? (
        <TouchableOpacity
          onPress={() => Linking.openURL(waLink)}
          style={styles.whatsappBtn}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 20 }}>💬</Text>
          <Text style={styles.whatsappBtnText}>Abrir WhatsApp</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity onPress={handleFinish} style={styles.skipBtn} activeOpacity={0.7}>
        <Text style={styles.skipText}>{waLink ? 'Lo hago después' : 'Ir a la app'}</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 40,
    alignSelf: 'flex-start',
  },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 26, backgroundColor: '#D97706' },
  dotDone: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D97706' },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: 'rgba(217,119,6,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: { fontSize: 42 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E1B4B',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 28,
    lineHeight: 22,
    textAlign: 'center',
  },
  qrCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
    width: '100%',
    gap: 14,
  },
  qrHint: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  qrPlaceholder: {
    alignItems: 'center',
    gap: 12,
  },
  successWrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  whatsappBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipBtn: {
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(217,119,6,0.3)',
  },
  skipText: {
    color: '#D97706',
    fontSize: 15,
    fontWeight: '600',
  },
});
