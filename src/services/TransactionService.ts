import { getDatabase, withTransaction } from '../database/db';
import {
  PointTransaction, TxPage, TxFilters, PointBreakdown, TransactionType,
} from '../types';
import { Defaults } from '../constants';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

class TransactionService {
  async getBalance(studentId: number): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ balance: number }>(
      'SELECT COALESCE(SUM(points), 0) AS balance FROM point_transactions WHERE student_id = ?',
      [studentId]
    );
    return row?.balance ?? 0;
  }

  async getBreakdown(studentId: number): Promise<PointBreakdown> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ type: TransactionType; total: number }>(
      `SELECT type, COALESCE(SUM(points), 0) AS total
       FROM point_transactions
       WHERE student_id = ?
       GROUP BY type`,
      [studentId]
    );

    const map: Record<string, number> = {};
    for (const r of rows) map[r.type] = r.total;

    const attendance = map['attendance'] ?? 0;
    const activity = map['activity'] ?? 0;
    const market_deductions = map['market_deduction'] ?? 0;
    const manual_adjustments = map['manual_adjustment'] ?? 0;

    return {
      attendance,
      activity,
      market_deductions,
      manual_adjustments,
      total: attendance + activity + market_deductions + manual_adjustments,
    };
  }

  async getLedger(studentId: number, filters: TxFilters = {}): Promise<TxPage> {
    const db = await getDatabase();
    const {
      type,
      dateFrom,
      dateTo,
      page = 0,
      pageSize = Defaults.ledgerPageSize,
    } = filters;

    let countQuery = `
      SELECT COUNT(*) AS total FROM point_transactions
      WHERE student_id = ?
    `;
    let dataQuery = `
      SELECT * FROM point_transactions
      WHERE student_id = ?
    `;
    const params: any[] = [studentId];
    const countParams: any[] = [studentId];

    if (type) {
      dataQuery += ' AND type = ?';
      countQuery += ' AND type = ?';
      params.push(type);
      countParams.push(type);
    }
    if (dateFrom) {
      dataQuery += ' AND created_at >= ?';
      countQuery += ' AND created_at >= ?';
      params.push(dateFrom);
      countParams.push(dateFrom);
    }
    if (dateTo) {
      dataQuery += ' AND created_at <= ?';
      countQuery += ' AND created_at <= ?';
      params.push(dateTo + 'T23:59:59');
      countParams.push(dateTo + 'T23:59:59');
    }

    dataQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(pageSize + 1, page * pageSize);

    const [countRow, rawRows] = await Promise.all([
      db.getFirstAsync<{ total: number }>(countQuery, countParams),
      db.getAllAsync<PointTransaction>(dataQuery, params),
    ]);

    const total = countRow?.total ?? 0;
    const hasMore = rawRows.length > pageSize;
    const transactions = hasMore ? rawRows.slice(0, pageSize) : rawRows;

    // Compute running balance (cumulative from newest to oldest)
    let runningBalance = await this.getBalance(studentId);
    const withBalance = transactions.map((tx) => {
      const snapshot = runningBalance;
      runningBalance -= tx.points;
      return { ...tx, running_balance: snapshot };
    });

    return { transactions: withBalance, hasMore, nextPage: page + 1, total };
  }

  async awardActivity(
    studentId: number,
    points: number,
    reason: string,
    awardedBy?: string
  ): Promise<PointTransaction> {
    if (points <= 0) throw new Error('Activity points must be positive');
    if (!reason.trim()) throw new Error('Reason is required');
    return this._insertTransaction(studentId, 'activity', points, reason, awardedBy);
  }

  async adjustManual(
    studentId: number,
    points: number,
    reason: string,
    awardedBy?: string
  ): Promise<PointTransaction> {
    if (!reason.trim()) throw new Error('Reason is required for manual adjustment');
    return this._insertTransaction(studentId, 'manual_adjustment', points, reason, awardedBy);
  }

  async redeemMarket(
    studentId: number,
    itemId: number
  ): Promise<PointTransaction> {
    return withTransaction(async (db) => {
      // Get item
      const item = await db.getFirstAsync<any>(
        'SELECT * FROM market_items WHERE id = ? AND is_active = 1',
        [itemId]
      );
      if (!item) throw new Error('Item not found or unavailable');

      // Check balance inside transaction
      const balRow = await db.getFirstAsync<{ balance: number }>(
        'SELECT COALESCE(SUM(points), 0) AS balance FROM point_transactions WHERE student_id = ?',
        [studentId]
      );
      const balance = balRow?.balance ?? 0;
      if (balance < item.point_cost) {
        throw new Error(`Insufficient points. Balance: ${balance}, Cost: ${item.point_cost}`);
      }

      // Check stock
      if (item.stock !== -1 && item.stock <= 0) {
        throw new Error('Item is out of stock');
      }

      // Insert negative transaction
      const txUUID = uuid();
      const now = new Date().toISOString();
      const result = await db.runAsync(
        `INSERT INTO point_transactions
           (uuid, student_id, type, points, reason, reference_id, reference_type, created_at)
         VALUES (?, ?, 'market_deduction', ?, ?, ?, 'market_item', ?)`,
        [
          txUUID, studentId, -item.point_cost,
          `Market: ${item.name}`, item.uuid, now,
        ]
      );

      // Decrement stock
      if (item.stock !== -1) {
        await db.runAsync(
          'UPDATE market_items SET stock = stock - 1 WHERE id = ?',
          [itemId]
        );
      }

      const tx = await db.getFirstAsync<PointTransaction>(
        'SELECT * FROM point_transactions WHERE id = ?',
        [result.lastInsertRowId]
      );
      return tx!;
    });
  }

  private async _insertTransaction(
    studentId: number,
    type: TransactionType,
    points: number,
    reason: string,
    awardedBy?: string
  ): Promise<PointTransaction> {
    const db = await getDatabase();
    const txUUID = uuid();
    const now = new Date().toISOString();

    const result = await db.runAsync(
      `INSERT INTO point_transactions
         (uuid, student_id, type, points, reason, awarded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [txUUID, studentId, type, points, reason, awardedBy ?? null, now]
    );

    return (await db.getFirstAsync<PointTransaction>(
      'SELECT * FROM point_transactions WHERE id = ?',
      [result.lastInsertRowId]
    ))!;
  }
}

export const transactionService = new TransactionService();
