import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../types';
import { AppCard } from '../../components/atoms/AppCard';
import { Colors, Typography } from '../../constants';

type Props = NativeStackScreenProps<SettingsStackParamList, 'About'>;

const TECH_STACK = [
  { icon: '⚛️', label: 'React Native', value: '0.76' },
  { icon: '📱', label: 'Expo SDK',      value: '54' },
  { icon: '🗄️', label: 'SQLite',        value: 'expo-sqlite v15' },
  { icon: '🔐', label: 'SecureStore',   value: 'expo-secure-store' },
  { icon: '📝', label: 'TypeScript',    value: '5.3' },
];

export function AboutScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* HERO */}
        <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.hero}>
          <Text style={styles.heroIcon}>⛪</Text>
          <Text style={styles.appName}>Kid's Ministry</Text>
          <Text style={styles.appSubtitle}>Attendance System</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </LinearGradient>

        <View style={{ padding: 16, gap: 16 }}>
          {/* DESCRIPTION */}
          <AppCard>
            <Text style={styles.sectionTitle}>About This App</Text>
            <Text style={styles.description}>
              A fully offline-first attendance and points tracking system built for church children's ministries. Designed for speed, simplicity, and reliability — no internet connection required.
            </Text>
          </AppCard>

          {/* TECH STACK */}
          <AppCard>
            <Text style={styles.sectionTitle}>🛠 Built With</Text>
            {TECH_STACK.map((item) => (
              <View key={item.label} style={styles.techRow}>
                <Text style={styles.techIcon}>{item.icon}</Text>
                <Text style={styles.techLabel}>{item.label}</Text>
                <Text style={styles.techValue}>{item.value}</Text>
              </View>
            ))}
          </AppCard>

          {/* FEATURES */}
          <AppCard>
            <Text style={styles.sectionTitle}>✨ Features</Text>
            {[
              '100% offline — no server required',
              'Secure PIN + biometric authentication',
              'Points ledger with full audit trail',
              'Multi-ministry support',
              'Market Day redemption system',
              'Database backup and restore',
            ].map((f, i) => (
              <Text key={i} style={styles.feature}>✓  {f}</Text>
            ))}
          </AppCard>

          <Text style={styles.footer}>
            Kid's Ministry Attendance App © 2026{'
'}
            Built with ❤️ for church teachers
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back: { fontSize: 28, color: Colors.primary, fontWeight: '700', marginRight: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: Typography.lg, fontWeight: Typography.semiBold, color: Colors.dark },
  hero: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  heroIcon: { fontSize: 64, marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  appSubtitle: { fontSize: Typography.md, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },
  versionBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  versionText: { color: Colors.white, fontSize: Typography.sm, fontWeight: Typography.semiBold },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.dark, marginBottom: 12 },
  description: { fontSize: Typography.sm, color: Colors.mid, lineHeight: 22 },
  techRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  techIcon: { fontSize: 18 },
  techLabel: { flex: 1, fontSize: Typography.sm, color: Colors.dark },
  techValue: { fontSize: Typography.sm, color: Colors.light },
  feature: { fontSize: Typography.sm, color: Colors.mid, paddingVertical: 5, lineHeight: 22 },
  footer: { textAlign: 'center', fontSize: Typography.xs, color: Colors.light, lineHeight: 20, marginTop: 8 },
});
