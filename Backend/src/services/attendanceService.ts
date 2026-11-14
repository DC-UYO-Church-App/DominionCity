import { query } from '../config/database';
import { Attendance, AttendanceStatus, NotificationType } from '../types';
import { NotificationService } from './notificationService';
import { config } from '../config';

/**
 * Raised when a geofenced event is checked into from the wrong place, or
 * without a usable location. Carries an HTTP status so the controller can
 * answer with a clear 4xx instead of a generic 500.
 */
export class AttendanceLocationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 422) {
    super(message);
    this.name = 'AttendanceLocationError';
    this.statusCode = statusCode;
  }
}

/**
 * Great-circle distance between two WGS84 points, in metres (haversine).
 * Accurate to well within a metre at the scale of a church campus.
 */
function distanceInMetres(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's mean radius in metres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export class AttendanceService {
  static async recordAttendance(data: {
    userId: string;
    eventId?: string;
    serviceDate: Date;
    checkInTime: Date;
    status?: AttendanceStatus;
    isFirstTimer?: boolean;
    notes?: string;
    location?: { latitude: number; longitude: number; accuracy?: number };
  }): Promise<Attendance> {
    // Location gate: if the event carries a geofence, the check-in must come
    // from inside it. Events without all three geofence fields are unrestricted.
    if (data.eventId) {
      const eventResult = await query(
        `SELECT latitude, longitude, geofence_radius_m FROM events WHERE id = $1`,
        [data.eventId]
      );
      const event = eventResult.rows[0];

      if (event && event.latitude != null && event.longitude != null && event.geofence_radius_m != null) {
        if (
          !data.location ||
          !Number.isFinite(data.location.latitude) ||
          !Number.isFinite(data.location.longitude)
        ) {
          throw new AttendanceLocationError(
            'This service requires you to check in at the venue. Enable location access and try again.',
            400
          );
        }

        const radius = Number(event.geofence_radius_m);
        const distance = distanceInMetres(
          parseFloat(event.latitude),
          parseFloat(event.longitude),
          data.location.latitude,
          data.location.longitude
        );

        // Allow the device's own reported accuracy as slack, so a member
        // standing inside the venue is not rejected by GPS jitter. Capped so a
        // wildly imprecise fix (e.g. 2km) can't defeat the geofence entirely.
        const accuracySlack = Math.min(Math.max(data.location.accuracy ?? 0, 0), 100);

        if (distance - accuracySlack > radius) {
          throw new AttendanceLocationError(
            `You appear to be about ${Math.round(distance)}m from the venue. You need to be within ${radius}m to check in.`
          );
        }
      }
    }

    const result = await query(
      `INSERT INTO attendance (user_id, event_id, service_date, check_in_time, status, is_first_timer, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id, event_id) 
       DO UPDATE SET check_in_time = $4, status = $5, notes = $7
       RETURNING *`,
      [
        data.userId,
        data.eventId || null,
        data.serviceDate,
        data.checkInTime,
        data.status || AttendanceStatus.PRESENT,
        data.isFirstTimer || false,
        data.notes,
      ]
    );

    const attendance = this.mapDbRowToAttendance(result.rows[0]);

    // Send welcome message to first-timers
    if (attendance.isFirstTimer) {
      await NotificationService.sendNotification({
        userId: data.userId,
        type: NotificationType.FIRST_TIMER_WELCOME,
        title: 'Welcome to Dominion City!',
        message: `Welcome to ${config.church.name}! We're thrilled to have you join us. May God bless you abundantly.`,
      });
    }

    return attendance;
  }

  static async getAttendanceByUser(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Attendance[]> {
    let queryText = `SELECT a.*, e.title as event_title FROM attendance a LEFT JOIN events e ON a.event_id = e.id WHERE a.user_id = $1`;
    const values: any[] = [userId];
    let paramCount = 2;

    if (startDate) {
      queryText += ` AND a.service_date >= $${paramCount}`;
      values.push(startDate);
      paramCount++;
    }

    if (endDate) {
      queryText += ` AND a.service_date <= $${paramCount}`;
      values.push(endDate);
      paramCount++;
    }

    queryText += ' ORDER BY a.check_in_time DESC';

    const result = await query(queryText, values);

    return result.rows.map(this.mapDbRowToAttendance);
  }

  static async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    const result = await query(
      `SELECT * FROM attendance WHERE service_date = $1 ORDER BY check_in_time ASC`,
      [date]
    );

    return result.rows.map(this.mapDbRowToAttendance);
  }

  static async getAbsentMembers(serviceDate: Date): Promise<string[]> {
    const result = await query(
      `SELECT id FROM users 
       WHERE is_active = true 
       AND id NOT IN (
         SELECT user_id FROM attendance WHERE service_date = $1
       )`,
      [serviceDate]
    );

    return result.rows.map((row) => row.id);
  }

  static async getConsecutiveAbsences(userId: string): Promise<number> {
    const result = await query(
      `WITH recent_sundays AS (
        SELECT DISTINCT service_date 
        FROM attendance 
        WHERE service_date >= CURRENT_DATE - INTERVAL '8 weeks'
        ORDER BY service_date DESC 
        LIMIT 8
      )
      SELECT COUNT(*) as absence_count
      FROM recent_sundays rs
      WHERE rs.service_date NOT IN (
        SELECT service_date 
        FROM attendance 
        WHERE user_id = $1 AND status = 'present'
      )
      AND rs.service_date <= CURRENT_DATE
      ORDER BY rs.service_date DESC`,
      [userId]
    );

    return parseInt(result.rows[0]?.absence_count || '0', 10);
  }

  static async checkAndNotifyAbsences(): Promise<void> {
    const recentSunday = await query(
      `SELECT DISTINCT service_date 
       FROM attendance 
       WHERE service_date <= CURRENT_DATE 
       ORDER BY service_date DESC 
       LIMIT 1`
    );

    if (recentSunday.rows.length === 0) return;

    const lastServiceDate = recentSunday.rows[0].service_date;
    const absentMembers = await this.getAbsentMembers(lastServiceDate);

    for (const userId of absentMembers) {
      const consecutiveAbsences = await this.getConsecutiveAbsences(userId);

      if (consecutiveAbsences >= config.notifications.absenceCriticalThreshold) {
        await NotificationService.sendNotification({
          userId,
          type: NotificationType.ABSENCE_CRITICAL,
          title: 'We Miss You!',
          message: `You've been absent for ${consecutiveAbsences} services. Your pastor will be reaching out to you soon. We hope to see you again!`,
        });

        // Notify HOD/Pastor
        const userResult = await query(
          `SELECT u.*, d.hod_id 
           FROM users u 
           LEFT JOIN departments d ON u.department_id = d.id 
           WHERE u.id = $1`,
          [userId]
        );

        if (userResult.rows[0]?.hod_id) {
          await NotificationService.sendNotification({
            userId: userResult.rows[0].hod_id,
            type: NotificationType.ABSENCE_CRITICAL,
            title: 'Member Follow-up Required',
            message: `${userResult.rows[0].first_name} ${userResult.rows[0].last_name} has been absent for ${consecutiveAbsences} consecutive services.`,
            metadata: { memberId: userId, absenceCount: consecutiveAbsences },
          });
        }
      } else if (consecutiveAbsences >= config.notifications.absenceWarningThreshold) {
        await NotificationService.sendNotification({
          userId,
          type: NotificationType.ABSENCE_WARNING,
          title: 'We Miss You!',
          message: `We noticed you've missed ${consecutiveAbsences} services. We hope everything is okay and look forward to seeing you soon!`,
        });
      }
    }
  }

  static async getAttendanceStats(userId: string): Promise<{
    totalServices: number;
    attended: number;
    percentage: number;
    consecutiveAbsences: number;
  }> {
    const result = await query(
      `SELECT 
        COUNT(DISTINCT a1.service_date) as total_services,
        COUNT(DISTINCT CASE WHEN a2.status = 'present' THEN a2.service_date END) as attended
       FROM attendance a1
       LEFT JOIN attendance a2 ON a1.service_date = a2.service_date AND a2.user_id = $1
       WHERE a1.service_date >= (SELECT join_date FROM users WHERE id = $1)
       AND a1.service_date <= CURRENT_DATE`,
      [userId]
    );

    const totalServices = parseInt(result.rows[0]?.total_services || '0', 10);
    const attended = parseInt(result.rows[0]?.attended || '0', 10);
    const percentage = totalServices > 0 ? (attended / totalServices) * 100 : 0;
    const consecutiveAbsences = await this.getConsecutiveAbsences(userId);

    return {
      totalServices,
      attended,
      percentage: Math.round(percentage * 100) / 100,
      consecutiveAbsences,
    };
  }

  private static mapDbRowToAttendance(row: any): Attendance {
    return {
      id: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      eventTitle: row.event_title || undefined,
      serviceDate: row.service_date,
      checkInTime: row.check_in_time,
      status: row.status as AttendanceStatus,
      isFirstTimer: row.is_first_timer,
      notes: row.notes,
      createdAt: row.created_at,
    };
  }
}
