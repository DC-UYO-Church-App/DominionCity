import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  /** The signed-in member's notifications, newest first. `?unread=true` filters. */
  static async list(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { unread } = request.query as { unread?: string };
      const isRead = unread === 'true' ? false : undefined;
      const notifications = await NotificationService.getNotificationsByUser(
        request.user!.id,
        isRead
      );
      reply.send({ notifications });
    } catch (error) {
      console.error('List notifications error:', error);
      reply.status(500).send({ error: 'Failed to load notifications' });
    }
  }

  /** Drives the bell badge. */
  static async unreadCount(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      reply.send({ count: await NotificationService.getUnreadCount(request.user!.id) });
    } catch (error) {
      console.error('Unread count error:', error);
      reply.status(500).send({ error: 'Failed to load the unread count' });
    }
  }

  static async markRead(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const notification = await NotificationService.markAsRead(id, request.user!.id);
      if (!notification) return reply.status(404).send({ error: 'Notification not found' });
      reply.send({ notification });
    } catch (error) {
      console.error('Mark notification read error:', error);
      reply.status(500).send({ error: 'Failed to update the notification' });
    }
  }

  static async markAllRead(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      await NotificationService.markAllAsRead(request.user!.id);
      reply.send({ success: true });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      reply.status(500).send({ error: 'Failed to update notifications' });
    }
  }

  static async remove(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const removed = await NotificationService.deleteNotification(id, request.user!.id);
      if (!removed) return reply.status(404).send({ error: 'Notification not found' });
      reply.send({ success: true });
    } catch (error) {
      console.error('Delete notification error:', error);
      reply.status(500).send({ error: 'Failed to delete the notification' });
    }
  }
}
