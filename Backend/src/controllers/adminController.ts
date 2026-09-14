import { FastifyReply } from 'fastify';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserService } from '../services/userService';
import { UserRole } from '../types';
import {
  ACTIVITY_STATUS_EXPR,
  Audience,
  INACTIVE_MISSED_SERVICES_THRESHOLD,
  MEMBER_ACTIVITY_CTE,
  MemberActivityService,
} from '../services/memberActivityService';
import {
  BATCH_DELAY_MS,
  BATCH_SIZE,
  EmailCampaignService,
} from '../services/emailCampaignService';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { buildStoredFilename } from '../utils/multipart';

export class AdminController {
  /**
   * Every card on the admin dashboard reads from this one query so the numbers
   * cannot drift apart. Each metric is paired with the same metric as it stood
   * 30 days ago; that pair is what the trend line under each card reports. The
   * trend used to be a hardcoded "8.5% Up from yesterday" on all four cards.
   */
  static async getDashboardStats(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const statsResult = await query(
        `SELECT
           (SELECT COUNT(*)::int FROM users WHERE is_active = true) AS total_members,
           (SELECT COUNT(*)::int FROM users
             WHERE is_active = true
               AND join_date < CURRENT_DATE - INTERVAL '30 days') AS total_members_prev,

           (SELECT COUNT(DISTINCT user_id)::int FROM attendance) AS total_attended,
           (SELECT COUNT(DISTINCT user_id)::int FROM attendance
             WHERE service_date < CURRENT_DATE - INTERVAL '30 days') AS total_attended_prev,

           (SELECT COUNT(*)::int FROM users
             WHERE is_active = true AND role = 'member'
               AND join_date >= CURRENT_DATE - INTERVAL '30 days') AS new_members,
           (SELECT COUNT(*)::int FROM users
             WHERE is_active = true AND role = 'member'
               AND join_date >= CURRENT_DATE - INTERVAL '60 days'
               AND join_date <  CURRENT_DATE - INTERVAL '30 days') AS new_members_prev,

           (SELECT COUNT(*)::int FROM users
             WHERE is_active = true AND role <> 'member') AS workers`
      );

      const row = statsResult.rows[0] ?? {};

      const sundaySeriesResult = await query(
        `WITH sundays AS (
           SELECT (date_trunc('week', CURRENT_DATE)::date + interval '6 days' - interval '7 weeks') AS start_date
         ), series AS (
           SELECT generate_series(
             (SELECT start_date FROM sundays),
             (date_trunc('week', CURRENT_DATE)::date + interval '6 days'),
             interval '7 days'
           )::date AS sunday
         )
         SELECT s.sunday,
                COUNT(u.id)::int AS count
         FROM series s
         LEFT JOIN users u
           ON u.role = 'member'
          AND (date_trunc('week', u.join_date)::date + interval '6 days')::date = s.sunday
         GROUP BY s.sunday
         ORDER BY s.sunday`
      );

      const chart = sundaySeriesResult.rows.map((r) => ({
        date: r.sunday,
        count: r.count,
      }));

      reply.send({
        totalMembers: row.total_members || 0,
        totalAttended: row.total_attended || 0,
        newMembers: row.new_members || 0,
        workers: row.workers || 0,
        /**
         * `previous` is the same measurement 30 days back, or null where no
         * honest baseline exists. Workers is the null case: promoting a member
         * to a worker role leaves no audit trail, so there is no way to know
         * how many workers there were last month. The card renders no trend
         * rather than an invented one.
         */
        trends: {
          totalMembers: { current: row.total_members || 0, previous: row.total_members_prev ?? null },
          totalAttended: { current: row.total_attended || 0, previous: row.total_attended_prev ?? null },
          newMembers: { current: row.new_members || 0, previous: row.new_members_prev ?? null },
          workers: { current: row.workers || 0, previous: null },
        },
        trendPeriodDays: 30,
        newMembersBySunday: chart,
      });
    } catch (error) {
      console.error('Admin dashboard stats error:', error);
      reply.status(500).send({ error: 'Failed to load admin dashboard stats' });
    }
  }

  /**
   * Full user registry for the admin Members page: every registered account,
   * active and deactivated alike. `getAllUsers` cannot back this screen because
   * it has no search, no paging and no total, and the existing `/admin/users`
   * search hides deactivated accounts and caps at 50 rows.
   *
   * Active vs non-active here is attendance-derived, not the `is_active`
   * column: see MemberActivityService. `is_active` still means the account
   * itself is enabled, which is what the separate 'deactivated' filter reports.
   */
  static async listMembers(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { status, role, q, page, limit } = request.query as {
        status?: string;
        role?: string;
        q?: string;
        page?: string;
        limit?: string;
      };

      const conditions: string[] = [];
      const values: any[] = [];

      // 'inactive' is accepted as an alias so older links keep working.
      if (status === 'active') {
        conditions.push(
          `u.is_active = true AND COALESCE(ma.missed_services, 0) < ${INACTIVE_MISSED_SERVICES_THRESHOLD}`
        );
      } else if (status === 'non_active' || status === 'inactive') {
        conditions.push(
          `u.is_active = true AND COALESCE(ma.missed_services, 0) >= ${INACTIVE_MISSED_SERVICES_THRESHOLD}`
        );
      } else if (status === 'deactivated') {
        conditions.push('u.is_active = false');
      }

      if (role && (Object.values(UserRole) as string[]).includes(role)) {
        values.push(role);
        conditions.push(`u.role = $${values.length}`);
      }

      if (q?.trim()) {
        values.push(`%${q.trim().toLowerCase()}%`);
        const p = `$${values.length}`;
        conditions.push(
          `(LOWER(u.first_name) LIKE ${p}
            OR LOWER(u.last_name) LIKE ${p}
            OR LOWER(u.first_name || ' ' || u.last_name) LIKE ${p}
            OR LOWER(u.email) LIKE ${p}
            OR u.phone_number LIKE ${p})`
        );
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const pageNum = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);
      const pageSize = Math.min(100, Math.max(1, Number.parseInt(limit ?? '25', 10) || 25));

      values.push(pageSize, (pageNum - 1) * pageSize);
      const limitParam = `$${values.length - 1}`;
      const offsetParam = `$${values.length}`;

      const rowsResult = await query(
        `WITH ${MEMBER_ACTIVITY_CTE}
         SELECT u.id, u.first_name, u.last_name, u.email, u.phone_number, u.role,
                u.is_active, u.join_date, u.created_at, u.profile_image,
                d.name AS department_name,
                c.name AS cell_group_name,
                COALESCE(ma.missed_services, 0) AS missed_services,
                ${ACTIVITY_STATUS_EXPR} AS activity_status,
                COUNT(*) OVER()::int AS total_count
         FROM users u
         LEFT JOIN member_activity ma ON ma.user_id = u.id
         LEFT JOIN departments d ON d.id = u.department_id
         LEFT JOIN cell_groups c ON c.id = u.cell_group_id
         ${where}
         ORDER BY u.created_at DESC
         LIMIT ${limitParam} OFFSET ${offsetParam}`,
        values
      );

      // Deliberately unfiltered: the tab badges report the size of the whole
      // registry, so they stay put while a search narrows the table below them.
      const counts = await MemberActivityService.getCounts();

      const total = rowsResult.rows[0]?.total_count ?? 0;

      reply.send({
        members: rowsResult.rows.map((r) => ({
          id: r.id,
          firstName: r.first_name,
          lastName: r.last_name,
          email: r.email,
          phoneNumber: r.phone_number,
          role: r.role,
          isActive: r.is_active,
          activityStatus: r.is_active ? r.activity_status : 'deactivated',
          missedServices: r.missed_services,
          joinDate: r.join_date,
          createdAt: r.created_at,
          profileImage: r.profile_image,
          departmentName: r.department_name,
          cellGroupName: r.cell_group_name,
        })),
        counts,
        inactiveThreshold: INACTIVE_MISSED_SERVICES_THRESHOLD,
        pagination: {
          page: pageNum,
          limit: pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      });
    } catch (error) {
      console.error('Admin list members error:', error);
      reply.status(500).send({ error: 'Failed to load members' });
    }
  }

  /** One member's full record for the admin profile page. */
  static async getMemberProfile(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };

      const result = await query(
        `WITH ${MEMBER_ACTIVITY_CTE}
         SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number, u.role,
                u.department_id, u.cell_group_id, u.date_of_birth, u.address,
                u.is_first_timer, u.join_date, u.profile_image, u.is_active,
                u.created_at, u.updated_at,
                d.name AS department_name,
                c.name AS cell_group_name,
                COALESCE(ma.missed_services, 0) AS missed_services,
                ${ACTIVITY_STATUS_EXPR} AS activity_status,
                (SELECT COUNT(DISTINCT a.service_date)::int
                   FROM attendance a
                  WHERE a.service_date >= u.join_date::date
                    AND a.service_date <= CURRENT_DATE) AS total_services,
                (SELECT COUNT(DISTINCT a.service_date)::int
                   FROM attendance a
                  WHERE a.user_id = u.id AND a.status = 'present') AS services_attended,
                (SELECT MAX(a.service_date)
                   FROM attendance a
                  WHERE a.user_id = u.id AND a.status = 'present') AS last_attended
         FROM users u
         LEFT JOIN member_activity ma ON ma.user_id = u.id
         LEFT JOIN departments d ON d.id = u.department_id
         LEFT JOIN cell_groups c ON c.id = u.cell_group_id
         WHERE u.id = $1`,
        [id]
      );

      const row = result.rows[0];
      if (!row) {
        return reply.status(404).send({ error: 'Member not found' });
      }

      reply.send({
        member: {
          id: row.id,
          email: row.email,
          firstName: row.first_name,
          lastName: row.last_name,
          phoneNumber: row.phone_number,
          role: row.role,
          departmentId: row.department_id,
          departmentName: row.department_name,
          cellGroupId: row.cell_group_id,
          cellGroupName: row.cell_group_name,
          dateOfBirth: row.date_of_birth,
          address: row.address,
          isFirstTimer: row.is_first_timer,
          joinDate: row.join_date,
          profileImage: row.profile_image,
          isActive: row.is_active,
          activityStatus: row.is_active ? row.activity_status : 'deactivated',
          missedServices: row.missed_services,
          totalServices: row.total_services,
          servicesAttended: row.services_attended,
          lastAttended: row.last_attended,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        inactiveThreshold: INACTIVE_MISSED_SERVICES_THRESHOLD,
      });
    } catch (error) {
      console.error('Admin get member profile error:', error);
      reply.status(500).send({ error: 'Failed to load the member' });
    }
  }

  /**
   * Edits an existing member. Email and password are not editable here: email
   * has no re-verification flow, and passwords are only ever written by the
   * reset service, which hashes first.
   */
  static async updateMember(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as Record<string, any>;

      const existing = await UserService.getUserById(id);
      if (!existing) {
        return reply.status(404).send({ error: 'Member not found' });
      }

      const updates: Record<string, any> = {};

      const trimmedText = (value: any) =>
        typeof value === 'string' ? value.trim() : undefined;

      for (const field of ['firstName', 'lastName', 'phoneNumber'] as const) {
        const value = trimmedText(body[field]);
        if (value !== undefined) {
          if (!value) {
            return reply.status(400).send({ error: `${field} cannot be empty` });
          }
          updates[field] = value;
        }
      }

      // Address and date of birth are genuinely optional, so an empty string
      // clears them rather than being rejected.
      if (body.address !== undefined) {
        updates.address = trimmedText(body.address) || null;
      }
      if (body.dateOfBirth !== undefined) {
        const raw = trimmedText(body.dateOfBirth);
        if (!raw) {
          updates.dateOfBirth = null;
        } else if (Number.isNaN(new Date(raw).getTime())) {
          return reply.status(400).send({ error: 'dateOfBirth is not a valid date' });
        } else {
          updates.dateOfBirth = raw;
        }
      }

      for (const field of ['departmentId', 'cellGroupId'] as const) {
        if (body[field] !== undefined) {
          updates[field] = trimmedText(body[field]) || null;
        }
      }

      if (body.isFirstTimer !== undefined) {
        updates.isFirstTimer = Boolean(body.isFirstTimer);
      }

      if (body.role !== undefined) {
        if (!(Object.values(UserRole) as string[]).includes(body.role)) {
          return reply.status(400).send({ error: 'Unknown role' });
        }
        // Self-lockout guard: an admin who demotes themselves loses the very
        // screen they would need to undo it.
        if (id === request.user!.id && body.role !== existing.role) {
          return reply.status(400).send({ error: 'You cannot change your own role' });
        }
        if (existing.role === UserRole.SUPER_ADMIN && body.role !== UserRole.SUPER_ADMIN) {
          const remaining = await query(
            `SELECT COUNT(*)::int AS count FROM users
             WHERE role = 'super_admin' AND is_active = true AND id <> $1`,
            [id]
          );
          if ((remaining.rows[0]?.count || 0) === 0) {
            return reply
              .status(400)
              .send({ error: 'This is the last super admin. Promote someone else first.' });
          }
        }
        updates.role = body.role;
      }

      if (body.isActive !== undefined) {
        const nextActive = Boolean(body.isActive);
        if (id === request.user!.id && !nextActive) {
          return reply.status(400).send({ error: 'You cannot deactivate your own account' });
        }
        if (!nextActive && existing.role === UserRole.SUPER_ADMIN) {
          const remaining = await query(
            `SELECT COUNT(*)::int AS count FROM users
             WHERE role = 'super_admin' AND is_active = true AND id <> $1`,
            [id]
          );
          if ((remaining.rows[0]?.count || 0) === 0) {
            return reply
              .status(400)
              .send({ error: 'This is the last super admin. Promote someone else first.' });
          }
        }
        updates.isActive = nextActive;
      }

      if (Object.keys(updates).length === 0) {
        return reply.status(400).send({ error: 'No editable fields were supplied' });
      }

      const updated = await UserService.updateUser(id, updates as any);
      if (!updated) {
        return reply.status(404).send({ error: 'Member not found' });
      }

      reply.send({ member: updated });
    } catch (error: any) {
      console.error('Admin update member error:', error);
      if (error?.code === '23503') {
        return reply.status(400).send({ error: 'That department or cell group does not exist' });
      }
      reply.status(500).send({ error: 'Failed to update the member' });
    }
  }

  /** Audience size and batching plan, so the compose form can say what a send will do. */
  static async getEmailAudience(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { audience } = request.query as { audience?: string };
      if (audience !== 'active' && audience !== 'non_active') {
        return reply.status(400).send({ error: "audience must be 'active' or 'non_active'" });
      }

      const recipients = await MemberActivityService.getRecipients(audience);
      reply.send({
        audience,
        recipientCount: recipients.length,
        batchSize: BATCH_SIZE,
        batchDelayMs: BATCH_DELAY_MS,
        totalBatches: Math.ceil(recipients.length / BATCH_SIZE),
      });
    } catch (error) {
      console.error('Admin email audience error:', error);
      reply.status(500).send({ error: 'Failed to resolve audience' });
    }
  }

  static async createEmailCampaign(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { audience, subject, body } = request.body as {
        audience?: string;
        subject?: string;
        body?: string;
      };

      if (audience !== 'active' && audience !== 'non_active') {
        return reply.status(400).send({ error: "audience must be 'active' or 'non_active'" });
      }
      if (!subject?.trim()) {
        return reply.status(400).send({ error: 'Subject is required' });
      }
      if (!body?.trim()) {
        return reply.status(400).send({ error: 'Message is required' });
      }
      if (subject.trim().length > 200) {
        return reply.status(400).send({ error: 'Subject must be 200 characters or fewer' });
      }
      if (body.trim().length > 20000) {
        return reply.status(400).send({ error: 'Message must be 20,000 characters or fewer' });
      }

      // One send at a time. Two overlapping runs would interleave their batches
      // and blow through the rate budget the batching exists to respect.
      const running = await EmailCampaignService.getRunning();
      if (running) {
        return reply.status(409).send({
          error: 'A send is already in progress. Wait for it to finish before starting another.',
          campaignId: running.id,
        });
      }

      const campaign = await EmailCampaignService.create({
        audience: audience as Audience,
        subject: subject.trim(),
        body: body.trim(),
        createdBy: request.user!.id,
      });

      reply.status(201).send({ campaign });
    } catch (error) {
      console.error('Admin create email campaign error:', error);
      reply.status(500).send({ error: 'Failed to start the send' });
    }
  }

  static async getEmailCampaign(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const campaign = await EmailCampaignService.getById(id);
      if (!campaign) {
        return reply.status(404).send({ error: 'Campaign not found' });
      }
      reply.send({ campaign });
    } catch (error) {
      console.error('Admin get email campaign error:', error);
      reply.status(500).send({ error: 'Failed to load the send' });
    }
  }

  static async listEmailCampaigns(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const campaigns = await EmailCampaignService.listRecent(10);
      reply.send({ campaigns });
    } catch (error) {
      console.error('Admin list email campaigns error:', error);
      reply.status(500).send({ error: 'Failed to load recent sends' });
    }
  }

  static async createBookshopManager(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const isMultipart = (request as any).isMultipart?.() ?? false;
      let fields: Record<string, any> = {};
      let profileImage: string | undefined;
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];

      if (isMultipart) {
        const parts = (request as any).parts();
        for await (const part of parts) {
          if (part.type === 'file') {
            if (!part.mimetype || !allowedImageTypes.includes(part.mimetype)) {
              return reply.status(400).send({ error: 'Only JPG or PNG images are allowed' });
            }
            if (part.fieldname !== 'profileImage' && part.fieldname !== 'profile') {
              continue;
            }
            await fs.mkdir(config.upload.dir, { recursive: true });
            const filename = buildStoredFilename(request.user!.id, part.filename, part.mimetype);
            const filePath = path.join(config.upload.dir, filename);
            const buffer = await part.toBuffer();
            await fs.writeFile(filePath, buffer);
            profileImage = `/uploads/${filename}`;
          } else {
            fields[part.fieldname] = part.value;
          }
        }
      } else {
        fields = request.body as any;
      }

      const { firstName, lastName, email, phoneNumber, address, password, confirmPassword } = fields;

      if (!firstName || !lastName || !email || !phoneNumber || !address || !password || !confirmPassword) {
        return reply.status(400).send({ error: 'All fields are required' });
      }

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return reply.status(400).send({ error: 'Invalid email address' });
      }

      if (password.length < 8) {
        return reply.status(400).send({ error: 'Password must be at least 8 characters' });
      }

      if (password !== confirmPassword) {
        return reply.status(400).send({ error: 'Passwords do not match' });
      }

      const existing = await UserService.getUserByEmail(email);
      if (existing) {
        return reply.status(409).send({ error: 'Email already registered' });
      }

      const user = await UserService.createUser({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        address,
        role: UserRole.BOOKSHOP_MANAGER,
        profileImage,
      });

      reply.status(201).send({ user });
    } catch (error) {
      console.error('Create bookshop manager error:', error);
      reply.status(500).send({ error: 'Failed to create bookshop manager' });
    }
  }

  static async listBookshopManagers(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const managers = await UserService.getAllUsers({ role: UserRole.BOOKSHOP_MANAGER, isActive: true });
      reply.send({ managers });
    } catch (error) {
      console.error('List bookshop managers error:', error);
      reply.status(500).send({ error: 'Failed to load bookshop managers' });
    }
  }

  static async deleteBookshopManager(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;

      const manager = await UserService.getUserById(id);
      if (!manager || manager.role !== UserRole.BOOKSHOP_MANAGER) {
        return reply.status(404).send({ error: 'Bookshop manager not found' });
      }

      const success = await UserService.deleteUser(id);
      if (!success) {
        return reply.status(404).send({ error: 'Bookshop manager not found' });
      }

      reply.send({ message: 'Bookshop manager deleted' });
    } catch (error) {
      console.error('Delete bookshop manager error:', error);
      reply.status(500).send({ error: 'Failed to delete bookshop manager' });
    }
  }
}
