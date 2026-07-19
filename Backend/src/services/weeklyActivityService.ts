import { query } from '../config/database';
import { WeeklyActivity } from '../types';

const DAY_ORDER = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export class WeeklyActivityService {
  static async createActivity(data: {
    title: string;
    description?: string;
    dayOfWeek: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    imageUrl?: string;
    isActive?: boolean;
    createdBy: string;
  }): Promise<WeeklyActivity> {
    const result = await query(
      `INSERT INTO weekly_activities
         (title, description, day_of_week, start_time, end_time, location, image_url, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.title,
        data.description,
        data.dayOfWeek,
        data.startTime ?? null,
        data.endTime ?? null,
        data.location,
        data.imageUrl,
        data.isActive ?? true,
        data.createdBy,
      ]
    );

    return this.mapDbRowToActivity(result.rows[0]);
  }

  static async getAllActivities(onlyActive = false): Promise<WeeklyActivity[]> {
    const result = await query(
      `SELECT * FROM weekly_activities
       ${onlyActive ? 'WHERE is_active = true' : ''}
       ORDER BY
         array_position(ARRAY['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], day_of_week),
         start_time NULLS LAST`
    );

    return result.rows.map(this.mapDbRowToActivity);
  }

  static async getActivityById(id: string): Promise<WeeklyActivity | null> {
    const result = await query(`SELECT * FROM weekly_activities WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapDbRowToActivity(result.rows[0]);
  }

  static async updateActivity(
    id: string,
    updates: Partial<Omit<WeeklyActivity, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
  ): Promise<WeeklyActivity | null> {
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
      return this.getActivityById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE weekly_activities SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToActivity(result.rows[0]);
  }

  static async deleteActivity(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM weekly_activities WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  static isValidDay(day: string): boolean {
    return DAY_ORDER.includes(day);
  }

  private static camelToSnake(str: string): string {
    if (str === 'dayOfWeek') return 'day_of_week';
    if (str === 'startTime') return 'start_time';
    if (str === 'endTime') return 'end_time';
    if (str === 'imageUrl') return 'image_url';
    if (str === 'isActive') return 'is_active';
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private static mapDbRowToActivity(row: any): WeeklyActivity {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      dayOfWeek: row.day_of_week,
      startTime: row.start_time ?? undefined,
      endTime: row.end_time ?? undefined,
      location: row.location,
      imageUrl: row.image_url,
      isActive: row.is_active,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
