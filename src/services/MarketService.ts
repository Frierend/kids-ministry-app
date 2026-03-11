// src/services/MarketService.ts

import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/schema';
import type { MarketItem } from '../types';

class MarketService {
  async getAll(availableOnly = false): Promise<MarketItem[]> {
    const db = await getDatabase();
    const clause = availableOnly ? 'WHERE is_available = 1' : '';
    const rows = await db.getAllAsync<any>(
      `SELECT * FROM market_items ${clause} ORDER BY name`
    );
    return rows.map(this._map);
  }

  async getById(id: string): Promise<MarketItem | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>(`SELECT * FROM market_items WHERE id = ?`, [id]);
    return row ? this._map(row) : null;
  }

  async create(data: {
    name: string;
    description?: string;
    point_cost: number;
    quantity?: number;
    image_uri?: string;
  }): Promise<MarketItem> {
    const db = await getDatabase();
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO market_items (id, name, description, point_cost, quantity, image_uri)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, data.name, data.description ?? null, data.point_cost, data.quantity ?? -1, data.image_uri ?? null]
    );
    return (await this.getById(id))!;
  }

  async update(id: string, data: Partial<{
    name: string;
    description: string | null;
    point_cost: number;
    quantity: number;
    is_available: boolean;
    image_uri: string | null;
  }>): Promise<MarketItem> {
    const db = await getDatabase();
    const sets: string[] = [];
    const values: any[] = [];
    for (const [k, v] of Object.entries(data)) {
      sets.push(`${k} = ?`);
      values.push(k === 'is_available' ? (v ? 1 : 0) : v);
    }
    if (sets.length > 0) {
      await db.runAsync(`UPDATE market_items SET ${sets.join(', ')} WHERE id = ?`, [...values, id]);
    }
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(`UPDATE market_items SET is_available = 0 WHERE id = ?`, [id]);
  }

  private _map(row: any): MarketItem {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      point_cost: row.point_cost,
      quantity: row.quantity,
      is_available: row.is_available === 1,
      image_uri: row.image_uri,
      created_at: row.created_at,
    };
  }
}

export const marketService = new MarketService();
