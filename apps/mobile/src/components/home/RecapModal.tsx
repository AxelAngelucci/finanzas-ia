import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatARS } from '@/lib/format';

const RC_DUR = 5000;
const CARDS_COUNT = 6;
const SEGMENT_GAP = 5;
const SEGMENT_H_PADDING = 14;

const { width: SCREEN_W } = Dimensions.get('window');
const SEGMENT_W =
  (SCREEN_W - SEGMENT_H_PADDING * 2 - SEGMENT_GAP * (CARDS_COUNT - 1)) / CARDS_COUNT;

// ─── RcStat ───────────────────────────────────────────────────────────────────

function RcStat({ n, l }: { n: string; l: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text
        style={{
          fontSize: 21,
          fontWeight: '800',
          letterSpacing: -0.8,
          color: 'white',
          fontVariant: ['tabular-nums'],
        }}
      >
        {n}
      </Text>
      <Text
        style={{
          fontSize: 9.5,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.7,
          color: 'rgba(255,255,255,0.65)',
        }}
      >
        {l}
      </Text>
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecapModalProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  income?: number;
  expenses?: number;
}

// ─── RecapModal ───────────────────────────────────────────────────────────────

export function RecapModal({
  visible,
  onClose,
  userName = 'Valentina',
  income = 45150000,
  expenses = 28880000,
}: RecapModalProps) {
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(0);
  const [toast, setToast] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const barAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const savedAmount = income > 0 ? income - expenses : 16265000;
  const savedPct = income > 0 ? Math.round(((income - expenses) / income) * 100) : 36;

  const monthName = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toLocaleDateString('es-AR', { month: 'long' });
  })();

  const monthLabel = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d
      .toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
      .toUpperCase()
      .replace('.', '');
  })();

  const isLast = idx === CARDS_COUNT - 1;
  const next = useCallback(() => setIdx(i => Math.min(CARDS_COUNT - 1, i + 1)), []);
  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);

  // Story progress bar
  useEffect(() => {
    if (!visible) return;
    progressAnim.setValue(0);
    animRef.current?.stop();

    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: RC_DUR,
      useNativeDriver: false,
    });
    animRef.current = anim;
    anim.start(({ finished }) => {
      if (finished && idx < CARDS_COUNT - 1) setIdx(i => i + 1);
    });

    return () => animRef.current?.stop();
  }, [idx, visible]);

  // Card body fade-in + scale
  useEffect(() => {
    cardAnim.setValue(0);
    Animated.spring(cardAnim, {
      toValue: 1,
      tension: 120,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [idx]);

  // Category bars (card 3, index 2)
  useEffect(() => {
    if (idx !== 2) return;
    barAnims.forEach(a => a.setValue(0));
    barAnims.forEach((a, i) => {
      Animated.sequence([
        Animated.delay(200 + i * 120),
        Animated.timing(a, { toValue: 1, duration: 900, useNativeDriver: false }),
      ]).start();
    });
  }, [idx]);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      setIdx(0);
      progressAnim.setValue(0);
    }
  }, [visible]);

  const cats = [
    { cat: 'Alquiler', monto: 8500000, pct: 100, col: '#F59E0B' },
    { cat: 'Varios', monto: 6445000, pct: 76, col: '#818CF8' },
    { cat: 'Transporte', monto: 6000000, pct: 71, col: '#A78BFA' },
  ];

  // Bar width available inside card body (screenW - 30*2 padding - 12*2 inner padding)
  const barMaxW = SCREEN_W - 60 - 24;

  type CardDef = {
    colors: [string, string] | [string, string, string];
    share?: boolean;
    body: React.ReactNode;
  };

  const cards: CardDef[] = [
    // 1 — Intro
    {
      colors: ['#0c0c24', '#1a0a3c', '#0d1b3e'],
      body: (
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 7,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 100,
              paddingHorizontal: 14,
              paddingVertical: 6,
              marginBottom: 34,
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#6366F1',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 10, color: 'white' }}>✦</Text>
            </View>
            <Text
              style={{
                fontSize: 11.5,
                fontWeight: '700',
                color: 'rgba(255,255,255,0.85)',
                letterSpacing: 0.3,
              }}
            >
              Finanzas IA
            </Text>
          </View>
          <Text
            style={{ fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}
          >
            {userName}, tu
          </Text>
          <Text
            style={{
              fontSize: 54,
              fontWeight: '800',
              color: 'white',
              letterSpacing: -2.5,
              lineHeight: 58,
              textAlign: 'center',
            }}
          >
            {monthName}{'\n'}cerró. 💜
          </Text>
          <Text
            style={{ fontSize: 14.5, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 22 }}
          >
            Esto es lo que pasó con tu plata
          </Text>
        </View>
      ),
    },

    // 2 — Registro / hábito
    {
      colors: ['#4F46E5', '#7C3AED'],
      body: (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
            Anotaste
          </Text>
          <Text style={{ fontSize: 96, fontWeight: '800', letterSpacing: -5, lineHeight: 96, color: 'white' }}>
            47
          </Text>
          <Text style={{ fontSize: 19, fontWeight: '700', color: 'white', marginTop: 4 }}>
            movimientos
          </Text>
          <View style={{ flexDirection: 'row', gap: 26, marginTop: 36 }}>
            <RcStat n="31" l="por WhatsApp" />
            <RcStat n="12" l="por audio" />
            <RcStat n="4" l="en la app" />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(255,255,255,0.14)',
              borderRadius: 100,
              paddingHorizontal: 18,
              paddingVertical: 9,
              marginTop: 34,
            }}
          >
            <Text style={{ fontSize: 16 }}>🔥</Text>
            <Text style={{ fontSize: 13.5, fontWeight: '800', color: 'white' }}>
              Racha de 12 días seguidos
            </Text>
          </View>
        </View>
      ),
    },

    // 3 — Top categoría
    {
      colors: ['#1E1B4B', '#312E81'],
      body: (
        <View style={{ width: '100%' }}>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 15,
              fontWeight: '700',
              color: 'rgba(255,255,255,0.65)',
              marginBottom: 6,
            }}
          >
            Tu top de gastos
          </Text>
          <Text style={{ textAlign: 'center', fontSize: 52, marginBottom: 2 }}>🏠</Text>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 30,
              fontWeight: '800',
              letterSpacing: -1.2,
              color: 'white',
              marginBottom: 30,
            }}
          >
            Alquiler
          </Text>
          <View style={{ gap: 13, paddingHorizontal: 12 }}>
            {cats.map((c, i) => (
              <View key={i}>
                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>{c.cat}</Text>
                  <Text
                    style={{ fontSize: 13, fontWeight: '800', color: 'white', fontVariant: ['tabular-nums'] }}
                  >
                    {formatARS(c.monto)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 7,
                    borderRadius: 100,
                    backgroundColor: 'rgba(255,255,255,0.14)',
                    overflow: 'hidden',
                  }}
                >
                  <Animated.View
                    style={{
                      height: '100%',
                      borderRadius: 100,
                      backgroundColor: c.col,
                      width: barAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (barMaxW * c.pct) / 100],
                      }),
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      ),
    },

    // 4 — Ahorro
    {
      colors: ['#064E3B', '#059669'],
      body: (
        <View style={{ alignItems: 'center' }}>
          <Text
            style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}
          >
            Te quedaron sin gastar
          </Text>
          <Text
            style={{
              fontSize: 50,
              fontWeight: '800',
              letterSpacing: -2.5,
              color: 'white',
              fontVariant: ['tabular-nums'],
            }}
          >
            {formatARS(savedAmount)}
          </Text>
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.14)',
              borderRadius: 100,
              paddingHorizontal: 18,
              paddingVertical: 8,
              marginTop: 24,
            }}
          >
            <Text style={{ fontSize: 13.5, fontWeight: '800', color: 'white' }}>
              {savedPct}% de tus ingresos 💪
            </Text>
          </View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.75)',
              marginTop: 26,
              lineHeight: 22,
              textAlign: 'center',
            }}
          >
            Tu mejor mes del año.{'\n'}En mayo habías guardado el 23%.
          </Text>
        </View>
      ),
    },

    // 5 — Meta
    {
      colors: ['#312E81', '#6366F1'],
      body: (
        <View style={{ alignItems: 'center', width: '100%' }}>
          <Text style={{ fontSize: 52, marginBottom: 6 }}>🏖️</Text>
          <Text
            style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}
          >
            Vacaciones en Brasil
          </Text>
          <Text
            style={{ fontSize: 42, fontWeight: '800', letterSpacing: -2, color: 'white' }}
          >
            37%
          </Text>
          <View style={{ paddingHorizontal: 34, marginVertical: 22, width: '100%' }}>
            <View
              style={{
                height: 9,
                borderRadius: 100,
                backgroundColor: 'rgba(255,255,255,0.18)',
                overflow: 'hidden',
              }}
            >
              <View
                style={{ width: '37%', height: '100%', borderRadius: 100, backgroundColor: 'white' }}
              />
            </View>
          </View>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.8)',
              lineHeight: 22,
              textAlign: 'center',
            }}
          >
            {'Este mes sumaste '}
            {formatARS(3100000)}.{'\n'}A este ritmo, llegás{' '}
            <Text style={{ fontWeight: '800' }}>un mes antes</Text> de lo planeado ✈️
          </Text>
        </View>
      ),
    },

    // 6 — Share
    {
      colors: ['#0c0c24', '#1a0a3c', '#0d1b3e'],
      share: true,
      body: (
        <View style={{ alignItems: 'center', width: '100%' }}>
          <Text
            style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}
          >
            Tu tarjeta de {monthName} ✨
          </Text>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#7C3AED']}
            locations={[0, 0.7, 1]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={{ width: 228, borderRadius: 22, padding: 20, paddingBottom: 16 }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4 }}
              >
                ✦ Finanzas IA
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>
                {monthLabel}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 25,
                fontWeight: '800',
                color: 'white',
                letterSpacing: -1,
                lineHeight: 30,
                marginBottom: 16,
              }}
            >
              {'Guardé el\n'}
              {savedPct}% de mis{'\n'}
              ingresos 💪
            </Text>
            <View
              style={{
                flexDirection: 'row',
                gap: 14,
                borderTopWidth: 1,
                borderTopColor: 'rgba(255,255,255,0.22)',
                paddingTop: 12,
              }}
            >
              <RcStat n="47" l="registros" />
              <RcStat n="🔥 12" l="días de racha" />
              <RcStat n="37%" l="meta Brasil" />
            </View>
          </LinearGradient>
        </View>
      ),
    },
  ];

  const currentCard = cards[idx];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <LinearGradient
        colors={currentCard.colors}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Atmospheric blobs */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -80,
            right: -80,
            width: 260,
            height: 260,
            borderRadius: 130,
            backgroundColor: 'rgba(255,255,255,0.09)',
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: -60,
            left: -90,
            width: 300,
            height: 300,
            borderRadius: 150,
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        />

        {/* Story progress segments */}
        <View
          style={{
            flexDirection: 'row',
            gap: SEGMENT_GAP,
            paddingHorizontal: SEGMENT_H_PADDING,
            paddingTop: insets.top + 10,
            zIndex: 3,
          }}
        >
          {cards.map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 100,
                backgroundColor: 'rgba(255,255,255,0.28)',
                overflow: 'hidden',
              }}
            >
              {i < idx ? (
                <View style={{ width: '100%', height: '100%', backgroundColor: 'white' }} />
              ) : i === idx ? (
                <Animated.View
                  style={{
                    height: '100%',
                    backgroundColor: 'white',
                    borderRadius: 100,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, SEGMENT_W],
                    }),
                  }}
                />
              ) : null}
            </View>
          ))}
        </View>

        {/* Tap zones */}
        <Pressable
          onPress={prev}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '32%', zIndex: 2 }}
        />
        <Pressable
          onPress={() => { if (!isLast) next(); }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '68%', zIndex: 2 }}
        />

        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            top: insets.top + 16,
            right: 14,
            zIndex: 20,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.16)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>

        {/* Card body */}
        <Animated.View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 30,
            zIndex: 1,
            opacity: cardAnim,
            transform: [
              {
                scale: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.96, 1],
                }),
              },
            ],
          }}
        >
          {currentCard.body}
        </Animated.View>

        {/* Footer */}
        <View
          style={{
            paddingHorizontal: 26,
            paddingBottom: Math.max(40, insets.bottom + 20),
            zIndex: 3,
          }}
        >
          {currentCard.share ? (
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => {
                  setToast(true);
                  setTimeout(() => setToast(false), 2200);
                }}
                style={{
                  backgroundColor: 'white',
                  borderRadius: 100,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Ionicons name="share-outline" size={16} color="#1E1B4B" />
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#1E1B4B' }}>
                  Compartir como story
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIdx(0)} style={{ alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.55)' }}>
                  ↺ Volver a ver
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text
              style={{
                textAlign: 'center',
                fontSize: 11,
                fontWeight: '600',
                color: 'rgba(255,255,255,0.4)',
                letterSpacing: 0.3,
              }}
            >
              Tocá para avanzar
            </Text>
          )}
        </View>

        {/* Toast */}
        {toast && (
          <View
            style={{
              position: 'absolute',
              bottom: 120,
              alignSelf: 'center',
              backgroundColor: 'rgba(255,255,255,0.96)',
              borderRadius: 100,
              paddingHorizontal: 20,
              paddingVertical: 10,
              zIndex: 5,
            }}
          >
            <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#1E1B4B' }}>
              ✓ Imagen lista para compartir
            </Text>
          </View>
        )}
      </LinearGradient>
    </Modal>
  );
}
