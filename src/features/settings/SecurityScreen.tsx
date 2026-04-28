import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Switch, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../navigation/navigation.types';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { AppCard } from '../../components/ui/AppCard';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { Snackbar } from '../../components/ui/Snackbar';
import { securityService } from '../security/security.service';
import { Colors, Typography, Radius, Layout } from '../../constants';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Security'>;

const AUTO_LOCK_OPTIONS = [
  { label: '1 minute',  value: 1 },
  { label: '5 minutes', value: 5 },
  { label: '10 minutes',value: 10 },
  { label: '30 minutes',value: 30 },
  { label: 'Never',     value: 0 },
];

export function SecurityScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [teacherName, setTeacherName] = useState('');
  const [autoLock, setAutoLock] = useState(5);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);

  // Change PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  // Reset state
  const [resetText, setResetText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [snackbar, setSnackbar] = useState({ visible: false, message: '', isError: false });
  const toast = (message: string, isError = false) =>
    setSnackbar({ visible: true, message, isError });

  useEffect(() => {
    (async () => {
      const [name, lock, bioEnabled, bioAvail] = await Promise.all([
        securityService.getTeacherName(),
        securityService.getAutoLockMinutes(),
        securityService.isBiometricEnabled(),
        securityService.isBiometricAvailable(),
      ]);
      setTeacherName(name);
      setAutoLock(lock);
      setBiometricsEnabled(bioEnabled);
      setBiometricsAvailable(bioAvail);
    })();
  }, []);

  const saveTeacherName = async () => {
    if (!teacherName.trim()) return;
    await securityService.setTeacherName(teacherName.trim());
    toast('Name saved!');
  };

  const saveAutoLock = async (val: number) => {
    setAutoLock(val);
    await securityService.setAutoLockMinutes(val);
    toast('Auto-lock updated');
  };

  const toggleBiometrics = async (val: boolean) => {
    if (val && !biometricsAvailable) {
      toast('Biometrics not available on this device', true);
      return;
    }
    setBiometricsEnabled(val);
    await securityService.setBiometricEnabled(val);
    toast(val ? 'Biometrics enabled' : 'Biometrics disabled');
  };

  const handleChangePin = async () => {
    setPinError('');
    if (currentPin.length !== 4) { setPinError('Enter your current 4-digit PIN'); return; }
    if (newPin.length !== 4)     { setPinError('New PIN must be 4 digits'); return; }
    if (newPin !== confirmPin)   { setPinError('PINs do not match'); return; }
    setSavingPin(true);
    try {
      await securityService.changePin(currentPin, newPin);
      setCurrentPin(''); setNewPin(''); setConfirmPin('');
      toast('PIN changed successfully!');
    } catch (e: any) {
      setPinError(e.message ?? 'Incorrect current PIN');
    } finally {
      setSavingPin(false);
    }
  };

  const handleReset = async () => {
    if (resetText !== 'RESET') return;
    setResetting(true);
    try {
      await securityService.resetApp();
      toast('App reset. Restart the app.');
    } catch (e: any) {
      toast('Reset failed: ' + (e.message ?? ''), true);
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  };

  const PinField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.pinInput}
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^0-9]/g, '').slice(0, 4))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        placeholder="••••"
        placeholderTextColor={Colors.light}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Security</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

          {/* TEACHER NAME */}
          <AppCard style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Teacher Name</Text>
            <View style={styles.nameRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={teacherName}
                onChangeText={setTeacherName}
                placeholder="Your name"
                placeholderTextColor={Colors.light}
              />
              <PrimaryButton label="Save" onPress={saveTeacherName} size="sm" style={{ marginLeft: 8 }} />
            </View>
          </AppCard>

          {/* CHANGE PIN */}
          <AppCard style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>🔑 Change PIN</Text>
            {pinError ? <Text style={styles.pinError}>{pinError}</Text> : null}
            <PinField label="Current PIN" value={currentPin} onChange={setCurrentPin} />
            <PinField label="New PIN" value={newPin} onChange={setNewPin} />
            <PinField label="Confirm New PIN" value={confirmPin} onChange={setConfirmPin} />
            <PrimaryButton label="Change PIN" onPress={handleChangePin} loading={savingPin} />
          </AppCard>

          {/* BIOMETRICS */}
          <AppCard style={{ marginBottom: 16 }}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.sectionTitle}>👆 Biometric Unlock</Text>
                <Text style={styles.toggleSub}>
                  {biometricsAvailable ? 'Face ID / Fingerprint available' : 'Not available on this device'}
                </Text>
              </View>
              <Switch
                value={biometricsEnabled}
                onValueChange={toggleBiometrics}
                disabled={!biometricsAvailable}
                trackColor={{ true: Colors.primary }}
              />
            </View>
          </AppCard>

          {/* AUTO LOCK */}
          <AppCard style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>⏱ Auto-Lock</Text>
            <View style={styles.lockOptions}>
              {AUTO_LOCK_OPTIONS.map((opt) => (
                <TouchableOpacity key={opt.value}
                  style={[styles.lockChip, autoLock === opt.value && styles.lockChipActive]}
                  onPress={() => saveAutoLock(opt.value)}>
                  <Text style={[styles.lockChipText, autoLock === opt.value && styles.lockChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </AppCard>

          {/* RESET APP */}
          <AppCard>
            <Text style={[styles.sectionTitle, { color: Colors.danger }]}>💥 Reset App</Text>
            <Text style={styles.resetWarning}>
              This permanently deletes ALL data — students, attendance, points, ministries. This cannot be undone.
            </Text>
            <Text style={styles.fieldLabel}>Type RESET to enable the button</Text>
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              value={resetText}
              onChangeText={setResetText}
              placeholder="RESET"
              placeholderTextColor={Colors.light}
              autoCapitalize="characters"
            />
            <PrimaryButton
              label="Reset App"
              onPress={() => setShowResetConfirm(true)}
              variant="danger"
              disabled={resetText !== 'RESET'}
            />
          </AppCard>
        </ScrollView>

        <ConfirmationDialog
          visible={showResetConfirm}
          title="⚠️ Permanently Reset App?"
          message="ALL data will be deleted immediately. This action cannot be undone. The app will need to be set up again from scratch."
          confirmLabel="Delete Everything"
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
          loading={resetting}
          destructive
        />

        <Snackbar visible={snackbar.visible} message={snackbar.message}
          type={snackbar.isError ? 'error' : 'success'}
          onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back: { fontSize: 28, color: Colors.primary, fontWeight: '700', marginRight: 8 },
  title: { flex: 1, textAlign: 'center', fontSize: Typography.lg, fontWeight: Typography.semiBold, color: Colors.dark },
  sectionTitle: { fontSize: Typography.md, fontWeight: Typography.semiBold, color: Colors.dark, marginBottom: 12 },
  fieldLabel: { fontSize: Typography.sm, color: Colors.mid, marginBottom: 6, fontWeight: Typography.medium },
  input: { height: Layout.inputHeight, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 14, fontSize: Typography.md, color: Colors.dark, backgroundColor: Colors.bg },
  pinInput: { height: 52, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 20, fontSize: 24, color: Colors.dark, backgroundColor: Colors.white, textAlign: 'center', letterSpacing: 8 },
  pinError: { color: Colors.danger, fontSize: Typography.sm, marginBottom: 8, backgroundColor: Colors.dangerLight, padding: 8, borderRadius: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleSub: { fontSize: Typography.xs, color: Colors.light, marginTop: 2 },
  lockOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lockChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border },
  lockChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  lockChipText: { fontSize: Typography.sm, color: Colors.mid },
  lockChipTextActive: { color: Colors.primary, fontWeight: Typography.semiBold },
  resetWarning: { fontSize: Typography.sm, color: Colors.danger, lineHeight: 20, marginBottom: 12 },
});
