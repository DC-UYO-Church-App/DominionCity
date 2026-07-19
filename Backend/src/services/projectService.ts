import { query } from '../config/database';
import { Project, ProjectStatus } from '../types';

export interface ProjectGiver {
  contributionId: string;
  userId: string | null;
  name: string;
  profileImage?: string | null;
  amount: number;
  isAnonymous: boolean;
  createdAt: Date;
}

export interface ProjectWithStats extends Project {
  totalRaised: number;
  contributorCount: number;
}

export class ProjectService {
  static async createProject(data: {
    title: string;
    description?: string;
    imageUrl?: string;
    targetAmount?: number;
    status?: ProjectStatus;
    createdBy: string;
  }): Promise<Project> {
    const result = await query(
      `INSERT INTO projects (title, description, image_url, target_amount, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.title,
        data.description,
        data.imageUrl,
        data.targetAmount ?? null,
        data.status ?? ProjectStatus.ACTIVE,
        data.createdBy,
      ]
    );

    return this.mapDbRowToProject(result.rows[0]);
  }

  static async getAllProjects(): Promise<ProjectWithStats[]> {
    const result = await query(
      `SELECT p.*,
              COALESCE(c.total_raised, 0) AS total_raised,
              COALESCE(c.contributor_count, 0) AS contributor_count
       FROM projects p
       LEFT JOIN (
         SELECT source_id,
                SUM(amount) AS total_raised,
                COUNT(DISTINCT user_id) AS contributor_count
         FROM contributions
         WHERE source_type = 'project' AND status = 'confirmed'
         GROUP BY source_id
       ) c ON c.source_id = p.id
       ORDER BY p.created_at DESC`
    );

    return result.rows.map(this.mapDbRowToProjectWithStats);
  }

  static async getProjectById(id: string): Promise<ProjectWithStats | null> {
    const result = await query(
      `SELECT p.*,
              COALESCE(c.total_raised, 0) AS total_raised,
              COALESCE(c.contributor_count, 0) AS contributor_count
       FROM projects p
       LEFT JOIN (
         SELECT source_id,
                SUM(amount) AS total_raised,
                COUNT(DISTINCT user_id) AS contributor_count
         FROM contributions
         WHERE source_type = 'project' AND status = 'confirmed'
         GROUP BY source_id
       ) c ON c.source_id = p.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToProjectWithStats(result.rows[0]);
  }

  /**
   * Public giver list for a project. Anonymous contributions are included but
   * with the giver's identity hidden.
   */
  static async getProjectGivers(id: string): Promise<ProjectGiver[]> {
    const result = await query(
      `SELECT c.id,
              c.amount,
              c.is_anonymous,
              c.created_at,
              u.id AS user_id,
              u.first_name,
              u.last_name,
              u.profile_image
       FROM contributions c
       JOIN users u ON u.id = c.user_id
       WHERE c.source_type = 'project' AND c.source_id = $1 AND c.status = 'confirmed'
       ORDER BY c.amount DESC, c.created_at DESC`,
      [id]
    );

    return result.rows.map((row: any) => {
      const anonymous = Boolean(row.is_anonymous);
      return {
        contributionId: row.id,
        userId: anonymous ? null : row.user_id,
        name: anonymous ? 'Anonymous' : `${row.first_name} ${row.last_name}`.trim(),
        profileImage: anonymous ? null : row.profile_image,
        amount: Number(row.amount ?? 0),
        isAnonymous: anonymous,
        createdAt: row.created_at,
      };
    });
  }

  static async updateProject(
    id: string,
    updates: Partial<Omit<Project, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>>
  ): Promise<Project | null> {
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
      return this.mapProjectOnly(id);
    }

    values.push(id);

    const result = await query(
      `UPDATE projects SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToProject(result.rows[0]);
  }

  static async deleteProject(id: string): Promise<boolean> {
    const result = await query(`DELETE FROM projects WHERE id = $1`, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  private static async mapProjectOnly(id: string): Promise<Project | null> {
    const result = await query(`SELECT * FROM projects WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapDbRowToProject(result.rows[0]);
  }

  private static camelToSnake(str: string): string {
    if (str === 'imageUrl') return 'image_url';
    if (str === 'targetAmount') return 'target_amount';
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  private static mapDbRowToProject(row: any): Project {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.image_url,
      targetAmount: row.target_amount != null ? Number(row.target_amount) : undefined,
      status: row.status as ProjectStatus,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapDbRowToProjectWithStats(row: any): ProjectWithStats {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.image_url,
      targetAmount: row.target_amount != null ? Number(row.target_amount) : undefined,
      status: row.status as ProjectStatus,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      totalRaised: Number(row.total_raised ?? 0),
      contributorCount: Number(row.contributor_count ?? 0),
    };
  }
}
