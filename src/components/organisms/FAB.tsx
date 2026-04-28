import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Layout, Shadows } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FABProps {
  onPress: () => void;
  icon?: string;
}

export function FAB({ onPress, icon = '+' }: FABProps) {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + Layout.tabBarHeight + 16 }]}
      onPress={onPress} activeOpacity={0.8}>
      <LinearGradient colors={Colors.gradientBlue as [string, string]} style={styles.gradient}>
        <Text style={styles.icon}>{icon}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: { position: 'absolute', right: 20, ...Shadows.lg },
  gradient: { width: Layout.fabSize, height: Layout.fabSize, borderRadius: Layout.fabSize / 2, alignItems: 'center', justifyContent: 'center' },
  icon: { color: Colors.white, fontSize: 28, fontWeight: '300', lineHeight: 32 },
});
