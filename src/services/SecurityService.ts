// src/services/SecurityService.ts
// PIN hash (SHA-256 + device salt), biometrics, auto-lock

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { getDatabase } from '../database/schema';

const SALT_KEY = 'km_device_salt';
const LAST_ACTIVE_KEY = 'km_last_active';
const LOCKED_KEY = 'km_is_locked';

async function sha256(message: string): Promise<string> {
  // React Native doesn't have native crypto.subtle, use a pure-JS approach
  // In production, use expo-crypto
  const { Crypto } = await import('expo-crypto');
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    message
  );
  return digest;
}

class SecurityService {
  // ── Salt & PIN ───────────────────────────────────────────

  async ensureSalt(): Promise<string> {
    let salt = await SecureStore.getItemAsync(SALT_KEY);
    if (!salt) {
      // Generate device salt on first launch
      salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
      await SecureStore.setItemAsync(SALT_KEY, salt);
    }
    return salt;
  }

  async hashPin(pin: string): Promise<string> {
    const salt = await this.ensureSalt();
    return sha256(salt + pin + salt);
  }

  async isPinSet(): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = 'pin_hash'`
    );
    return !!(row?.value);
  }

  async setPin(newPin: string): Promise<void> {
    const hash = await this.hashPin(newPin);
    const db = await getDatabase();
    await db.runAsync(
      `INSERT INTO app_settings (key, value) VALUES ('pin_hash', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      [hash]
    );
  }

  async verifyPin(pin: string): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = 'pin_hash'`
    );
    if (!row?.value) return false;
    const hash = await this.hashPin(pin);
    return hash === row.value;
  }

  // ── Lock State ───────────────────────────────────────────

  async lock(): Promise<void> {
    await SecureStore.setItemAsync(LOCKED_KEY, '1');
  }

  async unlock(): Promise<void> {
    await SecureStore.setItemAsync(LOCKED_KEY, '0');
    await this.touchActivity();
  }

  async isLocked(): Promise<boolean> {
    // Check explicit lock flag
    const locked = await SecureStore.getItemAsync(LOCKED_KEY);
    if (locked === '1') return true;

    // Check auto-lock timeout
    const autoLockMinutes = await this.getAutoLockMinutes();
    if (autoLockMinutes === 0) return false; // 'Never'

    const lastActive = await SecureStore.getItemAsync(LAST_ACTIVE_KEY);
    if (!lastActive) return true; // First launch

    const elapsed = (Date.now() - parseInt(lastActive, 10)) / 1000 / 60;
    return elapsed > autoLockMinutes;
  }

  async touchActivity(): Promise<void> {
    // Debounced — only write every 30 seconds
    const lastActive = await SecureStore.getItemAsync(LAST_ACTIVE_KEY);
    if (lastActive && Date.now() - parseInt(lastActive, 10) < 30_000) return;
    await SecureStore.setItemAsync(LAST_ACTIVE_KEY, Date.now().toString());
  }

  // ── Biometrics ───────────────────────────────────────────

  async isBiometricsAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return false;
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return isEnrolled;
  }

  async isBiometricsEnabled(): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = 'biometrics_enabled'`
    );
    return row?.value === 'true';
  }

  async setBiometricsEnabled(enabled: boolean): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE app_settings SET value = ?, updated_at = datetime('now') WHERE key = 'biometrics_enabled'`,
      [enabled ? 'true' : 'false']
    );
  }

  async authenticateWithBiometrics(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify your identity',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: false,
    });
    return result.success;
  }

  // ── Settings ─────────────────────────────────────────────

  async getAutoLockMinutes(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = 'auto_lock_minutes'`
    );
    return parseInt(row?.value ?? '5', 10);
  }

  async setAutoLockMinutes(minutes: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE app_settings SET value = ?, updated_at = datetime('now') WHERE key = 'auto_lock_minutes'`,
      [minutes.toString()]
    );
  }

  async getTeacherName(): Promise<string> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM app_settings WHERE key = 'teacher_name'`
    );
    return row?.value ?? 'Teacher';
  }

  async setTeacherName(name: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE app_settings SET value = ?, updated_at = datetime('now') WHERE key = 'teacher_name'`,
      [name]
    );
  }
}

export const securityService = new SecurityService();
