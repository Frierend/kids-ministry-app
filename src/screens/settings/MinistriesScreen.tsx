// src/screens/settings/MinistriesScreen.tsx

import React from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert,
} from 'react-native';
import { ScreenWrapper, StackHeader, FAB } from '../../components/navigation/ScreenWrapper';
import { GlassCard } from '../../components/atomic/GlassCard';
import { EmptyState, PrimaryButton } from '../../components/atomic';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { useMinistries, useUpdateMinistry } from '../../hooks/useData';
import type { SettingsStackParamList } from '../../types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

interface Props {
  navigation: NativeStackNavigationProp<SettingsStackParamList, 'Ministries'>;
}

export default function MinistriesScreen({ navigation }: Props) {
  const { data: ministries = [] } = useMinistries(false);
  const updateMutation = useUpdateMinistry();

  const handleToggle = async (id: string, isActive: boolean) => {
    await updateMutation.mutateAsync({ id, data: { is_active: !isActive } });
  };

  return (
    <ScreenWrapper>
      <StackHeader title="Ministries" onBack={() => navigation.goBack()} />
      <FlatList
        data={ministries}
        keyExtractor={m => m.id}
        renderItem={({ item: m }) => (
          <GlassCard
            style={styles.row}
            onPress={() => navigation.navigate('MinistryDetail', { ministryId: m.id })}
          >
            <View style={[styles.colorDot, { backgroundColor: m.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodyMedium, { color: Colors.textPrimary }]}>{m.name}</Text>
              <Text style={[Typography.caption, { color: Colors.textTertiary }]}>
                {m.student_count ?? 0} students · Sat {m.saturday_points}pts · Sun {m.sunday_points}pts
              </Text>
            </View>
            <View style={[
              styles.activeBadge,
              { backgroundColor: m.is_active ? Colors.successLight : Colors.divider },
            ]}>
              <Text style={[Typography.captionMedium, {
                color: m.is_active ? Colors.success : Colors.textTertiary,
              }]}>
                {m.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <Text style={{ color: Colors.textTertiary, fontSize: 18 }}>›</Text>
          </GlassCard>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon={<Text style={{ fontSize: 40 }}>⛪</Text>}
            title="No ministries"
            message="Add your first ministry to get started."
            action={{ label: 'Add Ministry', onPress: () => navigation.navigate('MinistryAdd') }}
          />
        }
      />
      <FAB onPress={() => navigation.navigate('MinistryAdd')} icon="+" label="Add Ministry" />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  list: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 100 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md,
  },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  activeBadge: {
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
});
