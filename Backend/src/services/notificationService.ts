import { query } from '../config/database';
import { Notification, NotificationType } from '../types';
import { EmailService } from '../config/email';
import { renderNotificationEmail } from '../templates/notificationEmail';

export class NotificationService {
  static async sendNotification(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: Record<string, any>;
    /** Optional deep link for the emailed copy; not persisted. */
    emailAction?: { label: string; path: string };
  }): Promise<Notification> {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.userId, data.type, data.title, data.message, JSON.stringify(data.metadata || {})]
    );

    const notification = this.mapDbRowToNotification(result.rows[0]);

    // Send email notification
    try {
      const userResult = await query(
        `SELECT email, first_name, last_name FROM users WHERE id = $1`,
        [data.userId]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        // Rendered through the shared shell so notifications look like the
        // rest of the church's mail, and so the message is escaped rather
        // than interpolated straight into markup.
        const message = renderNotificationEmail({
          firstName: user.first_name || 'there',
          title: data.title,
          message: data.message,
          action: data.emailAction,
        });

        await EmailService.send({
          to: user.email,
          subject: message.subject,
          html: message.html,
          text: message.text,
        });
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }

    return notification;
  }

  static async getNotificationsByUser(
    userId: string,
    isRead?: boolean
  ): Promise<Notification[]> {
    let queryText = `SELECT * FROM notifications WHERE user_id = $1`;
    const values: any[] = [userId];

    if (isRead !== undefined) {
      queryText += ` AND is_read = $2`;
      values.push(isRead);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, values);

    return result.rows.map(this.mapDbRowToNotification);
  }

  static async markAsRead(notificationId: string): Promise<Notification | null> {
    const result = await query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE id = $1
       RETURNING *`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapDbRowToNotification(result.rows[0]);
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
  }

  static async deleteNotification(notificationId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM notifications WHERE id = $1`,
      [notificationId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  private static mapDbRowToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as NotificationType,
      title: row.title,
      message: row.message,
      isRead: row.is_read,
      readAt: row.read_at,
      metadata: row.metadata,
      createdAt: row.created_at,
    };
  }
}
