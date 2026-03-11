// src/screens/auth/LockScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Alert, Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { securityService } from '../../services/SecurityService';
import { Colors, Typography, Spacing, Radius } from '../../theme';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30; // seconds

interface LockScreenProps {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: LockScreenProps) {
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    checkSetup();
  }, []);

  useEffect(() => {
    if (lockedUntil) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockedUntil(null);
          setCountdown(0);
          setAttempts(0);
          clearInterval(interval);
        } else {
          setCountdown(remaining);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockedUntil]);

  const checkSetup = async () => {
    const pinSet = await securityService.isPinSet();
    if (!pinSet) {
      setIsFirstLaunch(true);
      return;
    }
    const bioAvailable = await securityService.isBiometricsAvailable();
    const bioEnabled = await securityService.isBiometricsEnabled();
    setBiometricsAvailable(bioAvailable);
    setBiometricsEnabled(bioEnabled);
    if (bioAvailable && bioEnabled) {
      tryBiometrics();
    }
  };

  const tryBiometrics = async () => {
    const success = await securityService.authenticateWithBiometrics();
    if (success) {
      await securityService.unlock();
      onUnlock();
    }
  };

  const handleDigit = useCallback(async (digit: string) => {
    if (lockedUntil) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === PIN_LENGTH) {
      if (isFirstLaunch) {
        // Set PIN on first launch
        await securityService.setPin(newPin);
        await securityService.unlock();
        onUnlock();
        return;
      }

      const valid = await securityService.verifyPin(newPin);
      if (valid) {
        setPin('');
        await securityService.unlock();
        onUnlock();
      } else {
        Vibration.vibrate(200);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setPin('');
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_DURATION * 1000);
          setError(`Too many attempts. Wait ${LOCKOUT_DURATION}s.`);
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} tries left.`);
        }
      }
    }
  }, [pin, attempts, lockedUntil, isFirstLaunch, onUnlock]);

  const handleDelete = () => {
    setPin(p => p.slice(0, -1));
    setError('');
  };

  const ROWS = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']];

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + Spacing.xl }]}
    >
      {/* App branding */}
      <View style={styles.brand}>
        <Text style={styles.appIcon}>⛪</Text>
        <Text style={[Typography.title1, { color: Colors.textPrimary }]}>Kids Ministry</Text>
        <Text style={[Typography.body, { color: Colors.textSecondary }]}>
          {isFirstLaunch ? 'Set your 4-digit PIN' : 'Enter PIN to continue'}
        </Text>
      </View>

      {/* PIN dots */}
      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, pin.length > i && styles.dotFilled]}
          />
        ))}
      </View>

      {/* Error / lockout */}
      {error ? (
        <Text style={styles.error}>
          {lockedUntil ? `🔒 Locked — ${countdown}s remaining` : error}
        </Text>
      ) : null}

      {/* Keypad */}
      <View style={styles.keypad}>
        {ROWS.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((digit, di) => (
              <Pressable
                key={di}
                onPress={() => digit === '⌫' ? handleDelete() : digit ? handleDigit(digit) : null}
                style={({ pressed }) => [
                  styles.key,
                  digit === '' && styles.keyEmpty,
                  { opacity: pressed ? 0.6 : 1 },
                ]}
                disabled={!!lockedUntil && digit !== ''}
              >
                <Text style={[
                  digit === '⌫' ? styles.keyDelete : styles.keyLabel,
                  lockedUntil ? { color: Colors.textTertiary } : {},
                ]}>
                  {digit}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      {/* Biometrics button */}
      {biometricsAvailable && biometricsEnabled && !isFirstLaunch && (
        <Pressable onPress={tryBiometrics} style={styles.bioBtn}>
          <Text style={{ fontSize: 28 }}>🔑</Text>
          <Text style={[Typography.captionMedium, { color: Colors.primary }]}>Use Biometrics</Text>
        </Pressable>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  brand: { alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.xxl },
  appIcon: { fontSize: 56, marginBottom: Spacing.sm },

  dots: {
    flexDirection: 'row', gap: Spacing.lg,
    marginVertical: Spacing.xl,
  },
  dot: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 2, borderColor: Colors.primary,
  },
  dotFilled: { backgroundColor: Colors.primary },

  error: {
    ...Typography.captionMedium, color: Colors.danger,
    textAlign: 'center', minHeight: 20,
  },

  keypad: { width: '80%', maxWidth: 300, gap: Spacing.sm },
  keyRow: { flexDirection: 'row', justifyContent: 'space-between' },
  key: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.cardBg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.cardBorder,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  keyEmpty: { backgroundColor: Colors.transparent, borderColor: Colors.transparent, elevation: 0 },
  keyLabel: { ...Typography.title1, color: Colors.textPrimary },
  keyDelete: { fontSize: 22, color: Colors.textSecondary },

  bioBtn: {
    alignItems: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },
});
