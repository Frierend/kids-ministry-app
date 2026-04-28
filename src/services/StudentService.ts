import { getDatabase, withTransaction } from '../database/client';
import {
  Student, CreateStudentInput, UpdateStudentInput,
  StudentFilters, AttendanceSummary,
} from '../types';
import { Defaults } from '../constants';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function mapRow(row: any): Student {
  return { ...row, is_archived: row.is_archived === 1 };
}

type StudentPage = {
  students: Student[];
  hasMore: boolean;
  nextPage: number;
  total: number;
};

type StudentQueryFilters = Omit<StudentFilters, 'page' | 'pageSize'>;

function buildStudentQuery(filters: StudentQueryFilters = {}) {
  const {
    searchQuery = '',
    ministryId,
    includeArchived = false,
  } = filters;

  let from = 'FROM students s';
  const where = ['1=1'];
  const params: any[] = [];

  if (ministryId) {
    from += ` JOIN enrollments e ON e.student_id = s.id
      AND e.ministry_id = ? AND e.unenrolled_at IS NULL`;
    params.push(ministryId);
  }

  if (!includeArchived) where.push('s.is_archived = 0');
  if (searchQuery.trim()) {
    where.push('(s.first_name LIKE ? OR s.last_name LIKE ? OR s.nickname LIKE ?)');
    const like = `%${searchQuery.trim()}%`;
    params.push(like, like, like);
  }

  return {
    from,
    where: `WHERE ${where.join(' AND ')}`,
    params,
  };
}

class StudentService {
  async getAll(filters: StudentFilters = {}): Promise<Student[]> {
    const db = await getDatabase();
    const { page = 0, pageSize } = filters;
    const { from, where, params } = buildStudentQuery(filters);

    let query = `SELECT DISTINCT s.* ${from} ${where}
      ORDER BY s.last_name ASC, s.first_name ASC`;
    const queryParams = [...params];

    if (pageSize !== undefined) {
      query += ' LIMIT ? OFFSET ?';
      queryParams.push(pageSize, page * pageSize);
    }

    const rows = await db.getAllAsync<any>(query, queryParams);
    return rows.map(mapRow);
  }

  async getPage(filters: StudentFilters = {}): Promise<StudentPage> {
    const page = filters.page ?? 0;
    const pageSize = filters.pageSize ?? Defaults.pageSize;
    const rows = await this.getAll({ ...filters, page, pageSize: pageSize + 1 });
    const hasMore = rows.length > pageSize;
    const students = hasMore ? rows.slice(0, pageSize) : rows;
    const total = await this.count(filters);

    return {
      students,
      hasMore,
      nextPage: page + 1,
      total,
    };
  }

  async count(filters: StudentQueryFilters = {}): Promise<number> {
    const db = await getDatabase();
    const { from, where, params } = buildStudentQuery(filters);
    const row = await db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(DISTINCT s.id) AS total ${from} ${where}`,
      params
    );
    return row?.total ?? 0;
  }

  async getById(id: number): Promise<Student | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>('SELECT * FROM students WHERE id = ?', [id]);
    return row ? mapRow(row) : null;
  }

  async create(data: CreateStudentInput): Promise<Student> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const id_uuid = uuid();

    const result = await db.runAsync(
      `INSERT INTO students
         (uuid, first_name, last_name, nickname, birth_date,
          guardian_name, guardian_contact, photo_uri,
          is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id_uuid,
        data.first_name.trim(),
        data.last_name.trim(),
        data.nickname?.trim() || null,
        data.birth_date || null,
        data.guardian_name?.trim() || null,
        data.guardian_contact?.trim() || null,
        data.photo_uri || null,
        now, now,
      ]
    );

    const studentId = result.lastInsertRowId;

    if (data.ministry_ids?.length) {
      for (const mid of data.ministry_ids) {
        await db.runAsync(
          `INSERT OR IGNORE INTO enrollments (student_id, ministry_id, enrolled_at) VALUES (?, ?, ?)`,
          [studentId, mid, now]
        );
      }
    }

    return (await this.getById(studentId))!;
  }

  async update(id: number, data: UpdateStudentInput): Promise<Student> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.first_name !== undefined) { fields.push('first_name = ?'); values.push(data.first_name.trim()); }
    if (data.last_name !== undefined)  { fields.push('last_name = ?');  values.push(data.last_name.trim()); }
    if (data.nickname !== undefined)   { fields.push('nickname = ?');   values.push(data.nickname || null); }
    if (data.birth_date !== undefined) { fields.push('birth_date = ?'); values.push(data.birth_date || null); }
    if (data.guardian_name !== undefined) { fields.push('guardian_name = ?'); values.push(data.guardian_name || null); }
    if (data.guardian_contact !== undefined) { fields.push('guardian_contact = ?'); values.push(data.guardian_contact || null); }
    if (data.photo_uri !== undefined)  { fields.push('photo_uri = ?');  values.push(data.photo_uri || null); }

    if (!fields.length) return (await this.getById(id))!;

    fields.push('updated_at = ?');
    values.push(now, id);

    await db.runAsync(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`, values);
    return (await this.getById(id))!;
  }

  async archive(id: number, reason: string): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE students SET is_archived = 1, archived_at = ?, archived_reason = ?, updated_at = ? WHERE id = ?`,
      [now, reason, now, id]
    );
  }

  async restore(id: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE students SET is_archived = 0, archived_at = NULL, archived_reason = NULL, updated_at = ? WHERE id = ?`,
      [now, id]
    );
  }

  /**
   * PERMANENTLY delete a student and ALL their data.
   * This is irreversible — use only after explicit double-confirmation.
   * Deletes: enrollments, attendance_records, point_transactions, then the student row.
   */
  async permanentDelete(id: number): Promise<void> {
    await withTransaction(async (db) => {
      // Delete point transactions
      await db.runAsync('DELETE FROM point_transactions WHERE student_id = ?', [id]);
      // Delete attendance records
      await db.runAsync('DELETE FROM attendance_records WHERE student_id = ?', [id]);
      // Delete enrollments
      await db.runAsync('DELETE FROM enrollments WHERE student_id = ?', [id]);
      // Delete the student
      await db.runAsync('DELETE FROM students WHERE id = ?', [id]);
    });
  }

  async getPointBalance(id: number): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ balance: number }>(
      'SELECT COALESCE(SUM(points), 0) AS balance FROM point_transactions WHERE student_id = ?',
      [id]
    );
    return row?.balance ?? 0;
  }

  async getAttendanceSummary(id: number, ministryId?: number): Promise<AttendanceSummary> {
    const db = await getDatabase();
    let query = `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN ar.is_present = 1 THEN 1 ELSE 0 END) AS present,
        MAX(CASE WHEN ar.is_present = 1 THEN s.session_date ELSE NULL END) AS last_attended
      FROM attendance_records ar
      JOIN attendance_sessions s ON s.id = ar.session_id
      WHERE ar.student_id = ? AND s.status = 'committed'
    `;
    const params: any[] = [id];
    if (ministryId) { query += ' AND s.ministry_id = ?'; params.push(ministryId); }

    const row = await db.getFirstAsync<any>(query, params);
    const total = row?.total ?? 0;
    const present = row?.present ?? 0;

    return {
      total_sessions: total,
      present_count: present,
      absent_count: total - present,
      attendance_percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      last_attended: row?.last_attended ?? null,
      streak: await this._calculateStreak(id),
    };
  }

  private async _calculateStreak(studentId: number): Promise<number> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ session_date: string; is_present: number }>(
      `SELECT s.session_date, ar.is_present
       FROM attendance_records ar
       JOIN attendance_sessions s ON s.id = ar.session_id
       WHERE ar.student_id = ? AND s.status = 'committed'
       ORDER BY s.session_date DESC LIMIT 30`,
      [studentId]
    );
    let streak = 0;
    for (const r of rows) {
      if (r.is_present === 1) streak++;
      else break;
    }
    return streak;
  }

  async getEnrolledMinistries(studentId: number): Promise<number[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ ministry_id: number }>(
      `SELECT ministry_id FROM enrollments WHERE student_id = ? AND unenrolled_at IS NULL`,
      [studentId]
    );
    return rows.map((r) => r.ministry_id);
  }
}

export const studentService = new StudentService();
