import { FastifyReply } from 'fastify';
import { TitheService } from '../services/titheService';
import { AuthenticatedRequest, canAccessUserRecords } from '../middleware/auth';
import { TitheFrequency, UserRole } from '../types';

/**
 * Who may read someone else's giving.
 *
 * Narrower than PASTORAL_ROLES on purpose — attendance is pastoral care, but
 * a member's giving record is finance, so heads of department are excluded.
 */
const GIVING_ROLES: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PASTOR];

export class TitheController {
  static async recordTithe(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { userId, amount, frequency, paymentDate, paymentMethod, notes } = request.body as any;

      if (!userId || amount === undefined || !frequency || !paymentMethod) {
        return reply.status(400).send({ error: 'User ID, amount, frequency, and payment method are required' });
      }

      // The subject used to be whatever the body said, with no role guard, so
      // any member could file a financial record against anyone. Recording on
      // someone else's behalf is a finance-office job.
      const caller = request.user!;
      if (userId !== caller.id && !GIVING_ROLES.includes(caller.role)) {
        return reply
          .status(403)
          .send({ error: 'Forbidden: you can only record your own giving' });
      }

      // parseFloat accepts "-50000", "1e400" and "12abc". The column has no
      // CHECK constraint, so negatives used to land in the ledger and skew
      // every total built on top of it.
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return reply.status(400).send({ error: 'Amount must be a positive number' });
      }

      const tithe = await TitheService.recordTithe({
        userId,
        amount: parsedAmount,
        frequency: frequency as TitheFrequency,
        paymentDate: new Date(paymentDate || Date.now()),
        paymentMethod,
        notes,
      });

      reply.status(201).send({ tithe });
    } catch (error) {
      console.error('Record tithe error:', error);
      reply.status(500).send({ error: 'Failed to record tithe' });
    }
  }

  static async getUserTithes(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as any;
      const { startDate, endDate } = request.query as any;

      if (!canAccessUserRecords(request, reply, userId, GIVING_ROLES)) return;

      const tithes = await TitheService.getTithesByUser(
        userId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      reply.send({ tithes });
    } catch (error) {
      console.error('Get user tithes error:', error);
      reply.status(500).send({ error: 'Failed to get tithes' });
    }
  }

  static async getTitheByReceipt(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { receiptNumber } = request.params as any;

      const tithe = await TitheService.getTitheByReceipt(receiptNumber);

      if (!tithe) {
        return reply.status(404).send({ error: 'Receipt not found' });
      }

      // The receipt is looked up first, then checked: a member may only see
      // their own. Unauthorised callers get the same 404 as a miss, so the
      // endpoint cannot be used to test whether a receipt number exists.
      const caller = request.user;
      if (
        !caller ||
        (tithe.userId !== caller.id && !GIVING_ROLES.includes(caller.role))
      ) {
        return reply.status(404).send({ error: 'Receipt not found' });
      }

      reply.send({ tithe });
    } catch (error) {
      console.error('Get tithe by receipt error:', error);
      reply.status(500).send({ error: 'Failed to get tithe' });
    }
  }

  static async getTitheStats(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as any;

      if (!canAccessUserRecords(request, reply, userId, GIVING_ROLES)) return;

      const stats = await TitheService.getTitheStats(userId);

      reply.send({ stats });
    } catch (error) {
      console.error('Get tithe stats error:', error);
      reply.status(500).send({ error: 'Failed to get tithe stats' });
    }
  }
}
