import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../types';
import { AppCard } from '../../components/atoms/AppCard';
import { securityService } from '../../services/SecurityService';
import { Colors, Typography } from '../../constants';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>;

const ROWS = [
  { icon: '⛪', label: 'Ministries',       sub: 'Manage ministry classes',         screen: 'Ministries'   as const },
  { icon: '🔒', label: 'Security',          sub: 'PIN, biometrics & auto-lock',     screen: 'Security'     as const },
  { icon: '💾', label: 'Backup & Restore',  sub: 'Export or import your database',  screen: 'Backup'       as const },
  { icon: 'ℹ️', label: 'About',             sub: 'Version info & tech stack',        screen: 'About'        as const },
];

export function SettingsHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [teacherName, setTeacherName] = useState('Teacher');

  useEffect(() => {
    if (isFocused) {
      securityService.getTeacherName().then(setTeacherName);
    }
  }, [isFocused]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.bg }}
      contentContainerStyle={{ paddingBottom: 40 }}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* PROFILE CARD */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <AppCard elevated>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(teacherName[0] ?? 'T').toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{teacherName}</Text>
              <Text style={styles.profileRole}>Teacher</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Security')}>
              <Text style={styles.editBtn}>Edit ›</Text>
            </TouchableOpacity>
          </View>
        </AppCard>
      </View>

      {/* SETTINGS LIST */}
      <View style={{ paddingHorizontal: 16 }}>
        <AppCard padding={0}>
          {ROWS.map((row, i) => (
            <TouchableOpacity key={row.screen}
              style={[styles.row, i < ROWS.length - 1 && styles.rowDivider]}
              onPress={() => navigation.navigate(row.screen)}
              activeOpacity={0.7}>
              <Text style={styles.rowIcon}>{row.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowSub}>{row.sub}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </AppCard>
      </View>

      {/* APP VERSION */}
      <Text style={styles.version}>Kid's Ministry Attendance · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.dark },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: Colors.primary },
  profileName: { fontSize: Typography.lg, fontWeight: Typography.semiBold, color: Colors.dark },
  profileRole: { fontSize: Typography.sm, color: Colors.light, marginTop: 2 },
  editBtn: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.semiBold },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon: { fontSize: 24 },
  rowLabel: { fontSize: Typography.md, fontWeight: Typography.medium, color: Colors.dark },
  rowSub: { fontSize: Typography.xs, color: Colors.light, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.light },
  version: { textAlign: 'center', fontSize: Typography.xs, color: Colors.light, marginTop: 24 },
});
