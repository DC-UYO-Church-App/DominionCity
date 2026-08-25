import { getClient, query } from '../config/database';
import { NotificationService } from './notificationService';
import { NotificationType } from '../types';

export class CellJoinRequestService {
  static async sendRequest(userId: string, cellGroupId: string): Promise<any> {
    // Block if user already belongs to a cell group
    const userRes = await query(
      `SELECT cell_group_id, first_name, last_name FROM users WHERE id = $1`,
      [userId]
    );
    const user = userRes.rows[0];
    if (!user) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
    if (user.cell_group_id) {
      throw Object.assign(new Error('You are already a member of a cell group'), {
        code: 'ALREADY_IN_CELL',
      });
    }

    // Block if a pending request already exists (enforced by DB unique index too)
    const pendingRes = await query(
      `SELECT id FROM cell_join_requests WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );
    if (pendingRes.rows.length > 0) {
      throw Object.assign(
        new Error('You already have a pending join request. Wait for a response before sending another.'),
        { code: 'PENDING_EXISTS' }
      );
    }

    // Verify cell group exists and get leader
    const cgRes = await query(
      `SELECT id, name, leader_id FROM cell_groups WHERE id = $1`,
      [cellGroupId]
    );
    if (cgRes.rows.length === 0) {
      throw Object.assign(new Error('Cell group not found'), { code: 'NOT_FOUND' });
    }
    const cellGroup = cgRes.rows[0];

    const result = await query(
      `INSERT INTO cell_join_requests (user_id, cell_group_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING *`,
      [userId, cellGroupId]
    );
    const joinRequest = this.mapRow(result.rows[0]);

    // Notify the cell leader if one is assigned
    if (cellGroup.leader_id) {
      const userName = `${user.first_name} ${user.last_name}`.trim();
      await NotificationService.sendNotification({
        userId: cellGroup.leader_id,
        type: NotificationType.CELL_JOIN_REQUEST,
        title: 'New Cell Join Request',
        message: `${userName} wants to join your cell group "${cellGroup.name}". Open the Cell Groups section to accept or reject.`,
        metadata: { requestId: joinRequest.id, cellGroupId, requestingUserId: userId },
      }).catch((err) => console.error('Failed to notify cell leader:', err));
    }

    return joinRequest;
  }

  static async getMyRequest(userId: string): Promise<any | null> {
    const result = await query(
      `SELECT r.*, cg.name AS cell_group_name
       FROM cell_join_requests r
       JOIN cell_groups cg ON cg.id = r.cell_group_id
       WHERE r.user_id = $1 AND r.status = 'pending'
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [userId]
    );
    if (result.rows.length === 0) return null;
    return this.mapRowWithGroup(result.rows[0]);
  }

  static async getIncomingRequests(cellGroupId: string): Promise<any[]> {
    const result = await query(
      `SELECT r.*,
              u.first_name, u.last_name, u.email, u.profile_image, u.phone_number
       FROM cell_join_requests r
       JOIN users u ON u.id = r.user_id
       WHERE r.cell_group_id = $1 AND r.status = 'pending'
       ORDER BY r.created_at ASC`,
      [cellGroupId]
    );
    return result.rows.map((row) => ({
      ...this.mapRow(row),
      user: {
        id: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        profileImage: row.profile_image,
        phoneNumber: row.phone_number,
      },
    }));
  }

  static async acceptRequest(requestId: string, leaderId: string): Promise<void> {
    const req = await this.getRequestAndVerifyLeader(requestId, leaderId);

    // Assign user to the cell group and update request status in a transaction.
    // This has to run on one checked-out client: `query()` goes through the
    // pool, so BEGIN/COMMIT issued that way can land on different connections
    // and leave the two updates outside any transaction at all.
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `UPDATE cell_join_requests SET status = 'accepted', updated_at = NOW() WHERE id = $1`,
        [requestId]
      );
      await client.query(
        `UPDATE users SET cell_group_id = $1 WHERE id = $2`,
        [req.cell_group_id, req.user_id]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Notify the user
    const cgRes = await query(`SELECT name FROM cell_groups WHERE id = $1`, [req.cell_group_id]);
    const cellGroupName = cgRes.rows[0]?.name || 'the cell group';

    await NotificationService.sendNotification({
      userId: req.user_id,
      type: NotificationType.CELL_JOIN_RESPONSE,
      title: 'Join Request Accepted',
      message: `Great news! Your request to join "${cellGroupName}" has been accepted. Welcome to the family!`,
      metadata: { requestId, cellGroupId: req.cell_group_id },
      emailAction: { label: 'View your cell group', path: '/dashboard/cell-groups' },
    }).catch((err) => console.error('Failed to notify user of acceptance:', err));
  }

  static async rejectRequest(requestId: string, leaderId: string): Promise<void> {
    const req = await this.getRequestAndVerifyLeader(requestId, leaderId);

    await query(
      `UPDATE cell_join_requests SET status = 'rejected', updated_at = NOW() WHERE id = $1`,
      [requestId]
    );

    const cgRes = await query(`SELECT name FROM cell_groups WHERE id = $1`, [req.cell_group_id]);
    const cellGroupName = cgRes.rows[0]?.name || 'the cell group';

    await NotificationService.sendNotification({
      userId: req.user_id,
      type: NotificationType.CELL_JOIN_RESPONSE,
      title: 'Join Request Declined',
      message: `Your request to join "${cellGroupName}" was not accepted at this time. You may request to join another group.`,
      metadata: { requestId, cellGroupId: req.cell_group_id },
      emailAction: { label: 'Find another cell group', path: '/dashboard/cell-groups' },
    }).catch((err) => console.error('Failed to notify user of rejection:', err));
  }

  private static async getRequestAndVerifyLeader(
    requestId: string,
    leaderId: string
  ): Promise<any> {
    const result = await query(
      `SELECT r.*, cg.leader_id
       FROM cell_join_requests r
       JOIN cell_groups cg ON cg.id = r.cell_group_id
       WHERE r.id = $1`,
      [requestId]
    );
    if (result.rows.length === 0) {
      throw Object.assign(new Error('Request not found'), { code: 'NOT_FOUND' });
    }
    const req = result.rows[0];
    if (req.status !== 'pending') {
      throw Object.assign(new Error('This request has already been resolved'), {
        code: 'ALREADY_RESOLVED',
      });
    }
    if (req.leader_id !== leaderId) {
      throw Object.assign(new Error('Forbidden'), { code: 'FORBIDDEN' });
    }
    return req;
  }

  private static mapRow(row: any) {
    return {
      id: row.id,
      userId: row.user_id,
      cellGroupId: row.cell_group_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapRowWithGroup(row: any) {
    return {
      ...this.mapRow(row),
      cellGroupName: row.cell_group_name,
    };
  }
}
