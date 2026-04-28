import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList, Ministry } from '../../types';
import { AppCard } from '../../components/ui/AppCard';
import { Badge } from '../../components/ui/Badge';
import { FAB } from '../../components/ui/FAB';
import { EmptyState } from '../../components/ui/EmptyState';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Snackbar } from '../../components/ui/Snackbar';
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

  // Archive/restore confirm
  const [pendingArchive, setPendingArchive] = useState<Ministry | null>(null);
  const [pendingRestore, setPendingRestore] = useState<Ministry | null>(null);
  const [acting, setActing] = useState(false);

  const [snackbar, setSnackbar] = useState({
    visible: false, message: '', type: 'success' as 'success' | 'error',
  });

  const load = useCallback(async () => {
    const list = await ministryService.getAll(showArchived);
    setMinistries(list);
  }, [showArchived]);

  React.useEffect(() => {
    if (isFocused) load();
  }, [isFocused, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleArchive = async () => {
    if (!pendingArchive) return;
    setActing(true);
    try {
      await ministryService.archive(pendingArchive.id);
      setSnackbar({ visible: true, message: `"${pendingArchive.name}" archived`, type: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message ?? 'Failed', type: 'error' });
    } finally {
      setActing(false);
      setPendingArchive(null);
    }
  };

  const handleRestore = async () => {
    if (!pendingRestore) return;
    setActing(true);
    try {
      await ministryService.restore(pendingRestore.id);
      setSnackbar({ visible: true, message: `"${pendingRestore.name}" restored!`, type: 'success' });
      load();
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message ?? 'Failed', type: 'error' });
    } finally {
      setActing(false);
      setPendingRestore(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <LinearGradient
        colors={Colors.gradientNavy as [string, string]}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Ministries</Text>
          <TouchableOpacity
            style={[styles.archiveToggle, showArchived && styles.archiveToggleActive]}
            onPress={() => setShowArchived((v) => !v)}
          >
            <Text style={styles.archiveToggleText}>
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={ministries}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('MinistryDetail', { ministryId: item.id })}
            activeOpacity={0.7}
            style={{ marginBottom: 12 }}
          >
            <AppCard elevated>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.nameLine}>
                    <Text style={styles.ministryName}>{item.name}</Text>
                    {item.is_archived && (
                      <Badge value="Archived" color={Colors.muted} size="sm" style={{ marginLeft: 8 }} />
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
                <View style={styles.actions}>
                  {item.is_archived ? (
                    <TouchableOpacity
                      style={styles.restoreBtn}
                      onPress={() => setPendingRestore(item)}
                    >
                      <Text style={styles.restoreBtnText}>Restore</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.chevron}>›</Text>
                  )}
                </View>
              </View>
            </AppCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="⛪"
            title="No ministries yet"
            subtitle="Create your first ministry with the + button"
            action={{ label: 'Add Ministry', onPress: () => navigation.navigate('MinistryDetail', {}) }}
          />
        }
      />

      <FAB onPress={() => navigation.navigate('MinistryDetail', {})} />

      {/* ARCHIVE CONFIRM */}
      <ConfirmationDialog
        visible={!!pendingArchive}
        title="Archive Ministry?"
        message={`Archive "${pendingArchive?.name}"?\n\nIt will be hidden from the ministry list. Existing sessions and enrollments are preserved.`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={handleArchive}
        onCancel={() => setPendingArchive(null)}
        loading={acting}
        destructive
      />

      {/* RESTORE CONFIRM */}
      <ConfirmationDialog
        visible={!!pendingRestore}
        title="Restore Ministry?"
        message={`Restore "${pendingRestore?.name}"? It will become active again.`}
        confirmLabel="Restore"
        cancelLabel="Cancel"
        onConfirm={handleRestore}
        onCancel={() => setPendingRestore(null)}
        loading={acting}
      />

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  backIcon: { fontSize: 30, color: Colors.white, fontWeight: '300', lineHeight: 34 },
  title: { fontSize: Typography.lg, fontWeight: '700', color: Colors.white },
  archiveToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  archiveToggleActive: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  archiveToggleText: { fontSize: 11, color: Colors.white, fontWeight: '600' },

  cardRow: { flexDirection: 'row', alignItems: 'center' },
  nameLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  ministryName: { fontSize: Typography.md, fontWeight: '700', color: Colors.dark },
  studentCount: { fontSize: Typography.xs, color: Colors.muted, marginBottom: 8 },
  dayChips: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  dayChip: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dayChipText: { fontSize: 10, color: Colors.primary, fontWeight: '700' },
  actions: { alignItems: 'center', justifyContent: 'center', paddingLeft: 8 },
  chevron: { fontSize: 22, color: Colors.muted },
  restoreBtn: {
    backgroundColor: Colors.warningLight,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  restoreBtnText: { fontSize: Typography.xs, color: Colors.warning, fontWeight: '700' },
});