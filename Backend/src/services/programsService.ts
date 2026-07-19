import { query } from '../config/database';
import { Program, ProgramScope, ProgramStatus } from '../types';

export interface ProgramWithStats extends Program {
  totalRaised: number;
  contributorCount: number;
}

/**
 * Programs shown to members (National / State), each supporting giving.
 * Distinct from `ProgramService` (program_completions / DCA classes).
 */
export class ProgramsService {
  static async createProgram(data: {
    title: string;
    description?: string;
    scope: ProgramScope;
    imageUrl?: string;
    location?: string;
    startDate?: Date;
    status?: ProgramStatus;
    createdBy: string;
  }): Promise<Program> {
    const result = await query(
      `INSERT INTO programs (title, description, scope, image_url, location, start_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.title,
        data.description,
        data.scope,
        data.imageUrl,
        data.location,
        data.startDate ?? null,
        data.status ?? ProgramStatus.SCHEDULED,
        data.createdBy,
      ]
    );

    return this.mapDbRowToProgram(result.rows[0]);
  }

  static async getAllPrograms(scope?: ProgramScope): Promise<ProgramWithStats[]> {
    const values: any[] = [];
    let where = '';
    if (scope) {
      where = 'WHERE p.scope = $1';
      values.push(scope);
    }

    const result = await query(
      `SELECT p.*,
              COALESCE(c.total_raised, 0) AS total_raised,
              COALESCE(c.contributor_count, 0) AS contributor_count
       FROM programs p
       LEFT JOIN (
         SELECT source_id,
                SUM(amount) AS total_raised,
                COUNT(DISTINCT user_id) AS contributor_count
         FROM contributions
         WHERE source_type = 'program' AND status = 'confirmed'
         GROUP BY source_id
       ) c ON c.source_id = p.id
       ${where}
       ORDER BY p.start_date DESC NULLS LAST, p.created_at DESC`,
      values
    );

    return result.rows.map(this.mapDbRowToProgramWithStats);
  }

  static async getProgramById(id: string): Promise<ProgramWithStats | null> {
    const result = await query(
      `SELECT p.*,
              COALESCE(c.total_raised, 0) AS total_raised,
              COALESCE(c.contributor_count, 0) AS contributor_count
       FROM programs p
       LEFT JOIN (
         SELECT source_id,
                SUM(amount) AS total_raised,
                COUNT(DISTINCT user_id) AS contributor_count
         FROM contributions
         WHERE source_type = 'program' AND status = 'confirmed'
         GROUP BY source_id
       ) c ON c.source_id = p.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToProgramWithStats(result.rows[0]);
  }

  static async updateProgram(
    id: string,
    updates: Partial<Omit<Program, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
  ): Promise<Program | null> {
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
      return this.mapProgramOnly(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE programs SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToProgram(result.rows[0]);
  }

  static async deleteProgram(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM programs WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  private static async mapProgramOnly(id: string): Promise<Program | null> {
    const result = await query(`SELECT * FROM programs WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapDbRowToProgram(result.rows[0]);
  }

  private static camelToSnake(str: string): string {
    if (str === 'imageUrl') return 'image_url';
    if (str === 'startDate') return 'start_date';
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private static mapDbRowToProgram(row: any): Program {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      scope: row.scope as ProgramScope,
      imageUrl: row.image_url,
      location: row.location,
      startDate: row.start_date ?? undefined,
      status: row.status as ProgramStatus,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapDbRowToProgramWithStats(row: any): ProgramWithStats {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      scope: row.scope as ProgramScope,
      imageUrl: row.image_url,
      location: row.location,
      startDate: row.start_date ?? undefined,
      status: row.status as ProgramStatus,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      totalRaised: Number(row.total_raised ?? 0),
      contributorCount: Number(row.contributor_count ?? 0),
    };
  }
}
