import React from 'react';
import { View, Text, ImageStyle, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Colors, Typography } from '../../constants';

interface AvatarProps {
  uri?: string | null;
  initials: string;
  size?: number;
  style?: ViewStyle;
  backgroundColor?: string;
}

export function Avatar({ uri, initials, size = 48, style, backgroundColor = Colors.primaryLight }: AvatarProps) {
  if (uri) {
    return <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: size / 2 }, style as StyleProp<ImageStyle>]} contentFit="cover" />;
  }
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ color: Colors.primary, fontWeight: Typography.bold, fontSize: size * 0.4 }}>
        {initials.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}
