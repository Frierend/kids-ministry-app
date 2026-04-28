import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { AttendanceSession } from '../../types';
import { AppCard } from '../ui/AppCard';
import { Badge } from '../ui/Badge';
import { Colors, Typography, Spacing } from '../../constants';
import { format } from 'date-fns';

interface AttendanceSessionCardProps {
  session: AttendanceSession;
  onPress: () => void;
}

export function AttendanceSessionCard({ session, onPress }: AttendanceSessionCardProps) {
  const present = session.present_count ?? 0;
  const total = session.total_count ?? 0;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const isCommitted = session.status === 'committed';
  const dateLabel = (() => {
    try { return format(new Date(session.session_date + 'T00:00:00'), 'EEE, MMM d'); } catch { return session.session_date; }
  })();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <AppCard style={styles.card}>
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.ministry} numberOfLines={1}>{session.ministry_name}</Text>
            <Text style={styles.date}>{dateLabel}</Text>
            <Text style={styles.pts}>+{session.points_awarded} pts/student</Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.ratio}>{present}<Text style={styles.total}>/{total}</Text></Text>
            <Text style={styles.pct}>{pct}%</Text>
            <Badge
              value={isCommitted ? 'Saved' : 'Draft'}
              color={isCommitted ? Colors.accent : Colors.warning}
              size="sm"
              style={{ marginTop: 4 }}
            />
          </View>
        </View>
      </AppCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  info: { flex: 1 },
  ministry: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.dark, marginBottom: 4 },
  date: { fontSize: Typography.sm, color: Colors.mid, marginBottom: 2 },
  pts: { fontSize: Typography.xs, color: Colors.light },
  right: { alignItems: 'flex-end' },
  ratio: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.primary },
  total: { fontSize: Typography.md, color: Colors.light },
  pct: { fontSize: Typography.xs, color: Colors.light },
});
