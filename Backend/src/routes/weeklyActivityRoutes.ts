import { FastifyInstance } from 'fastify';
import { WeeklyActivityController } from '../controllers/weeklyActivityController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

export async function weeklyActivityRoutes(fastify: FastifyInstance) {
  // Member-visible reads (supports ?active=true)
  fastify.get('/', WeeklyActivityController.getAllActivities);

  // Admin management
  fastify.post(
    '/',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    WeeklyActivityController.createActivity
  );

  fastify.put(
    '/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    WeeklyActivityController.updateActivity
  );

  fastify.delete(
    '/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    WeeklyActivityController.deleteActivity
  );
}
