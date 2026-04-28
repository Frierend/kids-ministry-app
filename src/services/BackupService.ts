import * as FileSystem from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { closeDatabase, getDatabase } from '../database/db';
import { DB_NAME, DB_VERSION } from '../constants/app';

const TEMP_IMPORT_DB = 'kidsministry_import_validation.db';

const REQUIRED_TABLES = [
  'students',
  'ministries',
  'enrollments',
  'attendance_sessions',
  'attendance_records',
  'point_transactions',
  'market_items',
  'app_settings',
];

type RestoreResult = {
  snapshotUri: string | null;
};

class BackupService {
  async exportDatabase(): Promise<string> {
    await this.ensureSQLiteDirectory();
    await this.checkpointAndClose();

    const dbPath = this.databasePath();
    await this.requireReadableFile(dbPath, 'Database file not found');

    const exportPath = `${FileSystem.cacheDirectory ?? ''}kidsministry_backup_${this.timestamp()}.db`;
    await this.requireBaseDirectory(FileSystem.cacheDirectory, 'Cache directory is unavailable');
    await this.removeIfExists(exportPath);
    await FileSystem.copyAsync({ from: dbPath, to: exportPath });

    return exportPath;
  }

  async validateBackupFile(uri: string): Promise<void> {
    await this.ensureSQLiteDirectory();
    await this.requireReadableFile(uri, 'Backup file is missing or empty');

    const tempPath = `${this.sqliteDir()}${TEMP_IMPORT_DB}`;
    await this.removeDatabaseFiles(tempPath);
    await FileSystem.copyAsync({ from: uri, to: tempPath });

    let db: SQLite.SQLiteDatabase | null = null;
    try {
      db = await SQLite.openDatabaseAsync(TEMP_IMPORT_DB);

      const integrity = await db.getFirstAsync<Record<string, string>>('PRAGMA integrity_check;');
      const integrityValue = this.firstPragmaValue(integrity);
      if (integrityValue !== 'ok') {
        throw new Error('Backup failed SQLite integrity check');
      }

      const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
      const version = versionRow?.user_version ?? 0;
      if (version < 1) {
        throw new Error('Backup schema version is missing');
      }
      if (version > DB_VERSION) {
        throw new Error('Backup was created by a newer app version');
      }

      const placeholders = REQUIRED_TABLES.map(() => '?').join(', ');
      const rows = await db.getAllAsync<{ name: string }>(
        `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders})`,
        REQUIRED_TABLES
      );
      const found = new Set(rows.map((row) => row.name));
      const missing = REQUIRED_TABLES.filter((table) => !found.has(table));
      if (missing.length > 0) {
        throw new Error(`Backup is missing required tables: ${missing.join(', ')}`);
      }
    } finally {
      if (db) await db.closeAsync();
      await this.removeDatabaseFiles(tempPath);
    }
  }

  async restoreDatabase(uri: string): Promise<RestoreResult> {
    await this.validateBackupFile(uri);
    await this.checkpointAndClose();

    const dbPath = this.databasePath();
    const snapshotUri = `${this.sqliteDir()}kidsministry_pre_restore_${this.timestamp()}.db`;
    const existing = await FileSystem.getInfoAsync(dbPath);
    const hasCurrentDb = existing.exists;

    if (hasCurrentDb) {
      await this.removeIfExists(snapshotUri);
      await FileSystem.copyAsync({ from: dbPath, to: snapshotUri });
    }

    try {
      await this.removeDatabaseFiles(dbPath);
      await FileSystem.copyAsync({ from: uri, to: dbPath });
      await this.removeSidecars(dbPath);
    } catch (err) {
      if (hasCurrentDb) {
        await FileSystem.copyAsync({ from: snapshotUri, to: dbPath });
      }
      throw err;
    }

    return { snapshotUri: hasCurrentDb ? snapshotUri : null };
  }

  isDatabaseBackupName(nameOrUri: string): boolean {
    return nameOrUri.toLowerCase().split('?')[0].endsWith('.db');
  }

  private async checkpointAndClose(): Promise<void> {
    const db = await getDatabase();
    await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');
    await closeDatabase();
  }

  private async ensureSQLiteDirectory(): Promise<void> {
    const sqliteDir = this.sqliteDir();
    const info = await FileSystem.getInfoAsync(sqliteDir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
    }
  }

  private databasePath(): string {
    return `${this.sqliteDir()}${DB_NAME}`;
  }

  private sqliteDir(): string {
    this.requireBaseDirectory(FileSystem.documentDirectory, 'Document directory is unavailable');
    return `${FileSystem.documentDirectory}SQLite/`;
  }

  private async requireReadableFile(uri: string, missingMessage: string): Promise<void> {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      throw new Error(missingMessage);
    }
    if ('size' in info && typeof info.size === 'number' && info.size <= 0) {
      throw new Error('Backup file is empty');
    }
  }

  private async removeDatabaseFiles(dbPath: string): Promise<void> {
    await this.removeIfExists(dbPath);
    await this.removeSidecars(dbPath);
  }

  private async removeSidecars(dbPath: string): Promise<void> {
    await this.removeIfExists(`${dbPath}-wal`);
    await this.removeIfExists(`${dbPath}-shm`);
  }

  private async removeIfExists(uri: string): Promise<void> {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  }

  private requireBaseDirectory(uri: string | null, message: string): void {
    if (!uri) throw new Error(message);
  }

  private firstPragmaValue(row: Record<string, string> | null): string | null {
    if (!row) return null;
    const [value] = Object.values(row);
    return value ?? null;
  }

  private timestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }
}

export const backupService = new BackupService();
