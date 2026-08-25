import { query } from '../config/database';
import { Contribution, ContributionSource, ContributionStatus, NotificationType } from '../types';
import { NotificationService } from './notificationService';

export interface ContributionRecord extends Contribution {
  sourceTitle: string | null;
  giverName: string;
  giverImage?: string | null;
}

export interface GivingStats {
  totalGiven: number;
  totalPending: number;
  byProject: { id: string; title: string; total: number; contributorCount: number }[];
  byProgram: { id: string; title: string; total: number; contributorCount: number }[];
  topGivers: { userId: string; name: string; profileImage?: string | null; total: number }[];
  givers: { userId: string; name: string; profileImage?: string | null; total: number; count: number }[];
}

export class ContributionService {
  /**
   * Record a member's pending contribution ("I've paid"). Verifies the target
   * project/program exists before inserting. Amount validation is left to the
   * caller/DB check constraint.
   */
  static async createContribution(data: {
    userId: string;
    sourceType: ContributionSource;
    sourceId: string;
    amount: number;
    isAnonymous?: boolean;
    note?: string;
  }): Promise<Contribution> {
    const table = data.sourceType === ContributionSource.PROJECT ? 'projects' : 'programs';
    const exists = await query(`SELECT 1 FROM ${table} WHERE id = $1`, [data.sourceId]);
    if (exists.rows.length === 0) {
      throw new Error('SOURCE_NOT_FOUND');
    }

    const result = await query(
      `INSERT INTO contributions (user_id, source_type, source_id, amount, is_anonymous, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.userId,
        data.sourceType,
        data.sourceId,
        data.amount,
        data.isAnonymous ?? false,
        data.note,
      ]
    );

    return this.mapDbRowToContribution(result.rows[0]);
  }

  static async getContributions(filters?: {
    status?: ContributionStatus;
    sourceType?: ContributionSource;
    sourceId?: string;
  }): Promise<ContributionRecord[]> {
    const values: any[] = [];
    const conditions: string[] = [];

    if (filters?.status) {
      values.push(filters.status);
      conditions.push(`c.status = $${values.length}`);
    }
    if (filters?.sourceType) {
      values.push(filters.sourceType);
      conditions.push(`c.source_type = $${values.length}`);
    }
    if (filters?.sourceId) {
      values.push(filters.sourceId);
      conditions.push(`c.source_id = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT c.*,
              u.first_name, u.last_name, u.profile_image,
              COALESCE(pr.title, pg.title) AS source_title
       FROM contributions c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN projects pr ON c.source_type = 'project' AND pr.id = c.source_id
       LEFT JOIN programs pg ON c.source_type = 'program' AND pg.id = c.source_id
       ${where}
       ORDER BY c.created_at DESC`,
      values
    );

    return result.rows.map((row: any) => this.mapDbRowToRecord(row));
  }

  static async getUserContributions(userId: string): Promise<ContributionRecord[]> {
    const result = await query(
      `SELECT c.*,
              u.first_name, u.last_name, u.profile_image,
              COALESCE(pr.title, pg.title) AS source_title
       FROM contributions c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN projects pr ON c.source_type = 'project' AND pr.id = c.source_id
       LEFT JOIN programs pg ON c.source_type = 'program' AND pg.id = c.source_id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    return result.rows.map((row: any) => this.mapDbRowToRecord(row));
  }

  static async setStatus(
    id: string,
    status: ContributionStatus.CONFIRMED | ContributionStatus.REJECTED,
    adminId: string
  ): Promise<Contribution | null> {
    const result = await query(
      `UPDATE contributions
       SET status = $1,
           confirmed_by = $2,
           confirmed_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [status, adminId, id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const contribution = this.mapDbRowToContribution(result.rows[0]);

    // Until now an admin's decision was invisible to the giver: they marked a
    // payment and never heard back either way. Tell them.
    await this.notifyGiverOfDecision(contribution).catch((error) =>
      console.error('Failed to notify giver of contribution decision:', error)
    );

    return contribution;
  }

  /** Emails and in-app notifies the giver once their payment is reviewed. */
  private static async notifyGiverOfDecision(contribution: Contribution): Promise<void> {
    const sourceTable =
      contribution.sourceType === ContributionSource.PROJECT ? 'projects' : 'programs';

    const sourceResult = await query(
      `SELECT title FROM ${sourceTable} WHERE id = $1`,
      [contribution.sourceId]
    );
    const sourceTitle = sourceResult.rows[0]?.title || 'your giving';

    const amount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(Number(contribution.amount));

    const confirmed = contribution.status === ContributionStatus.CONFIRMED;

    await NotificationService.sendNotification({
      userId: contribution.userId,
      type: NotificationType.GENERAL,
      title: confirmed ? 'Your giving has been confirmed' : 'We could not confirm your giving',
      message: confirmed
        ? `Thank you. Your gift of ${amount} toward "${sourceTitle}" has been received and confirmed. ` +
          'God bless you for your faithfulness.'
        : `We were unable to confirm your gift of ${amount} toward "${sourceTitle}". ` +
          'If you believe this is a mistake, please get in touch and we will look into it.',
      metadata: {
        contributionId: contribution.id,
        sourceType: contribution.sourceType,
        sourceId: contribution.sourceId,
        amount: contribution.amount,
      },
      emailAction: { label: 'View your giving', path: '/dashboard/giving' },
    });
  }

  /** Aggregated data powering the admin Giving Page. */
  static async getGivingStats(): Promise<GivingStats> {
    const [totals, byProject, byProgram, topGivers, givers] = await Promise.all([
      query(
        `SELECT
           COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed'), 0) AS total_given,
           COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS total_pending
         FROM contributions`
      ),
      query(
        `SELECT p.id, p.title,
                COALESCE(SUM(c.amount), 0) AS total,
                COUNT(DISTINCT c.user_id) AS contributor_count
         FROM projects p
         LEFT JOIN contributions c
           ON c.source_type = 'project' AND c.source_id = p.id AND c.status = 'confirmed'
         GROUP BY p.id, p.title
         ORDER BY total DESC`
      ),
      query(
        `SELECT p.id, p.title,
                COALESCE(SUM(c.amount), 0) AS total,
                COUNT(DISTINCT c.user_id) AS contributor_count
         FROM programs p
         LEFT JOIN contributions c
           ON c.source_type = 'program' AND c.source_id = p.id AND c.status = 'confirmed'
         GROUP BY p.id, p.title
         ORDER BY total DESC`
      ),
      query(
        `SELECT u.id, u.first_name, u.last_name, u.profile_image,
                SUM(c.amount) AS total
         FROM contributions c
         JOIN users u ON u.id = c.user_id
         WHERE c.status = 'confirmed'
         GROUP BY u.id, u.first_name, u.last_name, u.profile_image
         ORDER BY total DESC
         LIMIT 10`
      ),
      query(
        `SELECT u.id, u.first_name, u.last_name, u.profile_image,
                SUM(c.amount) AS total,
                COUNT(*) AS count
         FROM contributions c
         JOIN users u ON u.id = c.user_id
         WHERE c.status = 'confirmed'
         GROUP BY u.id, u.first_name, u.last_name, u.profile_image
         ORDER BY total DESC`
      ),
    ]);

    return {
      totalGiven: Number(totals.rows[0]?.total_given ?? 0),
      totalPending: Number(totals.rows[0]?.total_pending ?? 0),
      byProject: byProject.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        total: Number(row.total ?? 0),
        contributorCount: Number(row.contributor_count ?? 0),
      })),
      byProgram: byProgram.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        total: Number(row.total ?? 0),
        contributorCount: Number(row.contributor_count ?? 0),
      })),
      topGivers: topGivers.rows.map((row: any) => ({
        userId: row.id,
        name: `${row.first_name} ${row.last_name}`.trim(),
        profileImage: row.profile_image,
        total: Number(row.total ?? 0),
      })),
      givers: givers.rows.map((row: any) => ({
        userId: row.id,
        name: `${row.first_name} ${row.last_name}`.trim(),
        profileImage: row.profile_image,
        total: Number(row.total ?? 0),
        count: Number(row.count ?? 0),
      })),
    };
  }

  private static mapDbRowToRecord(row: any): ContributionRecord {
    return {
      ...this.mapDbRowToContribution(row),
      sourceTitle: row.source_title ?? null,
      // Admin-facing lists keep the real name; anonymity is a public-display flag.
      giverName: `${row.first_name} ${row.last_name}`.trim(),
      giverImage: row.profile_image,
    };
  }

  private static mapDbRowToContribution(row: any): Contribution {
    return {
      id: row.id,
      userId: row.user_id,
      sourceType: row.source_type as ContributionSource,
      sourceId: row.source_id,
      amount: Number(row.amount ?? 0),
      isAnonymous: Boolean(row.is_anonymous),
      status: row.status as ContributionStatus,
      note: row.note ?? undefined,
      confirmedBy: row.confirmed_by ?? undefined,
      confirmedAt: row.confirmed_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
