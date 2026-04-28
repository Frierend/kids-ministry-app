import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Colors, Typography, Radius, Shadows, Spacing } from '../../constants';
import { PrimaryButton } from './PrimaryButton';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmationDialog({
  visible, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, destructive, loading,
}: ConfirmationDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <PrimaryButton label={cancelLabel} onPress={onCancel} variant="ghost"
              style={{ flex: 1 }} />
            <PrimaryButton label={confirmLabel} onPress={onConfirm}
              variant={destructive ? 'danger' : 'filled'} loading={loading}
              style={{ flex: 1 }} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 24, width: '100%', ...Shadows.lg },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.dark, marginBottom: 8 },
  message: { fontSize: Typography.md, color: Colors.mid, lineHeight: 24, marginBottom: 24 },
  actions: { flexDirection: 'row', gap: 12 },
});
