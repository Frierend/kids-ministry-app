// src/services/MinistryService.ts

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema';
import type { Ministry } from '../types';

class MinistryService {
  async getAll(activeOnly = true): Promise<Ministry[]> {
    const db = await getDatabase();
    const clause = activeOnly ? 'WHERE m.is_active = 1' : '';
    const rows = await db.getAllAsync<any>(
      `SELECT m.*,
         (SELECT COUNT(*) FROM enrollments e WHERE e.ministry_id = m.id AND e.unenrolled_at IS NULL) as student_count
       FROM ministries m ${clause}
       ORDER BY m.name`
    );
    return rows.map(this._map);
  }

  async getById(id: string): Promise<Ministry | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(
      `SELECT m.*,
         (SELECT COUNT(*) FROM enrollments e WHERE e.ministry_id = m.id AND e.unenrolled_at IS NULL) as student_count
       FROM ministries m WHERE m.id = ?`,
      [id]
    );
    return row ? this._map(row) : null;
  }

  async create(data: {
    name: string;
    color: string;
    saturday_points?: number;
    sunday_points?: number;
  }): Promise<Ministry> {
    // Validate point values
    const satPts = data.saturday_points ?? 20;
    const sunPts = data.sunday_points ?? 50;
    if (satPts !== 20) throw new Error('Saturday points must be 20');
    if (sunPts !== 50) throw new Error('Sunday points must be 50');

    const db = await getDatabase();
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO ministries (id, name, color, saturday_points, sunday_points) VALUES (?, ?, ?, ?, ?)`,
      [id, data.name, data.color, satPts, sunPts]
    );
    return (await this.getById(id))!;
  }

  async update(id: string, data: Partial<{ name: string; color: string; is_active: boolean }>): Promise<Ministry> {
    const db = await getDatabase();
    const sets: string[] = [];
    const values: any[] = [];
    if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
    if (data.color !== undefined) { sets.push('color = ?'); values.push(data.color); }
    if (data.is_active !== undefined) { sets.push('is_active = ?'); values.push(data.is_active ? 1 : 0); }
    if (sets.length === 0) return (await this.getById(id))!;
    await db.runAsync(`UPDATE ministries SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    // Soft-delete: mark inactive
    await db.runAsync(`UPDATE ministries SET is_active = 0 WHERE id = ?`, [id]);
  }

  private _map(row: any): Ministry {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      saturday_points: row.saturday_points,
      sunday_points: row.sunday_points,
      is_active: row.is_active === 1,
      created_at: row.created_at,
      student_count: row.student_count ?? 0,
    };
  }
}

export const ministryService = new MinistryService();
