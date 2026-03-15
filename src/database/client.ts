import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('kidsministry.db');
  await _db.execAsync('PRAGMA journal_mode=WAL;');
  await _db.execAsync('PRAGMA foreign_keys=ON;');
  await _db.execAsync('PRAGMA cache_size=-8000;'); // 8MB cache
  return _db;
}

export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}

/** Execute a write inside a transaction. Rolls back on any error. */
export async function withTransaction<T>(
  fn: (db: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  const db = await getDatabase();
  await db.execAsync('BEGIN TRANSACTION;');
  try {
    const result = await fn(db);
    await db.execAsync('COMMIT;');
    return result;
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }
}
