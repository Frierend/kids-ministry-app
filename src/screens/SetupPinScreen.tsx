import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { PINInput } from '../components/organisms/PINInput';
import { securityService } from '../services/SecurityService';
import { Colors, Typography } from '../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Setup'>;

export function SetupPinScreen({ navigation }: Props) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState(false);

  const handleFirst = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
  };

  const handleConfirm = async (pin: string) => {
    if (pin !== firstPin) {
      setError(true);
      setTimeout(() => { setError(false); setStep('enter'); setFirstPin(''); }, 800);
      return;
    }
    await securityService.setupPin(pin);
    navigation.replace('Main');
  };

  return (
    <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.container}>
      <Text style={styles.logoIcon}>⛪</Text>
      <Text style={styles.title}>{step === 'enter' ? 'Set a 4-digit PIN' : 'Confirm your PIN'}</Text>
      <Text style={styles.subtitle}>
        {step === 'enter' ? 'This PIN protects access to the app' : 'Enter the same PIN again'}
      </Text>
      <PINInput onComplete={step === 'enter' ? handleFirst : handleConfirm} error={error} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  logoIcon: { fontSize: 56 },
  title: { fontSize: Typography.xxl, fontWeight: Typography.bold, color: Colors.white },
  subtitle: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingHorizontal: 40 },
});
