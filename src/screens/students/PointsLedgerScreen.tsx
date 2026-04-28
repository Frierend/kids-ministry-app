import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PointTransaction, TransactionType } from '../../types';
import { StudentsStackParamList } from '../../navigation/navigation.types';
import { TransactionItem } from '../../components/domain/TransactionItem';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { transactionService } from '../../services/TransactionService';
import { Colors, Typography } from '../../constants';

type Props = NativeStackScreenProps<StudentsStackParamList, 'PointsLedger'>;

const FILTERS: { label: string; value: TransactionType | undefined }[] = [
  { label: 'All',        value: undefined },
  { label: 'Attendance', value: 'attendance' },
  { label: 'Activity',   value: 'activity' },
  { label: 'Market',     value: 'market_deduction' },
  { label: 'Manual',     value: 'manual_adjustment' },
];

export function PointsLedgerScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { studentId, studentName } = route.params;
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TransactionType | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: number, reset = false) => {
    if (loading && !reset) return;
    setLoading(true);
    try {
      const [bal, result] = await Promise.all([
        transactionService.getBalance(studentId),
        transactionService.getLedger(studentId, { type: typeFilter, page: p, pageSize: 20 }),
      ]);
      setBalance(bal);
      setTransactions((prev) => reset ? result.transactions : [...prev, ...result.transactions]);
      setHasMore(result.hasMore);
    } finally {
      setLoading(false);
    }
  }, [studentId, typeFilter]);

  useEffect(() => { setPage(0); load(0, true); }, [typeFilter]);

  const loadMore = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    load(next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{studentName}</Text>
          <Text style={styles.subtitle}>Points Ledger</Text>
        </View>
        <View style={styles.balancePill}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceNum}>{balance}</Text>
        </View>
      </View>

      {/* TYPE FILTERS */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = f.value === typeFilter;
          return (
            <TouchableOpacity key={f.label}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setTypeFilter(f.value)}>
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TRANSACTION LIST */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <TransactionItem tx={item} showRunningBalance />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          !loading ? (
            <EmptyState icon="📊" title="No transactions"
              subtitle="Points will appear here once earned" />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12,
  },
  back: { fontSize: 28, color: Colors.primary, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '600', color: Colors.dark },
  subtitle: { fontSize: 12, color: Colors.light },
  balancePill: {
    backgroundColor: Colors.primaryLight, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
  },
  balanceLabel: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
  balanceNum: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10,
    gap: 8, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterLabel: { fontSize: 12, color: Colors.mid, fontWeight: '500' },
  filterLabelActive: { color: Colors.white, fontWeight: '600' },
});
