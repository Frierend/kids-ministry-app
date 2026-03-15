import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MarketItem } from '../../types';
import { AppCard } from '../atoms/AppCard';
import { PrimaryButton } from '../atoms/PrimaryButton';
import { Colors, Typography, Radius } from '../../constants';

interface MarketItemCardProps {
  item: MarketItem;
  canAfford: boolean;
  onRedeem: () => void;
  loading?: boolean;
}

export function MarketItemCard({ item, canAfford, onRedeem, loading }: MarketItemCardProps) {
  return (
    <AppCard style={styles.card} padding={0}>
      <View style={styles.imageBox}>
        {item.photo_uri ? (
          <Image source={{ uri: item.photo_uri }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderIcon}>🎁</Text></View>
        )}
        <View style={styles.costBadge}>
          <Text style={styles.costText}>⭐ {item.point_cost}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        {item.stock !== -1 && (
          <Text style={styles.stock}>{item.stock} left</Text>
        )}
        <PrimaryButton
          label={canAfford ? 'Redeem' : 'Need more pts'}
          onPress={onRedeem}
          disabled={!canAfford || item.stock === 0}
          loading={loading}
          size="sm"
          style={{ marginTop: 8 }}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  imageBox: { position: 'relative', height: 100, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderIcon: { fontSize: 36 },
  costBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: Colors.dark + 'CC', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  costText: { color: Colors.white, fontSize: Typography.xs, fontWeight: Typography.bold },
  info: { padding: 12 },
  name: { fontSize: Typography.sm, fontWeight: Typography.semiBold, color: Colors.dark, marginBottom: 4 },
  stock: { fontSize: Typography.xs, color: Colors.warning },
});
