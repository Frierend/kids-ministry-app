// src/services/TransactionService.ts

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema';
import type { PointTransaction, TransactionType } from '../types';

class TransactionService {
  async getByStudent(studentId: string, limit = 50): Promise<PointTransaction[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM point_transactions WHERE student_id = ?
       ORDER BY created_at DESC LIMIT ?`,
      [studentId, limit]
    );
    return rows.map(this._map);
  }

  async getBalance(studentId: string): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ balance: number }>(
      `SELECT COALESCE(SUM(points), 0) AS balance FROM point_transactions WHERE student_id = ?`,
      [studentId]
    );
    return row?.balance ?? 0;
  }

  async awardPoints(data: {
    student_id: string;
    points: number;
    type: TransactionType;
    description: string;
    created_by?: string;
  }): Promise<PointTransaction> {
    if (data.points === 0) throw new Error('Points cannot be zero');
    const db = await getDatabase();
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO point_transactions (id, student_id, points, type, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.student_id, data.points, data.type, data.description, data.created_by ?? null]
    );
    const row = await db.getFirstAsync<any>(`SELECT * FROM point_transactions WHERE id = ?`, [id]);
    return this._map(row!);
  }

  async redeemItem(data: {
    student_id: string;
    item_id: string;
    item_name: string;
    point_cost: number;
  }): Promise<PointTransaction> {
    const db = await getDatabase();
    // Check balance
    const balance = await this.getBalance(data.student_id);
    if (balance < data.point_cost) throw new Error('Insufficient points');

    // Check item availability & quantity
    const item = await db.getFirstAsync<any>(
      `SELECT * FROM market_items WHERE id = ? AND is_available = 1`,
      [data.item_id]
    );
    if (!item) throw new Error('Item not available');
    if (item.quantity !== -1 && item.quantity <= 0) throw new Error('Item out of stock');

    const id = uuidv4();

    await db.execAsync('BEGIN TRANSACTION');
    try {
      await db.runAsync(
        `INSERT INTO point_transactions (id, student_id, points, type, description, item_id)
         VALUES (?, ?, ?, 'redemption', ?, ?)`,
        [id, data.student_id, -data.point_cost, `Redeemed: ${data.item_name}`, data.item_id]
      );
      if (item.quantity !== -1) {
        await db.runAsync(
          `UPDATE market_items SET quantity = quantity - 1 WHERE id = ?`,
          [data.item_id]
        );
      }
      await db.execAsync('COMMIT');
    } catch (err) {
      await db.execAsync('ROLLBACK');
      throw err;
    }

    const row = await db.getFirstAsync<any>(`SELECT * FROM point_transactions WHERE id = ?`, [id]);
    return this._map(row!);
  }

  private _map(row: any): PointTransaction {
    return {
      id: row.id,
      student_id: row.student_id,
      points: row.points,
      type: row.type,
      description: row.description,
      session_id: row.session_id,
      item_id: row.item_id,
      created_at: row.created_at,
      created_by: row.created_by,
    };
  }
}

export const transactionService = new TransactionService();
