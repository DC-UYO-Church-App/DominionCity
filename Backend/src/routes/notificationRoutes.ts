import { FastifyInstance } from 'fastify';
import { NotificationController } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

/**
 * In-app notifications for the signed-in member. Everything is scoped to the
 * caller inside the controller/service, so a member only ever sees or changes
 * their own.
 */
export async function notificationRoutes(fastify: FastifyInstance) {
  fastify.get('/', { onRequest: [authenticate] }, NotificationController.list);
  fastify.get('/unread-count', { onRequest: [authenticate] }, NotificationController.unreadCount);
  fastify.patch('/read-all', { onRequest: [authenticate] }, NotificationController.markAllRead);
  fastify.patch('/:id/read', { onRequest: [authenticate] }, NotificationController.markRead);
  fastify.delete('/:id', { onRequest: [authenticate] }, NotificationController.remove);
}
