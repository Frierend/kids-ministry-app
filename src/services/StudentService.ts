// src/services/StudentService.ts
// Manages student CRUD, enrollment, and point balance queries

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema';
import type { Student, Enrollment, Ministry } from '../types';

class StudentService {
  // ── Read ────────────────────────────────────────────────

  async getAll(includeArchived = false): Promise<Student[]> {
    const db = await getDatabase();
    const query = includeArchived
      ? `SELECT s.*,
           COALESCE((SELECT SUM(pt.points) FROM point_transactions pt WHERE pt.student_id = s.id), 0) AS balance
         FROM students s
         ORDER BY s.last_name, s.first_name`
      : `SELECT s.*,
           COALESCE((SELECT SUM(pt.points) FROM point_transactions pt WHERE pt.student_id = s.id), 0) AS balance
         FROM students s
         WHERE s.is_archived = 0
         ORDER BY s.last_name, s.first_name`;
    const rows = await db.getAllAsync<any>(query);
    return rows.map(this._mapRow);
  }

  async getById(id: string): Promise<Student | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT s.*,
         COALESCE((SELECT SUM(pt.points) FROM point_transactions pt WHERE pt.student_id = s.id), 0) AS balance
       FROM students s WHERE s.id = ?`,
      [id]
    );
    return row ? this._mapRow(row) : null;
  }

  async search(query: string, includeArchived = false): Promise<Student[]> {
    const db = await getDatabase();
    const like = `%${query}%`;
    const archiveClause = includeArchived ? '' : 'AND s.is_archived = 0';
    const rows = await db.getAllAsync<any>(
      `SELECT s.*,
         COALESCE((SELECT SUM(pt.points) FROM point_transactions pt WHERE pt.student_id = s.id), 0) AS balance
       FROM students s
       WHERE (s.first_name LIKE ? OR s.last_name LIKE ?) ${archiveClause}
       ORDER BY s.last_name, s.first_name`,
      [like, like]
    );
    return rows.map(this._mapRow);
  }

  async getByMinistry(ministryId: string): Promise<Student[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT s.*,
         COALESCE((SELECT SUM(pt.points) FROM point_transactions pt WHERE pt.student_id = s.id), 0) AS balance
       FROM students s
       INNER JOIN enrollments e ON e.student_id = s.id
       WHERE e.ministry_id = ? AND e.unenrolled_at IS NULL AND s.is_archived = 0
       ORDER BY s.last_name, s.first_name`,
      [ministryId]
    );
    return rows.map(this._mapRow);
  }

  async getBalance(studentId: string): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ balance: number }>(
      `SELECT COALESCE(SUM(points), 0) AS balance
       FROM point_transactions
       WHERE student_id = ?`,
      [studentId]
    );
    return row?.balance ?? 0;
  }

  // ── Write ───────────────────────────────────────────────

  async create(data: {
    first_name: string;
    last_name: string;
    photo_uri?: string;
    date_of_birth?: string;
    notes?: string;
  }): Promise<Student> {
    const db = await getDatabase();
    const id = uuidv4();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO students (id, first_name, last_name, photo_uri, date_of_birth, notes, is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [id, data.first_name, data.last_name, data.photo_uri ?? null, data.date_of_birth ?? null, data.notes ?? null, now, now]
    );
    return (await this.getById(id))!;
  }

  async update(id: string, data: Partial<{
    first_name: string;
    last_name: string;
    photo_uri: string | null;
    date_of_birth: string | null;
    notes: string | null;
  }>): Promise<Student> {
    const db = await getDatabase();
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    await db.runAsync(
      `UPDATE students SET ${fields}, updated_at = datetime('now') WHERE id = ?`,
      [...values, id]
    );
    return (await this.getById(id))!;
  }

  async archive(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE students SET is_archived = 1, updated_at = datetime('now') WHERE id = ?`,
      [id]
    );
    // Unenroll from all ministries
    await db.runAsync(
      `UPDATE enrollments SET unenrolled_at = datetime('now')
       WHERE student_id = ? AND unenrolled_at IS NULL`,
      [id]
    );
  }

  async restore(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE students SET is_archived = 0, updated_at = datetime('now') WHERE id = ?`,
      [id]
    );
  }

  // ── Enrollments ─────────────────────────────────────────

  async getEnrollments(studentId: string): Promise<(Enrollment & { ministry: Ministry })[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT e.*, m.id as m_id, m.name as m_name, m.color as m_color,
              m.saturday_points, m.sunday_points, m.is_active
       FROM enrollments e
       INNER JOIN ministries m ON m.id = e.ministry_id
       WHERE e.student_id = ? AND e.unenrolled_at IS NULL
       ORDER BY m.name`,
      [studentId]
    );
    return rows.map(r => ({
      id: r.id,
      student_id: r.student_id,
      ministry_id: r.ministry_id,
      enrolled_at: r.enrolled_at,
      unenrolled_at: r.unenrolled_at,
      ministry: {
        id: r.m_id,
        name: r.m_name,
        color: r.m_color,
        saturday_points: r.saturday_points,
        sunday_points: r.sunday_points,
        is_active: r.is_active === 1,
        created_at: '',
      },
    }));
  }

  async enroll(studentId: string, ministryId: string): Promise<void> {
    const db = await getDatabase();
    // Check for existing active enrollment
    const existing = await db.getFirstAsync<any>(
      `SELECT id FROM enrollments WHERE student_id = ? AND ministry_id = ? AND unenrolled_at IS NULL`,
      [studentId, ministryId]
    );
    if (existing) throw new Error('Student is already enrolled in this ministry');
    await db.runAsync(
      `INSERT INTO enrollments (id, student_id, ministry_id) VALUES (?, ?, ?)`,
      [uuidv4(), studentId, ministryId]
    );
  }

  async unenroll(studentId: string, ministryId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `UPDATE enrollments SET unenrolled_at = datetime('now')
       WHERE student_id = ? AND ministry_id = ? AND unenrolled_at IS NULL`,
      [studentId, ministryId]
    );
  }

  // ── Private ─────────────────────────────────────────────

  private _mapRow(row: any): Student {
    return {
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      photo_uri: row.photo_uri,
      date_of_birth: row.date_of_birth,
      notes: row.notes,
      is_archived: row.is_archived === 1,
      created_at: row.created_at,
      updated_at: row.updated_at,
      balance: row.balance ?? 0,
    };
  }
}

export const studentService = new StudentService();
