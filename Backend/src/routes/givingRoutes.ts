import { FastifyInstance } from 'fastify';
import { GivingController } from '../controllers/givingController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

export async function givingRoutes(fastify: FastifyInstance) {
  // Member's own giving history
  fastify.get('/mine', { onRequest: [authenticate] }, GivingController.myContributions);

  // Admin Giving Page
  fastify.get(
    '/stats',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    GivingController.getGivingStats
  );

  fastify.get(
    '/contributions',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    GivingController.listContributions
  );

  fastify.patch(
    '/contributions/:id/confirm',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    GivingController.confirmContribution
  );

  fastify.patch(
    '/contributions/:id/reject',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    GivingController.rejectContribution
  );
}
