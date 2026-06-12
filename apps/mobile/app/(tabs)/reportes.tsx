import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
  Animated,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBudgets } from '@/hooks/useBudgets';
import { useGoals } from '@/hooks/useGoals';
import { useSummary } from '@/hooks/useTransactions';
import { useCommitments, useMarkCommitmentPaid, useMarkCommitmentUnpaid } from '@/hooks/useCommitments';
import { formatARS, formatARSCompact, currentMonth } from '@/lib/format';
import { useTheme } from '@/hooks/useTheme';
import type { AppColors } from '@/lib/theme';
import { TransactionCategory, GoalStatus } from '@/types';
import type { Budget, Goal, Commitment, CommitmentStatus } from '@/types';

const CATEGORY_LABELS: Partial<Record<TransactionCategory, string>> = {
  [TransactionCategory.ALIMENTACION]: 'Alimentación',
  [TransactionCategory.TRANSPORTE]: 'Transporte',
  [TransactionCategory.ENTRETENIMIENTO]: 'Entretenimiento',
  [TransactionCategory.SALUD]: 'Salud',
  [TransactionCategory.ROPA]: 'Ropa',
  [TransactionCategory.TECNOLOGIA]: 'Tecnología',
  [TransactionCategory.ALQUILER]: 'Alquiler',
  [TransactionCategory.EDUCACION]: 'Educación',
  [TransactionCategory.TRABAJO]: 'Trabajo',
  [TransactionCategory.AHORRO]: 'Ahorro',
  [TransactionCategory.SUELDO]: 'Sueldo',
  [TransactionCategory.FREELANCE]: 'Freelance',
  [TransactionCategory.OTROS]: 'Otros',
};

// ─── Chart constants & helpers ────────────────────────────────────────────────

const CAT_COLORS: Partial<Record<TransactionCategory, string>> = {
  [TransactionCategory.ALQUILER]:        '#F59E0B',
  [TransactionCategory.OTROS]:           '#6366F1',
  [TransactionCategory.TRANSPORTE]:      '#8B5CF6',
  [TransactionCategory.ALIMENTACION]:    '#EC4899',
  [TransactionCategory.SALUD]:           '#10B981',
  [TransactionCategory.ENTRETENIMIENTO]: '#A78BFA',
  [TransactionCategory.TECNOLOGIA]:      '#3B82F6',
  [TransactionCategory.ROPA]:            '#F97316',
  [TransactionCategory.EDUCACION]:       '#0EA5E9',
  [TransactionCategory.TRABAJO]:         '#14B8A6',
  [TransactionCategory.AHORRO]:          '#22C55E',
  [TransactionCategory.SUELDO]:          '#84CC16',
  [TransactionCategory.FREELANCE]:       '#EAB308',
};

const CAT_SHORT: Partial<Record<TransactionCategory, string>> = {
  [TransactionCategory.ALQUILER]:        'Alquiler',
  [TransactionCategory.OTROS]:           'Varios',
  [TransactionCategory.TRANSPORTE]:      'Transp.',
  [TransactionCategory.ALIMENTACION]:    'Alim.',
  [TransactionCategory.SALUD]:           'Salud',
  [TransactionCategory.ENTRETENIMIENTO]: 'Entret.',
  [TransactionCategory.TECNOLOGIA]:      'Tecnol.',
  [TransactionCategory.ROPA]:            'Ropa',
  [TransactionCategory.EDUCACION]:       'Educ.',
  [TransactionCategory.TRABAJO]:         'Trabajo',
  [TransactionCategory.AHORRO]:          'Ahorro',
  [TransactionCategory.SUELDO]:          'Sueldo',
  [TransactionCategory.FREELANCE]:       'Freelance',
};

const MONTH_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function prevMonthStr(yyyyMm: string, n = 1): string {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y, m - 1 - n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(yyyyMm: string): string {
  return MONTH_SHORT[parseInt(yyyyMm.split('-')[1], 10) - 1];
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ─── DonutChart ───────────────────────────────────────────────────────────────

interface DonutSlice { color: string; amount: number; label: string }

function DonutChart({ data, total, colors }: { data: DonutSlice[]; total: number; colors: AppColors }) {
  const SIZE = 150;
  const SW   = 26;
  const R    = (SIZE - SW) / 2;
  const C    = 2 * Math.PI * R;
  const cx   = SIZE / 2;
  const cy   = SIZE / 2;
  const GAP  = 3;

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() =>
      Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }).start()
    , 150);
    return () => clearTimeout(t);
  }, []);

  let cumulative = 0;
  return (
    <View style={{ width: SIZE, height: SIZE, flexShrink: 0 }}>
      <Svg width={SIZE} height={SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={cx} cy={cy} r={R} fill="none" stroke={colors.surface2} strokeWidth={SW} />
        {data.map((d, i) => {
          const f      = d.amount / total;
          const angle  = cumulative * 360;
          cumulative  += f;
          const segLen = Math.max(0, f * C - GAP);
          const dashOffset = anim.interpolate({ inputRange: [0, 1], outputRange: [segLen, 0] });
          return (
            <G key={i} transform={`rotate(${angle} ${cx} ${cy})`}>
              <AnimatedCircle
                cx={cx} cy={cy} r={R}
                fill="none"
                stroke={d.color}
                strokeWidth={SW - 4}
                strokeDasharray={`${segLen} ${C}`}
                strokeDashoffset={dashOffset as any}
              />
            </G>
          );
        })}
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 10, color: colors.text2, fontWeight: '500' }}>Total</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginTop: 2 }}>
          {formatARS(total)}
        </Text>
      </View>
    </View>
  );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────

interface BarItem { month: string; label: string; expenses: number }

function BarChart({ data, colors }: { data: BarItem[]; colors: AppColors }) {
  const max   = Math.max(...data.map(d => d.expenses), 1);
  const BAR_H = 72;

  const animValues = useRef(data.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.stagger(100, animValues.map(v =>
        Animated.timing(v, { toValue: 1, duration: 900, useNativeDriver: false })
      )).start();
    }, 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
      {data.map((d, i) => {
        const isCurr  = i === data.length - 1;
        const targetH = (d.expenses / max) * BAR_H;
        const barH    = animValues[i].interpolate({ inputRange: [0, 1], outputRange: [0, targetH] });

        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 10, color: isCurr ? colors.primary : colors.text3, fontWeight: isCurr ? '700' : '400', textAlign: 'center' }}>
              {formatARSCompact(d.expenses)}
            </Text>
            <View style={{ width: '100%', height: BAR_H, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.surface2, justifyContent: 'flex-end' }}>
              {isCurr ? (
                <Animated.View style={{ width: '100%', height: barH, borderRadius: 10, overflow: 'hidden' }}>
                  <LinearGradient colors={['#A78BFA', colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }} />
                </Animated.View>
              ) : (
                <Animated.View style={{ width: '100%', height: barH, backgroundColor: colors.text3, opacity: 0.45, borderRadius: 10 }} />
              )}
            </View>
            <Text style={{ fontSize: 12, fontWeight: isCurr ? '700' : '400', color: isCurr ? colors.primary : colors.text2 }}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

type ReportTab = 'presupuestos' | 'analiticas' | 'metas' | 'compromisos';
const TABS: { id: ReportTab; label: string }[] = [
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'analiticas',   label: 'Analíticas' },
  { id: 'metas',        label: 'Metas' },
  { id: 'compromisos',  label: 'Compromisos' },
];

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root:           { flex: 1, backgroundColor: c.bg },
    header:         { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    title:          { fontSize: 24, fontWeight: '700', color: c.text, marginBottom: 14 },
    tabContainer:   { flexDirection: 'row', backgroundColor: c.surface2, borderRadius: 13, padding: 4 },
    tabItem:        { flex: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center' },
    tabItemActive:  { backgroundColor: c.surface, shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    tabText:        { fontSize: 11, fontWeight: '600', color: c.text2 },
    tabTextActive:  { color: c.primary },
    surfaceCard:    { backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden', shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    cardTitle:      { fontSize: 15, fontWeight: '600', color: c.text, padding: 16, paddingBottom: 12 },
    monthLabel:     { fontSize: 10, fontWeight: '700', color: c.text3, letterSpacing: 0.8, padding: 16, paddingBottom: 8 },
    rowSep:         { borderTopWidth: 1, borderTopColor: c.bg },
    budgetRow:      { padding: 16 },
    budgetMeta:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    budgetMetaLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    budgetDot:      { width: 8, height: 8, borderRadius: 4 },
    budgetCat:      { fontSize: 13, fontWeight: '500', color: c.text },
    budgetTrack:    { height: 5, backgroundColor: c.bg, borderRadius: 100, overflow: 'hidden', marginBottom: 6 },
    budgetFill:     { height: '100%' as any, borderRadius: 100 },
    budgetAmounts:  { flexDirection: 'row', justifyContent: 'space-between' },
    budgetSpent:    { fontSize: 11, color: c.text2 },
    budgetLimit:    { fontSize: 11, color: c.text3 },
    goalCard:       { backgroundColor: c.surface, borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    goalHeader:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    goalName:       { fontSize: 15, fontWeight: '600', color: c.text },
    goalDate:       { fontSize: 11, color: c.text3, marginTop: 2 },
    goalAmounts:    { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 8 },
    goalCurrent:    { fontSize: 20, fontWeight: '700', color: c.primary },
    goalTarget:     { fontSize: 13, color: c.text3 },
    goalTrack:      { height: 5, backgroundColor: c.bg, borderRadius: 100, overflow: 'hidden', marginBottom: 8 },
    goalFill:       { height: '100%' as any, borderRadius: 100, backgroundColor: c.primary },
    goalFooter:     { flexDirection: 'row', justifyContent: 'space-between' },
    goalPct:        { fontSize: 11, color: c.text3 },
    goalNeeded:     { fontSize: 11, color: c.text2 },
    catRow:         { paddingHorizontal: 16, paddingBottom: 12 },
    catMeta:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    catLabel:       { fontSize: 13, color: c.text2 },
    catRight:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
    catPct:         { fontSize: 11, color: c.text3 },
    catAmount:      { fontSize: 13, fontWeight: '600', color: c.text },
    catTrack:       { height: 4, backgroundColor: c.bg, borderRadius: 100, overflow: 'hidden' },
    catFill:        { height: '100%' as any, borderRadius: 100, backgroundColor: c.primary },
    summaryRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    summaryLabel:   { fontSize: 13, color: c.text2 },
    summaryValue:   { fontSize: 14, fontWeight: '600', color: c.text },
    summaryDivider: { borderBottomWidth: 1, borderBottomColor: c.bg },
    sectionLabel:   { fontSize: 11, fontWeight: '700', color: c.text2, letterSpacing: 0.9, marginBottom: 10, marginTop: 4 },
    center:         { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 8 },
    emptyTitle:     { fontSize: 15, fontWeight: '600', color: c.text },
    emptyDesc:      { fontSize: 13, color: c.text2, textAlign: 'center', paddingHorizontal: 24, lineHeight: 19 },
    completedBadge: { backgroundColor: '#ECFDF5', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
    completedText:  { fontSize: 11, fontWeight: '600', color: '#059669' },
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const BUDGET_COLORS: Record<string, string> = {
  alimentacion: '#D97706', transporte: '#2563EB', entretenimiento: '#7C3AED',
  salud: '#DC2626', educacion: '#0891B2', ropa: '#BE185D',
  tecnologia: '#6366F1', alquiler: '#059669', otros: '#6B7280',
};

function BudgetCard({ budget, delay = 0, styles, colors }: { budget: Budget; delay?: number; styles: ReturnType<typeof makeStyles>; colors: AppColors }) {
  const pct    = Math.min(100, Math.round(budget.percentage));
  const isOver = pct >= 100;
  const isWarn = pct >= 80 && !isOver;
  const barColor = isOver ? colors.danger : isWarn ? colors.warning : (BUDGET_COLORS[budget.category] ?? colors.primary);
  const amountColor = isOver ? colors.danger : isWarn ? colors.warning : colors.text2;

  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(width, { toValue: pct, duration: 900, useNativeDriver: false }).start();
    }, 130 + delay);
    return () => clearTimeout(t);
  }, [width, pct, delay]);

  return (
    <View style={[styles.surfaceCard, { padding: 16, paddingBottom: 10, marginBottom: 10 }]}>
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
      <View style={{ alignItems: 'flex-end', marginTop: 6 }}>
        <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: `${barColor}22` }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: barColor }}>
            {pct}%{isOver ? ' 🚨' : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

function GoalRow({ goal, colors, index = 0 }: { goal: Goal; colors: AppColors; index?: number }) {
  const pct        = Math.min(100, Math.round(goal.percentage));
  const isCompleted = goal.status === GoalStatus.COMPLETED || pct >= 100;
  const goalColor  = goal.color ?? colors.primary;

  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() =>
      Animated.timing(barAnim, { toValue: pct, duration: 950, useNativeDriver: false }).start()
    , 120 + index * 130);
    return () => clearTimeout(t);
  }, [pct, index]);

  const deadlineStr = goal.deadline
    ? (() => {
        const d = new Date(goal.deadline);
        return `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
      })()
    : null;

  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 18,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: `${goalColor}18`, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Text style={{ fontSize: 22 }}>{goal.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 15, color: colors.text }}>{goal.name}</Text>
          {deadlineStr ? (
            <Text style={{ fontSize: 11, color: colors.text3, marginTop: 3 }}>Meta para {deadlineStr}</Text>
          ) : null}
        </View>
        <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: `${goalColor}18` }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: goalColor }}>{pct}%</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ height: 7, borderRadius: 100, backgroundColor: colors.surface2, overflow: 'hidden', marginBottom: 12 }}>
        <Animated.View style={{
          height: '100%' as any,
          borderRadius: 100,
          backgroundColor: goalColor,
          width: barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        }} />
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 10, color: colors.text2, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}>Ahorrado</Text>
          <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{formatARS(goal.current_amount)}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: colors.text2, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}>Objetivo</Text>
          <Text style={{ fontWeight: '600', fontSize: 14, color: colors.text2 }}>{formatARS(goal.target_amount)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: goalColor, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' }}>Ahorrar/mes</Text>
          <Text style={{ fontWeight: '800', fontSize: 16, color: goalColor }}>{goal.monthly_needed ? formatARS(goal.monthly_needed) : '—'}</Text>
        </View>
      </View>

      {isCompleted ? (
        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.success, textAlign: 'center' }}>¡Meta completada! 🎉</Text>
        </View>
      ) : null}
    </View>
  );
}

function AnalyticsTab({ month, styles, colors }: { month: string; styles: ReturnType<typeof makeStyles>; colors: AppColors }) {
  const m1 = prevMonthStr(month, 1);
  const m2 = prevMonthStr(month, 2);

  const { data: summary, isLoading } = useSummary(month);
  const { data: sum1 } = useSummary(m1);
  const { data: sum2 } = useSummary(m2);

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (!summary) return null;

  const total = summary.expenses || 1;
  const catEntries = Object.entries(summary.by_category as Record<string, number>)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const donutData: DonutSlice[] = catEntries.map(([cat, amount]) => ({
    color: CAT_COLORS[cat as TransactionCategory] ?? '#9CA3AF',
    amount,
    label: CAT_SHORT[cat as TransactionCategory] ?? cat,
  }));

  const barData: BarItem[] = [
    { month: m2, label: monthLabel(m2), expenses: sum2?.expenses ?? 0 },
    { month: m1, label: monthLabel(m1), expenses: sum1?.expenses ?? 0 },
    { month,     label: monthLabel(month), expenses: summary.expenses },
  ];

  return (
    <View>
      {/* Gastos por categoría — donut */}
      <View style={[styles.surfaceCard, { padding: 20, marginBottom: 14 }]}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Gastos por categoría</Text>
        {donutData.length === 0 ? (
          <Text style={[styles.emptyDesc, { paddingBottom: 8 }]}>Sin gastos este mes</Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <DonutChart data={donutData} total={total} colors={colors} />
            <View style={{ flex: 1 }}>
              {donutData.map((d, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: i < donutData.length - 1 ? 9 : 0 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color }} />
                  <Text style={{ fontSize: 12, color: colors.text2, flex: 1 }}>{d.label}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text }}>{formatARS(d.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Comparativa mensual — bar chart */}
      <View style={[styles.surfaceCard, { padding: 20 }]}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 16 }}>Comparativa mensual</Text>
        <BarChart data={barData} colors={colors} />
      </View>
    </View>
  );
}

// ─── CompromisosTab ───────────────────────────────────────────────────────────

const COMMIT_STATUS_COLORS: Record<CommitmentStatus, string> = {
  paid:     '#059669',
  due_soon: '#F59E0B',
  overdue:  '#DC2626',
  pending:  '#9CA3AF',
};

const COMMIT_STATUS_LABELS: Record<CommitmentStatus, string> = {
  paid:     '✓ Pagado',
  due_soon: 'Próximo',
  overdue:  'Vencido',
  pending:  'Pendiente',
};

const COMMIT_CAT_LABELS: Record<string, string> = {
  Vivienda:   'Vivienda',
  Credito:    'Crédito',
  Seguros:    'Seguros',
  Servicios:  'Servicios',
  Transporte: 'Transporte',
  Otros:      'Otros',
};

function CompromisosRow({
  commitment,
  mLabel,
  onToggle,
  colors,
}: {
  commitment: Commitment;
  mLabel: string;
  onToggle: (c: Commitment) => void;
  colors: AppColors;
}) {
  const statusColor = COMMIT_STATUS_COLORS[commitment.status];
  const installmentStr = commitment.installment_current && commitment.installment_total
    ? `Cuota ${commitment.installment_current}/${commitment.installment_total}`
    : (COMMIT_CAT_LABELS[commitment.category] ?? commitment.category);

  return (
    <TouchableOpacity
      onPress={() => onToggle(commitment)}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 }}
    >
      {/* Date bubble */}
      <View style={{
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: `${statusColor}1A`,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: statusColor, lineHeight: 19 }}>
          {String(commitment.day_of_month).padStart(2, '0')}
        </Text>
        <Text style={{ fontSize: 8, fontWeight: '700', color: statusColor, letterSpacing: 0.5 }}>
          {mLabel.toUpperCase()}
        </Text>
      </View>

      {/* Emoji */}
      <Text style={{ fontSize: 24, flexShrink: 0 }}>{commitment.emoji ?? '📅'}</Text>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 2 }} numberOfLines={1}>
          {commitment.name}
        </Text>
        <Text style={{ fontSize: 11, color: colors.text3 }}>{installmentStr}</Text>
      </View>

      {/* Amount + badge */}
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>
          {formatARS(commitment.amount)}
        </Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: `${statusColor}1A` }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: statusColor }}>
            {COMMIT_STATUS_LABELS[commitment.status]}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CompromisosTab({ month, styles, colors }: { month: string; styles: ReturnType<typeof makeStyles>; colors: AppColors }) {
  const { data: commitments = [], isLoading } = useCommitments(month);
  const markPaid   = useMarkCommitmentPaid();
  const markUnpaid = useMarkCommitmentUnpaid();

  const mLabel = MONTH_SHORT[parseInt(month.split('-')[1], 10) - 1];

  const sorted = useMemo(
    () => [...commitments].sort((a, b) => a.day_of_month - b.day_of_month),
    [commitments],
  );

  const totalAmount   = useMemo(() => sorted.reduce((s, c) => s + c.amount, 0), [sorted]);
  const paidAmount    = useMemo(() => sorted.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0), [sorted]);
  const pendingAmount = totalAmount - paidAmount;
  const paidCount     = sorted.filter(c => c.status === 'paid').length;
  const pct           = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const barAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isLoading) {
      barAnim.setValue(0);
      Animated.timing(barAnim, { toValue: pct, duration: 800, useNativeDriver: false }).start();
    }
  }, [isLoading, pct]);

  const handleToggle = useCallback((c: Commitment) => {
    if (c.status === 'paid') markUnpaid.mutate(c.id);
    else markPaid.mutate(c.id);
  }, [markPaid, markUnpaid]);

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  if (sorted.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={48} color={colors.border} />
        <Text style={styles.emptyTitle}>Sin compromisos</Text>
        <Text style={styles.emptyDesc}>
          Pedile al asistente que registre tus pagos fijos como alquiler, créditos o seguros.
        </Text>
      </View>
    );
  }

  return (
    <View>
      {/* Summary card */}
      <View style={[styles.surfaceCard, { padding: 16, marginBottom: 14 }]}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 14 }}>
          Resumen — {mLabel}
        </Text>

        {/* Progress bar */}
        <View style={{ height: 6, backgroundColor: colors.surface2, borderRadius: 100, overflow: 'hidden', marginBottom: 6 }}>
          <Animated.View style={{
            height: '100%' as any,
            borderRadius: 100,
            backgroundColor: '#059669',
            width: barAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }} />
        </View>
        <Text style={{ fontSize: 11, color: colors.text3, marginBottom: 18, textAlign: 'right' }}>
          {paidCount} de {sorted.length} pagados ({pct}%)
        </Text>

        {/* Stats */}
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.text3, letterSpacing: 0.8, marginBottom: 5 }}>TOTAL MES</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{formatARS(totalAmount)}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#059669', letterSpacing: 0.8, marginBottom: 5 }}>PAGADO</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#059669' }}>{formatARS(paidAmount)}</Text>
          </View>
          <View style={{ width: 1, backgroundColor: colors.border }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: colors.text2, letterSpacing: 0.8, marginBottom: 5 }}>POR PAGAR</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text }}>{formatARS(pendingAmount)}</Text>
          </View>
        </View>
      </View>

      {/* Calendar list */}
      <View style={styles.surfaceCard}>
        <Text style={styles.cardTitle}>Calendario de vencimientos</Text>
        {sorted.map((c, i) => (
          <View key={c.id}>
            {i > 0 && <View style={styles.rowSep} />}
            <CompromisosRow
              commitment={c}
              mLabel={mLabel}
              onToggle={handleToggle}
              colors={colors}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ReportesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [activeTab, setActiveTab] = useState<ReportTab>('presupuestos');
  const month = currentMonth();
  const { data: budgets, isLoading: budgetsLoading } = useBudgets(month);
  const { data: goals, isLoading: goalsLoading } = useGoals();
  const activeGoals    = goals?.filter((g) => g.status === GoalStatus.ACTIVE) ?? [];
  const completedGoals = goals?.filter((g) => g.status === GoalStatus.COMPLETED) ?? [];
  // Pre-fetch commitments so the tab is instant when switched
  useCommitments(month);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Reportes</Text>

        <View style={styles.tabContainer}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabItem, active && styles.tabItemActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'presupuestos' ? (
          budgetsLoading ? (
            <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
          ) : budgets && budgets.length > 0 ? (
            <View>
              {budgets.map((b, i) => (
                <BudgetCard key={b.id} budget={b} delay={i * 80} styles={styles} colors={colors} />
              ))}
            </View>
          ) : (
            <View style={styles.center}>
              <Ionicons name="wallet-outline" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>Sin presupuestos</Text>
              <Text style={styles.emptyDesc}>Configurá presupuestos por categoría para controlar tus gastos.</Text>
            </View>
          )
        ) : null}

        {activeTab === 'analiticas' ? <AnalyticsTab month={month} styles={styles} colors={colors} /> : null}

        {activeTab === 'compromisos' ? (
          <CompromisosTab month={month} styles={styles} colors={colors} />
        ) : null}

        {activeTab === 'metas' ? (
          goalsLoading ? (
            <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
          ) : (
            <>
              {/* Dashed "Nueva meta" button */}
              <TouchableOpacity style={{ padding: 13, borderRadius: 16, marginBottom: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>Nueva meta de ahorro</Text>
              </TouchableOpacity>

              {activeGoals.length === 0 && completedGoals.length === 0 ? (
                <View style={styles.center}>
                  <Ionicons name="flag-outline" size={48} color={colors.border} />
                  <Text style={styles.emptyTitle}>Sin metas de ahorro</Text>
                  <Text style={styles.emptyDesc}>Creá una meta para empezar a ahorrar con un objetivo claro.</Text>
                </View>
              ) : (
                <>
                  {activeGoals.length > 0 ? (
                    <View style={{ marginBottom: 8 }}>
                      {activeGoals.map((g, i) => <GoalRow key={g.id} goal={g} colors={colors} index={i} />)}
                    </View>
                  ) : null}
                  {completedGoals.length > 0 ? (
                    <View>
                      <Text style={styles.sectionLabel}>COMPLETADAS</Text>
                      {completedGoals.map((g, i) => <GoalRow key={g.id} goal={g} colors={colors} index={activeGoals.length + i} />)}
                    </View>
                  ) : null}
                </>
              )}
            </>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}
