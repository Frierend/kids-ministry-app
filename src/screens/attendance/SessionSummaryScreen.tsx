import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AttendanceStackParamList } from '../../types';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { attendanceService } from '../../services/AttendanceService';
import { Colors, Typography, Defaults } from '../../constants';

type Props = NativeStackScreenProps<AttendanceStackParamList, 'SessionSummary'>;

export function SessionSummaryScreen({ route, navigation }: Props) {
  const { result } = route.params;
  const [undoAvailable, setUndoAvailable] = useState(true);
  const [undoing, setUndoing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(Math.ceil(Defaults.undoGraceMs / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setUndoAvailable(false); clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUndo = async () => {
    setUndoing(true);
    try {
      await attendanceService.undoCommit(result.session.id);
      navigation.replace('SessionDetail', {
        sessionId: result.session.id,
        ministryName: result.session.ministry_name ?? '',
        sessionDate: result.session.session_date,
      });
    } finally {
      setUndoing(false);
    }
  };

  return (
    <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.container}>
      <Text style={styles.checkmark}>✅</Text>
      <Text style={styles.title}>Attendance Saved!</Text>
      <Text style={styles.subtitle}>{result.session.ministry_name ?? 'Session'} · {result.session.session_date}</Text>

      <View style={styles.statsGrid}>
        {[
          { label: 'Present', value: result.awarded_count, icon: '✓' },
          { label: 'Absent', value: result.total_students - result.awarded_count, icon: '✗' },
          { label: 'Points Each', value: result.points_per_student, icon: '⭐' },
          { label: 'Total Points', value: result.total_points_awarded, icon: '🏆' },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton label="Back to Attendance" onPress={() => navigation.popToTop()}
        style={{ marginHorizontal: 24, marginTop: 8 }} />

      {undoAvailable && (
        <TouchableOpacity style={styles.undoBtn} onPress={handleUndo}>
          <Text style={styles.undoText}>
            {undoing ? 'Undoing...' : `Undo (${timeLeft}s)`}
          </Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  checkmark: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: Typography.hero, fontWeight: Typography.bold, color: Colors.dark, marginBottom: 8 },
  subtitle: { fontSize: Typography.md, color: Colors.mid, marginBottom: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 },
  statCard: { width: 140, backgroundColor: Colors.white, borderRadius: 16, padding: 16, alignItems: 'center' },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: Typography.bold, color: Colors.dark },
  statLabel: { fontSize: Typography.xs, color: Colors.light, marginTop: 4 },
  undoBtn: { marginTop: 16, padding: 12 },
  undoText: { color: Colors.danger, fontSize: Typography.sm, fontWeight: Typography.medium },
});
