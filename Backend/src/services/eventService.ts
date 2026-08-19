import { query } from '../config/database';
import { Event, EventStatus } from '../types';

export class EventService {
  static async createEvent(data: {
    title: string;
    description?: string;
    eventDate: Date;
    status?: EventStatus;
    imageUrl?: string;
    address?: string;
    createdBy: string;
  }): Promise<Event> {
    const result = await query(
      `INSERT INTO events (title, description, event_date, status, image_url, location, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.title,
        data.description,
        data.eventDate,
        data.status ?? EventStatus.SCHEDULED,
        data.imageUrl,
        data.address,
        data.createdBy,
      ]
    );

    return this.mapDbRowToEvent(result.rows[0]);
  }

  static async getEventById(id: string): Promise<Event | null> {
    const result = await query(`SELECT * FROM events WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToEvent(result.rows[0]);
  }

  static async getAllEvents(filters?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ events: Event[]; total: number }> {
    let queryText = `SELECT * FROM events WHERE 1=1`;
    let countText = `SELECT COUNT(*) as total FROM events WHERE 1=1`;
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.startDate) {
      queryText += ` AND event_date >= $${paramCount}`;
      countText += ` AND event_date >= $${paramCount}`;
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters?.endDate) {
      queryText += ` AND event_date <= $${paramCount}`;
      countText += ` AND event_date <= $${paramCount}`;
      values.push(filters.endDate);
      paramCount++;
    }

    queryText += ' ORDER BY event_date ASC';

    if (filters?.limit) {
      queryText += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
    }

    if (filters?.offset) {
      queryText += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
      paramCount++;
    }

    const [eventsResult, countResult] = await Promise.all([
      query(queryText, values),
      // The count query has no LIMIT/OFFSET, so it must not receive their
      // parameters — only the filter values that precede them.
      query(
        countText,
        values.slice(0, values.length - (filters?.limit ? 1 : 0) - (filters?.offset ? 1 : 0))
      ),
    ]);

    return {
      events: eventsResult.rows.map(this.mapDbRowToEvent),
      total: parseInt(countResult.rows[0]?.total || '0', 10),
    };
  }

  static async updateEvent(
    id: string,
    updates: Partial<Omit<Event, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
  ): Promise<Event | null> {
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
      return this.getEventById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE events SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToEvent(result.rows[0]);
  }

  static async deleteEvent(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM events WHERE id = $1`, [id]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  private static camelToSnake(str: string): string {
    if (str === 'eventDate') return 'event_date';
    if (str === 'address') return 'location';
    if (str === 'status') return 'status';
    if (str === 'imageUrl') return 'image_url';
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private static mapDbRowToEvent(row: any): Event {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      eventDate: row.event_date,
      status: row.status || EventStatus.SCHEDULED,
      imageUrl: row.image_url,
      address: row.location,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
