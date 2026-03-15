import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Radius } from '../../constants';

interface PINInputProps {
  onComplete: (pin: string) => void;
  error?: boolean;
  disabled?: boolean;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export function PINInput({ onComplete, error, disabled }: PINInputProps) {
  const [pin, setPin] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start(() => setPin(''));
    }
  }, [error]);

  const handleKey = (key: string) => {
    if (disabled) return;
    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!key || pin.length >= 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = pin + key;
    setPin(next);
    if (next.length === 4) onComplete(next);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
        ))}
      </Animated.View>
      {KEYS.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((key, ki) => (
            <TouchableOpacity key={ki} style={[styles.key, !key && styles.keyInvisible]}
              onPress={() => handleKey(key)} activeOpacity={0.7} disabled={!key || disabled}>
              <Text style={[styles.keyText, key === '⌫' && styles.backspace]}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 24 },
  dots: { flexDirection: 'row', gap: 20, marginBottom: 8 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  dotFilled: { backgroundColor: Colors.white, borderColor: Colors.white },
  row: { flexDirection: 'row', gap: 20 },
  key: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  keyInvisible: { backgroundColor: 'transparent' },
  keyText: { color: Colors.white, fontSize: Typography.xxl, fontWeight: Typography.medium },
  backspace: { fontSize: Typography.lg },
});
