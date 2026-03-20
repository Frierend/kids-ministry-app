import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../types';
import { AppCard } from '../../components/atoms/AppCard';
import { Colors, Typography } from '../../constants';

type Props = NativeStackScreenProps<SettingsStackParamList, 'About'>;

function TechRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.techRow}>
      <Text style={styles.techLabel}>{label}</Text>
      <Text style={styles.techValue}>{value}</Text>
    </View>
  );
}

function FeatureRow({ text }: { text: string }) {
  return <Text style={styles.feature}>{text}</Text>;
}

export function AboutScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>About</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <LinearGradient colors={['#1E3A8A', '#3B82F6']} style={styles.hero}>
          <Text style={styles.heroIcon}>{'church'}</Text>
          <Text style={styles.appName}>{"Kid's Ministry"}</Text>
          <Text style={styles.appSubtitle}>Attendance System</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v1.0.0</Text>
          </View>
        </LinearGradient>

        <View style={{ padding: 16, gap: 16 }}>
          <AppCard>
            <Text style={styles.sectionTitle}>About This App</Text>
            <Text style={styles.description}>
              {"A fully offline-first attendance and points tracking system for church ministries. No internet required."}
            </Text>
          </AppCard>

          <AppCard>
            <Text style={styles.sectionTitle}>Built With</Text>
            <TechRow label="React Native" value="0.76" />
            <TechRow label="Expo SDK" value="54" />
            <TechRow label="SQLite" value="expo-sqlite v15" />
            <TechRow label="SecureStore" value="expo-secure-store" />
            <TechRow label="TypeScript" value="5.3" />
          </AppCard>

          <AppCard>
            <Text style={styles.sectionTitle}>Features</Text>
            <FeatureRow text="100% offline - no server required" />
            <FeatureRow text="Secure PIN + biometric authentication" />
            <FeatureRow text="Points ledger with full audit trail" />
            <FeatureRow text="Multi-ministry support" />
            <FeatureRow text="Market Day redemption system" />
            <FeatureRow text="Database backup and restore" />
          </AppCard>

          <Text style={styles.footer}>{"Kid's Ministry Attendance App 2026"}</Text>
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
  heroIcon: { fontSize: 40, marginBottom: 12 },
  appName: { fontSize: 28, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  appSubtitle: { fontSize: Typography.md, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },
  versionBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  versionText: { color: Colors.white, fontSize: Typography.sm, fontWeight: Typography.semiBold },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.dark, marginBottom: 12 },
  description: { fontSize: Typography.sm, color: Colors.mid, lineHeight: 22 },
  techRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  techLabel: { flex: 1, fontSize: Typography.sm, color: Colors.dark },
  techValue: { fontSize: Typography.sm, color: Colors.light },
  feature: { fontSize: Typography.sm, color: Colors.mid, paddingVertical: 5, lineHeight: 22 },
  footer: { textAlign: 'center', fontSize: Typography.xs, color: Colors.light, lineHeight: 20, marginTop: 8 },
});
