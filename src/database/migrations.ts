import { getDatabase, withTransaction } from './db';
import { DEFAULT_MINISTRIES, Defaults } from '../constants';

const CURRENT_VERSION = 1;

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function runMigrations(): Promise<void> {
  const db = await getDatabase();
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;
  if (currentVersion >= CURRENT_VERSION) return;

  // ── All DDL inside one transaction (EXCEPT the version pragma) ──
  await withTransaction(async (db) => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        nickname TEXT,
        birth_date TEXT,
        guardian_name TEXT,
        guardian_contact TEXT,
        photo_uri TEXT,
        is_archived INTEGER NOT NULL DEFAULT 0,
        archived_at TEXT,
        archived_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_students_archived ON students(is_archived);');
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_students_name ON students(last_name, first_name);');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ministries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        active_days TEXT NOT NULL DEFAULT '[]',
        points_config TEXT NOT NULL DEFAULT '{"saturday":20,"sunday":50}',
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL REFERENCES students(id),
        ministry_id INTEGER NOT NULL REFERENCES ministries(id),
        enrolled_at TEXT NOT NULL,
        unenrolled_at TEXT
      );
    `);
    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollment_active
        ON enrollments(student_id, ministry_id) WHERE unenrolled_at IS NULL;
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        ministry_id INTEGER NOT NULL REFERENCES ministries(id),
        session_date TEXT NOT NULL,
        day_of_week TEXT NOT NULL,
        points_awarded INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'draft',
        committed_at TEXT,
        created_at TEXT NOT NULL
      );
    `);
    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_session_unique
        ON attendance_sessions(ministry_id, session_date);
    `);
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_session_date ON attendance_sessions(session_date);');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL REFERENCES attendance_sessions(id),
        student_id INTEGER NOT NULL REFERENCES students(id),
        is_present INTEGER NOT NULL DEFAULT 0,
        marked_at TEXT,
        note TEXT,
        UNIQUE(session_id, student_id)
      );
    `);
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_record_student ON attendance_records(student_id);');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS point_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        student_id INTEGER NOT NULL REFERENCES students(id),
        type TEXT NOT NULL,
        points INTEGER NOT NULL,
        reason TEXT NOT NULL,
        reference_id TEXT,
        reference_type TEXT,
        awarded_by TEXT,
        created_at TEXT NOT NULL
      );
    `);
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_tx_student
        ON point_transactions(student_id, created_at DESC);
    `);
    await db.execAsync('CREATE INDEX IF NOT EXISTS idx_tx_type ON point_transactions(student_id, type);');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS market_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        point_cost INTEGER NOT NULL CHECK(point_cost > 0),
        stock INTEGER NOT NULL DEFAULT -1,
        photo_uri TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    const now = new Date().toISOString();
    await db.execAsync(`
      INSERT OR IGNORE INTO app_settings (key, value, updated_at) VALUES
        ('teacher_name', '"Teacher"', '${now}'),
        ('auto_lock_minutes', '5', '${now}'),
        ('biometrics_enabled', 'false', '${now}'),
        ('app_version', '"1.0.0"', '${now}');
    `);

    for (const m of DEFAULT_MINISTRIES) {
      const id_uuid = generateUUID();
      await db.runAsync(
        'INSERT OR IGNORE INTO ministries (uuid, name, description, active_days, points_config, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)',
        [id_uuid, m.name, m.description, JSON.stringify(m.active_days), JSON.stringify(m.points_config), now, now]
      );
    }
  });

  // ── CRITICAL: set version OUTSIDE transaction ──
  await db.execAsync(`PRAGMA user_version = ${CURRENT_VERSION};`);
}
