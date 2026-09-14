import { query } from '../config/database';
import { EmailService } from '../config/email';
import { renderBirthdayEmail } from '../templates/birthdayEmail';
import { NotificationService } from './notificationService';
import { NotificationType } from '../types';
import { config } from '../config';

/**
 * Birthdays are a local-calendar idea, so "today" is the church's date rather
 * than the server's. Railway runs UTC, which is an hour behind Uyo; deriving
 * the date in the database's own timezone would greet some members on the
 * wrong day.
 */
export const CHURCH_TIMEZONE = 'Africa/Lagos';

export interface BirthdayRunResult {
  localDate: string;
  candidates: number;
  claimed: number;
  sent: number;
  failed: number;
}

/**
 * Members whose birthday falls on the church's current date.
 *
 * February 29 is handled explicitly: in a non-leap year those members are
 * greeted on the 28th, so a leap-day birthday is not silently skipped three
 * years in four.
 */
const TODAYS_BIRTHDAYS_SQL = `
  WITH today AS (
    SELECT (CURRENT_TIMESTAMP AT TIME ZONE '${CHURCH_TIMEZONE}')::date AS local_date
  )
  SELECT u.id, u.first_name, u.last_name, u.email, u.date_of_birth,
         t.local_date,
         EXTRACT(YEAR FROM t.local_date)::int AS local_year
  FROM users u
  CROSS JOIN today t
  WHERE u.is_active = true
    AND u.date_of_birth IS NOT NULL
    AND u.email IS NOT NULL
    AND btrim(u.email) <> ''
    AND (
      (
        EXTRACT(MONTH FROM u.date_of_birth) = EXTRACT(MONTH FROM t.local_date)
        AND EXTRACT(DAY FROM u.date_of_birth) = EXTRACT(DAY FROM t.local_date)
      )
      OR (
        EXTRACT(MONTH FROM u.date_of_birth) = 2
        AND EXTRACT(DAY FROM u.date_of_birth) = 29
        AND EXTRACT(MONTH FROM t.local_date) = 2
        AND EXTRACT(DAY FROM t.local_date) = 28
        -- February ends on the 28th, so this year has no 29th to greet on.
        AND EXTRACT(DAY FROM (date_trunc('year', t.local_date) + interval '2 months' - interval '1 day')) = 28
      )
    )
`;

export class BirthdayService {
  /** Read-only preview of who would be greeted right now. */
  static async getTodaysBirthdays(): Promise<
    { id: string; firstName: string; lastName: string; email: string; dateOfBirth: string }[]
  > {
    const result = await query(`${TODAYS_BIRTHDAYS_SQL} ORDER BY u.first_name, u.last_name`);
    return result.rows.map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      dateOfBirth: row.date_of_birth,
    }));
  }

  /**
   * Sends today's greetings.
   *
   * Claim-then-send: a row is written for each member before any mail goes out,
   * so a second run — a restart, a redeploy, a second instance — finds the
   * greeting already claimed and sends nothing. A claim that fails to send is
   * marked 'failed' and is picked up again by the next run, which is why the
   * conflict clause re-claims failed rows but leaves sent ones alone.
   */
  static async sendTodaysGreetings(): Promise<BirthdayRunResult> {
    const candidates = await query(TODAYS_BIRTHDAYS_SQL);

    const localDate: string = candidates.rows[0]?.local_date
      ? new Date(candidates.rows[0].local_date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    if (candidates.rows.length === 0) {
      return { localDate, candidates: 0, claimed: 0, sent: 0, failed: 0 };
    }

    const year: number = candidates.rows[0].local_year;
    const ids = candidates.rows.map((row) => row.id);

    const claimed = await query(
      `INSERT INTO birthday_greetings (user_id, greeting_year, status)
       SELECT unnest($1::uuid[]), $2, 'pending'
       ON CONFLICT (user_id, greeting_year) DO UPDATE
         SET status = 'pending',
             attempts = birthday_greetings.attempts + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE birthday_greetings.status = 'failed'
       RETURNING user_id`,
      [ids, year]
    );

    const claimedIds = new Set(claimed.rows.map((row) => row.user_id));
    const toGreet = candidates.rows.filter((row) => claimedIds.has(row.id));

    let sent = 0;
    let failed = 0;

    for (const person of toGreet) {
      try {
        const message = renderBirthdayEmail({
          firstName: person.first_name,
          age: computeAge(person.date_of_birth, person.local_date),
        });

        await EmailService.send({
          to: person.email,
          subject: message.subject,
          html: message.html,
          text: message.text,
        });

        await query(
          `UPDATE birthday_greetings
           SET status = 'sent', sent_at = CURRENT_TIMESTAMP, error = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND greeting_year = $2`,
          [person.id, year]
        );
        sent += 1;

        // The in-app notification is best effort: the email is the greeting,
        // and a failure to record the bell item should not mark the day failed.
        try {
          await NotificationService.sendNotification({
            userId: person.id,
            type: NotificationType.BIRTHDAY,
            title: 'Happy Birthday! 🎉',
            message: `Happy Birthday ${person.first_name}! ${config.church.name} celebrates you today. May this new year of your life be filled with God's blessings, joy, and prosperity. We love you!`,
            skipEmail: true,
          });
        } catch (notifyError) {
          console.error('Birthday in-app notification failed:', notifyError);
        }
      } catch (error) {
        failed += 1;
        console.error(`Birthday email failed for ${person.email}:`, error);
        await query(
          `UPDATE birthday_greetings
           SET status = 'failed', error = $3, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND greeting_year = $2`,
          [person.id, year, error instanceof Error ? error.message : 'Unknown error']
        ).catch((err) => console.error('Could not record birthday failure:', err));
      }
    }

    return {
      localDate,
      candidates: candidates.rows.length,
      claimed: toGreet.length,
      sent,
      failed,
    };
  }
}

/** Age today, or undefined when the stored birth year is missing or implausible. */
function computeAge(dateOfBirth: string | Date, localDate: string | Date): number | undefined {
  const born = new Date(dateOfBirth);
  const today = new Date(localDate);
  if (Number.isNaN(born.getTime()) || Number.isNaN(today.getTime())) return undefined;

  let age = today.getUTCFullYear() - born.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - born.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < born.getUTCDate())) {
    age -= 1;
  }

  // Placeholder birth years are common in church records; saying "these 0
  // years" or "these 130 years" would be worse than saying nothing.
  return age > 0 && age < 120 ? age : undefined;
}
