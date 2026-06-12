import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useTransactions,
  useDeleteTransaction,
  useCreateTransaction,
  useUpdateTransaction,
} from '@/hooks/useTransactions';
import { TransactionItem } from '@/components/transactions/TransactionItem';
import { TransactionSheet } from '@/components/transactions/TransactionSheet';
import { formatDateRelative, formatARS } from '@/lib/format';
import { useTheme } from '@/hooks/useTheme';
import type { AppColors } from '@/lib/theme';
import { TransactionType, type Transaction, type CreateTransactionPayload } from '@/types';

const FILTER_CHIPS = [
  { label: 'Todos',    value: undefined },
  { label: 'Gastos',   value: TransactionType.EXPENSE },
  { label: 'Ingresos', value: TransactionType.INCOME },
] as const;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface DateGroup {
  date: string;
  label: string;
  transactions: Transaction[];
  total: number;
}

function groupByDate(transactions: Transaction[]): DateGroup[] {
  const map = new Map<string, Transaction[]>();
  for (const txn of transactions) {
    const key = txn.date.split('T')[0];
    const g = map.get(key) ?? [];
    g.push(txn);
    map.set(key, g);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, txns]) => ({
      date,
      label: formatDateRelative(date),
      transactions: txns,
      total: txns.reduce(
        (acc, t) => t.type === TransactionType.EXPENSE ? acc - t.amount : acc + t.amount,
        0,
      ),
    }));
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root:         { flex: 1, backgroundColor: c.bg },
    header:       { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
    title:        { fontSize: 22, fontWeight: '700', color: c.text, marginBottom: 14 },
    searchBar:    { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: c.border, marginBottom: 12 },
    searchInput:  { flex: 1, fontSize: 14, color: c.text, padding: 0 },
    chips:        { flexDirection: 'row', gap: 8, marginBottom: 4 },
    chip:         { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: c.surface },
    chipActive:   { backgroundColor: c.primary },
    chipText:     { fontSize: 13, fontWeight: '400', color: c.text2 },
    chipTextActive: { color: 'white', fontWeight: '600' },
    center:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
    emptyTitle:   { fontSize: 17, fontWeight: '600', color: c.text },
    emptyDesc:    { fontSize: 13, color: c.text2, textAlign: 'center', lineHeight: 19 },
    listBody:     { flex: 1, backgroundColor: c.surface },
    dateHeader:   { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5, backgroundColor: c.bg },
    dateLabel:    { fontSize: 11, fontWeight: '700', color: c.text2, textTransform: 'uppercase', letterSpacing: 0.6 },
    dateTotal:    { fontSize: 11, fontWeight: '700' },
    divider:      { height: 1, backgroundColor: c.border, marginHorizontal: 20 },
    swipeEdit:    { width: 80, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    swipeDelete:  { width: 80, backgroundColor: c.danger, alignItems: 'center', justifyContent: 'center' },
    footerLoader: { paddingVertical: 16, alignItems: 'center' },
    fab:          { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 18, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', shadowColor: c.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  });
}

export default function MovimientosScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<TransactionType | undefined>(undefined);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [showSheet, setShowSheet] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useTransactions({
    type: activeFilter,
    search: debouncedSearch || undefined,
    per_page: 30,
  });

  const deleteTransaction = useDeleteTransaction();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();

  const allTransactions = useMemo(() => {
    const flat: Transaction[] = [];
    data?.pages.forEach((p) => p.data.filter((t) => !t.deleted_at).forEach((t) => flat.push(t)));
    return flat;
  }, [data]);

  const groups = useMemo(() => groupByDate(allTransactions), [allTransactions]);

  const handleDelete = useCallback((txn: Transaction) => {
    Alert.alert('Eliminar movimiento', `¿Eliminás "${txn.description}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteTransaction.mutate(txn.id) },
    ], { cancelable: true });
  }, [deleteTransaction]);

  const handleEdit = useCallback((txn: Transaction) => { setEditingTxn(txn); setShowSheet(true); }, []);

  const handleSheetSubmit = useCallback(async (payload: CreateTransactionPayload) => {
    if (editingTxn) {
      await updateTransaction.mutateAsync({ id: editingTxn.id, ...payload });
    } else {
      await createTransaction.mutateAsync(payload);
    }
    setShowSheet(false);
    setEditingTxn(null);
  }, [editingTxn, createTransaction, updateTransaction]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Movimientos</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={17} color={colors.text3} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar movimientos..."
            placeholderTextColor={colors.text3}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={colors.text3} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.chips}>
          {FILTER_CHIPS.map((chip) => {
            const active = activeFilter === chip.value;
            return (
              <TouchableOpacity
                key={chip.label}
                onPress={() => setActiveFilter(chip.value)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="receipt-outline" size={56} color={colors.border} />
          <Text style={styles.emptyTitle}>Sin movimientos</Text>
          <Text style={styles.emptyDesc}>
            {search ? 'No encontramos resultados para tu búsqueda.' : 'Registrá tu primer movimiento con el botón +'}
          </Text>
        </View>
      ) : (
        <View style={styles.listBody}>
          <FlatList
            data={groups}
            keyExtractor={(item) => item.date}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
            onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
            onEndReachedThreshold={0.3}
            renderItem={({ item: group }) => (
              <View>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateLabel}>{group.label}</Text>
                </View>
                {group.transactions.map((txn, idx) => (
                  <View key={txn.id}>
                    <SwipeableRow
                      colors={colors}
                      swipeEditStyle={styles.swipeEdit}
                      swipeDeleteStyle={styles.swipeDelete}
                      onDelete={() => handleDelete(txn)}
                      onEdit={() => handleEdit(txn)}
                    >
                      <TransactionItem transaction={txn} onPress={() => handleEdit(txn)} />
                    </SwipeableRow>
                    {idx < group.transactions.length - 1 ? <View style={styles.divider} /> : null}
                  </View>
                ))}
              </View>
            )}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        </View>
      )}

      <TouchableOpacity
        onPress={() => { setEditingTxn(null); setShowSheet(true); }}
        style={[styles.fab, { bottom: insets.bottom + 92 }]}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <TransactionSheet
        visible={showSheet}
        onClose={() => { setShowSheet(false); setEditingTxn(null); }}
        onSubmit={handleSheetSubmit}
        initialData={editingTxn ?? undefined}
        isLoading={createTransaction.isPending || updateTransaction.isPending}
      />
    </View>
  );
}

// ─── Swipeable Row ────────────────────────────────────────────────────────────

function SwipeableRow({
  children,
  colors,
  swipeEditStyle,
  swipeDeleteStyle,
  onDelete,
  onEdit,
}: {
  children: React.ReactNode;
  colors: AppColors;
  swipeEditStyle: object;
  swipeDeleteStyle: object;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [revealed, setRevealed] = useState(false);
  const ACTION_WIDTH = 80;

  const open = () => {
    Animated.spring(translateX, { toValue: -ACTION_WIDTH * 2, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    setRevealed(true);
  };
  const close = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
    setRevealed(false);
  };

  return (
    <View style={{ overflow: 'hidden' }}>
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, flexDirection: 'row' }}>
        <TouchableOpacity onPress={() => { close(); onEdit(); }} style={swipeEditStyle}>
          <Ionicons name="pencil-outline" size={18} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { close(); onDelete(); }} style={swipeDeleteStyle}>
          <Ionicons name="trash-outline" size={18} color="white" />
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }}>
        <TouchableOpacity activeOpacity={1} onLongPress={open} onPress={revealed ? close : undefined}>
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
