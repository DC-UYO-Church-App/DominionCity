import { FastifyReply, FastifyRequest } from 'fastify';
import { ContributionService } from '../services/contributionService';
import { NotificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/auth';
import { ContributionSource, ContributionStatus, NotificationType } from '../types';

export class GivingController {
  /** Admin Giving Page: totals, per-project/program breakdown, top givers. */
  static async getGivingStats(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await ContributionService.getGivingStats();
      reply.send(stats);
    } catch (error) {
      console.error('Get giving stats error:', error);
      reply.status(500).send({ error: 'Failed to load giving stats' });
    }
  }

  /** Admin list of contributions, optionally filtered (e.g. pending to confirm). */
  static async listContributions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { status, sourceType, sourceId } = request.query as any;

      if (status && !Object.values(ContributionStatus).includes(status)) {
        return reply.status(400).send({ error: 'Invalid status filter' });
      }
      if (sourceType && !Object.values(ContributionSource).includes(sourceType)) {
        return reply.status(400).send({ error: 'Invalid source type filter' });
      }

      const contributions = await ContributionService.getContributions({
        status,
        sourceType,
        sourceId,
      });
      reply.send({ contributions });
    } catch (error) {
      console.error('List contributions error:', error);
      reply.status(500).send({ error: 'Failed to load contributions' });
    }
  }

  /** Member's own giving history. */
  static async myContributions(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const contributions = await ContributionService.getUserContributions(request.user!.id);
      reply.send({ contributions });
    } catch (error) {
      console.error('My contributions error:', error);
      reply.status(500).send({ error: 'Failed to load contributions' });
    }
  }

  static async confirmContribution(request: AuthenticatedRequest, reply: FastifyReply) {
    return GivingController.updateStatus(request, reply, ContributionStatus.CONFIRMED);
  }

  static async rejectContribution(request: AuthenticatedRequest, reply: FastifyReply) {
    return GivingController.updateStatus(request, reply, ContributionStatus.REJECTED);
  }

  private static async updateStatus(
    request: AuthenticatedRequest,
    reply: FastifyReply,
    status: ContributionStatus.CONFIRMED | ContributionStatus.REJECTED
  ) {
    try {
      const { id } = request.params as any;
      const contribution = await ContributionService.setStatus(id, status, request.user!.id);

      if (!contribution) {
        return reply
          .status(404)
          .send({ error: 'Pending contribution not found or already processed' });
      }

      // Let the giver know their payment was reviewed.
      try {
        const confirmed = status === ContributionStatus.CONFIRMED;
        await NotificationService.sendNotification({
          userId: contribution.userId,
          type: NotificationType.GENERAL,
          title: confirmed ? 'Payment Confirmed' : 'Payment Not Confirmed',
          message: confirmed
            ? `Your giving of ${contribution.amount} has been confirmed. Thank you for your support!`
            : `Your giving of ${contribution.amount} could not be confirmed. Please contact the church office.`,
          metadata: { contributionId: contribution.id, status },
        });
      } catch (notifyError) {
        console.error('Failed to notify giver:', notifyError);
      }

      reply.send({ contribution });
    } catch (error) {
      console.error('Update contribution status error:', error);
      reply.status(500).send({ error: 'Failed to update contribution' });
    }
  }
}
