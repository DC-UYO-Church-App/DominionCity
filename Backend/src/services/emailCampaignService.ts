import { query } from '../config/database';
import { EmailService } from '../config/email';
import { renderBroadcastEmail } from '../templates/broadcastEmail';
import { Audience, MemberActivityService } from './memberActivityService';

/** Recipients per batch, and the pause between batches. */
export const BATCH_SIZE = 30;
export const BATCH_DELAY_MS = 5000;

/** Cap on stored per-recipient failures, so one broken audience cannot bloat the row. */
const MAX_STORED_FAILURES = 200;

export type CampaignStatus = 'pending' | 'sending' | 'completed' | 'failed' | 'interrupted';

export interface Campaign {
  id: string;
  audience: Audience;
  subject: string;
  body: string;
  status: CampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  batchSize: number;
  batchDelayMs: number;
  totalBatches: number;
  completedBatches: number;
  failures: { email: string; reason: string }[];
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

function mapRow(row: any): Campaign {
  return {
    id: row.id,
    audience: row.audience,
    subject: row.subject,
    body: row.body,
    status: row.status,
    totalRecipients: row.total_recipients,
    sentCount: row.sent_count,
    failedCount: row.failed_count,
    batchSize: row.batch_size,
    batchDelayMs: row.batch_delay_ms,
    totalBatches: row.total_batches,
    completedBatches: row.completed_batches,
    failures: row.failures || [],
    error: row.error,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class EmailCampaignService {
  /**
   * A send that was mid-flight when the process died leaves a row stuck on
   * 'sending' that nothing will ever advance. Called at startup so the UI shows
   * it as interrupted instead of a progress bar that never moves.
   */
  static async reconcileInterrupted(): Promise<number> {
    const result = await query(
      `UPDATE email_campaigns
       SET status = 'interrupted',
           error = COALESCE(error, 'The server restarted while this send was in progress.'),
           finished_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE status IN ('pending', 'sending')
       RETURNING id`
    );
    return result.rowCount || 0;
  }

  static async getById(id: string): Promise<Campaign | null> {
    const result = await query(`SELECT * FROM email_campaigns WHERE id = $1`, [id]);
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  static async listRecent(limit = 10): Promise<Campaign[]> {
    const result = await query(
      `SELECT * FROM email_campaigns ORDER BY created_at DESC LIMIT $1`,
      [Math.min(50, Math.max(1, limit))]
    );
    return result.rows.map(mapRow);
  }

  /** True while a send is running, used to refuse a second concurrent send. */
  static async getRunning(): Promise<Campaign | null> {
    const result = await query(
      `SELECT * FROM email_campaigns WHERE status IN ('pending', 'sending')
       ORDER BY created_at DESC LIMIT 1`
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  }

  /**
   * Resolves the audience, records the campaign, and starts sending in the
   * background. Returns as soon as the row exists so the admin UI can begin
   * polling immediately rather than holding a request open for the whole send.
   */
  static async create(input: {
    audience: Audience;
    subject: string;
    body: string;
    createdBy: string;
  }): Promise<Campaign> {
    const recipients = await MemberActivityService.getRecipients(input.audience);
    const totalBatches = Math.ceil(recipients.length / BATCH_SIZE);

    const result = await query(
      `INSERT INTO email_campaigns
         (audience, subject, body, status, total_recipients, batch_size, batch_delay_ms,
          total_batches, created_by)
       VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        input.audience,
        input.subject,
        input.body,
        recipients.length,
        BATCH_SIZE,
        BATCH_DELAY_MS,
        totalBatches,
        input.createdBy,
      ]
    );

    const campaign = mapRow(result.rows[0]);

    if (recipients.length === 0) {
      await query(
        `UPDATE email_campaigns
         SET status = 'completed', started_at = CURRENT_TIMESTAMP,
             finished_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [campaign.id]
      );
      return (await this.getById(campaign.id))!;
    }

    // Intentionally not awaited: the HTTP response returns now and the batches
    // run on after it. Any throw is caught inside `run`, so there is no route
    // to an unhandled rejection here.
    void this.run(campaign.id, recipients, input.subject, input.body);

    return campaign;
  }

  private static async run(
    campaignId: string,
    recipients: { email: string; firstName: string }[],
    subject: string,
    body: string
  ): Promise<void> {
    const failures: { email: string; reason: string }[] = [];
    let sent = 0;
    let failed = 0;

    try {
      await query(
        `UPDATE email_campaigns
         SET status = 'sending', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [campaignId]
      );

      const totalBatches = Math.ceil(recipients.length / BATCH_SIZE);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
        const batch = recipients.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);

        /* allSettled rather than all: one bad address must not abandon the
           other 29 in the batch, and each failure is recorded by name. */
        const results = await Promise.allSettled(
          batch.map((recipient) => {
            const rendered = renderBroadcastEmail({
              firstName: recipient.firstName,
              subject,
              body,
            });
            return EmailService.send({
              to: recipient.email,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
            });
          })
        );

        results.forEach((outcome, index) => {
          if (outcome.status === 'fulfilled') {
            sent += 1;
          } else {
            failed += 1;
            if (failures.length < MAX_STORED_FAILURES) {
              failures.push({
                email: batch[index].email,
                reason:
                  outcome.reason instanceof Error
                    ? outcome.reason.message
                    : String(outcome.reason),
              });
            }
          }
        });

        await query(
          `UPDATE email_campaigns
           SET sent_count = $2, failed_count = $3, completed_batches = $4,
               failures = $5::jsonb, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [campaignId, sent, failed, batchIndex + 1, JSON.stringify(failures)]
        );

        // Pause between batches, but not after the last one — that would just
        // delay the completed status by five seconds for no reason.
        if (batchIndex < totalBatches - 1) {
          await sleep(BATCH_DELAY_MS);
        }
      }

      await query(
        `UPDATE email_campaigns
         SET status = $2, finished_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [campaignId, failed > 0 && sent === 0 ? 'failed' : 'completed']
      );
    } catch (error) {
      console.error('Email campaign failed:', error);
      await query(
        `UPDATE email_campaigns
         SET status = 'failed', error = $2, sent_count = $3, failed_count = $4,
             finished_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [
          campaignId,
          error instanceof Error ? error.message : 'Unknown error',
          sent,
          failed,
        ]
      ).catch((err) => console.error('Could not record campaign failure:', err));
    }
  }
}
