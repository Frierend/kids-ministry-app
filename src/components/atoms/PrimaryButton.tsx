import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius, Layout } from '../../constants';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function PrimaryButton({ label, onPress, loading, disabled, variant = 'filled', size = 'md', style, textStyle, icon }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const height = size === 'sm' ? 40 : size === 'lg' ? 60 : Layout.buttonHeight;

  if (variant === 'filled') {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8}
        style={[{ borderRadius: Radius.lg, overflow: 'hidden', opacity: isDisabled ? 0.6 : 1 }, style]}>
        <LinearGradient colors={Colors.gradientBlue} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.btn, { height }]}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : (
            <>{icon}<Text style={[styles.filledText, textStyle]}>{label}</Text></>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.7}
      style={[styles.btn, { height, borderRadius: Radius.lg, opacity: isDisabled ? 0.5 : 1 },
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger, style]}>
      {loading ? (
        <ActivityIndicator color={variant === 'danger' ? Colors.danger : Colors.primary} size="small" />
      ) : (
        <>{icon}<Text style={[styles.outlineText, variant === 'ghost' && styles.ghostText,
          variant === 'danger' && styles.dangerText, textStyle]}>{label}</Text></>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  filledText: { color: Colors.white, fontSize: Typography.md, fontWeight: Typography.semiBold },
  outline: { borderWidth: 1.5, borderColor: Colors.primary },
  ghost: { backgroundColor: 'transparent' },
  danger: { borderWidth: 1.5, borderColor: Colors.danger },
  outlineText: { color: Colors.primary, fontSize: Typography.md, fontWeight: Typography.semiBold },
  ghostText: { color: Colors.mid },
  dangerText: { color: Colors.danger },
});
