import { getDatabase } from '../database/client';
import { Ministry, CreateMinistryInput, DayOfWeek, Enrollment } from '../types';
import { Defaults } from '../constants';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function validatePoints(config: any): void {
  if (config.saturday !== undefined && config.saturday !== 20) {
    throw new Error('Saturday points must always be 20');
  }
  if (config.sunday !== undefined && config.sunday !== 50) {
    throw new Error('Sunday points must always be 50');
  }
}

function mapRow(row: any): Ministry {
  return {
    ...row,
    is_archived: row.is_archived === 1,
    active_days: JSON.parse(row.active_days || '[]'),
    points_config: JSON.parse(row.points_config || '{"saturday":20,"sunday":50}'),
  };
}

class MinistryService {
  async getAll(includeArchived = false): Promise<Ministry[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT m.*,
         (SELECT COUNT(*) FROM enrollments e
          WHERE e.ministry_id = m.id AND e.unenrolled_at IS NULL) AS student_count
       FROM ministries m
       WHERE m.is_archived = ${includeArchived ? '0 OR m.is_archived = 1' : '0'}
       ORDER BY m.name ASC`
    );
    return rows.map(mapRow);
  }

  async getById(id: number): Promise<Ministry | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT m.*,
         (SELECT COUNT(*) FROM enrollments e
          WHERE e.ministry_id = m.id AND e.unenrolled_at IS NULL) AS student_count
       FROM ministries m WHERE m.id = ?`,
      [id]
    );
    return row ? mapRow(row) : null;
  }

  async create(data: CreateMinistryInput): Promise<Ministry> {
    const db = await getDatabase();

    // Validate fixed points
    validatePoints(data.points_config);

    // Ensure saturday/sunday are always correct
    const config = {
      ...data.points_config,
      saturday: 20 as const,
      sunday: 50 as const,
    };

    const now = new Date().toISOString();
    const id_uuid = uuid();

    const result = await db.runAsync(
      `INSERT INTO ministries
         (uuid, name, description, active_days, points_config, is_archived, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        id_uuid,
        data.name.trim(),
        data.description?.trim() || null,
        JSON.stringify(data.active_days),
        JSON.stringify(config),
        now, now,
      ]
    );

    return (await this.getById(result.lastInsertRowId))!;
  }

  async update(id: number, data: Partial<CreateMinistryInput>): Promise<Ministry> {
    const db = await getDatabase();
    const now = new Date().toISOString();

    if (data.points_config) validatePoints(data.points_config);

    const current = await this.getById(id);
    if (!current) throw new Error('Ministry not found');

    const newConfig = data.points_config
      ? { ...current.points_config, ...data.points_config, saturday: 20 as const, sunday: 50 as const }
      : current.points_config;

    const newDays = data.active_days ?? current.active_days;

    await db.runAsync(
      `UPDATE ministries
       SET name = ?, description = ?, active_days = ?, points_config = ?, updated_at = ?
       WHERE id = ?`,
      [
        data.name?.trim() ?? current.name,
        data.description?.trim() ?? current.description,
        JSON.stringify(newDays),
        JSON.stringify(newConfig),
        now, id,
      ]
    );

    return (await this.getById(id))!;
  }

  async archive(id: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE ministries SET is_archived = 1, updated_at = ? WHERE id = ?',
      [now, id]
    );
  }

  async restore(id: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      'UPDATE ministries SET is_archived = 0, updated_at = ? WHERE id = ?',
      [now, id]
    );
  }

  async enroll(studentId: number, ministryId: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR IGNORE INTO enrollments (student_id, ministry_id, enrolled_at)
       VALUES (?, ?, ?)`,
      [studentId, ministryId, now]
    );
  }

  async unenroll(studentId: number, ministryId: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.runAsync(
      `UPDATE enrollments
       SET unenrolled_at = ?
       WHERE student_id = ? AND ministry_id = ? AND unenrolled_at IS NULL`,
      [now, studentId, ministryId]
    );
  }

  async getPointsForDay(ministryId: number, day: DayOfWeek): Promise<number> {
    const ministry = await this.getById(ministryId);
    if (!ministry) return 0;
    return (ministry.points_config as any)[day] ?? 0;
  }

  async getActiveDays(ministryId: number): Promise<DayOfWeek[]> {
    const ministry = await this.getById(ministryId);
    return ministry?.active_days ?? [];
  }

  async getEnrolledStudents(ministryId: number): Promise<number[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ student_id: number }>(
      `SELECT student_id FROM enrollments
       WHERE ministry_id = ? AND unenrolled_at IS NULL`,
      [ministryId]
    );
    return rows.map((r) => r.student_id);
  }
}

export const ministryService = new MinistryService();
