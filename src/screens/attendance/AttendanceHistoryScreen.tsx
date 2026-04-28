import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AttendanceStackParamList, AttendanceSession } from '../../types';
import { AttendanceSessionCard } from '../../components/domain/AttendanceSessionCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { attendanceService } from '../../services/AttendanceService';
import { Colors, Typography } from '../../constants';

type Props = NativeStackScreenProps<AttendanceStackParamList, 'AttendanceHistory'>;

export function AttendanceHistoryScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);

  useEffect(() => {
    attendanceService.getRecentSessions(route.params?.ministryId, 50)
      .then(setSessions);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Attendance History</Text>
      </View>
      <FlatList
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <AttendanceSessionCard session={item}
            onPress={() => navigation.push('SessionDetail', {
              sessionId: item.id,
              ministryName: item.ministry_name ?? '',
              sessionDate: item.session_date,
            })} />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<EmptyState icon="📅" title="No sessions yet" subtitle="Start taking attendance to see history here" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  back: { fontSize: 28, color: Colors.primary, fontWeight: Typography.bold },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.dark },
});
