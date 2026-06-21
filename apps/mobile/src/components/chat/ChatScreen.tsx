import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  ScrollView,
  Animated,
  Keyboard,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useChat } from '@/hooks/useAI';
import { useTheme } from '@/hooks/useTheme';
import type { AppColors } from '@/lib/theme';
import type { ChatMessage } from '@/types';

interface ChatScreenProps {
  visible: boolean;
  onClose: () => void;
  initialMessage?: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    overlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet:           { height: '92%' as any, backgroundColor: c.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
    handle:          { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
    handleBar:       { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border },

    // Header
    header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    headerLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarLarge:     { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    headerTitle:     { fontSize: 16, fontWeight: '700', color: c.text },
    headerOnline:    { fontSize: 12, color: '#22C55E', fontWeight: '500', marginTop: 1 },
    closeBtn:        { width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface2, alignItems: 'center', justifyContent: 'center' },

    // Bot message row: avatar + bubble
    botRow:          { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14, maxWidth: '88%' },
    avatarSmall:     { width: 28, height: 28, borderRadius: 14, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0 },
    botBubble:       { backgroundColor: c.surface, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 18, borderBottomLeftRadius: 4, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2, flexShrink: 1 },
    botText:         { fontSize: 14, lineHeight: 21, color: c.text },

    // User bubble
    userBubbleWrap:  { alignSelf: 'flex-end', maxWidth: '78%', marginBottom: 14 },
    userBubble:      { backgroundColor: c.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 18, borderBottomRightRadius: 4 },
    userText:        { fontSize: 14, lineHeight: 21, color: '#FFFFFF' },

    timestamp:       { fontSize: 10, color: c.text3, marginTop: 4, marginLeft: 36 },
    userTimestamp:   { fontSize: 10, color: c.text3, marginTop: 4, alignSelf: 'flex-end' },

    // Typing
    typingRow:       { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
    typingBubble:    { backgroundColor: c.surface, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18, borderBottomLeftRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 5, shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
    dot:             { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.text3 },

    // Empty
    emptyWrap:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    emptyIcon:       { width: 72, height: 72, borderRadius: 36, backgroundColor: c.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle:      { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 6 },
    emptyDesc:       { fontSize: 13, color: c.text2, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },

    // Suggestions
    suggestionsRow:  { paddingHorizontal: 16, paddingBottom: 10 },
    chip:            { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: c.surface, borderRadius: 20, borderWidth: 1, borderColor: c.border, marginRight: 8, shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    chipText:        { color: c.text, fontSize: 13, fontWeight: '500' },

    // Attachment preview
    attachment:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 6, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: c.primaryLight, borderRadius: 12 },
    attachText:      { color: c.primary, fontSize: 12, flex: 1 },

    // Input bar
    inputBar:        { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: c.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    inputPill:       { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: c.bg, borderRadius: 24, paddingLeft: 16, paddingRight: 6, paddingVertical: 8, minHeight: 44 },
    textInput:       { flex: 1, fontSize: 14, color: c.text, maxHeight: 100, paddingVertical: 2, lineHeight: 20 },
    micBtn:          { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
    sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', shadowColor: c.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6, marginBottom: 0 },
    sendBtnDisabled: { backgroundColor: c.border, shadowOpacity: 0 },
  });
}

// ─── Bot Avatar ───────────────────────────────────────────────────────────────

function BotAvatar({ size, styles }: { size: 'small' | 'large'; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={size === 'large' ? styles.avatarLarge : styles.avatarSmall}>
      <Text style={{ fontSize: size === 'large' ? 22 : 14 }}>🤖</Text>
    </View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, styles }: { message: ChatMessage; styles: ReturnType<typeof makeStyles> }) {
  const isUser = message.role === 'user';
  const timeStr = message.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  if (isUser) {
    return (
      <View>
        <View style={styles.userBubbleWrap}>
          <View style={styles.userBubble}>
            <Text style={styles.userText}>{message.content}</Text>
          </View>
        </View>
        <Text style={styles.userTimestamp}>{timeStr}</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.botRow}>
        <BotAvatar size="small" styles={styles} />
        <View style={styles.botBubble}>
          <Text style={styles.botText}>{message.content}</Text>
        </View>
      </View>
      <Text style={styles.timestamp}>{timeStr}</Text>
    </View>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      ).start();
    animate(dot1, 0);
    animate(dot2, 200);
    animate(dot3, 400);
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingRow}>
      <BotAvatar size="small" styles={styles} />
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
        ))}
      </View>
    </View>
  );
}

// ─── Main Chat Screen ─────────────────────────────────────────────────────────

export function ChatScreen({ visible, onClose, initialMessage }: ChatScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<{ uri: string; base64: string; mime: string } | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const slideAnim = useRef(new Animated.Value(900)).current;
  const { messages, isLoading, suggestions, sendMessage, clearChat } = useChat();

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 280, useNativeDriver: false }).start();
      if (initialMessage) setInputText(initialMessage);
    } else {
      Keyboard.dismiss();
      Animated.timing(slideAnim, { toValue: 900, duration: 280, useNativeDriver: false }).start();
    }
  }, [visible, slideAnim, initialMessage]);

  // Single source of truth for keyboard insets — avoid stacking this with
  // KeyboardAvoidingView, which on Android double-shifts content inside a Modal.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates?.height ?? 0));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if ((!text && !pendingImage) || isLoading) return;
    setInputText('');
    const img = pendingImage;
    setPendingImage(null);
    await sendMessage(text || 'Analizá esta imagen', img?.base64, img?.mime);
  }, [inputText, pendingImage, isLoading, sendMessage]);

  const handlePickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingImage({ uri: asset.uri, base64: asset.base64 ?? '', mime: asset.mimeType ?? 'image/jpeg' });
      setInputText('');
    }
  }, []);

  const handleCameraCapture = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara.'); return; }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7, allowsEditing: false });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setPendingImage({ uri: asset.uri, base64: asset.base64 ?? '', mime: asset.mimeType ?? 'image/jpeg' });
      setInputText('');
    }
  }, []);

  const handleMicPress = useCallback(() => {
    Alert.alert('Adjuntar imagen', 'Elegí una opción', [
      { text: 'Galería', onPress: handlePickImage },
      { text: 'Cámara', onPress: handleCameraCapture },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }, [handlePickImage, handleCameraCapture]);

  const canSend = (inputText.trim().length > 0 || !!pendingImage) && !isLoading;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: keyboardHeight }]}>

          {/* Handle */}
          <View style={styles.handle}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <BotAvatar size="large" styles={styles} />
              <View>
                <Text style={styles.headerTitle}>Asistente IA</Text>
                <Text style={styles.headerOnline}>● En línea</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={colors.text2} />
            </TouchableOpacity>
          </View>

          {/* Messages + input */}
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <MessageBubble message={item} styles={styles} />}
              contentContainerStyle={{ padding: 16, paddingBottom: 8, flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIcon}>
                    <Text style={{ fontSize: 34 }}>🤖</Text>
                  </View>
                  <Text style={styles.emptyTitle}>¡Hola! Soy tu asistente</Text>
                  <Text style={styles.emptyDesc}>
                    Registrá gastos, consultá tu balance, creá metas o mandame la foto de un ticket.
                  </Text>
                </View>
              }
            />

            {isLoading ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
                <TypingIndicator styles={styles} />
              </View>
            ) : null}

            {/* Suggestion chips */}
            {messages.length === 0 && !isLoading ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.suggestionsRow}
                contentContainerStyle={{ paddingBottom: 4 }}
              >
                {suggestions.map((s) => (
                  <TouchableOpacity key={s} onPress={() => sendMessage(s)} style={styles.chip}>
                    <Text style={styles.chipText} numberOfLines={1}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : null}

            {/* Image pending */}
            {pendingImage ? (
              <View style={styles.attachment}>
                <Ionicons name="image-outline" size={16} color={colors.primary} />
                <Text style={styles.attachText} numberOfLines={1}>Imagen adjunta</Text>
                <TouchableOpacity onPress={() => setPendingImage(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Input bar */}
            <View style={[styles.inputBar, { paddingBottom: keyboardHeight > 0 ? 10 : insets.bottom + 10 }]}>
              <View style={styles.inputPill}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Escribí un gasto o preguntá algo..."
                  placeholderTextColor={colors.text3}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity onPress={handleMicPress} style={styles.micBtn}>
                  <Ionicons name="mic-outline" size={20} color={colors.text3} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleSend}
                disabled={!canSend}
                style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              >
                <Ionicons name="send" size={17} color="white" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>

          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
