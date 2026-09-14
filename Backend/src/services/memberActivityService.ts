import { query } from '../config/database';

/**
 * A member counts as non-active once they have failed to mark attendance for
 * this many of the recent services. Deliberately a constant rather than an env
 * var: `config` treats every declared variable as required, so introducing one
 * would refuse to boot until it was set in every environment.
 */
export const INACTIVE_MISSED_SERVICES_THRESHOLD = 3;

/**
 * How far back "recent services" reaches. Services are inferred from the
 * attendance table, which is the only record that a service was held at all.
 */
export const RECENT_SERVICES_WINDOW = 8;

/**
 * Shared definition of member activity, used by both the members list and the
 * email audience so the tab a person sees and the list that gets emailed can
 * never disagree.
 *
 * Services before a member joined are not counted against them, so somebody who
 * registered last week is active rather than non-active by default. A member is
 * "present" for a service only on an attendance row with status 'present';
 * 'absent' and 'excused' rows both count as a miss.
 */
export const MEMBER_ACTIVITY_CTE = `
  recent_services AS (
    SELECT DISTINCT service_date
    FROM attendance
    WHERE service_date <= CURRENT_DATE
    ORDER BY service_date DESC
    LIMIT ${RECENT_SERVICES_WINDOW}
  ),
  member_activity AS (
    SELECT u.id AS user_id,
           COUNT(*) FILTER (
             WHERE rs.service_date IS NOT NULL
               AND NOT EXISTS (
                 SELECT 1 FROM attendance a
                 WHERE a.user_id = u.id
                   AND a.service_date = rs.service_date
                   AND a.status = 'present'
               )
           )::int AS missed_services
    FROM users u
    LEFT JOIN recent_services rs ON rs.service_date >= u.join_date::date
    GROUP BY u.id
  )
`;

/** SQL expression yielding 'active' | 'non_active' for a joined member_activity row. */
export const ACTIVITY_STATUS_EXPR = `
  CASE WHEN COALESCE(ma.missed_services, 0) >= ${INACTIVE_MISSED_SERVICES_THRESHOLD}
       THEN 'non_active' ELSE 'active' END
`;

export type Audience = 'active' | 'non_active';

export interface MemberActivityCounts {
  all: number;
  active: number;
  nonActive: number;
  deactivated: number;
}

export class MemberActivityService {
  /**
   * Registry-wide tallies for the members page tabs. `active` and `nonActive`
   * cover enabled accounts only; a deactivated account is neither, so the three
   * numbers plus `deactivated` add up to `all`.
   */
  static async getCounts(): Promise<MemberActivityCounts> {
    const result = await query(
      `WITH ${MEMBER_ACTIVITY_CTE}
       SELECT
         COUNT(*)::int AS all_users,
         COUNT(*) FILTER (WHERE u.is_active = false)::int AS deactivated,
         COUNT(*) FILTER (
           WHERE u.is_active = true
             AND COALESCE(ma.missed_services, 0) < ${INACTIVE_MISSED_SERVICES_THRESHOLD}
         )::int AS active,
         COUNT(*) FILTER (
           WHERE u.is_active = true
             AND COALESCE(ma.missed_services, 0) >= ${INACTIVE_MISSED_SERVICES_THRESHOLD}
         )::int AS non_active
       FROM users u
       LEFT JOIN member_activity ma ON ma.user_id = u.id`
    );

    const row = result.rows[0] ?? {};
    return {
      all: row.all_users || 0,
      active: row.active || 0,
      nonActive: row.non_active || 0,
      deactivated: row.deactivated || 0,
    };
  }

  /**
   * Recipients for a send. Deactivated accounts are excluded whatever the
   * audience — a disabled account should not receive church mail — as are rows
   * with no email address.
   */
  static async getRecipients(audience: Audience): Promise<
    { id: string; email: string; firstName: string; lastName: string }[]
  > {
    const comparator = audience === 'non_active' ? '>=' : '<';
    const result = await query(
      `WITH ${MEMBER_ACTIVITY_CTE}
       SELECT u.id, u.email, u.first_name, u.last_name
       FROM users u
       LEFT JOIN member_activity ma ON ma.user_id = u.id
       WHERE u.is_active = true
         AND u.email IS NOT NULL
         AND btrim(u.email) <> ''
         AND COALESCE(ma.missed_services, 0) ${comparator} ${INACTIVE_MISSED_SERVICES_THRESHOLD}
       ORDER BY u.first_name, u.last_name`
    );

    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
    }));
  }
}
