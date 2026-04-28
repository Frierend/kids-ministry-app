import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as ExpoCrypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import { getDatabase } from '../database/client';
import { BiometricResult } from '../types';

const KEYS = {
  salt:       'app_salt_v1',
  lastActive: 'last_active_at',
  failCount:  'pin_fail_count',
  failTime:   'pin_fail_time',
};

const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

async function generateSalt(): Promise<string> {
  const bytes = await ExpoCrypto.getRandomBytesAsync(32);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

class SecurityService {
  async hasPin(): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'pin_hash'"
    );
    return !!row?.value;
  }

  async setupPin(pin: string): Promise<void> {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      throw new Error('PIN must be exactly 4 digits');
    }
    let salt = await SecureStore.getItemAsync(KEYS.salt);
    if (!salt) {
      salt = await generateSalt();
      await SecureStore.setItemAsync(KEYS.salt, salt);
    }
    const hash = CryptoJS.SHA256(pin + salt).toString();
    const now = new Date().toISOString();
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('pin_hash', ?, ?)`,
      [JSON.stringify(hash), now]
    );
  }

  async verifyPin(pin: string): Promise<boolean> {
    const fails = parseInt(await SecureStore.getItemAsync(KEYS.failCount) ?? '0', 10);
    const lockoutExpiry = await this.getLockoutExpiry();
    if (lockoutExpiry && Date.now() < lockoutExpiry) return false;
    const db = await getDatabase();
    const saltStr = await SecureStore.getItemAsync(KEYS.salt);
    if (!saltStr) return false;
    const hashRow = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'pin_hash'"
    );
    if (!hashRow) return false;
    const storedHash = JSON.parse(hashRow.value);
    const inputHash = CryptoJS.SHA256(pin + saltStr).toString();
    const isValid = storedHash === inputHash;
    if (isValid) {
      await SecureStore.setItemAsync(KEYS.failCount, '0');
      await SecureStore.deleteItemAsync(KEYS.failTime);
      await this.recordActivity();
    } else {
      const newFails = fails + 1;
      if (newFails >= MAX_ATTEMPTS) {
        const expiry = Date.now() + LOCKOUT_SECONDS * 1000;
        await SecureStore.setItemAsync(KEYS.failTime, String(expiry));
        await SecureStore.setItemAsync(KEYS.failCount, '0');
      } else {
        await SecureStore.setItemAsync(KEYS.failCount, String(newFails));
      }
    }
    return isValid;
  }

  async changePin(oldPin: string, newPin: string): Promise<void> {
    const valid = await this.verifyPin(oldPin);
    if (!valid) throw new Error('Current PIN is incorrect');
    await this.setupPin(newPin);
  }

  async getFailCount(): Promise<number> {
    return parseInt(await SecureStore.getItemAsync(KEYS.failCount) ?? '0', 10);
  }

  async getLockoutExpiry(): Promise<number | null> {
    const val = await SecureStore.getItemAsync(KEYS.failTime);
    if (!val) return null;
    const expiry = parseInt(val, 10);
    if (Date.now() >= expiry) {
      await SecureStore.deleteItemAsync(KEYS.failTime);
      await SecureStore.setItemAsync(KEYS.failCount, '0');
      return null;
    }
    return expiry;
  }

  async isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  async isBiometricEnabled(): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'biometrics_enabled'"
    );
    return row?.value === 'true';
  }

  async setBiometricEnabled(enabled: boolean): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('biometrics_enabled', ?, ?)`,
      [String(enabled), now]
    );
  }

  async biometricAuth(): Promise<BiometricResult> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Kid's Ministry App",
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true,
      });
      if (result.success) {
        await this.recordActivity();
        return { success: true };
      }
      return { success: false, error: result.error ?? 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async recordActivity(): Promise<void> {
    await SecureStore.setItemAsync(KEYS.lastActive, String(Date.now()));
  }

  async isLocked(): Promise<boolean> {
    const hasPin = await this.hasPin();
    if (!hasPin) return false;
    const lastActive = await SecureStore.getItemAsync(KEYS.lastActive);
    if (!lastActive) return true;
    const lockMinutes = await this.getAutoLockMinutes();
    if (lockMinutes === 0) return false;
    const elapsed = Date.now() - parseInt(lastActive, 10);
    return elapsed > lockMinutes * 60 * 1000;
  }

  async getAutoLockMinutes(): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'auto_lock_minutes'"
    );
    return parseInt(row?.value ?? '5', 10);
  }

  async setAutoLockMinutes(minutes: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('auto_lock_minutes', ?, ?)`,
      [String(minutes), now]
    );
  }

  async getTeacherName(): Promise<string> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'teacher_name'"
    );
    return row ? JSON.parse(row.value) : 'Teacher';
  }

  async setTeacherName(name: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('teacher_name', ?, ?)`,
      [JSON.stringify(name), now]
    );
  }

  async resetApp(): Promise<void> {
    const db = await getDatabase();
    await db.execAsync('DELETE FROM point_transactions;');
    await db.execAsync('DELETE FROM attendance_records;');
    await db.execAsync('DELETE FROM attendance_sessions;');
    await db.execAsync('DELETE FROM enrollments;');
    await db.execAsync('DELETE FROM students;');
    await db.execAsync('DELETE FROM market_items;');
    await db.execAsync('DELETE FROM ministries;');
    await db.execAsync('DELETE FROM app_settings;');
    await db.execAsync('PRAGMA user_version = 0;');
    await SecureStore.deleteItemAsync(KEYS.salt);
    await SecureStore.deleteItemAsync(KEYS.lastActive);
    await SecureStore.deleteItemAsync(KEYS.failCount);
    await SecureStore.deleteItemAsync(KEYS.failTime);
  }
}

export const securityService = new SecurityService();
