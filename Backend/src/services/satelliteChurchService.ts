import { query } from '../config/database';
import { SatelliteChurch } from '../types';

export interface SatelliteChurchRecord extends SatelliteChurch {
  assignedUserName?: string | null;
  assignedUserImage?: string | null;
}

export class SatelliteChurchService {
  static async createSatelliteChurch(data: {
    name: string;
    location?: string;
    description?: string;
    assignedUserId?: string;
    createdBy: string;
  }): Promise<SatelliteChurch> {
    const result = await query(
      `INSERT INTO satellite_churches (name, location, description, assigned_user_id, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.name, data.location, data.description, data.assignedUserId ?? null, data.createdBy]
    );

    return this.mapDbRowToSatellite(result.rows[0]);
  }

  static async getAllSatelliteChurches(): Promise<SatelliteChurchRecord[]> {
    const result = await query(
      `SELECT s.*,
              u.first_name, u.last_name, u.profile_image
       FROM satellite_churches s
       LEFT JOIN users u ON u.id = s.assigned_user_id
       ORDER BY s.created_at DESC`
    );

    return result.rows.map((row: any) => this.mapDbRowToRecord(row));
  }

  static async getSatelliteChurchById(id: string): Promise<SatelliteChurchRecord | null> {
    const result = await query(
      `SELECT s.*,
              u.first_name, u.last_name, u.profile_image
       FROM satellite_churches s
       LEFT JOIN users u ON u.id = s.assigned_user_id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToRecord(result.rows[0]);
  }

  /** Satellite churches assigned to a given member (their dashboard link). */
  static async getSatelliteChurchesForUser(userId: string): Promise<SatelliteChurch[]> {
    const result = await query(
      `SELECT * FROM satellite_churches WHERE assigned_user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(this.mapDbRowToSatellite);
  }

  static async updateSatelliteChurch(
    id: string,
    updates: Partial<Omit<SatelliteChurch, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
  ): Promise<SatelliteChurch | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      const existing = await this.getSatelliteChurchById(id);
      return existing;
    }

    values.push(id);

    const result = await query(
      `UPDATE satellite_churches SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToSatellite(result.rows[0]);
  }

  static async deleteSatelliteChurch(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM satellite_churches WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  private static camelToSnake(str: string): string {
    if (str === 'assignedUserId') return 'assigned_user_id';
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private static mapDbRowToSatellite(row: any): SatelliteChurch {
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      description: row.description,
      assignedUserId: row.assigned_user_id ?? undefined,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapDbRowToRecord(row: any): SatelliteChurchRecord {
    const base = SatelliteChurchService.mapDbRowToSatellite(row);
    const hasUser = Boolean(row.assigned_user_id && row.first_name);
    return {
      ...base,
      assignedUserName: hasUser ? `${row.first_name} ${row.last_name}`.trim() : null,
      assignedUserImage: hasUser ? row.profile_image : null,
    };
  }
}
