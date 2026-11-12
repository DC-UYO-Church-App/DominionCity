import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../middleware/auth';
import { query } from '../config/database';
import { FaceService, FaceError } from '../services/faceService';

function handleError(reply: FastifyReply, error: unknown, fallback: string) {
  if (error instanceof FaceError) {
    return reply.status(error.status).send({ error: error.message, code: error.code });
  }
  console.error(`${fallback}:`, error);
  return reply.status(500).send({ error: fallback });
}

export class FaceController {
  // ---- Member-facing ------------------------------------------------------

  /** A member registers their own face. */
  static async enrollMe(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const body = request.body as { image?: unknown; consent?: unknown };
      const result = await FaceService.enroll({
        userId: request.user!.id,
        image: body.image,
        consent: body.consent === true,
        enrolledBy: request.user!.id,
      });
      reply.status(201).send(result);
    } catch (error) {
      handleError(reply, error, 'Failed to register your face');
    }
  }

  static async getMyEnrollment(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const enrollment = await FaceService.getEnrollment(request.user!.id);
      reply.send({ enrollment, configured: FaceService.enrollmentReady().ok });
    } catch (error) {
      handleError(reply, error, 'Failed to load your face registration');
    }
  }

  static async deleteMyEnrollment(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const removed = await FaceService.deleteEnrollment(request.user!.id);
      if (!removed) return reply.status(404).send({ error: 'You have no face registered' });
      reply.send({ success: true });
    } catch (error) {
      handleError(reply, error, 'Failed to remove your face registration');
    }
  }

  // ---- Technical dashboard ------------------------------------------------

  /** Every registered user with their face-enrolment status. */
  static async listUsers(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { q, enrolled } = request.query as { q?: string; enrolled?: string };
      const conditions: string[] = [];
      const values: any[] = [];

      if (q && q.trim()) {
        values.push(`%${q.trim()}%`);
        conditions.push(
          `(u.first_name ILIKE $${values.length} OR u.last_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`
        );
      }
      if (enrolled === 'true') conditions.push(`e.user_id IS NOT NULL`);
      if (enrolled === 'false') conditions.push(`e.user_id IS NULL`);

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const result = await query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.profile_image, u.is_active,
                (e.user_id IS NOT NULL) AS face_enrolled,
                e.updated_at AS enrolled_at
           FROM users u
           LEFT JOIN face_enrollments e ON e.user_id = u.id
           ${where}
           ORDER BY u.first_name, u.last_name
           LIMIT 500`,
        values
      );

      const counts = await query(
        `SELECT COUNT(*)::int AS total,
                (SELECT COUNT(*)::int FROM face_enrollments) AS enrolled
           FROM users`
      );

      reply.send({
        users: result.rows.map((row) => ({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          role: row.role,
          profileImage: row.profile_image,
          isActive: row.is_active,
          faceEnrolled: row.face_enrolled,
          enrolledAt: row.enrolled_at,
        })),
        totals: {
          users: counts.rows[0]?.total || 0,
          enrolled: counts.rows[0]?.enrolled || 0,
        },
        configured: FaceService.isFaceServiceConfigured(),
      });
    } catch (error) {
      handleError(reply, error, 'Failed to load users');
    }
  }

  /** Scan a face and identify which registered member it is. */
  static async recognize(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const body = request.body as { image?: unknown };
      const result = await FaceService.recognize(body.image);
      reply.send(result);
    } catch (error) {
      handleError(reply, error, 'Failed to scan the face');
    }
  }

  /** Streams a user's enrolled face still so the dashboard can display it. */
  static async getUserEnrollmentImage(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      const { body, contentType } = await FaceService.getEnrollmentImage(userId);
      reply
        .header('Content-Type', contentType)
        .header('Cache-Control', 'private, max-age=300')
        .send(body);
    } catch (error) {
      handleError(reply, error, 'Failed to load the face image');
    }
  }

  /** A technical operator removes someone else's face registration. */
  static async deleteUserEnrollment(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      const removed = await FaceService.deleteEnrollment(userId);
      if (!removed) return reply.status(404).send({ error: 'That user has no face registered' });
      reply.send({ success: true });
    } catch (error) {
      handleError(reply, error, 'Failed to remove the face registration');
    }
  }
}
