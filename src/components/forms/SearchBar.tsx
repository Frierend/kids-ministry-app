import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Colors, Radius, Typography, Layout } from '../../constants';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  transparent?: boolean;
}

export function SearchBar({
  value, onChangeText, placeholder = 'Search...', onClear, transparent = false,
}: SearchBarProps) {
  return (
    <View style={[styles.container, transparent && styles.transparent]}>
      <Text style={[styles.icon, transparent && styles.iconLight]}>🔍</Text>
      <TextInput
        style={[styles.input, transparent && styles.inputLight]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={transparent ? 'rgba(255,255,255,0.5)' : Colors.muted}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => { onChangeText(''); onClear?.(); }}
          style={styles.clear}
        >
          <Text style={[styles.clearText, transparent && { color: 'rgba(255,255,255,0.7)' }]}>
            ✕
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: Layout.inputHeight,
    gap: 8,
  },
  transparent: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  icon: { fontSize: 15 },
  iconLight: {},
  input: {
    flex: 1,
    fontSize: Typography.md,
    color: Colors.dark,
  },
  inputLight: { color: Colors.white },
  clear: { padding: 4 },
  clearText: { color: Colors.muted, fontSize: 13 },
});