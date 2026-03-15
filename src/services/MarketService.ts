import { getDatabase } from '../database/client';
import { MarketItem, CreateMarketItemInput } from '../types';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

class MarketService {
  async getAll(includeInactive = false): Promise<MarketItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MarketItem>(
      `SELECT * FROM market_items
       WHERE is_active = ${includeInactive ? '0 OR is_active = 1' : '1'}
       ORDER BY point_cost ASC, name ASC`
    );
    return rows.map((r) => ({ ...r, is_active: (r.is_active as any) === 1 }));
  }

  async getById(id: number): Promise<MarketItem | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<MarketItem>(
      'SELECT * FROM market_items WHERE id = ?', [id]
    );
    if (!row) return null;
    return { ...row, is_active: (row.is_active as any) === 1 };
  }

  async create(data: CreateMarketItemInput): Promise<MarketItem> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO market_items
         (uuid, name, description, point_cost, stock, photo_uri, is_active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        uuid(),
        data.name.trim(),
        data.description?.trim() || null,
        data.point_cost,
        data.stock ?? -1,
        data.photo_uri || null,
        now,
      ]
    );
    return (await this.getById(result.lastInsertRowId))!;
  }

  async update(id: number, data: Partial<CreateMarketItemInput>): Promise<MarketItem> {
    const db = await getDatabase();
    const current = await this.getById(id);
    if (!current) throw new Error('Item not found');

    await db.runAsync(
      `UPDATE market_items
       SET name = ?, description = ?, point_cost = ?, stock = ?, photo_uri = ?
       WHERE id = ?`,
      [
        data.name?.trim() ?? current.name,
        data.description?.trim() ?? current.description,
        data.point_cost ?? current.point_cost,
        data.stock ?? current.stock,
        data.photo_uri ?? current.photo_uri,
        id,
      ]
    );
    return (await this.getById(id))!;
  }

  async deactivate(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE market_items SET is_active = 0 WHERE id = ?', [id]);
  }

  async activate(id: number): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('UPDATE market_items SET is_active = 1 WHERE id = ?', [id]);
  }
}

export const marketService = new MarketService();
