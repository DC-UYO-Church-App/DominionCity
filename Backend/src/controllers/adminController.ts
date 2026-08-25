import { FastifyReply } from 'fastify';
import { query } from '../config/database';
import { AuthenticatedRequest } from '../middleware/auth';
import { UserService } from '../services/userService';
import { UserRole } from '../types';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { buildStoredFilename } from '../utils/multipart';

export class AdminController {
  static async getDashboardStats(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const totalMembersResult = await query(
        `SELECT COUNT(*)::int AS count FROM users WHERE is_active = true`
      );

      const totalAttendedResult = await query(
        `SELECT COUNT(DISTINCT user_id)::int AS count FROM attendance`
      );

      const newMembersResult = await query(
        `SELECT COUNT(*)::int AS count
         FROM users
         WHERE is_active = true
           AND role = 'member'
           AND join_date >= CURRENT_DATE - INTERVAL '30 days'`
      );

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

      const chart = sundaySeriesResult.rows.map((row) => ({
        date: row.sunday,
        count: row.count,
      }));

      reply.send({
        totalMembers: totalMembersResult.rows[0]?.count || 0,
        totalAttended: totalAttendedResult.rows[0]?.count || 0,
        newMembers: newMembersResult.rows[0]?.count || 0,
        newMembersBySunday: chart,
      });
    } catch (error) {
      console.error('Admin dashboard stats error:', error);
      reply.status(500).send({ error: 'Failed to load admin dashboard stats' });
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
