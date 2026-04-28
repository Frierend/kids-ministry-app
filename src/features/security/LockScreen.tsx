import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation.types';
import { PINInput } from '../../components/forms/PINInput';
import { securityService } from '../../services/SecurityService';
import { Colors, Typography } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Lock'>;

const LOCKOUT_TRIGGER_ATTEMPTS = 3;

export function LockScreen({ navigation }: Props) {
  const [error, setError] = useState(false);
  const [lockoutExpiry, setLockoutExpiry] = useState<number | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    (async () => {
      const [avail, enabled] = await Promise.all([
        securityService.isBiometricAvailable(),
        securityService.isBiometricEnabled(),
      ]);
      setBiometricAvailable(avail);
      setBiometricEnabled(enabled);
      const exp = await securityService.getLockoutExpiry();
      setLockoutExpiry(exp);
      if (avail && enabled) tryBiometric();
    })();
  }, []);

  useEffect(() => {
    if (!lockoutExpiry) { setCountdown(0); return; }
    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutExpiry - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) {
        setLockoutExpiry(null);
        setStatusMessage('');
        clearInterval(tick);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [lockoutExpiry]);

  const tryBiometric = async () => {
    const result = await securityService.biometricAuth();
    if (result.success) navigation.replace('Main');
  };

  const handlePIN = async (pin: string) => {
    const valid = await securityService.verifyPin(pin);
    if (valid) {
      navigation.replace('Main');
    } else {
      setError(true);
      const fc = await securityService.getFailCount();
      const exp = await securityService.getLockoutExpiry();
      setLockoutExpiry(exp);
      if (exp) {
        setStatusMessage('Too many incorrect PIN attempts. Please wait before trying again.');
      } else {
        const remainingAttempts = Math.max(0, LOCKOUT_TRIGGER_ATTEMPTS - fc);
        setStatusMessage(
          remainingAttempts > 0
            ? `Incorrect PIN. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} before cooldown.`
            : 'Incorrect PIN. Try again.'
        );
      }
      setTimeout(() => setError(false), 800);
    }
  };

  return (
    <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoIcon}>â›ª</Text>
        <Text style={styles.appName}>{"Kid's Ministry"}</Text>
        <Text style={styles.subtitle}>Attendance System</Text>
      </View>

      {countdown > 0 ? (
        <View style={styles.lockoutBox}>
          <Text style={styles.lockoutText}>
            Too many incorrect PIN attempts. Try again in {countdown}s.
          </Text>
        </View>
      ) : (
        <>
          <PINInput onComplete={handlePIN} error={error} />
          {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
        </>
      )}

      {biometricAvailable && biometricEnabled && countdown === 0 && (
        <TouchableOpacity style={styles.biometricBtn} onPress={tryBiometric}>
          <Text style={styles.biometricIcon}>ðŸ‘†</Text>
          <Text style={styles.biometricLabel}>Use Fingerprint / Face ID</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 40 },
  logo: { alignItems: 'center' },
  logoIcon: { fontSize: 64, marginBottom: 12 },
  appName: { fontSize: 32, fontWeight: Typography.extraBold, color: Colors.white },
  subtitle: { fontSize: Typography.md, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  lockoutBox: { padding: 16, backgroundColor: 'rgba(255,165,0,0.2)', borderRadius: 12 },
  lockoutText: { color: Colors.white, fontSize: Typography.md, textAlign: 'center' },
  statusText: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sm, textAlign: 'center', marginTop: -20 },
  biometricBtn: { alignItems: 'center', gap: 8, marginTop: 8 },
  biometricIcon: { fontSize: 36 },
  biometricLabel: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sm },
});
