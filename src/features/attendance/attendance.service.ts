import { getDatabase, withTransaction } from '../../database/db';
import {
  AttendanceSession, SessionStudent, BulkAttendanceRecord,
  CommitResult, CalendarDay, DayOfWeek,
} from '../../types';
import { ministryService } from '../ministries/ministry.service';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getDayOfWeek(dateStr: string): DayOfWeek {
  const days: DayOfWeek[] = [
    'sunday','monday','tuesday','wednesday','thursday','friday','saturday',
  ];
  return days[new Date(dateStr + 'T00:00:00').getDay()];
}

class AttendanceService {

  /**
   * Get or create a draft session.
   * @param customPoints  Optional override — if provided, updates points_awarded on existing drafts too.
   */
  async getOrCreateSession(
    ministryId: number,
    date: string,
    customPoints?: number
  ): Promise<AttendanceSession> {
    const db = await getDatabase();

    const existing = await db.getFirstAsync<any>(
      `SELECT s.*, m.name AS ministry_name,
         (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.is_present = 1) AS present_count,
         (SELECT COUNT(*) FROM enrollments e WHERE e.ministry_id = s.ministry_id AND e.unenrolled_at IS NULL) AS total_count
       FROM attendance_sessions s
       JOIN ministries m ON m.id = s.ministry_id
       WHERE s.ministry_id = ? AND s.session_date = ?`,
      [ministryId, date]
    );

    if (existing) {
      // If custom points provided and session is still draft, update it
      if (customPoints !== undefined && existing.status === 'draft' && existing.points_awarded !== customPoints) {
        await db.runAsync(
          'UPDATE attendance_sessions SET points_awarded = ? WHERE id = ?',
          [customPoints, existing.id]
        );
        existing.points_awarded = customPoints;
      }
      return mapSession(existing);
    }

    // Create new draft
    const dayOfWeek = getDayOfWeek(date);
    const pointsAwarded = customPoints ?? await ministryService.getPointsForDay(ministryId, dayOfWeek);
    const now = new Date().toISOString();
    const sessionUUID = uuid();

    await db.runAsync(
      `INSERT INTO attendance_sessions
         (uuid, ministry_id, session_date, day_of_week, points_awarded, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?)`,
      [sessionUUID, ministryId, date, dayOfWeek, pointsAwarded, now]
    );

    // Pre-populate absent records
    const enrolled = await db.getAllAsync<{ id: number }>(
      `SELECT s.id FROM students s
       JOIN enrollments e ON e.student_id = s.id
       WHERE e.ministry_id = ? AND e.unenrolled_at IS NULL AND s.is_archived = 0`,
      [ministryId]
    );

    const sessionRow = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM attendance_sessions WHERE uuid = ?', [sessionUUID]
    );

    if (sessionRow) {
      for (const student of enrolled) {
        await db.runAsync(
          `INSERT OR IGNORE INTO attendance_records (session_id, student_id, is_present) VALUES (?, ?, 0)`,
          [sessionRow.id, student.id]
        );
      }
    }

    return (await this.getOrCreateSession(ministryId, date));
  }

  async getSessionStudents(sessionId: number): Promise<SessionStudent[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT s.*,
         COALESCE(ar.is_present, 0) AS is_present,
         ar.marked_at,
         ar.note
       FROM students s
       JOIN attendance_records ar ON ar.student_id = s.id AND ar.session_id = ?
       WHERE s.is_archived = 0
       ORDER BY s.last_name ASC, s.first_name ASC`,
      [sessionId]
    );
    return rows.map((r) => ({
      ...r,
      is_archived: r.is_archived === 1,
      is_present: r.is_present === 1,
    }));
  }

  async markPresent(sessionId: number, studentId: number): Promise<void> {
    await this._checkDraft(sessionId);
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO attendance_records (session_id, student_id, is_present, marked_at)
       VALUES (?, ?, 1, ?)
       ON CONFLICT(session_id, student_id)
       DO UPDATE SET is_present = 1, marked_at = ?`,
      [sessionId, studentId, now, now]
    );
  }

  async markAbsent(sessionId: number, studentId: number, note?: string): Promise<void> {
    await this._checkDraft(sessionId);
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO attendance_records (session_id, student_id, is_present, marked_at, note)
       VALUES (?, ?, 0, ?, ?)
       ON CONFLICT(session_id, student_id)
       DO UPDATE SET is_present = 0, marked_at = ?, note = ?`,
      [sessionId, studentId, now, note ?? null, now, note ?? null]
    );
  }

  async markBulk(sessionId: number, records: BulkAttendanceRecord[]): Promise<void> {
    await this._checkDraft(sessionId);
    await withTransaction(async (db) => {
      const now = new Date().toISOString();
      for (const rec of records) {
        await db.runAsync(
          `INSERT INTO attendance_records (session_id, student_id, is_present, marked_at, note)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(session_id, student_id)
           DO UPDATE SET is_present = ?, marked_at = ?, note = ?`,
          [
            sessionId, rec.student_id, rec.is_present ? 1 : 0, now, rec.note ?? null,
            rec.is_present ? 1 : 0, now, rec.note ?? null,
          ]
        );
      }
    });
  }

  async commitSession(sessionId: number): Promise<CommitResult> {
    const db = await getDatabase();

    const session = await db.getFirstAsync<any>(
      'SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]
    );
    if (!session) throw new Error('Session not found');
    if (session.status === 'committed') throw new Error('Session already committed');

    const presentStudents = await db.getAllAsync<{ student_id: number }>(
      `SELECT student_id FROM attendance_records WHERE session_id = ? AND is_present = 1`,
      [sessionId]
    );
    const totalStudents = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM attendance_records WHERE session_id = ?',
      [sessionId]
    );

    await withTransaction(async (db) => {
      const now = new Date().toISOString();
      for (const { student_id } of presentStudents) {
        const txUUID = uuid();
        await db.runAsync(
          `INSERT INTO point_transactions
             (uuid, student_id, type, points, reason, reference_id, reference_type, created_at)
           VALUES (?, ?, 'attendance', ?, ?, ?, 'session', ?)`,
          [
            txUUID, student_id, session.points_awarded,
            `Attendance: ${session.session_date} (${session.day_of_week})`,
            session.uuid, now,
          ]
        );
      }
      await db.runAsync(
        `UPDATE attendance_sessions SET status = 'committed', committed_at = ? WHERE id = ?`,
        [now, sessionId]
      );
    });

    const updatedSession = await db.getFirstAsync<any>(
      'SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]
    );

    return {
      session: mapSession(updatedSession!),
      awarded_count: presentStudents.length,
      total_students: totalStudents?.count ?? 0,
      points_per_student: session.points_awarded,
      total_points_awarded: presentStudents.length * session.points_awarded,
    };
  }

  async undoCommit(sessionId: number): Promise<void> {
    const db = await getDatabase();
    const session = await db.getFirstAsync<any>(
      'SELECT * FROM attendance_sessions WHERE id = ?', [sessionId]
    );
    if (!session || session.status !== 'committed') throw new Error('Session is not committed');

    await withTransaction(async (db) => {
      await db.runAsync(
        `DELETE FROM point_transactions WHERE reference_id = ? AND reference_type = 'session'`,
        [session.uuid]
      );
      await db.runAsync(
        `UPDATE attendance_sessions SET status = 'draft', committed_at = NULL WHERE id = ?`,
        [sessionId]
      );
    });
  }

  async getRecentSessions(ministryId?: number, limit = 10): Promise<AttendanceSession[]> {
    const db = await getDatabase();
    let query = `
      SELECT s.*, m.name AS ministry_name,
        (SELECT COUNT(*) FROM attendance_records ar WHERE ar.session_id = s.id AND ar.is_present = 1) AS present_count,
        (SELECT COUNT(*) FROM attendance_records ar2 WHERE ar2.session_id = s.id) AS total_count
      FROM attendance_sessions s
      JOIN ministries m ON m.id = s.ministry_id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (ministryId) { query += ' AND s.ministry_id = ?'; params.push(ministryId); }
    query += ' ORDER BY s.session_date DESC, s.created_at DESC LIMIT ?';
    params.push(limit);
    const rows = await db.getAllAsync<any>(query, params);
    return rows.map(mapSession);
  }

  async getStudentCalendar(studentId: number, year: number, month: number): Promise<CalendarDay[]> {
    const db = await getDatabase();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    const rows = await db.getAllAsync<any>(
      `SELECT s.session_date, ar.is_present, m.name AS ministry_name
       FROM attendance_records ar
       JOIN attendance_sessions s ON s.id = ar.session_id
       JOIN ministries m ON m.id = s.ministry_id
       WHERE ar.student_id = ? AND s.session_date BETWEEN ? AND ? AND s.status = 'committed'
       ORDER BY s.session_date ASC`,
      [studentId, startDate, endDate]
    );
    const map = new Map<string, CalendarDay>();
    for (const row of rows) {
      if (!map.has(row.session_date)) {
        map.set(row.session_date, { date: row.session_date, status: 'absent', sessions: [] });
      }
      const day = map.get(row.session_date)!;
      day.sessions.push({ ministry_name: row.ministry_name, is_present: row.is_present === 1 });
      if (row.is_present === 1) day.status = 'present';
    }
    return Array.from(map.values());
  }

  async getPresentCount(sessionId: number): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM attendance_records WHERE session_id = ? AND is_present = 1',
      [sessionId]
    );
    return row?.count ?? 0;
  }

  private async _checkDraft(sessionId: number): Promise<void> {
    const db = await getDatabase();
    const session = await db.getFirstAsync<{ status: string }>(
      'SELECT status FROM attendance_sessions WHERE id = ?', [sessionId]
    );
    if (!session) throw new Error('Session not found');
    if (session.status === 'committed') throw new Error('Cannot modify a committed session');
  }
}

function mapSession(row: any): AttendanceSession {
  return { ...row };
}

export const attendanceService = new AttendanceService();
