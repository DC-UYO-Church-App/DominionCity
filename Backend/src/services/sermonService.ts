import { query } from '../config/database';
import { Sermon } from '../types';

export class SermonService {
  static async createSermon(data: {
    title: string;
    preacher: string;
    sermonDate: Date;
    description?: string;
    audioUrl?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    category: string;
    duration?: number;
    uploadedBy: string;
  }): Promise<Sermon> {
    const result = await query(
      `INSERT INTO sermons (title, preacher, sermon_date, description, audio_url, video_url, thumbnail_url, category, duration_minutes, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.title,
        data.preacher,
        data.sermonDate,
        data.description,
        data.audioUrl,
        data.videoUrl,
        data.thumbnailUrl,
        data.category,
        data.duration,
        data.uploadedBy,
      ]
    );

    return this.mapDbRowToSermon(result.rows[0]);
  }

  static async getSermonById(id: string): Promise<Sermon | null> {
    const result = await query(`SELECT * FROM sermons WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    // Increment view count
    await query(`UPDATE sermons SET views = views + 1 WHERE id = $1`, [id]);

    return this.mapDbRowToSermon(result.rows[0]);
  }

  static async getAllSermons(filters?: {
    preacher?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ sermons: Sermon[]; total: number }> {
    let queryText = `SELECT * FROM sermons WHERE 1=1`;
    let countText = `SELECT COUNT(*) as total FROM sermons WHERE 1=1`;
    const values: any[] = [];
    let paramCount = 1;

    if (filters?.preacher) {
      queryText += ` AND preacher ILIKE $${paramCount}`;
      countText += ` AND preacher ILIKE $${paramCount}`;
      values.push(`%${filters.preacher}%`);
      paramCount++;
    }

    if (filters?.category) {
      queryText += ` AND category = $${paramCount}`;
      countText += ` AND category = $${paramCount}`;
      values.push(filters.category);
      paramCount++;
    }

    if (filters?.startDate) {
      queryText += ` AND sermon_date >= $${paramCount}`;
      countText += ` AND sermon_date >= $${paramCount}`;
      values.push(filters.startDate);
      paramCount++;
    }

    if (filters?.endDate) {
      queryText += ` AND sermon_date <= $${paramCount}`;
      countText += ` AND sermon_date <= $${paramCount}`;
      values.push(filters.endDate);
      paramCount++;
    }

    queryText += ' ORDER BY sermon_date DESC';

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

    const [sermonsResult, countResult] = await Promise.all([
      query(queryText, values),
      // The count query has no LIMIT/OFFSET, so it must not receive their
      // parameters — only the filter values that precede them.
      query(
        countText,
        values.slice(0, values.length - (filters?.limit ? 1 : 0) - (filters?.offset ? 1 : 0))
      ),
    ]);

    return {
      sermons: sermonsResult.rows.map(this.mapDbRowToSermon),
      total: parseInt(countResult.rows[0]?.total || '0', 10),
    };
  }

  static async searchSermons(searchTerm: string): Promise<Sermon[]> {
    const result = await query(
      `SELECT * FROM sermons 
       WHERE title ILIKE $1 OR description ILIKE $1 OR preacher ILIKE $1
       ORDER BY sermon_date DESC
       LIMIT 20`,
      [`%${searchTerm}%`]
    );

    return result.rows.map(this.mapDbRowToSermon);
  }

  static async updateSermon(
    id: string,
    updates: Partial<Omit<Sermon, 'id' | 'uploadedBy' | 'views' | 'createdAt' | 'updatedAt'>>
  ): Promise<Sermon | null> {
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
      return this.getSermonById(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE sermons SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToSermon(result.rows[0]);
  }

  static async deleteSermon(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM sermons WHERE id = $1`, [id]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  private static camelToSnake(str: string): string {
    if (str === 'duration') return 'duration_minutes';
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private static mapDbRowToSermon(row: any): Sermon {
    return {
      id: row.id,
      title: row.title,
      preacher: row.preacher,
      sermonDate: row.sermon_date,
      description: row.description,
      audioUrl: row.audio_url,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      category: row.category,
      duration: row.duration_minutes,
      uploadedBy: row.uploaded_by,
      views: row.views,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
