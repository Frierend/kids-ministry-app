// src/database/schema.ts
// SQLite schema — 9 tables, WAL mode, all indexes

import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('kids_ministry.db');
  await initDatabase(_db);
  return _db;
}

async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Enable WAL mode for concurrent reads during writes
  await db.execAsync('PRAGMA journal_mode=WAL;');
  await db.execAsync('PRAGMA foreign_keys=ON;');

  await db.execAsync(`
    -- ─── STUDENTS ─────────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS students (
      id            TEXT PRIMARY KEY,
      first_name    TEXT NOT NULL,
      last_name     TEXT NOT NULL,
      photo_uri     TEXT,
      date_of_birth TEXT,
      notes         TEXT,
      is_archived   INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_students_archived
      ON students(is_archived);
    CREATE INDEX IF NOT EXISTS idx_students_name
      ON students(last_name, first_name);

    -- ─── MINISTRIES ───────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS ministries (
      id                  TEXT PRIMARY KEY,
      name                TEXT NOT NULL,
      color               TEXT NOT NULL DEFAULT '#3B7DD8',
      saturday_points     INTEGER NOT NULL DEFAULT 20,
      sunday_points       INTEGER NOT NULL DEFAULT 50,
      is_active           INTEGER NOT NULL DEFAULT 1,
      created_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ─── ENROLLMENTS ──────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS enrollments (
      id            TEXT PRIMARY KEY,
      student_id    TEXT NOT NULL REFERENCES students(id),
      ministry_id   TEXT NOT NULL REFERENCES ministries(id),
      enrolled_at   TEXT NOT NULL DEFAULT (datetime('now')),
      unenrolled_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollment_active
      ON enrollments(student_id, ministry_id)
      WHERE unenrolled_at IS NULL;

    -- ─── ATTENDANCE SESSIONS ──────────────────────────────────
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id            TEXT PRIMARY KEY,
      ministry_id   TEXT NOT NULL REFERENCES ministries(id),
      session_date  TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'committed'
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      committed_at  TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_session_unique
      ON attendance_sessions(ministry_id, session_date);
    CREATE INDEX IF NOT EXISTS idx_session_date
      ON attendance_sessions(session_date);

    -- ─── ATTENDANCE RECORDS ────────────────────────────────────
    CREATE TABLE IF NOT EXISTS attendance_records (
      id            TEXT PRIMARY KEY,
      session_id    TEXT NOT NULL REFERENCES attendance_sessions(id),
      student_id    TEXT NOT NULL REFERENCES students(id),
      status        TEXT NOT NULL DEFAULT 'absent',  -- 'present' | 'absent'
      marked_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_record_unique
      ON attendance_records(session_id, student_id);
    CREATE INDEX IF NOT EXISTS idx_record_student
      ON attendance_records(student_id);

    -- ─── POINT TRANSACTIONS (Append-Only Ledger) ──────────────
    CREATE TABLE IF NOT EXISTS point_transactions (
      id            TEXT PRIMARY KEY,
      student_id    TEXT NOT NULL REFERENCES students(id),
      points        INTEGER NOT NULL,   -- positive=award, negative=deduction
      type          TEXT NOT NULL,      -- 'attendance' | 'activity' | 'bonus' | 'redemption' | 'adjustment'
      description   TEXT NOT NULL,
      session_id    TEXT REFERENCES attendance_sessions(id),
      item_id       TEXT REFERENCES market_items(id),
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      created_by    TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_tx_student
      ON point_transactions(student_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_tx_type
      ON point_transactions(student_id, type);

    -- ─── MARKET ITEMS ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS market_items (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      description   TEXT,
      point_cost    INTEGER NOT NULL,
      quantity      INTEGER NOT NULL DEFAULT -1,  -- -1 = unlimited
      is_available  INTEGER NOT NULL DEFAULT 1,
      image_uri     TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- ─── APP SETTINGS ─────────────────────────────────────────
    CREATE TABLE IF NOT EXISTS app_settings (
      key           TEXT PRIMARY KEY,
      value         TEXT NOT NULL,
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Insert default settings if not present
  await db.execAsync(`
    INSERT OR IGNORE INTO app_settings (key, value) VALUES
      ('auto_lock_minutes', '5'),
      ('biometrics_enabled', 'false'),
      ('teacher_name', 'Teacher'),
      ('app_version', '1.0.0');
  `);
}

export type DB = SQLite.SQLiteDatabase;
