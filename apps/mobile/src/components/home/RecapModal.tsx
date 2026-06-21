import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatARS } from '@/lib/format';
import { useSummary } from '@/hooks/useTransactions';
import { useGoals } from '@/hooks/useGoals';
import { TransactionCategory, GoalStatus } from '@/types';

const RC_DUR = 5000;
const CARDS_COUNT = 6;
const SEGMENT_GAP = 5;
const SEGMENT_H_PADDING = 14;

const { width: SCREEN_W } = Dimensions.get('window');
const SEGMENT_W =
  (SCREEN_W - SEGMENT_H_PADDING * 2 - SEGMENT_GAP * (CARDS_COUNT - 1)) / CARDS_COUNT;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function prevMonthStr(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const CAT_COLORS: Partial<Record<TransactionCategory, string>> = {
  [TransactionCategory.ALQUILER]:        '#F59E0B',
  [TransactionCategory.OTROS]:           '#6366F1',
  [TransactionCategory.TRANSPORTE]:      '#8B5CF6',
  [TransactionCategory.ALIMENTACION]:    '#EC4899',
  [TransactionCategory.SALUD]:          '#10B981',
  [TransactionCategory.ENTRETENIMIENTO]: '#A78BFA',
  [TransactionCategory.TECNOLOGIA]:      '#3B82F6',
  [TransactionCategory.ROPA]:            '#F97316',
  [TransactionCategory.EDUCACION]:       '#0EA5E9',
  [TransactionCategory.TRABAJO]:         '#14B8A6',
  [TransactionCategory.AHORRO]:          '#22C55E',
  [TransactionCategory.SUELDO]:          '#84CC16',
  [TransactionCategory.FREELANCE]:       '#EAB308',
};

const CAT_SHORT: Partial<Record<string, string>> = {
  Alquiler:        'Alquiler',
  Otros:           'Varios',
  Transporte:      'Transp.',
  Alimentacion:    'Alim.',
  Salud:           'Salud',
  Entretenimiento: 'Entret.',
  Tecnologia:      'Tecnol.',
  Ropa:            'Ropa',
  Educacion:       'Educ.',
  Trabajo:         'Trabajo',
  Ahorro:          'Ahorro',
  Sueldo:          'Sueldo',
  Freelance:       'Freelance',
};

// ─── RcStat ───────────────────────────────────────────────────────────────────

function RcStat({ n, l }: { n: string; l: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 21, fontWeight: '800', letterSpacing: -0.8, color: 'white', fontVariant: ['tabular-nums'] }}>
        {n}
      </Text>
      <Text style={{ fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, color: 'rgba(255,255,255,0.65)' }}>
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
}

// ─── RecapModal ───────────────────────────────────────────────────────────────

export function RecapModal({ visible, onClose, userName = 'vos' }: RecapModalProps) {
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(0);

  const prevMonth = prevMonthStr();
  const { data: summary } = useSummary(prevMonth);
  const { data: goals } = useGoals();

  const income   = summary?.income   ?? 0;
  const expenses = summary?.expenses ?? 0;
  const txnCount = summary?.transaction_count ?? 0;
  const savedAmount = income > 0 ? income - expenses : 0;
  const savedPct    = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

  // Top 3 categories by expense
  const topCats = Object.entries(summary?.by_category ?? {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat, amount]) => ({
      cat: CAT_SHORT[cat] ?? cat,
      monto: amount,
      pct: expenses > 0 ? Math.round((amount / expenses) * 100) : 0,
      col: CAT_COLORS[cat as TransactionCategory] ?? '#818CF8',
    }));

  // First active goal
  const activeGoal = goals?.find((g) => g.status === GoalStatus.ACTIVE) ?? null;

  const barMaxW = SCREEN_W - 60 - 24;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardAnim     = useRef(new Animated.Value(0)).current;
  const animRef      = useRef<Animated.CompositeAnimation | null>(null);
  const barAnims     = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

  const monthName = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toLocaleDateString('es-AR', { month: 'long' });
  })();

  const monthLabel = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }).toUpperCase().replace('.', '');
  })();

  const isLast = idx === CARDS_COUNT - 1;
  const next = useCallback(() => setIdx(i => Math.min(CARDS_COUNT - 1, i + 1)), []);
  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), []);

  // Story progress bar
  useEffect(() => {
    if (!visible) return;
    progressAnim.setValue(0);
    animRef.current?.stop();
    const anim = Animated.timing(progressAnim, { toValue: 1, duration: RC_DUR, useNativeDriver: false });
    animRef.current = anim;
    anim.start(({ finished }) => { if (finished && idx < CARDS_COUNT - 1) setIdx(i => i + 1); });
    return () => animRef.current?.stop();
  }, [idx, visible]);

  // Card fade-in + scale
  useEffect(() => {
    cardAnim.setValue(0);
    Animated.spring(cardAnim, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }).start();
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

  useEffect(() => {
    if (!visible) { setIdx(0); progressAnim.setValue(0); }
  }, [visible]);

  const handleShare = useCallback(async () => {
    try {
      const msg =
        `📊 Mi recap de ${monthName} — Finia\n\n` +
        (income > 0 ? `💰 Ingresos: ${formatARS(income)}\n💸 Gastos: ${formatARS(expenses)}\n` : '') +
        (savedPct > 0 ? `✅ Guardé el ${savedPct}% de mis ingresos\n` : '') +
        (txnCount > 0 ? `📝 Registré ${txnCount} movimientos\n` : '') +
        (activeGoal ? `🎯 Meta "${activeGoal.name}": ${Math.round(activeGoal.percentage)}%\n` : '') +
        '\nFinia — gestioná tu plata con IA 🤖';
      await Share.share({ message: msg, title: `Recap ${monthName} · Finia` });
    } catch {
      // user cancelled or share unavailable
    }
  }, [monthName, income, expenses, savedPct, txnCount, activeGoal]);

  type CardDef = { colors: [string, string] | [string, string, string]; share?: boolean; body: React.ReactNode };

  const cards: CardDef[] = [
    // 1 — Intro
    {
      colors: ['#0c0c24', '#1a0a3c', '#0d1b3e'],
      body: (
        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 34 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 10, color: 'white' }}>✦</Text>
            </View>
            <Text style={{ fontSize: 11.5, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.3 }}>Finia</Text>
          </View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>{userName}, tu</Text>
          <Text style={{ fontSize: 54, fontWeight: '800', color: 'white', letterSpacing: -2.5, lineHeight: 58, textAlign: 'center' }}>
            {monthName}{'\n'}cerró. 💜
          </Text>
          <Text style={{ fontSize: 14.5, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 22 }}>
            Esto es lo que pasó con tu plata
          </Text>
        </View>
      ),
    },

    // 2 — Registro
    {
      colors: ['#4F46E5', '#7C3AED'],
      body: (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Anotaste</Text>
          <Text style={{ fontSize: 96, fontWeight: '800', letterSpacing: -5, lineHeight: 96, color: 'white' }}>
            {txnCount > 0 ? txnCount : '—'}
          </Text>
          <Text style={{ fontSize: 19, fontWeight: '700', color: 'white', marginTop: 4 }}>movimientos</Text>
          {txnCount === 0 ? (
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 24, textAlign: 'center', lineHeight: 22 }}>
              Empezá a registrar este mes{'\n'}y el próximo recap será tuyo 🔥
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 100, paddingHorizontal: 18, paddingVertical: 9, marginTop: 34 }}>
              <Text style={{ fontSize: 16 }}>📊</Text>
              <Text style={{ fontSize: 13.5, fontWeight: '800', color: 'white' }}>
                {formatARS(expenses > 0 ? Math.round(expenses / Math.max(1, txnCount)) : 0)} promedio/gasto
              </Text>
            </View>
          )}
        </View>
      ),
    },

    // 3 — Top categoría
    {
      colors: ['#1E1B4B', '#312E81'],
      body: (
        <View style={{ width: '100%' }}>
          <Text style={{ textAlign: 'center', fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.65)', marginBottom: 6 }}>
            Tu top de gastos
          </Text>
          {topCats.length === 0 ? (
            <Text style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 24 }}>
              Sin gastos registrados en {monthName}
            </Text>
          ) : (
            <>
              <Text style={{ textAlign: 'center', fontSize: 52, marginBottom: 2 }}>
                {topCats[0]?.col === '#F59E0B' ? '🏠' : '💸'}
              </Text>
              <Text style={{ textAlign: 'center', fontSize: 30, fontWeight: '800', letterSpacing: -1.2, color: 'white', marginBottom: 30 }}>
                {topCats[0]?.cat ?? '—'}
              </Text>
              <View style={{ gap: 13, paddingHorizontal: 12 }}>
                {topCats.map((c, i) => (
                  <View key={i}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>{c.cat}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: 'white', fontVariant: ['tabular-nums'] }}>{formatARS(c.monto)}</Text>
                    </View>
                    <View style={{ height: 7, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' }}>
                      <Animated.View style={{
                        height: '100%',
                        borderRadius: 100,
                        backgroundColor: c.col,
                        width: barAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, (barMaxW * c.pct) / 100] }),
                      }} />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      ),
    },

    // 4 — Ahorro
    {
      colors: ['#064E3B', '#059669'],
      body: (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
            {savedAmount > 0 ? 'Te quedaron sin gastar' : 'Balance del mes'}
          </Text>
          <Text style={{ fontSize: 50, fontWeight: '800', letterSpacing: -2.5, color: 'white', fontVariant: ['tabular-nums'] }}>
            {income > 0 ? formatARS(Math.abs(savedAmount)) : '—'}
          </Text>
          {income > 0 ? (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 100, paddingHorizontal: 18, paddingVertical: 8, marginTop: 24 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '800', color: 'white' }}>
                {savedPct >= 0 ? `${savedPct}% de tus ingresos 💪` : `Gastaste ${Math.abs(savedPct)}% más de tus ingresos`}
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 24, textAlign: 'center', lineHeight: 22 }}>
              Registrá tus ingresos este mes{'\n'}para ver tu balance real
            </Text>
          )}
        </View>
      ),
    },

    // 5 — Meta
    {
      colors: ['#312E81', '#6366F1'],
      body: activeGoal ? (
        <View style={{ alignItems: 'center', width: '100%' }}>
          <Text style={{ fontSize: 44, marginBottom: 6 }}>{activeGoal.emoji}</Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>{activeGoal.name}</Text>
          <Text style={{ fontSize: 42, fontWeight: '800', letterSpacing: -2, color: 'white' }}>{Math.round(activeGoal.percentage)}%</Text>
          <View style={{ paddingHorizontal: 34, marginVertical: 22, width: '100%' }}>
            <View style={{ height: 9, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, activeGoal.percentage)}%`, height: '100%', borderRadius: 100, backgroundColor: 'white' }} />
            </View>
          </View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', lineHeight: 22, textAlign: 'center' }}>
            {formatARS(activeGoal.current_amount)} de {formatARS(activeGoal.target_amount)}
            {activeGoal.monthly_needed ? `\nAhorrá ${formatARS(activeGoal.monthly_needed)}/mes para llegar ✈️` : ''}
          </Text>
        </View>
      ) : (
        <View style={{ alignItems: 'center', width: '100%' }}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🎯</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: 'white', letterSpacing: -0.5, textAlign: 'center' }}>Sin metas activas</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 16, textAlign: 'center', lineHeight: 22 }}>
            Creá una meta en la pestaña Reportes{'\n'}y seguí tu progreso mes a mes
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
          <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>Tu tarjeta de {monthName} ✨</Text>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6', '#7C3AED']}
            locations={[0, 0.7, 1]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={{ width: 228, borderRadius: 22, padding: 20, paddingBottom: 16 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.4 }}>✦ Finia</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>{monthLabel}</Text>
            </View>
            <Text style={{ fontSize: 25, fontWeight: '800', color: 'white', letterSpacing: -1, lineHeight: 30, marginBottom: 16 }}>
              {savedPct > 0 ? `Guardé el\n${savedPct}% de mis\ningresos 💪` : `Registré\n${txnCount} movimientos\neste mes 📊`}
            </Text>
            <View style={{ flexDirection: 'row', gap: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.22)', paddingTop: 12 }}>
              <RcStat n={String(txnCount)} l="registros" />
              <RcStat n={income > 0 ? `${savedPct}%` : '—'} l="ahorro" />
              {activeGoal ? <RcStat n={`${Math.round(activeGoal.percentage)}%`} l={activeGoal.name.slice(0, 8)} /> : <RcStat n="🎯" l="crear meta" />}
            </View>
          </LinearGradient>
        </View>
      ),
    },
  ];

  const currentCard = cards[idx];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <LinearGradient colors={currentCard.colors} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ flex: 1 }}>
        {/* Atmospheric blobs */}
        <View pointerEvents="none" style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.09)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', bottom: -60, left: -90, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.06)' }} />

        {/* Story progress segments */}
        <View style={{ flexDirection: 'row', gap: SEGMENT_GAP, paddingHorizontal: SEGMENT_H_PADDING, paddingTop: insets.top + 10, zIndex: 3 }}>
          {cards.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' }}>
              {i < idx ? (
                <View style={{ width: '100%', height: '100%', backgroundColor: 'white' }} />
              ) : i === idx ? (
                <Animated.View style={{
                  height: '100%',
                  backgroundColor: 'white',
                  borderRadius: 100,
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, SEGMENT_W] }),
                }} />
              ) : null}
            </View>
          ))}
        </View>

        {/* Tap zones */}
        <Pressable onPress={prev} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '32%', zIndex: 2 }} />
        <Pressable onPress={() => { if (!isLast) next(); }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '68%', zIndex: 2 }} />

        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{ position: 'absolute', top: insets.top + 16, right: 14, zIndex: 20, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={16} color="white" />
        </TouchableOpacity>

        {/* Card body */}
        <Animated.View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 30,
          zIndex: 1,
          opacity: cardAnim,
          transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
        }}>
          {currentCard.body}
        </Animated.View>

        {/* Footer */}
        <View style={{ paddingHorizontal: 26, paddingBottom: Math.max(40, insets.bottom + 20), zIndex: 3 }}>
          {currentCard.share ? (
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={handleShare}
                style={{ backgroundColor: 'white', borderRadius: 100, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <Ionicons name="share-outline" size={16} color="#1E1B4B" />
                <Text style={{ fontSize: 14.5, fontWeight: '800', color: '#1E1B4B' }}>Compartir recap</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIdx(0)} style={{ alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.55)' }}>↺ Volver a ver</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={{ textAlign: 'center', fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.3 }}>
              Tocá para avanzar
            </Text>
          )}
        </View>
      </LinearGradient>
    </Modal>
  );
}
