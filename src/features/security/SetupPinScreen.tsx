import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/navigation.types';
import { PINInput } from '../../components/forms/PINInput';
import { securityService } from './security.service';
import { Colors, Typography } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

export function SetupPinScreen({ navigation }: Props) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  // pinKey forces PINInput to fully remount and clear dots
  const [pinKey, setPinKey] = useState(0);

  const resetToEnter = () => {
    setStep('enter');
    setFirstPin('');
    setError(false);
    setErrorMsg('');
    setPinKey((k) => k + 1);
  };

  const handleFirst = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
    setPinKey((k) => k + 1); // remount PINInput with empty dots
  };

  const handleConfirm = async (pin: string) => {
    if (pin !== firstPin) {
      setError(true);
      setErrorMsg("PINs don't match. Try again.");
      setTimeout(() => {
        resetToEnter();
      }, 900);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      await securityService.setupPin(pin);
      await securityService.recordActivity();
      navigation.replace('Main');
    } catch (e: any) {
      setLoading(false);
      setError(true);
      setErrorMsg(e?.message ?? 'Setup failed. Try again.');
      setTimeout(() => {
        resetToEnter();
      }, 1200);
    }
  };

  return (
    <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.container}>
      <Text style={styles.logoIcon}>⛪</Text>

      <Text style={styles.title}>
        {step === 'enter' ? 'Set a 4-digit PIN' : 'Confirm your PIN'}
      </Text>

      <Text style={styles.subtitle}>
        {step === 'enter'
          ? 'This PIN protects access to the app'
          : 'Enter the same PIN again'}
      </Text>

      {loading ? (
        <ActivityIndicator color={Colors.white} size="large" />
      ) : (
        <PINInput
          key={pinKey}
          onComplete={step === 'enter' ? handleFirst : handleConfirm}
          error={error}
        />
      )}

      {errorMsg.length > 0 && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {step === 'confirm' && !loading && (
        <Text style={styles.backLink} onPress={resetToEnter}>
          ← Start over
        </Text>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  logoIcon: { fontSize: 56 },
  title: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.white,
  },
  subtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.25)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: -8,
  },
  errorText: {
    color: Colors.white,
    fontSize: Typography.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
  backLink: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: Typography.sm,
    marginTop: -8,
    padding: 8,
  },
});
