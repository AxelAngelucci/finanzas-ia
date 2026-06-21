import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  StyleSheet,
  Linking,
  AppState,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useSettingsStore } from '@/store/settings';
import { useTheme } from '@/hooks/useTheme';
import type { AppColors } from '@/lib/theme';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatARS, parseARSToCentavos } from '@/lib/format';

type AgentTone = 'amigable' | 'formal' | 'estricto';
type Theme     = 'light' | 'dark' | 'system';

const TONE_OPTIONS: { value: AgentTone; label: string; desc: string; emoji: string }[] = [
  { value: 'amigable', label: 'Amigable', desc: 'Cálido, usa emojis y celebra tus logros',         emoji: '😊' },
  { value: 'formal',   label: 'Formal',   desc: 'Directo y profesional, sin rodeos',               emoji: '🎩' },
  { value: 'estricto', label: 'Estricto', desc: 'Te alerta cuando te pasás del presupuesto',       emoji: '📊' },
];

const THEME_OPTIONS: { value: 'light' | 'dark'; label: string }[] = [
  { value: 'light', label: '☀️ Claro' },
  { value: 'dark',  label: '🌙 Oscuro' },
];

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    root:                    { flex: 1, backgroundColor: c.bg },
    title:                   { fontSize: 24, fontWeight: '700', color: c.text, marginBottom: 20 },
    sectionLabel:            { fontSize: 11, fontWeight: '700', color: c.text2, letterSpacing: 0.9, marginBottom: 10, marginTop: 20 },
    profileCard:             { backgroundColor: c.surface, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    avatar:                  { width: 56, height: 56, borderRadius: 18, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    avatarText:              { color: 'white', fontWeight: '700', fontSize: 22 },
    profileName:             { fontSize: 17, fontWeight: '700', color: c.text },
    profileEmail:            { fontSize: 13, color: c.text2, marginTop: 2 },
    personalityCard:         { backgroundColor: c.surface, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: 'transparent', shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    personalityCardActive:   { borderColor: c.primary },
    personalityEmoji:        { fontSize: 22 },
    personalityLabel:        { fontSize: 14, fontWeight: '600', color: c.text, marginBottom: 2 },
    personalityLabelActive:  { color: c.primary },
    personalityDesc:         { fontSize: 12, color: c.text2 },
    radio:                   { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
    radioActive:             { borderColor: c.primary },
    radioDot:                { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },
    surfaceCard:             { backgroundColor: c.surface, borderRadius: 20, overflow: 'hidden', shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
    row:                     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
    rowBorder:               { borderBottomWidth: 1, borderBottomColor: c.bg },
    rowIcon:                 { width: 36, height: 36, borderRadius: 11, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center' },
    rowLabel:                { fontSize: 14, fontWeight: '500', color: c.text, flex: 1 },
    rowSub:                  { fontSize: 11, color: c.text3, marginTop: 1 },
    radioEmpty:              { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: c.border },
    alertHeader:             { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    thresholdValue:          { fontSize: 15, fontWeight: '700', color: c.primary },
    thresholdRow:            { flexDirection: 'row', gap: 8 },
    thresholdBtn:            { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center', backgroundColor: c.bg, borderWidth: 1, borderColor: c.border },
    thresholdBtnActive:      { backgroundColor: c.primary, borderColor: c.primary },
    thresholdBtnText:        { fontSize: 12, fontWeight: '600', color: c.text2 },
    thresholdBtnTextActive:  { color: 'white' },
    incomeEdit:              { flexDirection: 'row', alignItems: 'center', gap: 8 },
    incomeInput:             { flex: 1, backgroundColor: c.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: c.text, borderWidth: 1, borderColor: c.border },
    incomeDisplay:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: c.border },
    incomeValue:             { fontSize: 14, color: c.text, fontWeight: '500' },
    version:                 { fontSize: 12, color: c.text3, textAlign: 'center', marginTop: 24 },
  });
}

export default function ConfiguracionScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user, logout, setUser, refreshProfile } = useAuth();
  const settings = useSettingsStore();

  // Linking WhatsApp happens outside the app — refetch when we come back
  // from the background so "Vinculado" reflects the real state.
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        refreshProfile();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [refreshProfile]);

  const [isLoggingOut,   setIsLoggingOut]   = useState(false);
  const [editingIncome,  setEditingIncome]   = useState(false);
  const [incomeText,     setIncomeText]      = useState(user?.income_monthly ? String(user.income_monthly / 100) : '');
  const [isSavingIncome, setIsSavingIncome]  = useState(false);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { setIsLoggingOut(true); await logout(); } },
    ]);
  };

  const handleSetTone = async (tone: AgentTone) => {
    await settings.setAgentTone(tone);
    try {
      const res = await api.put<{ ok: boolean; user: NonNullable<typeof user> }>('/users/me', { agent_tone: tone });
      if (res.user) setUser(res.user);
    } catch { await settings.setAgentTone(settings.agentTone); }
  };

  const handleSetTheme = async (theme: 'light' | 'dark') => { await settings.setTheme(theme); };

  const handleSaveIncome = async () => {
    setIsSavingIncome(true);
    try {
      const centavos = parseARSToCentavos(incomeText);
      const res = await api.put<{ ok: boolean; user: NonNullable<typeof user> }>('/users/me', { income_monthly: centavos });
      if (res.user) setUser(res.user);
      setEditingIncome(false);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el ingreso mensual.');
    } finally { setIsSavingIncome(false); }
  };

  const handleLinkWhatsApp = async () => {
    try {
      const res = await api.get<{ url: string }>('/users/me/qr-token');
      if (res.url) await Linking.openURL(res.url);
    } catch {
      Alert.alert('Error', 'No se pudo generar el código de vinculación. Intentá de nuevo.');
    }
  };

  const handleOpenTerms = () => Linking.openURL('https://finanzas-ia.app/terms');
  const handleOpenPrivacy = () => Linking.openURL('https://finanzas-ia.app/privacy');

  const handleUnlinkWhatsApp = () => {
    Alert.alert('Desvincular WhatsApp', '¿Estás seguro? Perderás la capacidad de registrar gastos por WhatsApp.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desvincular', style: 'destructive', onPress: async () => {
        try { await api.delete('/users/me/wa'); if (user) setUser({ ...user, wa_phone: null }); }
        catch { Alert.alert('Error', 'No se pudo desvincular WhatsApp.'); }
      }},
    ]);
  };

return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Configuración</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? '?'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.name ?? 'Usuario'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          </View>
        </View>

        {/* Agent personality */}
        <Text style={styles.sectionLabel}>PERSONALIDAD DEL ASISTENTE</Text>
        <View>
          {TONE_OPTIONS.map((opt, idx) => {
            const active = settings.agentTone === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => handleSetTone(opt.value)}
                activeOpacity={0.75}
                style={[styles.personalityCard, active && styles.personalityCardActive, idx > 0 && { marginTop: 10 }]}
              >
                <Text style={styles.personalityEmoji}>{opt.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.personalityLabel, active && styles.personalityLabelActive]}>{opt.label}</Text>
                  <Text style={styles.personalityDesc}>{opt.desc}</Text>
                </View>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active ? <View style={styles.radioDot} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Theme */}
        <Text style={styles.sectionLabel}>APARIENCIA</Text>
        <View style={[styles.surfaceCard, { padding: 16 }]}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text, marginBottom: 12 }}>Tema de color</Text>
          <View style={{ flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: 12, padding: 4 }}>
            {THEME_OPTIONS.map((opt) => {
              const active = settings.theme === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => handleSetTheme(opt.value)}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', backgroundColor: active ? colors.surface : 'transparent' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: active ? '600' : '400', color: active ? colors.text : colors.text2 }}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Budget alert threshold */}
        <Text style={styles.sectionLabel}>ALERTAS DE PRESUPUESTO</Text>
        <View style={[styles.surfaceCard, { padding: 16 }]}>
          <View style={styles.alertHeader}>
            <View style={[styles.rowIcon, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="notifications-outline" size={17} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Umbral de alerta</Text>
              <Text style={styles.rowSub}>Avisar cuando llegue al {settings.budgetAlertThreshold}%</Text>
            </View>
            <Text style={styles.thresholdValue}>{settings.budgetAlertThreshold}%</Text>
          </View>
          <View style={styles.thresholdRow}>
            {[60, 70, 80, 90].map((v) => {
              const active = settings.budgetAlertThreshold === v;
              return (
                <TouchableOpacity
                  key={v}
                  onPress={() => settings.setBudgetAlertThreshold(v)}
                  style={[styles.thresholdBtn, active && styles.thresholdBtnActive]}
                >
                  <Text style={[styles.thresholdBtnText, active && styles.thresholdBtnTextActive]}>{v}%</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Income */}
        <Text style={styles.sectionLabel}>DATOS FINANCIEROS</Text>
        <View style={[styles.surfaceCard, { padding: 16 }]}>
          <View style={[styles.alertHeader, { marginBottom: 12 }]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.successLight }]}>
              <Ionicons name="cash-outline" size={17} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Ingreso mensual</Text>
              <Text style={styles.rowSub}>Para calcular tu presupuesto diario</Text>
            </View>
          </View>
          {editingIncome ? (
            <View style={styles.incomeEdit}>
              <TextInput
                style={styles.incomeInput}
                placeholder="Ej: 500000"
                placeholderTextColor={colors.text3}
                value={incomeText}
                onChangeText={setIncomeText}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Button size="sm" onPress={handleSaveIncome} loading={isSavingIncome}>Guardar</Button>
              <Button size="sm" variant="ghost" onPress={() => { setEditingIncome(false); setIncomeText(user?.income_monthly ? String(user.income_monthly / 100) : ''); }}>
                Cancelar
              </Button>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingIncome(true)} style={styles.incomeDisplay}>
              <Text style={styles.incomeValue}>
                {user?.income_monthly ? formatARS(user.income_monthly) : 'No configurado'}
              </Text>
              <Ionicons name="pencil-outline" size={16} color={colors.text3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Integrations */}
        <Text style={styles.sectionLabel}>INTEGRACIONES</Text>
        <TouchableOpacity
          onPress={user?.wa_phone ? handleUnlinkWhatsApp : handleLinkWhatsApp}
          activeOpacity={0.8}
          style={[styles.surfaceCard, { padding: 16, borderWidth: 2, borderColor: '#25D366' }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>💬</Text>
            </View>
            <View>
              <Text style={{ fontWeight: '600', fontSize: 15, color: colors.text }}>WhatsApp</Text>
              {user?.wa_phone ? (
                <Text style={{ fontSize: 12, color: colors.success, fontWeight: '500' }}>● Conectado</Text>
              ) : (
                <Text style={{ fontSize: 12, color: colors.text3 }}>No vinculado</Text>
              )}
            </View>
          </View>
          <Text style={{ fontSize: 13, color: colors.text2, lineHeight: 20 }}>
            {user?.wa_phone
              ? `${user.wa_phone} vinculado. Los mensajes se procesan automáticamente vía IA.`
              : 'Vincular WhatsApp para registrar gastos con un mensaje o nota de voz.'}
          </Text>
        </TouchableOpacity>

        {/* Legal */}
        <Text style={styles.sectionLabel}>LEGAL</Text>
        <View style={styles.surfaceCard}>
          <TouchableOpacity onPress={handleOpenTerms} style={[styles.row, styles.rowBorder]}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="document-text-outline" size={17} color={colors.primary} />
            </View>
            <Text style={styles.rowLabel}>Términos y condiciones</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text3} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenPrivacy} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="shield-checkmark-outline" size={17} color={colors.primary} />
            </View>
            <Text style={styles.rowLabel}>Política de privacidad</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text3} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <Text style={styles.sectionLabel}>CUENTA</Text>
        <View style={styles.surfaceCard}>
          <TouchableOpacity onPress={handleLogout} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="log-out-outline" size={17} color={colors.danger} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.danger }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Finia v1.0.0</Text>
      </ScrollView>
    </View>
  );
}
