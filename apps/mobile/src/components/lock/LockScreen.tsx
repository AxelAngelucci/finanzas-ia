import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Vibration,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '@/hooks/useAuth';

const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;
const { width: SW, height: SH } = Dimensions.get('window');

export function LockScreen() {
  const { unlock, user } = useAuth();
  const [pin, setPin] = useState('');
  const [correctPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeStr, setTimeStr] = useState('');

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${h}:${m}`);
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    LocalAuthentication.hasHardwareAsync().then((hasHardware) => {
      if (!hasHardware) return;
      LocalAuthentication.isEnrolledAsync().then((isEnrolled) => {
        setBiometricAvailable(isEnrolled);
      });
    });
  }, []);

  useEffect(() => {
    if (biometricAvailable) triggerBiometric();
  }, [biometricAvailable]);

  useEffect(() => {
    if (!lockoutEnd) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutEnd(null);
        setAttempts(0);
        setSecondsLeft(0);
        setErrorMessage('');
        clearInterval(interval);
      } else {
        setSecondsLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEnd]);

  const triggerBiometric = useCallback(async () => {
    if (lockoutEnd) return;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verificá tu identidad para continuar',
        cancelLabel: 'Usar PIN',
        fallbackLabel: 'Usar PIN',
        disableDeviceFallback: false,
      });
      if (result.success) unlock();
    } catch {
      // Fallback to PIN
    }
  }, [lockoutEnd, unlock]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (lockoutEnd) return;
      if (pin.length >= PIN_LENGTH) return;
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMessage('');
      if (newPin.length === PIN_LENGTH) {
        if (correctPin && newPin !== correctPin) {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setPin('');
          if (newAttempts >= MAX_ATTEMPTS) {
            setLockoutEnd(Date.now() + LOCKOUT_SECONDS * 1000);
            setSecondsLeft(LOCKOUT_SECONDS);
            setErrorMessage(`Demasiados intentos. Esperá ${LOCKOUT_SECONDS}s.`);
          } else {
            setErrorMessage(`PIN incorrecto. ${MAX_ATTEMPTS - newAttempts} intentos restantes.`);
          }
          shakeX.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(-8, { duration: 50 }),
            withTiming(8, { duration: 50 }),
            withTiming(0, { duration: 50 }),
          );
          Vibration.vibrate(200);
        } else {
          setTimeout(() => { unlock(); setPin(''); }, 100);
        }
      }
    },
    [pin, attempts, lockoutEnd, correctPin, unlock, shakeX],
  );

  const handleDelete = useCallback(() => {
    setPin((p) => p.slice(0, -1));
    setErrorMessage('');
  }, []);

  const isLocked = !!lockoutEnd;
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <LinearGradient
      colors={['#0c0c24', '#1a0a3c', '#0d1b3e']}
      locations={[0, 0.45, 1]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.container}
    >
      {/* Blur orbs */}
      <View style={[styles.orb, { top: SH * 0.08, left: -SW * 0.2, width: SW * 0.7, height: SW * 0.7, backgroundColor: 'rgba(99,102,241,0.12)' }]} />
      <View style={[styles.orb, { bottom: SH * 0.15, right: -SW * 0.15, width: SW * 0.55, height: SW * 0.55, backgroundColor: 'rgba(139,92,246,0.1)' }]} />

      {/* Time */}
      <Text style={styles.time}>{timeStr || '00:00'}</Text>

      {/* Greeting */}
      <Text style={styles.greeting}>
        {firstName ? `Hola, ${firstName}` : 'Finanzas IA'}
      </Text>

      {/* App icon */}
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.appIcon}
      >
        <Ionicons name="wallet" size={38} color="white" />
      </LinearGradient>

      {/* PIN dots */}
      <Animated.View style={[styles.dotsRow, shakeStyle]}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length ? styles.dotFilled : styles.dotEmpty,
            ]}
          />
        ))}
      </Animated.View>

      {/* Error */}
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : isLocked ? (
        <Text style={styles.errorText}>Bloqueado por {secondsLeft} segundos</Text>
      ) : null}

      {/* Keypad */}
      <View style={styles.keypad}>
        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['bio', '0', 'del']].map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key) => {
              if (key === 'bio') {
                return (
                  <TouchableOpacity
                    key="bio"
                    onPress={triggerBiometric}
                    disabled={isLocked || !biometricAvailable}
                    style={styles.keyBio}
                  >
                    {biometricAvailable ? (
                      <View style={styles.fingerprintCircle}>
                        <Ionicons name="finger-print-outline" size={26} color="rgba(255,255,255,0.85)" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              }
              if (key === 'del') {
                return (
                  <TouchableOpacity
                    key="del"
                    onPress={handleDelete}
                    disabled={isLocked}
                    style={styles.keyBio}
                  >
                    <Ionicons name="backspace-outline" size={22} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleDigit(key)}
                  disabled={isLocked}
                  style={styles.keyBtn}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  time: {
    fontSize: 84,
    fontWeight: '100',
    color: 'white',
    letterSpacing: -4,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 32,
    fontWeight: '400',
  },
  appIcon: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
  },
  dotFilled: {
    backgroundColor: 'white',
  },
  dotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  errorText: {
    color: '#F87171',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  keypad: {
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 16,
    gap: 10,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  keyBtn: {
    flex: 1,
    height: 66,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  keyText: {
    color: 'white',
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 1,
  },
  keyBio: {
    flex: 1,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerprintCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
