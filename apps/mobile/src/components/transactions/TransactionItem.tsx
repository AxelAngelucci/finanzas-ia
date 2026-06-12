import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatARS, formatDateRelative } from '@/lib/format';
import { useTheme } from '@/hooks/useTheme';
import { TransactionType, TransactionCategory, TransactionChannel } from '@/types';
import type { Transaction } from '@/types';

// ─── Channel Config ───────────────────────────────────────────────────────────

const CHANNEL_CONFIG: Record<TransactionChannel, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
  [TransactionChannel.WA_AUDIO]: { bg: '#25D366', icon: 'mic-outline' },
  [TransactionChannel.WA_TEXT]:  { bg: '#25D366', icon: 'chatbubble-outline' },
  [TransactionChannel.APP]:      { bg: '', icon: 'phone-portrait-outline' },
};

// ─── Category Labels ──────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  [TransactionCategory.ALIMENTACION]:    'Alimentación',
  [TransactionCategory.TRANSPORTE]:      'Transporte',
  [TransactionCategory.ENTRETENIMIENTO]: 'Entretenimiento',
  [TransactionCategory.SALUD]:           'Salud',
  [TransactionCategory.EDUCACION]:       'Educación',
  [TransactionCategory.ROPA]:            'Ropa',
  [TransactionCategory.TECNOLOGIA]:      'Tecnología',
  [TransactionCategory.ALQUILER]:        'Alquiler',
  [TransactionCategory.TRABAJO]:         'Trabajo',
  [TransactionCategory.AHORRO]:          'Ahorro',
  [TransactionCategory.SUELDO]:          'Sueldo',
  [TransactionCategory.FREELANCE]:       'Freelance',
  [TransactionCategory.OTROS]:           'Otros',
};

// ─── Component ────────────────────────────────────────────────────────────────

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps) {
  const { colors } = useTheme();
  const isIncome = transaction.type === TransactionType.INCOME;
  const amountColor = isIncome ? colors.success : colors.text;
  const amountPrefix = isIncome ? '+' : '−';

  const ch = CHANNEL_CONFIG[transaction.channel] ?? CHANNEL_CONFIG[TransactionChannel.APP];
  const channelBg = ch.bg || colors.primary;

  const catLabel = CATEGORY_LABELS[transaction.category] ?? transaction.category;
  const dateLabel = formatDateRelative(transaction.date);

  return (
    <TouchableOpacity
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, gap: 13, backgroundColor: colors.surface }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: channelBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Ionicons name={ch.icon} size={18} color="white" />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontWeight: '600', fontSize: 14, color: colors.text }} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={{ fontSize: 11, color: colors.text2, marginTop: 3, letterSpacing: 0.1 }}>
          {catLabel} · {dateLabel}
        </Text>
      </View>

      <Text style={{ fontWeight: '700', fontSize: 15, color: amountColor, fontVariant: ['tabular-nums'], letterSpacing: -0.3 }}>
        {amountPrefix}{formatARS(transaction.amount)}
      </Text>
    </TouchableOpacity>
  );
}

export { CATEGORY_LABELS };
