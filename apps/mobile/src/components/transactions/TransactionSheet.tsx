import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { parseARSToCentavos } from '@/lib/format';
import { useTheme } from '@/hooks/useTheme';
import type { AppColors } from '@/lib/theme';
import { TransactionType, TransactionCategory, TransactionChannel } from '@/types';
import type { Transaction, CreateTransactionPayload } from '@/types';

const EXPENSE_CATEGORIES = [
  { value: TransactionCategory.ALIMENTACION, label: '🍽️ Alimentación' },
  { value: TransactionCategory.TRANSPORTE,   label: '🚗 Transporte' },
  { value: TransactionCategory.ENTRETENIMIENTO, label: '🎮 Entretenimiento' },
  { value: TransactionCategory.SALUD,        label: '🏥 Salud' },
  { value: TransactionCategory.EDUCACION,    label: '📚 Educación' },
  { value: TransactionCategory.ROPA,         label: '👗 Ropa' },
  { value: TransactionCategory.TECNOLOGIA,   label: '💻 Tecnología' },
  { value: TransactionCategory.ALQUILER,     label: '🏠 Alquiler' },
  { value: TransactionCategory.OTROS,        label: '❓ Otros' },
];

const INCOME_CATEGORIES = [
  { value: TransactionCategory.SUELDO,       label: '💼 Sueldo' },
  { value: TransactionCategory.FREELANCE,    label: '🧑‍💻 Freelance' },
  { value: TransactionCategory.TRABAJO,      label: '💰 Trabajo' },
  { value: TransactionCategory.AHORRO,       label: '📈 Ahorro' },
  { value: TransactionCategory.OTROS,        label: '❓ Otros' },
];

const CHANNELS = [
  { value: TransactionChannel.APP,      label: 'App' },
  { value: TransactionChannel.WA_TEXT,  label: 'WhatsApp' },
  { value: TransactionChannel.WA_AUDIO, label: 'Voz WA' },
];

interface TransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTransactionPayload) => Promise<void>;
  initialData?: Transaction;
  isLoading?: boolean;
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    overlay:        { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    sheet:          { backgroundColor: c.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
    handleWrap:     { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
    handleBar:      { width: 48, height: 4, borderRadius: 2, backgroundColor: c.border },
    headerRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
    headerTitle:    { fontSize: 17, fontWeight: '700', color: c.text },
    typeToggle:     { flexDirection: 'row', backgroundColor: c.surface, borderRadius: 16, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: c.border },
    typeBtn:        { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
    typeBtnActive:  {},
    typeBtnText:    { fontSize: 14, fontWeight: '600', color: c.text2 },
    typeBtnTextActive: { color: 'white' },
    fieldLabel:     { fontSize: 13, fontWeight: '500', color: c.text, marginBottom: 8 },
    fieldWrap:      { marginBottom: 16 },
    input:          { backgroundColor: c.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: c.text, borderWidth: 1, borderColor: c.border },
    inputError:     { borderColor: c.danger },
    errorText:      { fontSize: 12, color: c.danger, marginTop: 4 },
    chipsWrap:      { flexDirection: 'row', gap: 8 },
    chip:           { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
    chipActive:     { backgroundColor: c.primary, borderColor: c.primary },
    chipActiveLight: { backgroundColor: c.primaryLight, borderColor: c.primary },
    chipText:       { fontSize: 12, fontWeight: '500', color: c.text2 },
    chipTextActive: { color: 'white' },
    chipTextActiveLight: { color: c.primary },
  });
}

export function TransactionSheet({ visible, onClose, onSubmit, initialData, isLoading = false }: TransactionSheetProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const slideAnim = useRef(new Animated.Value(600)).current;
  const [type, setType]             = useState<TransactionType>(initialData?.type ?? TransactionType.EXPENSE);
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [amountText, setAmountText]  = useState(initialData ? String(initialData.amount / 100) : '');
  const [category, setCategory]      = useState<TransactionCategory>(initialData?.category ?? TransactionCategory.OTROS);
  const [channel, setChannel]        = useState<TransactionChannel>(initialData?.channel ?? TransactionChannel.APP);
  const [note, setNote]              = useState(initialData?.note ?? '');
  const [errors, setErrors]          = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, damping: 20, stiffness: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible, slideAnim]);

  const categories = type === TransactionType.EXPENSE ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!description.trim()) newErrors.description = 'La descripción es requerida';
    const parsed = parseFloat(amountText.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) newErrors.amount = 'Ingresá un monto válido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit({
      type,
      description: description.trim(),
      amount: parseARSToCentavos(amountText),
      category,
      channel,
      date: initialData?.date ?? new Date().toISOString().split('T')[0],
      note: note.trim() || undefined,
    });
  };

  const isExpense = type === TransactionType.EXPENSE;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            {/* Handle */}
            <View style={styles.handleWrap}>
              <View style={styles.handleBar} />
            </View>

            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>
                {initialData ? 'Editar movimiento' : 'Nuevo movimiento'}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle-outline" size={26} color={colors.text2} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ paddingHorizontal: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Type toggle */}
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  onPress={() => { setType(TransactionType.EXPENSE); setCategory(TransactionCategory.OTROS); }}
                  style={[styles.typeBtn, isExpense && { backgroundColor: colors.danger }]}
                >
                  <Text style={[styles.typeBtnText, isExpense && styles.typeBtnTextActive]}>Gasto</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setType(TransactionType.INCOME); setCategory(TransactionCategory.OTROS); }}
                  style={[styles.typeBtn, !isExpense && { backgroundColor: colors.success }]}
                >
                  <Text style={[styles.typeBtnText, !isExpense && styles.typeBtnTextActive]}>Ingreso</Text>
                </TouchableOpacity>
              </View>

              {/* Description */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Descripción</Text>
                <TextInput
                  style={[styles.input, errors.description ? styles.inputError : {}]}
                  placeholder="Ej: Almuerzo en el trabajo"
                  placeholderTextColor={colors.text3}
                  value={description}
                  onChangeText={setDescription}
                />
                {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}
              </View>

              {/* Amount */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Monto</Text>
                <TextInput
                  style={[styles.input, errors.amount ? styles.inputError : {}]}
                  placeholder="0"
                  placeholderTextColor={colors.text3}
                  value={amountText}
                  onChangeText={setAmountText}
                  keyboardType="decimal-pad"
                />
                {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
              </View>

              {/* Category */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipsWrap}>
                    {categories.map((cat) => {
                      const active = category === cat.value;
                      return (
                        <TouchableOpacity
                          key={cat.value}
                          onPress={() => setCategory(cat.value)}
                          style={[styles.chip, active && styles.chipActive]}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              {/* Channel */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Canal</Text>
                <View style={styles.chipsWrap}>
                  {CHANNELS.map((ch) => {
                    const active = channel === ch.value;
                    return (
                      <TouchableOpacity
                        key={ch.value}
                        onPress={() => setChannel(ch.value)}
                        style={[styles.chip, active && styles.chipActiveLight]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActiveLight]}>{ch.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Note */}
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Nota (opcional)</Text>
                <TextInput
                  style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
                  placeholder="Detalles adicionales..."
                  placeholderTextColor={colors.text3}
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Submit */}
              <View style={{ paddingBottom: 32, marginTop: 4 }}>
                <Button
                  variant={isExpense ? 'danger' : 'primary'}
                  fullWidth
                  onPress={handleSubmit}
                  loading={isLoading}
                >
                  {initialData ? 'Guardar cambios' : 'Registrar movimiento'}
                </Button>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
