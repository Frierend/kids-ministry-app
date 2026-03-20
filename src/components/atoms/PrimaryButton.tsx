import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, ViewStyle, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius, Layout } from '../../constants';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function PrimaryButton({
  label, onPress, loading, disabled,
  variant = 'filled', size = 'md',
  style, icon, fullWidth = true,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  const height = size === 'sm' ? 38 : size === 'lg' ? 58 : Layout.buttonHeight;
  const fontSize = size === 'sm' ? Typography.sm : Typography.md;

  if (variant === 'filled') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          { borderRadius: Radius.lg, overflow: 'hidden', opacity: isDisabled ? 0.55 : 1 },
          fullWidth && { alignSelf: 'stretch' },
          style,
        ]}
      >
        <LinearGradient
          colors={Colors.gradientBlue as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btn, { height }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.filledText, { fontSize }]}>{label}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'success') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          { borderRadius: Radius.lg, overflow: 'hidden', opacity: isDisabled ? 0.55 : 1 },
          fullWidth && { alignSelf: 'stretch' },
          style,
        ]}
      >
        <LinearGradient
          colors={Colors.gradientGreen as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btn, { height }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {icon}
              <Text style={[styles.filledText, { fontSize }]}>{label}</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles = {
    outline: { borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: 'transparent' },
    ghost:   { backgroundColor: 'transparent' },
    danger:  { borderWidth: 1.5, borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  };

  const textStyles = {
    outline: { color: Colors.primary },
    ghost:   { color: Colors.mid },
    danger:  { color: Colors.danger },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.btn,
        { height, borderRadius: Radius.lg, opacity: isDisabled ? 0.5 : 1 },
        variantStyles[variant as keyof typeof variantStyles],
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'danger' ? Colors.danger : Colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.variantText,
              { fontSize },
              textStyles[variant as keyof typeof textStyles],
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  filledText: {
    color: Colors.white,
    fontWeight: Typography.semiBold,
  },
  variantText: {
    fontWeight: Typography.semiBold,
  },
});