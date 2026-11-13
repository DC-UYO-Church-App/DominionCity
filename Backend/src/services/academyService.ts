import { getClient, query } from '../config/database';
import { NotificationType, UserRole } from '../types';
import { NotificationService } from './notificationService';

export type TrackStatus = 'not_started' | 'in_progress' | 'completed' | 'withdrawn';

export class AcademyService {
  /**
   * Academy-wide authority: create tracks, open cohorts, appoint coordinators,
   * see every cohort. Held by the admin role, and by super admins so the
   * academy is never left without an owner.
   */
  static isAcademyAdmin(role: string): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  /**
   * Per-cohort authority. A coordinator runs their own cohort and nobody
   * else's, which is the whole reason staffing is a grant rather than a role.
   */
  static async isCohortStaff(userId: string, cohortId: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM academy_cohort_staff WHERE cohort_id = $1 AND user_id = $2`,
      [cohortId, userId]
    );
    return (result.rowCount || 0) > 0;
  }

  static async canManageCohort(user: { id: string; role: string }, cohortId: string) {
    return this.isAcademyAdmin(user.role) || this.isCohortStaff(user.id, cohortId);
  }

  /**
   * Cohorts this member staffs, with the track each belongs to.
   *
   * Drives two things: the "Go to ... Dashboard" button on their own member
   * dashboard, and whether the academy shell lets them in at all. A coordinator
   * usually holds no elevated role, so this grant is their only way in.
   */
  static async getStaffCohorts(userId: string): Promise<
    { cohortId: string; cohortName: string; trackName: string; staffRole: string }[]
  > {
    const result = await query(
      `SELECT c.id, c.name, t.name AS track_name, s.staff_role
       FROM academy_cohort_staff s
       JOIN academy_cohorts c ON c.id = s.cohort_id
       JOIN academy_tracks t ON t.id = c.track_id
       WHERE s.user_id = $1
       ORDER BY c.start_date DESC NULLS LAST, c.created_at DESC`,
      [userId]
    );
    return result.rows.map((row) => ({
      cohortId: row.id,
      cohortName: row.name,
      trackName: row.track_name,
      staffRole: row.staff_role,
    }));
  }

  // ---- Tracks -------------------------------------------------------------

  static async listTracks() {
    const result = await query(
      `SELECT t.*, p.name AS prerequisite_name,
              (SELECT COUNT(*)::int FROM academy_cohorts c WHERE c.track_id = t.id) AS cohort_count,
              (SELECT COUNT(*)::int
                 FROM academy_enrollments e
                 JOIN academy_cohorts c ON c.id = e.cohort_id
                WHERE c.track_id = t.id) AS enrollment_count
       FROM academy_tracks t
       LEFT JOIN academy_tracks p ON p.id = t.prerequisite_track_id
       ORDER BY t.sequence, t.name`
    );
    return result.rows.map(mapTrack);
  }

  static async createTrack(input: {
    name: string;
    description?: string | null;
    sequence?: number;
    prerequisiteTrackId?: string | null;
  }) {
    const result = await query(
      `INSERT INTO academy_tracks (name, description, sequence, prerequisite_track_id)
       VALUES ($1, $2, COALESCE($3, 0), $4) RETURNING *`,
      [input.name, input.description ?? null, input.sequence ?? null, input.prerequisiteTrackId ?? null]
    );
    return mapTrack(result.rows[0]);
  }

  static async updateTrack(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      sequence?: number;
      prerequisiteTrackId?: string | null;
      isActive?: boolean;
    }
  ) {
    const columns: Record<string, string> = {
      name: 'name',
      description: 'description',
      sequence: 'sequence',
      prerequisiteTrackId: 'prerequisite_track_id',
      isActive: 'is_active',
    };

    const sets: string[] = [];
    const values: any[] = [];

    for (const [key, column] of Object.entries(columns)) {
      const value = (input as any)[key];
      if (value !== undefined) {
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      }
    }

    if (sets.length === 0) return this.getTrack(id);

    values.push(id);
    const result = await query(
      `UPDATE academy_tracks SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length} RETURNING *`,
      values
    );
    return result.rows[0] ? mapTrack(result.rows[0]) : null;
  }

  static async getTrack(id: string) {
    const result = await query(`SELECT * FROM academy_tracks WHERE id = $1`, [id]);
    return result.rows[0] ? mapTrack(result.rows[0]) : null;
  }

  static async deleteTrack(id: string) {
    const result = await query(`DELETE FROM academy_tracks WHERE id = $1`, [id]);
    return (result.rowCount || 0) > 0;
  }

  // ---- Cohorts ------------------------------------------------------------

  /** `staffUserId` narrows the list to cohorts that person actually runs. */
  static async listCohorts(filters?: { trackId?: string; status?: string; staffUserId?: string }) {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters?.trackId) {
      values.push(filters.trackId);
      conditions.push(`c.track_id = $${values.length}`);
    }
    if (filters?.status) {
      values.push(filters.status);
      conditions.push(`c.status = $${values.length}`);
    }
    if (filters?.staffUserId) {
      values.push(filters.staffUserId);
      conditions.push(
        `EXISTS (SELECT 1 FROM academy_cohort_staff s
                  WHERE s.cohort_id = c.id AND s.user_id = $${values.length})`
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT c.id, c.track_id, c.name, c.status,
              c.start_date::text AS start_date,
              c.end_date::text AS end_date,
              t.name AS track_name,
              (SELECT COUNT(*)::int FROM academy_enrollments e WHERE e.cohort_id = c.id) AS enrolled_count,
              (SELECT COUNT(*)::int FROM academy_enrollments e
                WHERE e.cohort_id = c.id AND e.status = 'completed') AS completed_count,
              (SELECT COUNT(*)::int FROM academy_sessions s WHERE s.cohort_id = c.id) AS session_count,
              COALESCE(
                (SELECT json_agg(json_build_object(
                          'userId', st.user_id,
                          'staffRole', st.staff_role,
                          'firstName', u.first_name,
                          'lastName', u.last_name,
                          'email', u.email))
                   FROM academy_cohort_staff st
                   JOIN users u ON u.id = st.user_id
                  WHERE st.cohort_id = c.id), '[]'::json) AS staff
       FROM academy_cohorts c
       JOIN academy_tracks t ON t.id = c.track_id
       ${where}
       ORDER BY c.start_date DESC NULLS LAST, c.created_at DESC`,
      values
    );
    return result.rows.map(mapCohort);
  }

  static async getCohort(id: string) {
    const rows = await this.listCohorts();
    return rows.find((c) => c.id === id) ?? null;
  }

  static async createCohort(input: {
    trackId: string;
    name: string;
    startDate?: string | null;
    endDate?: string | null;
    status?: string;
    createdBy: string;
  }) {
    const result = await query(
      `INSERT INTO academy_cohorts (track_id, name, start_date, end_date, status, created_by)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'planned'), $6) RETURNING id`,
      [
        input.trackId,
        input.name,
        input.startDate ?? null,
        input.endDate ?? null,
        input.status ?? null,
        input.createdBy,
      ]
    );
    return this.getCohort(result.rows[0].id);
  }

  static async updateCohort(
    id: string,
    input: { name?: string; startDate?: string | null; endDate?: string | null; status?: string }
  ) {
    const columns: Record<string, string> = {
      name: 'name',
      startDate: 'start_date',
      endDate: 'end_date',
      status: 'status',
    };

    const sets: string[] = [];
    const values: any[] = [];

    for (const [key, column] of Object.entries(columns)) {
      const value = (input as any)[key];
      if (value !== undefined) {
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      }
    }

    if (sets.length === 0) return this.getCohort(id);

    values.push(id);
    const result = await query(
      `UPDATE academy_cohorts SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length} RETURNING id`,
      values
    );
    return result.rows[0] ? this.getCohort(id) : null;
  }

  static async deleteCohort(id: string) {
    const result = await query(`DELETE FROM academy_cohorts WHERE id = $1`, [id]);
    return (result.rowCount || 0) > 0;
  }

  // ---- Staff --------------------------------------------------------------

  static async addStaff(input: {
    cohortId: string;
    userId: string;
    staffRole: string;
    assignedBy: string;
  }) {
    await query(
      `INSERT INTO academy_cohort_staff (cohort_id, user_id, staff_role, assigned_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cohort_id, user_id) DO UPDATE SET staff_role = EXCLUDED.staff_role`,
      [input.cohortId, input.userId, input.staffRole, input.assignedBy]
    );
    return this.getCohort(input.cohortId);
  }

  static async removeStaff(cohortId: string, userId: string) {
    const result = await query(
      `DELETE FROM academy_cohort_staff WHERE cohort_id = $1 AND user_id = $2`,
      [cohortId, userId]
    );
    return (result.rowCount || 0) > 0;
  }

  // ---- Enrolments ---------------------------------------------------------

  static async listEnrollments(cohortId: string) {
    const result = await query(
      `SELECT e.*, u.first_name, u.last_name, u.email, u.phone_number, u.profile_image,
              (SELECT COUNT(*)::int FROM academy_session_attendance a
                WHERE a.enrollment_id = e.id AND a.status = 'present') AS sessions_attended
       FROM academy_enrollments e
       JOIN users u ON u.id = e.user_id
       WHERE e.cohort_id = $1
       ORDER BY u.first_name, u.last_name`,
      [cohortId]
    );
    return result.rows.map(mapEnrollment);
  }

  static async enroll(cohortId: string, userIds: string[]) {
    const result = await query(
      `INSERT INTO academy_enrollments (cohort_id, user_id)
       SELECT $1, unnest($2::uuid[])
       ON CONFLICT (cohort_id, user_id) DO NOTHING
       RETURNING id`,
      [cohortId, userIds]
    );
    return result.rowCount || 0;
  }

  static async updateEnrollment(
    id: string,
    input: { status?: string; certificateNumber?: string | null; notes?: string | null }
  ) {
    const sets: string[] = [];
    const values: any[] = [];

    if (input.status !== undefined) {
      values.push(input.status);
      sets.push(`status = $${values.length}`);
      // Completion stamps its own date, and reversing a completion clears it,
      // so the date can never disagree with the status.
      sets.push(
        input.status === 'completed'
          ? 'completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP)'
          : 'completed_at = NULL'
      );
    }
    if (input.certificateNumber !== undefined) {
      values.push(input.certificateNumber);
      sets.push(`certificate_number = $${values.length}`);
    }
    if (input.notes !== undefined) {
      values.push(input.notes);
      sets.push(`notes = $${values.length}`);
    }

    if (sets.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE academy_enrollments SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length} RETURNING cohort_id`,
      values
    );
    return result.rows[0]?.cohort_id ?? null;
  }

  static async removeEnrollment(id: string) {
    const result = await query(
      `DELETE FROM academy_enrollments WHERE id = $1 RETURNING cohort_id`,
      [id]
    );
    return result.rows[0]?.cohort_id ?? null;
  }

  static async getEnrollmentCohort(id: string): Promise<string | null> {
    const result = await query(`SELECT cohort_id FROM academy_enrollments WHERE id = $1`, [id]);
    return result.rows[0]?.cohort_id ?? null;
  }

  // ---- Sessions -----------------------------------------------------------

  static async listSessions(cohortId: string) {
    const result = await query(
      `SELECT s.id, s.cohort_id, s.title, s.topic,
              s.session_date::text AS session_date,
              u.first_name AS facilitator_first_name, u.last_name AS facilitator_last_name,
              (SELECT COUNT(*)::int FROM academy_session_attendance a
                WHERE a.session_id = s.id AND a.status = 'present') AS present_count,
              (SELECT COUNT(*)::int FROM academy_session_attendance a
                WHERE a.session_id = s.id) AS recorded_count
       FROM academy_sessions s
       LEFT JOIN users u ON u.id = s.facilitator_id
       WHERE s.cohort_id = $1
       ORDER BY s.session_date DESC`,
      [cohortId]
    );
    return result.rows.map(mapSession);
  }

  static async createSession(input: {
    cohortId: string;
    title: string;
    topic?: string | null;
    sessionDate: string;
    facilitatorId?: string | null;
  }) {
    const result = await query(
      `INSERT INTO academy_sessions (cohort_id, title, topic, session_date, facilitator_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [
        input.cohortId,
        input.title,
        input.topic ?? null,
        input.sessionDate,
        input.facilitatorId ?? null,
      ]
    );
    return result.rows[0].id as string;
  }

  static async deleteSession(id: string) {
    const result = await query(
      `DELETE FROM academy_sessions WHERE id = $1 RETURNING cohort_id`,
      [id]
    );
    return result.rows[0]?.cohort_id ?? null;
  }

  static async getSessionCohort(id: string): Promise<string | null> {
    const result = await query(`SELECT cohort_id FROM academy_sessions WHERE id = $1`, [id]);
    return result.rows[0]?.cohort_id ?? null;
  }

  static async getSessionAttendance(sessionId: string) {
    const result = await query(
      `SELECT e.id AS enrollment_id, u.first_name, u.last_name,
              COALESCE(a.status, 'absent') AS status,
              (a.id IS NOT NULL) AS recorded
       FROM academy_sessions s
       JOIN academy_enrollments e ON e.cohort_id = s.cohort_id
       JOIN users u ON u.id = e.user_id
       LEFT JOIN academy_session_attendance a
         ON a.session_id = s.id AND a.enrollment_id = e.id
       WHERE s.id = $1
       ORDER BY u.first_name, u.last_name`,
      [sessionId]
    );
    return result.rows.map((row) => ({
      enrollmentId: row.enrollment_id,
      firstName: row.first_name,
      lastName: row.last_name,
      status: row.status,
      recorded: row.recorded,
    }));
  }

  /** Whole-register save: one row per enrolment, replacing whatever was there. */
  static async recordAttendance(
    sessionId: string,
    entries: { enrollmentId: string; status: string }[],
    recordedBy: string
  ) {
    if (entries.length === 0) return 0;

    const result = await query(
      // The recordset column names are matched against the JSON keys verbatim,
      // so they are quoted to keep the camelCase the client actually sends.
      // Declaring them snake_case silently yields nulls rather than an error.
      `INSERT INTO academy_session_attendance (session_id, enrollment_id, status, recorded_by)
       SELECT $1, x."enrollmentId"::uuid, x.status, $3
       FROM jsonb_to_recordset($2::jsonb) AS x("enrollmentId" text, status text)
       ON CONFLICT (session_id, enrollment_id)
       DO UPDATE SET status = EXCLUDED.status, recorded_by = EXCLUDED.recorded_by
       RETURNING id`,
      [sessionId, JSON.stringify(entries), recordedBy]
    );
    return result.rowCount || 0;
  }

  // ---- Member progress ----------------------------------------------------

  /**
   * One row per active track for a member: the best outcome they have reached
   * across every run of that track, and whether the track is still gated by an
   * unfinished prerequisite. This replaces the hardcoded list on the profile.
   */
  static async getMemberProgress(userId: string) {
    const result = await query(
      `SELECT t.id, t.name, t.sequence, t.prerequisite_track_id,
              COALESCE(MAX(CASE e.status
                             WHEN 'completed' THEN 3
                             WHEN 'in_progress' THEN 2
                             WHEN 'enrolled' THEN 2
                             WHEN 'withdrawn' THEN 1
                             ELSE 0 END), 0) AS rank,
              MAX(e.completed_at) FILTER (WHERE e.status = 'completed') AS completed_at,
              MAX(c.name) FILTER (WHERE e.status IN ('enrolled', 'in_progress')) AS current_cohort,
              -- The soonest open run of this track the member is not already in,
              -- so the profile card can offer a place. Null means nothing to join.
              (SELECT oc.id FROM academy_cohorts oc
                WHERE oc.track_id = t.id AND oc.status = 'open'
                  AND NOT EXISTS (SELECT 1 FROM academy_enrollments oe
                                   WHERE oe.cohort_id = oc.id AND oe.user_id = $1)
                ORDER BY oc.start_date NULLS LAST, oc.created_at
                LIMIT 1) AS open_cohort_id,
              (SELECT oc.name FROM academy_cohorts oc
                WHERE oc.track_id = t.id AND oc.status = 'open'
                  AND NOT EXISTS (SELECT 1 FROM academy_enrollments oe
                                   WHERE oe.cohort_id = oc.id AND oe.user_id = $1)
                ORDER BY oc.start_date NULLS LAST, oc.created_at
                LIMIT 1) AS open_cohort_name,
              -- Whether they are already waiting on a decision for this track.
              EXISTS (SELECT 1 FROM academy_enrollment_requests r
                       JOIN academy_cohorts rc ON rc.id = r.cohort_id
                      WHERE rc.track_id = t.id AND r.user_id = $1 AND r.status = 'pending'
                     ) AS request_pending
       FROM academy_tracks t
       LEFT JOIN academy_cohorts c ON c.track_id = t.id
       LEFT JOIN academy_enrollments e ON e.cohort_id = c.id AND e.user_id = $1
       WHERE t.is_active = true
       GROUP BY t.id
       ORDER BY t.sequence, t.name`,
      [userId]
    );

    const statusFor = (rank: number): TrackStatus =>
      rank === 3 ? 'completed' : rank === 2 ? 'in_progress' : rank === 1 ? 'withdrawn' : 'not_started';

    const byId = new Map<string, TrackStatus>();
    for (const row of result.rows) byId.set(row.id, statusFor(Number(row.rank)));

    return result.rows.map((row) => {
      const prerequisiteId = row.prerequisite_track_id;
      return {
        trackId: row.id,
        name: row.name,
        sequence: row.sequence,
        status: statusFor(Number(row.rank)),
        completedAt: row.completed_at,
        currentCohort: row.current_cohort,
        // Gated only while the prerequisite is genuinely unfinished. A track
        // with no prerequisite is never locked.
        locked: Boolean(prerequisiteId) && byId.get(prerequisiteId) !== 'completed',
        // What the member can do about this track right now: the open run they
        // may ask to join, and whether they are already waiting on a decision.
        openCohortId: row.open_cohort_id,
        openCohortName: row.open_cohort_name,
        requestPending: row.request_pending,
      };
    });
  }

  /**
   * The discipleship funnel: how many members have reached each track. The
   * number leadership does not currently have.
   */
  static async getOverview() {
    const funnel = await query(
      `SELECT t.id, t.name, t.sequence,
              COUNT(DISTINCT e.user_id) FILTER (WHERE e.status = 'completed')::int AS completed,
              COUNT(DISTINCT e.user_id) FILTER (WHERE e.status IN ('enrolled', 'in_progress'))::int AS in_progress,
              COUNT(DISTINCT c.id)::int AS cohorts
       FROM academy_tracks t
       LEFT JOIN academy_cohorts c ON c.track_id = t.id
       LEFT JOIN academy_enrollments e ON e.cohort_id = c.id
       WHERE t.is_active = true
       GROUP BY t.id
       ORDER BY t.sequence, t.name`
    );

    const totals = await query(
      `SELECT (SELECT COUNT(*)::int FROM academy_tracks WHERE is_active = true) AS tracks,
              (SELECT COUNT(*)::int FROM academy_cohorts WHERE status IN ('open', 'running')) AS active_cohorts,
              (SELECT COUNT(DISTINCT user_id)::int FROM academy_enrollments) AS members_enrolled,
              (SELECT COUNT(*)::int FROM academy_enrollments WHERE status = 'completed') AS completions`
    );

    return {
      funnel: funnel.rows.map((row) => ({
        trackId: row.id,
        name: row.name,
        completed: row.completed,
        inProgress: row.in_progress,
        cohorts: row.cohorts,
      })),
      totals: {
        tracks: totals.rows[0]?.tracks || 0,
        activeCohorts: totals.rows[0]?.active_cohorts || 0,
        membersEnrolled: totals.rows[0]?.members_enrolled || 0,
        completions: totals.rows[0]?.completions || 0,
      },
    };
  }

  // ---- Member-initiated enrolment requests --------------------------------

  /** Raw status, used to tell a real status change from a no-op save. */
  static async getCohortStatus(id: string): Promise<string | null> {
    const result = await query(`SELECT status FROM academy_cohorts WHERE id = $1`, [id]);
    return result.rows[0]?.status ?? null;
  }

  /**
   * One in-app notice per member who could join this newly opened cohort.
   * Deliberately in-app only (no email blast): the member acts on it from their
   * profile, which is where the "Request to join" button lives.
   *
   * Eligible means an active member who is not already in this cohort, has no
   * standing in this track yet (not enrolled, in progress or completed), and
   * has cleared the prerequisite track if the track has one.
   */
  static async notifyCohortOpened(cohortId: string): Promise<number> {
    const info = await query(
      `SELECT c.name AS cohort_name, t.id AS track_id, t.name AS track_name,
              t.prerequisite_track_id
         FROM academy_cohorts c
         JOIN academy_tracks t ON t.id = c.track_id
        WHERE c.id = $1`,
      [cohortId]
    );
    const row = info.rows[0];
    if (!row) return 0;

    const title = `${row.track_name} is now open`;
    const message =
      `Enrolment for "${row.cohort_name}" (${row.track_name}) is open. ` +
      `Open your profile to request a place.`;

    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       SELECT u.id, 'academy_cohort_open', $2, $3,
              jsonb_build_object('cohortId', $1::text, 'trackId', $4::text)
         FROM users u
        WHERE u.is_active = true
          AND NOT EXISTS (
                SELECT 1 FROM academy_enrollments e
                 JOIN academy_cohorts c ON c.id = e.cohort_id
                WHERE c.track_id = $4 AND e.user_id = u.id
                  AND e.status IN ('enrolled', 'in_progress', 'completed'))
          AND ($5::uuid IS NULL OR EXISTS (
                SELECT 1 FROM academy_enrollments e
                 JOIN academy_cohorts c ON c.id = e.cohort_id
                WHERE c.track_id = $5 AND e.user_id = u.id AND e.status = 'completed'))`,
      [cohortId, title, message, row.track_id, row.prerequisite_track_id]
    );
    return result.rowCount || 0;
  }

  /**
   * A member asks to join an open cohort. Validated the same way the profile
   * card decides whether to show the button, so a crafted request cannot slip
   * past a closed cohort, an unmet prerequisite, or a place already held.
   */
  static async requestJoin(userId: string, cohortId: string) {
    const cohortRes = await query(
      `SELECT c.id, c.name, c.status, c.track_id, t.name AS track_name,
              t.prerequisite_track_id
         FROM academy_cohorts c
         JOIN academy_tracks t ON t.id = c.track_id
        WHERE c.id = $1`,
      [cohortId]
    );
    const cohort = cohortRes.rows[0];
    if (!cohort) throw Object.assign(new Error('Cohort not found'), { code: 'NOT_FOUND' });
    if (cohort.status !== 'open') {
      throw Object.assign(new Error('This cohort is not open for enrolment'), { code: 'NOT_OPEN' });
    }

    const standing = await query(
      `SELECT 1 FROM academy_enrollments e
         JOIN academy_cohorts c ON c.id = e.cohort_id
        WHERE c.track_id = $1 AND e.user_id = $2
          AND e.status IN ('enrolled', 'in_progress', 'completed')
        LIMIT 1`,
      [cohort.track_id, userId]
    );
    if ((standing.rowCount || 0) > 0) {
      throw Object.assign(new Error('You already have a place on this track'), {
        code: 'ALREADY_ENROLLED',
      });
    }

    if (cohort.prerequisite_track_id) {
      const prereq = await query(
        `SELECT 1 FROM academy_enrollments e
           JOIN academy_cohorts c ON c.id = e.cohort_id
          WHERE c.track_id = $1 AND e.user_id = $2 AND e.status = 'completed'
          LIMIT 1`,
        [cohort.prerequisite_track_id, userId]
      );
      if ((prereq.rowCount || 0) === 0) {
        throw Object.assign(new Error('You have not yet completed the prerequisite track'), {
          code: 'PREREQUISITE',
        });
      }
    }

    const pending = await query(
      `SELECT 1 FROM academy_enrollment_requests
        WHERE cohort_id = $1 AND user_id = $2 AND status = 'pending'`,
      [cohortId, userId]
    );
    if ((pending.rowCount || 0) > 0) {
      throw Object.assign(new Error('You already have a pending request for this cohort'), {
        code: 'PENDING_EXISTS',
      });
    }

    const inserted = await query(
      `INSERT INTO academy_enrollment_requests (cohort_id, user_id, status)
       VALUES ($1, $2, 'pending') RETURNING id`,
      [cohortId, userId]
    );
    const requestId = inserted.rows[0].id as string;

    // Tell the cohort's staff there is someone to let in. In-app only; the
    // register lives in the cohort dashboard, not in email.
    const staff = await query(
      `SELECT user_id FROM academy_cohort_staff WHERE cohort_id = $1`,
      [cohortId]
    );
    const requester = await query(
      `SELECT first_name, last_name FROM users WHERE id = $1`,
      [userId]
    );
    const name = requester.rows[0]
      ? `${requester.rows[0].first_name} ${requester.rows[0].last_name}`.trim()
      : 'A member';

    await Promise.all(
      staff.rows.map((s) =>
        NotificationService.sendNotification({
          userId: s.user_id,
          type: NotificationType.ACADEMY_JOIN_REQUEST,
          title: 'New academy join request',
          message: `${name} has asked to join "${cohort.name}" (${cohort.track_name}).`,
          metadata: { requestId, cohortId, requestingUserId: userId },
          skipEmail: true,
        }).catch((err) => console.error('Failed to notify cohort staff:', err))
      )
    );

    return { id: requestId, cohortId, status: 'pending' };
  }

  static async getMyRequests(userId: string) {
    const result = await query(
      `SELECT r.id, r.cohort_id, r.status, r.created_at,
              c.name AS cohort_name, t.name AS track_name
         FROM academy_enrollment_requests r
         JOIN academy_cohorts c ON c.id = r.cohort_id
         JOIN academy_tracks t ON t.id = c.track_id
        WHERE r.user_id = $1 AND r.status = 'pending'
        ORDER BY r.created_at DESC`,
      [userId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      cohortId: row.cohort_id,
      cohortName: row.cohort_name,
      trackName: row.track_name,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  static async listJoinRequests(cohortId: string) {
    const result = await query(
      `SELECT r.id, r.user_id, r.created_at,
              u.first_name, u.last_name, u.email, u.profile_image, u.phone_number
         FROM academy_enrollment_requests r
         JOIN users u ON u.id = r.user_id
        WHERE r.cohort_id = $1 AND r.status = 'pending'
        ORDER BY r.created_at ASC`,
      [cohortId]
    );
    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      profileImage: row.profile_image,
      phoneNumber: row.phone_number,
      createdAt: row.created_at,
    }));
  }

  static async getJoinRequestCohort(requestId: string): Promise<string | null> {
    const result = await query(
      `SELECT cohort_id FROM academy_enrollment_requests WHERE id = $1`,
      [requestId]
    );
    return result.rows[0]?.cohort_id ?? null;
  }

  /** Accept marks the request and enrols the member in one transaction. */
  static async acceptJoinRequest(requestId: string, decidedBy: string) {
    const reqRes = await query(
      `SELECT r.user_id, r.cohort_id, r.status, c.name AS cohort_name, t.name AS track_name
         FROM academy_enrollment_requests r
         JOIN academy_cohorts c ON c.id = r.cohort_id
         JOIN academy_tracks t ON t.id = c.track_id
        WHERE r.id = $1`,
      [requestId]
    );
    const req = reqRes.rows[0];
    if (!req) throw Object.assign(new Error('Request not found'), { code: 'NOT_FOUND' });
    if (req.status !== 'pending') {
      throw Object.assign(new Error('This request has already been resolved'), {
        code: 'ALREADY_RESOLVED',
      });
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE academy_enrollment_requests
            SET status = 'accepted', decided_by = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1`,
        [requestId, decidedBy]
      );
      await client.query(
        `INSERT INTO academy_enrollments (cohort_id, user_id)
         VALUES ($1, $2) ON CONFLICT (cohort_id, user_id) DO NOTHING`,
        [req.cohort_id, req.user_id]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    await NotificationService.sendNotification({
      userId: req.user_id,
      type: NotificationType.ACADEMY_JOIN_RESPONSE,
      title: 'Academy request accepted',
      message: `You have a place on "${req.cohort_name}" (${req.track_name}). Welcome!`,
      metadata: { requestId, cohortId: req.cohort_id },
      emailAction: { label: 'View your progress', path: '/dashboard/profile' },
    }).catch((err) => console.error('Failed to notify member of acceptance:', err));

    return req.cohort_id as string;
  }

  static async rejectJoinRequest(requestId: string, decidedBy: string) {
    const reqRes = await query(
      `SELECT r.user_id, r.cohort_id, r.status, c.name AS cohort_name, t.name AS track_name
         FROM academy_enrollment_requests r
         JOIN academy_cohorts c ON c.id = r.cohort_id
         JOIN academy_tracks t ON t.id = c.track_id
        WHERE r.id = $1`,
      [requestId]
    );
    const req = reqRes.rows[0];
    if (!req) throw Object.assign(new Error('Request not found'), { code: 'NOT_FOUND' });
    if (req.status !== 'pending') {
      throw Object.assign(new Error('This request has already been resolved'), {
        code: 'ALREADY_RESOLVED',
      });
    }

    await query(
      `UPDATE academy_enrollment_requests
          SET status = 'rejected', decided_by = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
      [requestId, decidedBy]
    );

    await NotificationService.sendNotification({
      userId: req.user_id,
      type: NotificationType.ACADEMY_JOIN_RESPONSE,
      title: 'Academy request declined',
      message: `Your request to join "${req.cohort_name}" (${req.track_name}) was not accepted this time.`,
      metadata: { requestId, cohortId: req.cohort_id },
      skipEmail: true,
    }).catch((err) => console.error('Failed to notify member of rejection:', err));

    return req.cohort_id as string;
  }
}

function mapTrack(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sequence: row.sequence,
    prerequisiteTrackId: row.prerequisite_track_id,
    prerequisiteName: row.prerequisite_name ?? null,
    isActive: row.is_active,
    cohortCount: row.cohort_count ?? 0,
    enrollmentCount: row.enrollment_count ?? 0,
  };
}

function mapCohort(row: any) {
  return {
    id: row.id,
    trackId: row.track_id,
    trackName: row.track_name,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    enrolledCount: row.enrolled_count ?? 0,
    completedCount: row.completed_count ?? 0,
    sessionCount: row.session_count ?? 0,
    staff: row.staff ?? [],
  };
}

function mapEnrollment(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phoneNumber: row.phone_number,
    profileImage: row.profile_image,
    status: row.status,
    enrolledAt: row.enrolled_at,
    completedAt: row.completed_at,
    certificateNumber: row.certificate_number,
    notes: row.notes,
    sessionsAttended: row.sessions_attended ?? 0,
  };
}

function mapSession(row: any) {
  return {
    id: row.id,
    cohortId: row.cohort_id,
    title: row.title,
    topic: row.topic,
    sessionDate: row.session_date,
    facilitatorName: [row.facilitator_first_name, row.facilitator_last_name]
      .filter(Boolean)
      .join(' ') || null,
    presentCount: row.present_count ?? 0,
    recordedCount: row.recorded_count ?? 0,
  };
}
