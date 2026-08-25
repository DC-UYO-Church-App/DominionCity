import crypto from 'crypto';
import { getClient, query } from '../config/database';
import { hashPassword } from '../utils/password';

/** How long a reset link stays valid. Short, because it lands in an inbox. */
const TOKEN_TTL_MINUTES = 60;

/** Most reset emails one account can trigger inside the window below. */
const MAX_REQUESTS_PER_WINDOW = 5;
const REQUEST_WINDOW_MINUTES = 60;

export interface IssuedResetToken {
  /** Plaintext token — goes in the emailed link and is never stored. */
  token: string;
  expiresAt: Date;
}

export class PasswordResetService {
  /**
   * The token is random, and only its SHA-256 hash is persisted. SHA-256 is
   * the right choice here rather than bcrypt: the token already has 256 bits
   * of entropy, so it is not brute-forceable, and lookup needs to be a single
   * indexed query rather than a scan comparing every row.
   */
  private static hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Issues a reset token for a user, or returns null if the account has asked
   * too many times recently. Any outstanding tokens are invalidated first, so
   * only the newest link works.
   */
  static async issueToken(userId: string, requestedIp?: string): Promise<IssuedResetToken | null> {
    const recent = await query(
      `SELECT COUNT(*)::int AS count
         FROM password_reset_tokens
        WHERE user_id = $1
          AND created_at > NOW() - ($2 || ' minutes')::interval`,
      [userId, String(REQUEST_WINDOW_MINUTES)]
    );

    if ((recent.rows[0]?.count ?? 0) >= MAX_REQUESTS_PER_WINDOW) {
      return null;
    }

    await this.invalidateTokensForUser(userId);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, requested_ip)
       VALUES ($1, $2, $3, $4)`,
      [userId, this.hash(token), expiresAt, requestedIp ?? null]
    );

    return { token, expiresAt };
  }

  /** Resolves a plaintext token to its user, if it is unused and unexpired. */
  static async findValidToken(token: string): Promise<{ id: string; userId: string } | null> {
    const result = await query(
      `SELECT id, user_id
         FROM password_reset_tokens
        WHERE token_hash = $1
          AND used_at IS NULL
          AND expires_at > NOW()`,
      [this.hash(token)]
    );

    const row = result.rows[0];
    return row ? { id: row.id, userId: row.user_id } : null;
  }

  /**
   * Sets the new password and burns the token in one transaction, so a token
   * can never be spent twice even if two requests arrive together.
   *
   * Returns null when the token is already spent or expired — the UPDATE's
   * WHERE clause is what enforces single use, not a prior read.
   */
  static async consumeTokenAndSetPassword(
    token: string,
    newPassword: string
  ): Promise<{ userId: string } | null> {
    const tokenHash = this.hash(token);
    const hashedPassword = await hashPassword(newPassword);

    // The whole claim-and-update has to run on one connection: `query()` goes
    // through the pool and would hand each statement a different client,
    // leaving BEGIN/COMMIT on unrelated sessions.
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const claimed = await client.query(
        `UPDATE password_reset_tokens
            SET used_at = NOW()
          WHERE token_hash = $1
            AND used_at IS NULL
            AND expires_at > NOW()
          RETURNING user_id`,
        [tokenHash]
      );

      if (claimed.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const userId = claimed.rows[0].user_id;

      await client.query(
        `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
        [hashedPassword, userId]
      );

      // Any other outstanding link for this account stops working too.
      await client.query(
        `UPDATE password_reset_tokens
            SET used_at = NOW()
          WHERE user_id = $1 AND used_at IS NULL`,
        [userId]
      );

      await client.query('COMMIT');
      return { userId };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async invalidateTokensForUser(userId: string): Promise<void> {
    await query(
      `UPDATE password_reset_tokens
          SET used_at = NOW()
        WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );
  }
}
