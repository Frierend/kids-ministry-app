// src/screens/market/MarketHomeScreen.tsx

import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert,
} from 'react-native';
import { ScreenWrapper, StackHeader, FAB } from '../../components/navigation/ScreenWrapper';
import { GlassCard } from '../../components/atomic/GlassCard';
import { MarketItemCard } from '../../components/domain';
import { EmptyState, SectionHeader, PrimaryButton } from '../../components/atomic';
import { Colors, Typography, Spacing } from '../../theme';
import { useMarketItems } from '../../hooks/useData';
import { useStudents } from '../../hooks/useStudents';
import { useRedeemItem } from '../../hooks/useData';
import type { MarketStackParamList, Student } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<MarketStackParamList, 'MarketHome'>;
}

export default function MarketHomeScreen({ navigation }: Props) {
  const { data: items = [] } = useMarketItems(false);
  const { data: students = [] } = useStudents();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const redeemMutation = useRedeemItem();

  const handleRedeem = (itemId: string, itemName: string, cost: number) => {
    if (!selectedStudent) {
      Alert.alert('Select Student', 'Please select a student first.');
      return;
    }
    const balance = selectedStudent.balance ?? 0;
    if (balance < cost) {
      Alert.alert('Insufficient Points', `${selectedStudent.first_name} only has ${balance} points. This item costs ${cost} pts.`);
      return;
    }
    Alert.alert(
      'Confirm Redemption',
      `Redeem "${itemName}" for ${selectedStudent.first_name}?\n${cost} points will be deducted. (Balance: ${balance} → ${balance - cost})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              await redeemMutation.mutateAsync({
                student_id: selectedStudent.id,
                item_id: itemId,
                item_name: itemName,
                point_cost: cost,
              });
              Alert.alert('✅ Redeemed!', `${selectedStudent.first_name} redeemed "${itemName}" for ${cost} pts.`);
              // Update selected student balance optimistically
              setSelectedStudent(prev => prev ? { ...prev, balance: (prev.balance ?? 0) - cost } : null);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <StackHeader
        title="Market Day"
        rightAction={{
          icon: <Text style={{ fontSize: 18 }}>⚙️</Text>,
          onPress: () => navigation.navigate('ItemAdd'),
        }}
      />
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={
          <>
            {/* Student selector */}
            <SectionHeader title="SELECT STUDENT" />
            <View style={styles.studentPicker}>
              <FlatList
                horizontal
                data={students}
                keyExtractor={s => s.id}
                renderItem={({ item: s }) => (
                  <GlassCard
                    style={[
                      styles.studentChip,
                      selectedStudent?.id === s.id && styles.studentChipSelected,
                    ]}
                    onPress={() => setSelectedStudent(s)}
                  >
                    <Text style={[Typography.captionMedium, {
                      color: selectedStudent?.id === s.id ? Colors.primary : Colors.textSecondary,
                    }]}>
                      {s.first_name}
                    </Text>
                    <Text style={[Typography.caption, {
                      color: selectedStudent?.id === s.id ? Colors.gold : Colors.textTertiary,
                    }]}>
                      {s.balance ?? 0} pts
                    </Text>
                  </GlassCard>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: Spacing.md, gap: Spacing.sm }}
              />
            </View>

            {selectedStudent && (
              <GlassCard style={styles.balanceBanner}>
                <Text style={[Typography.body, { color: Colors.textPrimary }]}>
                  👤 <Text style={{ fontWeight: '700' }}>{selectedStudent.first_name}</Text>
                  {' '}—{' '}
                  <Text style={{ color: Colors.gold, fontWeight: '700' }}>
                    {selectedStudent.balance ?? 0} pts available
                  </Text>
                </Text>
              </GlassCard>
            )}

            <SectionHeader title="ITEMS" />
          </>
        }
        renderItem={({ item }) => (
          <MarketItemCard
            item={item}
            studentBalance={selectedStudent?.balance}
            onPress={() => handleRedeem(item.id, item.name, item.point_cost)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon={<Text style={{ fontSize: 40 }}>🛒</Text>}
            title="No items yet"
            message="Add market items using the ⚙️ button above."
          />
        }
      />

      <FAB onPress={() => navigation.navigate('ItemAdd')} icon="+" label="Add Item" />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: Spacing.md, gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  studentPicker: { marginBottom: Spacing.sm },
  studentChip: {
    padding: Spacing.sm, alignItems: 'center', gap: 2,
    minWidth: 80,
  },
  studentChipSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  balanceBanner: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    padding: Spacing.sm,
  },
  list: { paddingBottom: 100 },
});
