import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MarketStackParamList, MarketItem, Student } from '../../types';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Snackbar } from '../../components/ui/Snackbar';
import { marketService } from '../../services/MarketService';
import { studentService } from '../../services/StudentService';
import { transactionService } from '../../services/TransactionService';
import { Colors, Typography } from '../../constants';

type Props = NativeStackScreenProps<MarketStackParamList, 'RedeemConfirm'>;

export function RedeemConfirmScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { studentId, itemId } = route.params;
  const [item, setItem] = useState<MarketItem | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [balance, setBalance] = useState(0);
  const [redeeming, setRedeeming] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', isError: false });

  useEffect(() => {
    Promise.all([
      marketService.getById(itemId),
      studentService.getById(studentId),
      transactionService.getBalance(studentId),
    ]).then(([i, s, b]) => {
      setItem(i);
      setStudent(s);
      setBalance(b);
    });
  }, []);

  const handleRedeem = async () => {
    setRedeeming(true);
    try {
      await transactionService.redeemMarket(studentId, itemId);
      setSnackbar({ visible: true, message: `Redeemed! New balance: ${balance - (item?.point_cost ?? 0)} pts`, isError: false });
      setTimeout(() => navigation.navigate('MarketHome'), 1800);
    } catch (e: any) {
      setSnackbar({ visible: true, message: e.message ?? 'Redemption failed', isError: true });
    } finally {
      setRedeeming(false);
    }
  };

  if (!item || !student) return <View style={{ flex: 1, backgroundColor: Colors.bg }} />;

  const canAfford = balance >= item.point_cost;
  const newBalance = balance - item.point_cost;
  const displayName = student.nickname || `${student.first_name} ${student.last_name}`;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Confirm Redemption</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={{ padding: 16, flex: 1 }}>
        {/* ITEM CARD */}
        <View style={styles.itemCard}>
          <Text style={styles.itemIcon}>🎁</Text>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.description && <Text style={styles.itemDesc}>{item.description}</Text>}
          <View style={styles.costBadge}>
            <Text style={styles.costText}>⭐ {item.point_cost} points</Text>
          </View>
        </View>

        {/* STUDENT SUMMARY */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{displayName}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceCol}>
              <Text style={styles.balLabel}>Current Balance</Text>
              <Text style={styles.balValue}>{balance} pts</Text>
            </View>
            <Text style={styles.arrow}>→</Text>
            <View style={styles.balanceCol}>
              <Text style={styles.balLabel}>After Redemption</Text>
              <Text style={[styles.balValue, { color: canAfford ? Colors.accent : Colors.danger }]}>
                {newBalance} pts
              </Text>
            </View>
          </View>
          {!canAfford && (
            <Text style={styles.insufficientText}>
              ⚠️ Insufficient points. Need {item.point_cost - balance} more pts.
            </Text>
          )}
        </View>

        <PrimaryButton
          label={canAfford ? '✓ Confirm Redemption' : 'Insufficient Points'}
          onPress={handleRedeem}
          disabled={!canAfford}
          loading={redeeming}
          style={{ marginTop: 'auto' }}
        />
        <PrimaryButton label="Cancel" onPress={() => navigation.goBack()} variant="ghost" style={{ marginTop: 8 }} />
      </View>

      <Snackbar visible={snackbar.visible} message={snackbar.message}
        type={snackbar.isError ? 'error' : 'success'}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back: { fontSize: 28, color: Colors.primary, fontWeight: '700', marginRight: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: Colors.dark },
  itemCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  itemIcon: { fontSize: 48, marginBottom: 12 },
  itemName: { fontSize: 20, fontWeight: '700', color: Colors.dark, marginBottom: 4 },
  itemDesc: { fontSize: 14, color: Colors.light, marginBottom: 12 },
  costBadge: { backgroundColor: Colors.primaryLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  costText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  summaryCard: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: Colors.dark, textAlign: 'center', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceCol: { alignItems: 'center', flex: 1 },
  balLabel: { fontSize: 12, color: Colors.light, marginBottom: 4 },
  balValue: { fontSize: 22, fontWeight: '800', color: Colors.dark },
  arrow: { fontSize: 24, color: Colors.light },
  insufficientText: { marginTop: 12, color: Colors.danger, fontSize: 14, textAlign: 'center' },
});
