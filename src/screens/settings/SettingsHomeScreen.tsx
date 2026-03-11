// src/screens/settings/SettingsHomeScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Pressable, Alert } from 'react-native';
import { ScreenWrapper, StackHeader } from '../../components/navigation/ScreenWrapper';
import { GlassCard } from '../../components/atomic/GlassCard';
import { Divider, SectionHeader } from '../../components/atomic';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { securityService } from '../../services/SecurityService';
import type { SettingsStackParamList } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;
}

export default function SettingsHomeScreen({ navigation }: Props) {
  const [teacherName, setTeacherName] = useState('Teacher');

  useEffect(() => {
    securityService.getTeacherName().then(setTeacherName);
  }, []);

  return (
    <ScreenWrapper>
      <StackHeader title="Settings" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Profile */}
        <SectionHeader title="PROFILE" />
        <GlassCard style={styles.card}>
          <SettingsRow
            icon="👤"
            label="Teacher Name"
            value={teacherName}
            onPress={() => navigation.navigate('SecuritySettings')}
          />
        </GlassCard>

        {/* Ministries */}
        <SectionHeader title="CONTENT" />
        <GlassCard style={styles.card}>
          <SettingsRow
            icon="⛪"
            label="Ministries"
            onPress={() => navigation.navigate('Ministries')}
            showChevron
          />
        </GlassCard>

        {/* Security */}
        <SectionHeader title="SECURITY" />
        <GlassCard style={styles.card}>
          <SettingsRow
            icon="🔒"
            label="PIN & Biometrics"
            onPress={() => navigation.navigate('SecuritySettings')}
            showChevron
          />
          <Divider />
          <SettingsRow
            icon="⏱"
            label="Auto-Lock"
            onPress={() => navigation.navigate('SecuritySettings')}
            showChevron
          />
        </GlassCard>

        {/* Data */}
        <SectionHeader title="DATA" />
        <GlassCard style={styles.card}>
          <SettingsRow
            icon="💾"
            label="Backup & Restore"
            onPress={() => navigation.navigate('BackupRestore')}
            showChevron
          />
        </GlassCard>

        {/* About */}
        <SectionHeader title="ABOUT" />
        <GlassCard style={styles.card}>
          <SettingsRow icon="ℹ️" label="Version" value="1.0.0" />
          <Divider />
          <SettingsRow icon="📖" label="About" onPress={() => navigation.navigate('About')} showChevron />
        </GlassCard>

        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function SettingsRow({ icon, label, value, onPress, showChevron }: {
  icon: string; label: string; value?: string;
  onPress?: () => void; showChevron?: boolean;
}) {
  const inner = (
    <View style={styles.settingsRow}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <Text style={[Typography.bodyMedium, { color: Colors.textPrimary, flex: 1 }]}>{label}</Text>
      {value && <Text style={[Typography.body, { color: Colors.textSecondary }]}>{value}</Text>}
      {showChevron && <Text style={{ color: Colors.textTertiary, fontSize: 18 }}>›</Text>}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  card: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm, padding: 0, overflow: 'hidden' },
  settingsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    gap: Spacing.sm, minHeight: 52,
  },
  settingsIcon: { fontSize: 20, width: 28, textAlign: 'center' },
});
