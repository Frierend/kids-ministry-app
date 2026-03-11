// src/screens/settings/MinistryAddScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { ScreenWrapper, StackHeader } from '../../components/navigation/ScreenWrapper';
import { GlassCard } from '../../components/atomic/GlassCard';
import { PrimaryButton } from '../../components/atomic';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useCreateMinistry } from '../../hooks/useData';
import type { SettingsStackParamList } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

const PRESET_COLORS = [
  '#3B7DD8', '#E83E8C', '#34C759', '#FF9500',
  '#AF52DE', '#FF3B30', '#5AC8FA', '#FFCC00',
];

interface Props {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'MinistryAdd'>;
}

export default function MinistryAddScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const createMutation = useCreateMinistry();

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Enter a ministry name.'); return; }
    try {
      await createMutation.mutateAsync({ name: name.trim(), color });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScreenWrapper>
      <StackHeader title="Add Ministry" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <GlassCard style={styles.form}>
          <Text style={[Typography.label, { color: Colors.textSecondary }]}>MINISTRY NAME</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Kingdom Kids, Teen Ministry…"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="words"
            style={[Typography.body, styles.input]}
          />

          <Text style={[Typography.label, { color: Colors.textSecondary, marginTop: Spacing.md }]}>COLOR</Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map(c => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.colorSwatch, { backgroundColor: c }, color === c && styles.colorSelected]}
              >
                {color === c && <Text style={styles.checkmark}>✓</Text>}
              </Pressable>
            ))}
          </View>

          <View style={styles.pointsInfo}>
            <Text style={[Typography.captionMedium, { color: Colors.textTertiary }]}>
              📌 Points: Saturday = 20 pts · Sunday = 50 pts (standard)
            </Text>
          </View>
        </GlassCard>

        <PrimaryButton
          label={createMutation.isPending ? 'Saving…' : 'Create Ministry'}
          onPress={handleSave}
          loading={createMutation.isPending}
          size="lg"
          style={{ marginTop: Spacing.md }}
        />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.md },
  form: { padding: Spacing.md, gap: Spacing.sm },
  input: {
    backgroundColor: Colors.inputBg, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.inputBorder,
    padding: Spacing.md, color: Colors.textPrimary,
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorSwatch: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  colorSelected: {
    borderWidth: 3, borderColor: Colors.white,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  checkmark: { color: Colors.white, fontSize: 18, fontWeight: '800' },
  pointsInfo: {
    backgroundColor: Colors.primary + '10',
    borderRadius: Radius.md, padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
