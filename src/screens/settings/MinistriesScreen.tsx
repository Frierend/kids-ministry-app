import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList, Ministry } from '../../types';
import { AppCard } from '../../components/atoms/AppCard';
import { Badge } from '../../components/atoms/Badge';
import { FAB } from '../../components/organisms/FAB';
import { EmptyState } from '../../components/atoms/EmptyState';
import { ministryService } from '../../services/MinistryService';
import { Colors, Typography } from '../../constants';

type Nav = NativeStackNavigationProp<SettingsStackParamList, 'Ministries'>;

const DAY_SHORT: Record<string, string> = {
  monday:'Mon', tuesday:'Tue', wednesday:'Wed',
  thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun',
};

export function MinistriesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await ministryService.getAll(showArchived);
    setMinistries(list);
  }, [showArchived]);

  useEffect(() => { if (isFocused) load(); }, [isFocused, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ministries</Text>
        <TouchableOpacity onPress={() => setShowArchived((v) => !v)}>
          <Text style={[styles.archiveBtn, showArchived && { color: Colors.primary }]}>
            {showArchived ? '🗃 Hide' : '🗃'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={ministries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('MinistryDetail', { ministryId: item.id })}
            activeOpacity={0.7}
            style={{ marginBottom: 12 }}>
            <AppCard>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameLine}>
                    <Text style={styles.ministryName}>{item.name}</Text>
                    {item.is_archived && (
                      <Badge value="Archived" color={Colors.light} size="sm" style={{ marginLeft: 8 }} />
                    )}
                  </View>
                  <Text style={styles.studentCount}>
                    👥 {item.student_count ?? 0} students enrolled
                  </Text>
                  <View style={styles.dayChips}>
                    {item.active_days.map((d) => (
                      <View key={d} style={styles.dayChip}>
                        <Text style={styles.dayChipText}>{DAY_SHORT[d] ?? d}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </View>
            </AppCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState icon="⛪" title="No ministries yet"
            subtitle="Create your first ministry with the + button"
            action={{ label: 'Add Ministry', onPress: () => navigation.navigate('MinistryDetail', {}) }} />
        }
      />

      <FAB onPress={() => navigation.navigate('MinistryDetail', {})} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  back: { fontSize: 28, color: Colors.primary, fontWeight: '700' },
  title: { flex: 1, fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.dark },
  archiveBtn: { fontSize: Typography.md, color: Colors.light },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  nameLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ministryName: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.dark },
  studentCount: { fontSize: Typography.xs, color: Colors.light, marginBottom: 8 },
  dayChips: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  dayChip: { backgroundColor: Colors.primaryLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  dayChipText: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
  chevron: { fontSize: 22, color: Colors.light },
});
