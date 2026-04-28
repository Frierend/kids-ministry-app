import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { SettingsStackParamList } from '../../types';
import { AppCard } from '../../components/ui/AppCard';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Snackbar } from '../../components/ui/Snackbar';
import { backupService } from '../../services/BackupService';
import { Colors, Typography } from '../../constants';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Backup'>;

export function BackupScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<{ uri: string; name: string } | null>(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', isError: false });

  const toast = (message: string, isError = false) =>
    setSnackbar({ visible: true, message, isError });

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportPath = await backupService.exportDatabase();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(exportPath, {
          mimeType: 'application/octet-stream',
          dialogTitle: "Save Kids Ministry Backup",
          UTI: 'public.data',
        });
        toast('Backup exported safely.');
      } else {
        toast('Sharing not available on this device', true);
      }
    } catch (e: any) {
      toast('Export failed: ' + (e.message ?? ''), true);
    } finally {
      setExporting(false);
    }
  };

  const handlePickImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = asset.name ?? uri;
      if (!backupService.isDatabaseBackupName(name) && !backupService.isDatabaseBackupName(uri)) {
        toast('Please select a valid .db backup file', true);
        return;
      }
      await backupService.validateBackupFile(uri);
      setPendingBackup({ uri, name });
      setShowImportConfirm(true);
    } catch (e: any) {
      toast('Invalid backup: ' + (e.message ?? 'Could not read selected file'), true);
    }
  };

  const handleImport = async () => {
    if (!pendingBackup) return;
    setImporting(true);
    try {
      await backupService.restoreDatabase(pendingBackup.uri);
      toast('Database imported safely. Restart the app to apply changes.');
    } catch (e: any) {
      toast('Import failed: ' + (e.message ?? ''), true);
    } finally {
      setImporting(false);
      setShowImportConfirm(false);
      setPendingBackup(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Backup & Restore</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={{ padding: 16, gap: 16 }}>
        {/* EXPORT */}
        <AppCard>
          <Text style={styles.cardIcon}>💾</Text>
          <Text style={styles.cardTitle}>Export Backup</Text>
          <Text style={styles.cardDesc}>
            Saves a copy of all students, attendance records, and points as a .db file. Share it to Google Drive, email, or local storage.
          </Text>
          <PrimaryButton
            label={exporting ? 'Exporting...' : 'Export Database'}
            onPress={handleExport}
            loading={exporting}
            style={{ marginTop: 16 }}
          />
        </AppCard>

        {/* IMPORT */}
        <AppCard>
          <Text style={styles.cardIcon}>📥</Text>
          <Text style={styles.cardTitle}>Import Backup</Text>
          <Text style={styles.cardDesc}>
            Replaces the current database with a backup file. The current data will be saved as a safety snapshot first.
          </Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>⚠️ This will overwrite all current data with the imported backup.</Text>
          </View>
          <PrimaryButton
            label="Choose Backup File"
            onPress={handlePickImport}
            variant="outline"
            style={{ marginTop: 12 }}
          />
        </AppCard>

        {/* INFO */}
        <AppCard>
          <Text style={styles.infoTitle}>📋 Backup Tips</Text>
          {[
            'Export regularly — weekly is recommended',
            'Store backups in Google Drive or email for safety',
            'Keep multiple backup files with dates in the name',
            'Import will restart the app to apply changes',
          ].map((tip, i) => (
            <Text key={i} style={styles.tip}>• {tip}</Text>
          ))}
        </AppCard>
      </View>

      <ConfirmationDialog
        visible={showImportConfirm}
        title="Import Backup?"
        message={`This will replace all current data with "${pendingBackup?.name ?? 'the selected backup'}". Your current data will be saved as a safety snapshot first. This cannot be undone from inside the app.`}
        confirmLabel="Import & Replace"
        onConfirm={handleImport}
        onCancel={() => { setShowImportConfirm(false); setPendingBackup(null); }}
        loading={importing}
        destructive
      />

      <Snackbar visible={snackbar.visible} message={snackbar.message}
        type={snackbar.isError ? 'error' : 'success'}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back: { fontSize: 28, color: Colors.primary, fontWeight: '700', marginRight: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: Typography.lg, fontWeight: Typography.semiBold, color: Colors.dark },
  cardIcon: { fontSize: 36, marginBottom: 8 },
  cardTitle: { fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.dark, marginBottom: 8 },
  cardDesc: { fontSize: Typography.sm, color: Colors.mid, lineHeight: 22 },
  warningBox: { backgroundColor: '#FEF9C3', borderRadius: 8, padding: 10, marginTop: 10, borderWidth: 1, borderColor: '#FDE047' },
  warningText: { fontSize: Typography.xs, color: '#92400E' },
  infoTitle: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.dark, marginBottom: 10 },
  tip: { fontSize: Typography.sm, color: Colors.mid, marginBottom: 6, lineHeight: 20 },
});
