// src/services/AttendanceService.ts
// Manages sessions and attendance records with atomic commit

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema';
import type { AttendanceSession, AttendanceRecord, AttendanceStatus } from '../types';
import { getPointsForDay } from '../types';
import { ministryService } from './MinistryService';

class AttendanceService {
  // ── Sessions ────────────────────────────────────────────

  async getOrCreateSession(ministryId: string, sessionDate: string): Promise<AttendanceSession> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<any>(
      `SELECT * FROM attendance_sessions WHERE ministry_id = ? AND session_date = ?`,
      [ministryId, sessionDate]
    );
    if (existing) return this._mapSession(existing);

    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO attendance_sessions (id, ministry_id, session_date, status) VALUES (?, ?, ?, 'draft')`,
      [id, ministryId, sessionDate]
    );

    // Pre-populate records for all enrolled students as 'absent'
    const students = await db.getAllAsync<{ id: string }>(
      `SELECT s.id FROM students s
       INNER JOIN enrollments e ON e.student_id = s.id
       WHERE e.ministry_id = ? AND e.unenrolled_at IS NULL AND s.is_archived = 0`,
      [ministryId]
    );
    for (const student of students) {
      await db.runAsync(
        `INSERT OR IGNORE INTO attendance_records (id, session_id, student_id, status)
         VALUES (?, ?, ?, 'absent')`,
        [uuidv4(), id, student.id]
      );
    }

    return (await this.getSessionById(id))!;
  }

  async getSessionById(sessionId: string): Promise<AttendanceSession | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT s.*, m.name as ministry_name, m.color as ministry_color
       FROM attendance_sessions s
       LEFT JOIN ministries m ON m.id = s.ministry_id
       WHERE s.id = ?`,
      [sessionId]
    );
    if (!row) return null;
    const session = this._mapSession(row);
    session.records = await this.getRecords(sessionId);
    session.present_count = session.records.filter(r => r.status === 'present').length;
    session.total_count = session.records.length;
    return session;
  }

  async getSessionsByMinistry(ministryId: string, limit = 30): Promise<AttendanceSession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT s.*,
         (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'present') as present_count,
         (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id) as total_count
       FROM attendance_sessions s
       WHERE s.ministry_id = ?
       ORDER BY s.session_date DESC
       LIMIT ?`,
      [ministryId, limit]
    );
    return rows.map(r => ({ ...this._mapSession(r), present_count: r.present_count, total_count: r.total_count }));
  }

  async getRecentSessions(limit = 10): Promise<AttendanceSession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT s.*, m.name as ministry_name, m.color as ministry_color,
         (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.status = 'present') as present_count,
         (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id) as total_count
       FROM attendance_sessions s
       LEFT JOIN ministries m ON m.id = s.ministry_id
       ORDER BY s.session_date DESC, s.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map(r => ({ ...this._mapSession(r), present_count: r.present_count, total_count: r.total_count }));
  }

  // ── Records ─────────────────────────────────────────────

  async getRecords(sessionId: string): Promise<AttendanceRecord[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT ar.*,
         s.first_name, s.last_name, s.photo_uri
       FROM attendance_records ar
       INNER JOIN students s ON s.id = ar.student_id
       WHERE ar.session_id = ?
       ORDER BY s.last_name, s.first_name`,
      [sessionId]
    );
    return rows.map(r => ({
      id: r.id,
      session_id: r.session_id,
      student_id: r.student_id,
      status: r.status as AttendanceStatus,
      marked_at: r.marked_at,
      student: {
        id: r.student_id,
        first_name: r.first_name,
        last_name: r.last_name,
        photo_uri: r.photo_uri,
        is_archived: false,
        created_at: '',
        updated_at: '',
      },
    }));
  }

  async markAttendance(sessionId: string, studentId: string, status: AttendanceStatus): Promise<void> {
    const db = await getDatabase();
    // Guard: session must be draft
    const session = await db.getFirstAsync<{ status: string }>(
      `SELECT status FROM attendance_sessions WHERE id = ?`,
      [sessionId]
    );
    if (!session) throw new Error('Session not found');
    if (session.status === 'committed') throw new Error('Cannot modify a committed session');

    await db.runAsync(
      `INSERT INTO attendance_records (id, session_id, student_id, status)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(session_id, student_id) DO UPDATE SET status = excluded.status, marked_at = datetime('now')`,
      [uuidv4(), sessionId, studentId, status]
    );
  }

  // ── Commit ───────────────────────────────────────────────
  // Atomically: mark session committed + insert point_transactions for present students

  async commitSession(sessionId: string): Promise<{ pointsAwarded: number; presentCount: number }> {
    const db = await getDatabase();

    // Guard: must be draft
    const session = await db.getFirstAsync<any>(
      `SELECT s.*, m.saturday_points, m.sunday_points
       FROM attendance_sessions s
       INNER JOIN ministries m ON m.id = s.ministry_id
       WHERE s.id = ?`,
      [sessionId]
    );
    if (!session) throw new Error('Session not found');
    if (session.status === 'committed') throw new Error('Session already committed');

    const ministry = await ministryService.getById(session.ministry_id);
    if (!ministry) throw new Error('Ministry not found');

    const pointsPerStudent = getPointsForDay(ministry, session.session_date);

    const presentRecords = await db.getAllAsync<{ student_id: string }>(
      `SELECT student_id FROM attendance_records WHERE session_id = ? AND status = 'present'`,
      [sessionId]
    );

    // Single atomic transaction
    await db.execAsync('BEGIN TRANSACTION');
    try {
      for (const record of presentRecords) {
        await db.runAsync(
          `INSERT INTO point_transactions (id, student_id, points, type, description, session_id, created_at)
           VALUES (?, ?, ?, 'attendance', ?, ?, datetime('now'))`,
          [
            uuidv4(),
            record.student_id,
            pointsPerStudent,
            `Attendance — ${session.session_date}`,
            sessionId,
          ]
        );
      }
      await db.runAsync(
        `UPDATE attendance_sessions SET status = 'committed', committed_at = datetime('now') WHERE id = ?`,
        [sessionId]
      );
      await db.execAsync('COMMIT');
    } catch (err) {
      await db.execAsync('ROLLBACK');
      throw err;
    }

    return { pointsAwarded: pointsPerStudent * presentRecords.length, presentCount: presentRecords.length };
  }

  // ── Student history ──────────────────────────────────────

  async getStudentAttendanceHistory(studentId: string, limit = 30): Promise<any[]> {
    const db = await getDatabase();
    return db.getAllAsync<any>(
      `SELECT ar.*, s_sess.session_date, s_sess.ministry_id, m.name as ministry_name, m.color as ministry_color
       FROM attendance_records ar
       INNER JOIN attendance_sessions s_sess ON s_sess.id = ar.session_id
       INNER JOIN ministries m ON m.id = s_sess.ministry_id
       WHERE ar.student_id = ?
       ORDER BY s_sess.session_date DESC
       LIMIT ?`,
      [studentId, limit]
    );
  }

  // ── Private ─────────────────────────────────────────────

  private _mapSession(row: any): AttendanceSession {
    return {
      id: row.id,
      ministry_id: row.ministry_id,
      session_date: row.session_date,
      status: row.status,
      created_at: row.created_at,
      committed_at: row.committed_at,
      ministry: row.ministry_name ? {
        id: row.ministry_id,
        name: row.ministry_name,
        color: row.ministry_color ?? '#3B7DD8',
        saturday_points: row.saturday_points ?? 20,
        sunday_points: row.sunday_points ?? 50,
        is_active: true,
        created_at: '',
      } : undefined,
    };
  }
}

export const attendanceService = new AttendanceService();
