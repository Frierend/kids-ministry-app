import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MarketStackParamList, PointTransaction } from '../../types';
import { TransactionItem } from '../../components/molecules/TransactionItem';
import { EmptyState } from '../../components/atoms/EmptyState';
import { transactionService } from '../../services/TransactionService';
import { studentService } from '../../services/StudentService';
import { Colors, Typography } from '../../constants';

type Props = NativeStackScreenProps<MarketStackParamList, 'MarketHistory'>;

export function MarketHistoryScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    const sid = route.params?.studentId;
    if (sid) {
      studentService.getById(sid).then((s) => {
        if (s) setStudentName(s.nickname || (s.first_name + ' ' + s.last_name));
      });
      transactionService.getLedger(sid, { type: 'market_deduction', pageSize: 50 })
        .then((r) => setTransactions(r.transactions));
    }
  }, []);

  const headerTitle = studentName ? (studentName + "'s History") : 'Market History';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{headerTitle}</Text>
      </View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <TransactionItem tx={item} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={<EmptyState icon="🛒" title="No redemptions yet" />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  back: { fontSize: 28, color: Colors.primary, fontWeight: '700' },
  title: { fontSize: 17, fontWeight: '600', color: Colors.dark },
});
