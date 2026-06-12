import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSummary } from '@/hooks/useTransactions';
import { useInsight } from '@/hooks/useAI';
import { useAuth } from '@/hooks/useAuth';
import { TransactionSheet } from '@/components/transactions/TransactionSheet';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { formatARS, currentMonth } from '@/lib/format';
import { useTheme } from '@/hooks/useTheme';
import type { AppColors } from '@/lib/theme';
import { TransactionCategory, TransactionChannel, TransactionType } from '@/types';
import type { Transaction, Commitment, CommitmentStatus } from '@/types';
import { useCommitments } from '@/hooks/useCommitments';
import { RecapModal } from '@/components/home/RecapModal';

// ─── Channel config ───────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<TransactionChannel, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  [TransactionChannel.WA_AUDIO]: { bg: '#25D366', icon: 'mic-outline' },
  [TransactionChannel.WA_TEXT]:  { bg: '#25D366', icon: 'chatbubble-outline' },
  [TransactionChannel.APP]:      { bg: 'primary', icon: 'phone-portrait-outline' },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root:            { flex: 1, backgroundColor: c.bg },
    greeting:        { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 2 },
    greetingDate:    { fontSize: 13, color: c.text2, marginBottom: 2 },
    greetingName:    { fontSize: 22, fontWeight: '700', color: c.text },
    cardWrap:        { paddingHorizontal: 20, marginBottom: 14 },
    // PocketCard
    pocketOrb:       { position: 'absolute', top: -20, right: -20, width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.07)' },
    pocketLabel:     { fontSize: 10, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
    pocketAmount:    { fontWeight: '800', letterSpacing: -2, color: 'white', fontVariant: ['tabular-nums'], marginBottom: 12 },
    pocketSubRow:    { flexDirection: 'row', alignItems: 'center', gap: 16 },
    pocketSubLabel:  { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
    pocketSubValue:  { fontWeight: '700', fontSize: 13, color: 'white', fontVariant: ['tabular-nums'] },
    pocketDivider:   { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },
    // BalanceCard
    balanceOrb1:     { position: 'absolute', top: -30, right: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.06)' },
    balanceOrb2:     { position: 'absolute', bottom: -20, left: -10, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)' },
    balanceLabel:    { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
    balanceAmount:   { fontSize: 42, fontWeight: '800', letterSpacing: -2, color: 'white', fontVariant: ['tabular-nums'], marginBottom: 20 },
    balanceRow:      { flexDirection: 'row' },
    balanceCol:      { flex: 1, paddingRight: 16 },
    balanceColR:     { flex: 1, paddingLeft: 16 },
    balanceSep:      { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    balanceSubLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
    balanceSubValue: { fontWeight: '700', fontSize: 17, color: 'white', marginTop: 3 },
    // Section title
    sectionRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 },
    sectionTitle:    { fontSize: 11, fontWeight: '700', color: c.text2, textTransform: 'uppercase', letterSpacing: 0.9 },
    sectionAction:   { fontSize: 13, fontWeight: '600', color: c.primary },
    // Month progress
    progressCard:    { backgroundColor: c.surface, borderRadius: 20, padding: 16, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    progressHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    progressTitle:   { fontSize: 14, fontWeight: '700', color: c.text },
    progressRow:     { marginBottom: 12 },
    progressMeta:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressMetaText:{ fontSize: 11, color: c.text2, fontWeight: '500' },
    progressTrack:   { height: 5, borderRadius: 100, backgroundColor: c.surface2 },
    progressNote:    { fontSize: 12, color: c.text2, lineHeight: 20, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border, fontStyle: 'italic' },
    // Budget bar
    budgetCard:      { backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden', shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    budgetRow:       { marginBottom: 16 },
    budgetMeta:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7, alignItems: 'baseline' },
    budgetCat:       { fontSize: 13, fontWeight: '600', color: c.text },
    budgetAmounts:   { fontSize: 11, fontWeight: '500', fontVariant: ['tabular-nums'] },
    budgetTrack:     { height: 5, borderRadius: 100, backgroundColor: c.surface2 },
    // MiniTxnRow
    txnCard:         { backgroundColor: c.surface, borderRadius: 18, overflow: 'hidden', shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    txnRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: c.border },
    txnDesc:         { fontWeight: '600', fontSize: 13, color: c.text },
    txnSub:          { fontSize: 11, color: c.text2, marginTop: 2 },
    txnAmount:       { fontWeight: '700', fontSize: 13, fontVariant: ['tabular-nums'], letterSpacing: -0.3 },
    // Subscriptions
    subCard:         { backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden', shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    subHeader:       { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    subIconWrap:     { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(220,38,38,0.1)', alignItems: 'center', justifyContent: 'center' },
    subTotal:        { fontWeight: '800', fontSize: 16, color: c.danger, fontVariant: ['tabular-nums'], marginRight: 6 },
    subBody:         { borderTopWidth: 1, borderTopColor: c.border },
    subItemRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 11 },
    subItemSep:      { borderBottomWidth: 1, borderBottomColor: c.border },
    subItemDot:      { width: 8, height: 8, borderRadius: 4 },
    subItemName:     { fontWeight: '600', fontSize: 13, color: c.text },
    subItemMeta:     { fontSize: 11, color: c.text2, marginTop: 2 },
    subItemAmount:   { fontWeight: '700', fontSize: 13, color: c.text, fontVariant: ['tabular-nums'] },
    // Insight
    insightCard:     { backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden', flexDirection: 'row', shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    insightAccent:   { width: 3, backgroundColor: '#7C3AED' },
    insightInner:    { flex: 1, padding: 14 },
    insightLabel:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
    insightLabelText:{ fontSize: 10, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: '#7C3AED' },
    insightText:     { fontSize: 13, color: c.text, lineHeight: 21, fontStyle: 'italic' },
    // Empty
    emptyState:      { alignItems: 'center', paddingVertical: 28, gap: 8 },
    emptyText:       { fontSize: 13, color: c.text3 },
    // FAB
    fab:             { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 18, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', shadowColor: c.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    section:         { paddingHorizontal: 20, marginBottom: 20 },
    // CommitmentsCard
    commitCard:      { backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden', shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    commitHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    commitIconWrap:  { width: 40, height: 40, borderRadius: 14, backgroundColor: `${c.primary}18`, alignItems: 'center', justifyContent: 'center' },
    commitInfo:      { flex: 1 },
    commitTitle:     { fontWeight: '700', fontSize: 14, color: c.text },
    commitSub:       { fontSize: 11, color: c.text2, marginTop: 1 },
    commitAmt:       { fontWeight: '800', fontSize: 16, fontVariant: ['tabular-nums'] },
    commitAmtLabel:  { fontSize: 10, color: c.text3, textAlign: 'right', marginTop: 1 },
    commitChips:     { flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingBottom: 12 },
    commitChip:      { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.surface2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    commitChipText:  { fontSize: 11, fontWeight: '600', color: c.text2 },
    commitBody:      { borderTopWidth: 1, borderTopColor: c.border },
    commitRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11 },
    commitRowSep:    { borderBottomWidth: 1, borderBottomColor: c.border },
    commitRowIcon:   { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    commitRowName:   { fontWeight: '600', fontSize: 13, color: c.text },
    commitRowSub:    { fontSize: 11, marginTop: 2 },
    commitRowAmt:    { fontWeight: '700', fontSize: 13, fontVariant: ['tabular-nums'] },
    installBadge:    { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: `${c.primary}18` },
    installText:     { fontSize: 10, fontWeight: '600', color: c.primary },
    statusBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 3 },
    statusBadgeText: { fontSize: 10, fontWeight: '700' },
  });
}

// ─── PocketCard ───────────────────────────────────────────────────────────────

function PocketCard({ disponible, styles }: { disponible: number; styles: ReturnType<typeof makeStyles> }) {
  const dias = (() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
  })();
  const hoy = dias > 0 ? Math.round(disponible / dias) : disponible;
  return (
    <LinearGradient
      colors={['#047857', '#059669', '#10B981']}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 24, padding: 20, overflow: 'hidden' }}
    >
      <View style={styles.pocketOrb} />
      <Text style={styles.pocketLabel}>¿Cuánto podés gastar hoy?</Text>
      <Text style={[styles.pocketAmount, { fontSize: 40 }]}>
        {formatARS(hoy)}
      </Text>
      <View style={styles.pocketSubRow}>
        <View>
          <Text style={styles.pocketSubLabel}>Disponible</Text>
          <Text style={styles.pocketSubValue}>{formatARS(disponible)}</Text>
        </View>
        <View style={styles.pocketDivider} />
        <View>
          <Text style={styles.pocketSubLabel}>Días restantes</Text>
          <Text style={styles.pocketSubValue}>{dias} días</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

// ─── BalanceCard ──────────────────────────────────────────────────────────────

function BalanceCard({ disponible, income, expenses, styles }: { disponible: number; income: number; expenses: number; styles: ReturnType<typeof makeStyles> }) {
  return (
    <LinearGradient
      colors={['#5254CC', '#7C3AED', '#9F67E8']}
      locations={[0, 0.6, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ borderRadius: 24, padding: 22, overflow: 'hidden' }}
    >
      <View style={styles.balanceOrb1} />
      <View style={styles.balanceOrb2} />
      <Text style={styles.balanceLabel}>Balance disponible</Text>
      <Text style={styles.balanceAmount} numberOfLines={1} adjustsFontSizeToFit>
        {formatARS(disponible)}
      </Text>
      <View style={styles.balanceRow}>
        <View style={styles.balanceCol}>
          <Text style={styles.balanceSubLabel}>↑ Ingresos</Text>
          <Text style={styles.balanceSubValue}>{formatARS(income)}</Text>
        </View>
        <View style={styles.balanceSep} />
        <View style={styles.balanceColR}>
          <Text style={styles.balanceSubLabel}>↓ Gastos</Text>
          <Text style={styles.balanceSubValue}>{formatARS(expenses)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

// ─── MonthProgress ────────────────────────────────────────────────────────────

function MonthProgress({ income, expenses, styles, colors }: { income: number; expenses: number; styles: ReturnType<typeof makeStyles>; colors: AppColors }) {
  const now = new Date();
  const day = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const pctMes = Math.round((day / daysInMonth) * 100);
  const pctGasto = income > 0 ? Math.round((expenses / income) * 100) : 0;
  const isAlert = pctGasto > pctMes + 20;
  const statusLabel = isAlert ? 'Ritmo elevado' : 'Ritmo saludable';
  const statusColor = isAlert ? colors.warning : colors.success;

  const [anim, setAnim] = useState(false);
  const mesWidth = useRef(new Animated.Value(0)).current;
  const gastoWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      setAnim(true);
      Animated.timing(mesWidth, { toValue: pctMes, duration: 750, useNativeDriver: false }).start();
      Animated.timing(gastoWidth, { toValue: Math.min(100, pctGasto), duration: 950, useNativeDriver: false }).start();
    }, 220);
    return () => clearTimeout(t);
  }, [mesWidth, gastoWidth, pctMes, pctGasto]);

  const barColor = isAlert ? colors.warning : colors.primary;

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>Progreso del mes</Text>
        <View style={{ backgroundColor: `${statusColor}1A`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor }}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressMetaText}>Mes transcurrido</Text>
          <Text style={styles.progressMetaText}>Día {day} de {daysInMonth} · {pctMes}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={{
            height: '100%' as any,
            borderRadius: 100,
            backgroundColor: colors.text3,
            width: mesWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }} />
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressMetaText}>Presupuesto consumido</Text>
          <Text style={styles.progressMetaText}>{formatARS(expenses)} · {pctGasto}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={{
            height: '100%' as any,
            borderRadius: 100,
            backgroundColor: barColor,
            width: gastoWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }} />
        </View>
      </View>

      <Text style={styles.progressNote}>
        {isAlert
          ? `Gastaste el ${pctGasto}% del presupuesto cuando solo transcurrió el ${pctMes}% del mes. Considerá frenar algunos gastos.`
          : `Vas a buen ritmo: ${pctGasto}% gastado con el ${pctMes}% del mes transcurrido.`}
      </Text>
    </View>
  );
}

// ─── BudgetBar ────────────────────────────────────────────────────────────────

const BUDGET_COLORS: Partial<Record<TransactionCategory, string>> = {
  [TransactionCategory.ALIMENTACION]:   '#D97706',
  [TransactionCategory.TRANSPORTE]:     '#2563EB',
  [TransactionCategory.ENTRETENIMIENTO]:'#7C3AED',
  [TransactionCategory.SALUD]:          '#DC2626',
  [TransactionCategory.EDUCACION]:      '#0891B2',
  [TransactionCategory.ROPA]:           '#BE185D',
  [TransactionCategory.TECNOLOGIA]:     '#6366F1',
  [TransactionCategory.ALQUILER]:       '#059669',
  [TransactionCategory.OTROS]:          '#6B7280',
};

const CATEGORY_LABELS: Partial<Record<TransactionCategory, string>> = {
  [TransactionCategory.ALIMENTACION]:   'Alimentación',
  [TransactionCategory.TRANSPORTE]:     'Transporte',
  [TransactionCategory.ENTRETENIMIENTO]:'Entretenimiento',
  [TransactionCategory.SALUD]:          'Salud',
  [TransactionCategory.EDUCACION]:      'Educación',
  [TransactionCategory.ROPA]:           'Ropa',
  [TransactionCategory.TECNOLOGIA]:     'Tecnología',
  [TransactionCategory.ALQUILER]:       'Alquiler',
  [TransactionCategory.TRABAJO]:        'Trabajo',
  [TransactionCategory.AHORRO]:         'Ahorro',
  [TransactionCategory.SUELDO]:         'Sueldo',
  [TransactionCategory.FREELANCE]:      'Freelance',
  [TransactionCategory.OTROS]:          'Otros',
};

function BudgetBar({ budget, delay = 0, styles, colors }: { budget: { category: TransactionCategory; spent: number; amount: number; percentage: number }; delay?: number; styles: ReturnType<typeof makeStyles>; colors: AppColors }) {
  const pct = Math.min(100, Math.max(0, Number.isFinite(budget.percentage) ? Math.round(budget.percentage) : 0));
  const isOver = pct >= 100;
  const isWarn = pct >= 80 && !isOver;
  const barColor = isOver ? colors.danger : isWarn ? colors.warning : (BUDGET_COLORS[budget.category] ?? colors.primary);
  const amountColor = isOver ? colors.danger : isWarn ? colors.warning : colors.text2;

  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      width.setValue(0);
      Animated.timing(width, { toValue: pct, duration: 900, useNativeDriver: false }).start();
    }, 130 + delay);
    return () => clearTimeout(t);
  }, [width, pct, delay]);

  return (
    <View style={styles.budgetRow}>
      <View style={styles.budgetMeta}>
        <Text style={styles.budgetCat}>{CATEGORY_LABELS[budget.category] ?? budget.category}</Text>
        <Text style={[styles.budgetAmounts, { color: amountColor }]}>
          {formatARS(budget.spent)} / {formatARS(budget.amount)}
        </Text>
      </View>
      <View style={styles.budgetTrack}>
        <Animated.View style={{
          height: '100%' as any,
          borderRadius: 100,
          backgroundColor: barColor,
          width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        }} />
      </View>
    </View>
  );
}

// ─── MiniTxnRow ───────────────────────────────────────────────────────────────

function MiniTxnRow({ txn, styles, colors, isLast }: { txn: Transaction; styles: ReturnType<typeof makeStyles>; colors: AppColors; isLast: boolean }) {
  const ch = CHANNEL_CONFIG[txn.channel] ?? CHANNEL_CONFIG[TransactionChannel.APP];
  const bg = ch.bg === 'primary' ? colors.primary : ch.bg;
  const isIncome = txn.type === TransactionType.INCOME;
  const cat = CATEGORY_LABELS[txn.category] ?? txn.category;
  const dateStr = new Date(txn.date + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

  return (
    <View style={[styles.txnRow, isLast && { borderBottomWidth: 0 }]}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ionicons name={ch.icon} size={14} color="white" />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.txnDesc} numberOfLines={1}>{txn.description}</Text>
        <Text style={styles.txnSub}>{cat} · {dateStr}</Text>
      </View>
      <Text style={[styles.txnAmount, { color: isIncome ? colors.success : colors.text }]}>
        {isIncome ? '+' : '−'}{formatARS(txn.amount)}
      </Text>
    </View>
  );
}

// ─── SuscripcionesCard ────────────────────────────────────────────────────────

const DOT_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#8B5CF6'];

function SuscripcionesCard({ subs, styles, colors }: { subs: Array<{ id: string; name: string; amount: number; billing_day: number }>; styles: ReturnType<typeof makeStyles>; colors: AppColors }) {
  const [open, setOpen] = useState(false);
  const total = subs.reduce((s, x) => s + x.amount, 0);

  return (
    <View style={styles.subCard}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.7} style={styles.subHeader}>
        <View style={styles.subIconWrap}>
          <Ionicons name="cube-outline" size={18} color={colors.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 14, color: colors.text }}>Suscripciones detectadas</Text>
          <Text style={{ fontSize: 12, color: colors.text2, marginTop: 2 }}>{subs.length} activas este mes</Text>
        </View>
        <Text style={styles.subTotal}>{formatARS(total)}/mes</Text>
        <Ionicons
          name="chevron-down-outline"
          size={16}
          color={colors.text3}
          style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>
      {open && (
        <View style={styles.subBody}>
          {subs.map((s, i) => (
            <View key={s.id} style={[styles.subItemRow, i < subs.length - 1 && styles.subItemSep]}>
              <View style={[styles.subItemDot, { backgroundColor: DOT_COLORS[i % 4] }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.subItemName}>{s.name}</Text>
                <Text style={styles.subItemMeta}>Día {s.billing_day} c/mes</Text>
              </View>
              <Text style={styles.subItemAmount}>{formatARS(s.amount)}/mes</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── CommitmentsCard ──────────────────────────────────────────────────────────

const COMMIT_CAT_COLORS: Record<string, string> = {
  Vivienda: '#F97316', Credito: '#6366F1', Seguros: '#EF4444',
  Servicios: '#EAB308', Transporte: '#3B82F6', Otros: '#6B7280',
};

function commitStatusColor(status: CommitmentStatus, colors: AppColors): string {
  if (status === 'paid')     return colors.success;
  if (status === 'due_soon') return colors.warning;
  if (status === 'overdue')  return colors.danger;
  return colors.text3;
}

function commitDueText(c: Commitment): string {
  if (c.status === 'paid')    return `✓ Pagado el día ${c.day_of_month}`;
  if (c.status === 'overdue') return `Venció hace ${Math.abs(c.days_until_due)} día${Math.abs(c.days_until_due) === 1 ? '' : 's'}`;
  if (c.days_until_due === 0) return '⚡ Vence hoy';
  if (c.days_until_due === 1) return '⚡ Vence mañana';
  if (c.days_until_due <= 3)  return `⚡ Vence en ${c.days_until_due} días`;
  return `Vence día ${c.day_of_month}`;
}

function CommitmentRow({ c, isLast, styles, colors }: { c: Commitment; isLast: boolean; styles: ReturnType<typeof makeStyles>; colors: AppColors }) {
  const sc = commitStatusColor(c.status, colors);
  const amtColor = c.status === 'due_soon' ? colors.warning : c.status === 'overdue' ? colors.danger : colors.text;
  const catColor = COMMIT_CAT_COLORS[c.category] ?? colors.primary;
  const badgeLabel = c.status === 'paid' ? 'Pagado' : c.status === 'due_soon' ? 'Vence pronto' : c.status === 'overdue' ? 'Vencido' : 'Pendiente';

  return (
    <View style={[styles.commitRow, !isLast && styles.commitRowSep]}>
      <View style={[styles.commitRowIcon, { backgroundColor: `${catColor}18` }]}>
        <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Text style={styles.commitRowName} numberOfLines={1}>{c.name}</Text>
          {c.installment_current != null && c.installment_total != null ? (
            <View style={styles.installBadge}>
              <Text style={styles.installText}>Cuota {c.installment_current}/{c.installment_total}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.commitRowSub, { color: sc }]} numberOfLines={1}>
          {c.category} · {commitDueText(c)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.commitRowAmt, { color: amtColor }]}>{formatARS(c.amount)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${sc}18` }]}>
          <Text style={[styles.statusBadgeText, { color: sc }]}>{badgeLabel}</Text>
        </View>
      </View>
    </View>
  );
}

function CommitmentsCard({ commitments, styles, colors }: { commitments: Commitment[]; styles: ReturnType<typeof makeStyles>; colors: AppColors }) {
  const [open, setOpen] = useState(false);

  const paid    = commitments.filter(c => c.status === 'paid').length;
  const dueSoon = commitments.filter(c => c.status === 'due_soon').length;
  const overdue = commitments.filter(c => c.status === 'overdue').length;
  const pending = commitments.filter(c => c.status === 'pending').length;
  const total   = commitments.reduce((s, c) => s + c.amount, 0);
  const remaining = commitments.filter(c => c.status !== 'paid').reduce((s, c) => s + c.amount, 0);
  const remainingColor = overdue > 0 ? colors.danger : dueSoon > 0 ? colors.warning : colors.text;

  return (
    <View style={styles.commitCard}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.7}>
        <View style={styles.commitHeader}>
          <View style={styles.commitIconWrap}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.commitInfo}>
            <Text style={styles.commitTitle}>Compromisos del mes</Text>
            <Text style={styles.commitSub}>{commitments.length} pagos · {formatARS(total)}/mes</Text>
          </View>
          <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
            <Text style={[styles.commitAmt, { color: remainingColor }]}>{formatARS(remaining)}</Text>
            <Text style={styles.commitAmtLabel}>por pagar</Text>
          </View>
          <Ionicons name={open ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={colors.text3} />
        </View>

        <View style={styles.commitChips}>
          {paid > 0 ? (
            <View style={styles.commitChip}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
              <Text style={styles.commitChipText}>{paid} pagados</Text>
            </View>
          ) : null}
          {(dueSoon + overdue) > 0 ? (
            <View style={styles.commitChip}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning }} />
              <Text style={styles.commitChipText}>{dueSoon + overdue} vencen pronto</Text>
            </View>
          ) : null}
          {pending > 0 ? (
            <View style={styles.commitChip}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.text3 }} />
              <Text style={styles.commitChipText}>{pending} pendientes</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      {open ? (
        <View style={styles.commitBody}>
          {commitments.map((c, i) => (
            <CommitmentRow key={c.id} c={c} isLast={i === commitments.length - 1} styles={styles} colors={colors} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { data: summary, isLoading, refetch, isRefetching } = useSummary(currentMonth());
  const { data: commitments } = useCommitments();
  const { data: insight } = useInsight();
  const createTransaction = useCreateTransaction();
  const [showTxnSheet, setShowTxnSheet] = useState(false);
  const [showRecap, setShowRecap] = useState(false);
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const onRefresh = useCallback(async () => { await refetch(); }, [refetch]);

  const firstName = user?.name?.split(' ')[0] ?? '';
  const monthLabel = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    .replace(/^\w/, c => c.toUpperCase());

  const disponible = summary ? Math.max(0, summary.balance) : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingDate}>{monthLabel}</Text>
        <Text style={styles.greetingName}>Hola, {firstName || 'bienvenido'} 👋</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* PocketCard */}
        <View style={styles.cardWrap}>
          {isLoading ? (
            <View style={{ height: 140, borderRadius: 24, backgroundColor: colors.surface2 }} />
          ) : (
            <PocketCard disponible={disponible} styles={styles} />
          )}
        </View>

        {/* BalanceCard */}
        <View style={[styles.cardWrap, { marginBottom: 16 }]}>
          {isLoading ? (
            <View style={{ height: 160, borderRadius: 24, backgroundColor: colors.surface2 }} />
          ) : summary ? (
            <BalanceCard
              disponible={disponible}
              income={summary.income}
              expenses={summary.expenses}
              styles={styles}
            />
          ) : null}
        </View>

        {/* MonthProgress */}
        {summary && summary.income > 0 ? (
          <View style={[styles.section, { marginBottom: 20 }]}>
            <MonthProgress
              income={summary.income}
              expenses={summary.expenses}
              styles={styles}
              colors={colors}
            />
          </View>
        ) : null}

        {/* Recap banner */}
        <View style={[styles.section, { marginBottom: 20 }]}>
          <TouchableOpacity
            onPress={() => setShowRecap(true)}
            activeOpacity={0.88}
            style={{
              borderRadius: 20,
              padding: 15,
              paddingHorizontal: 17,
              overflow: 'hidden',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 13,
              shadowColor: '#1a0a3c',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 14,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={['#0c0c24', '#1a0a3c', '#2a1458']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: 20,
              }}
            />
            {/* Orb */}
            <View style={{
              position: 'absolute',
              top: -25, right: -25,
              width: 90, height: 90,
              borderRadius: 45,
              backgroundColor: 'rgba(139,92,246,0.25)',
            }} pointerEvents="none" />
            <Text style={{ fontSize: 26, flexShrink: 0 }}>🎁</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '800', color: 'white', letterSpacing: -0.2 }}>
                Tu recap de {new Date(new Date().setMonth(new Date().getMonth() - 1))
                  .toLocaleDateString('es-AR', { month: 'long' })} está listo
              </Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 2 }}>
                Tu mes en formato story · compartible
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#A78BFA', flexShrink: 0 }}>Ver →</Text>
          </TouchableOpacity>
        </View>

        {/* Commitments */}
        {commitments && commitments.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Compromisos del mes</Text>
            </View>
            <CommitmentsCard commitments={commitments} styles={styles} colors={colors} />
          </View>
        ) : null}

        {/* Budgets */}
        {summary && summary.top_budgets.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Presupuestos</Text>
            </View>
            <View>
              {summary.top_budgets.slice(0, 3).map((b, i) => (
                <BudgetBar key={b.id} budget={b} delay={i * 80} styles={styles} colors={colors} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Last transactions */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Últimos movimientos</Text>
          </View>
          <View style={styles.txnCard}>
            {isLoading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Cargando...</Text>
              </View>
            ) : summary?.recent_transactions?.filter(t => !t.deleted_at).length ? (
              summary.recent_transactions
                .filter(t => !t.deleted_at)
                .slice(0, 3)
                .map((txn, idx, arr) => (
                  <MiniTxnRow key={txn.id} txn={txn} styles={styles} colors={colors} isLast={idx === arr.length - 1} />
                ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={32} color={colors.border} />
                <Text style={styles.emptyText}>Sin movimientos este mes</Text>
              </View>
            )}
          </View>
        </View>

        {/* Subscriptions */}
        {summary && summary.subscriptions.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Suscripciones</Text>
            </View>
            <SuscripcionesCard subs={summary.subscriptions} styles={styles} colors={colors} />
          </View>
        ) : null}

        {/* Insight */}
        {insight?.content ? (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Insight de la semana</Text>
            </View>
            <View style={styles.insightCard}>
              <LinearGradient
                colors={[colors.primary, '#A78BFA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.insightAccent}
              />
              <View style={styles.insightInner}>
                <View style={styles.insightLabel}>
                  <Ionicons name="star" size={11} color="#7C3AED" />
                  <Text style={styles.insightLabelText}>Insight IA</Text>
                </View>
                <Text style={styles.insightText}>{insight.content}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowTxnSheet(true)}
        style={[styles.fab, { bottom: insets.bottom + 92 }]}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <TransactionSheet
        visible={showTxnSheet}
        onClose={() => setShowTxnSheet(false)}
        onSubmit={async (payload) => { await createTransaction.mutateAsync(payload); setShowTxnSheet(false); }}
        isLoading={createTransaction.isPending}
      />

      <RecapModal
        visible={showRecap}
        onClose={() => setShowRecap(false)}
        userName={firstName || 'Valentina'}
        income={summary?.income}
        expenses={summary?.expenses}
      />
    </View>
  );
}
