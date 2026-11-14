import { FastifyRequest, FastifyReply } from 'fastify';
import { AttendanceService, AttendanceLocationError } from '../services/attendanceService';
import { AuthenticatedRequest, canAccessUserRecords } from '../middleware/auth';
import { AttendanceStatus, UserRole } from '../types';

// Roles permitted to record attendance on another member's behalf (e.g. an
// usher checking people in). Everyone else may only check themselves in.
const ATTENDANCE_RECORDERS: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PASTOR,
  UserRole.HOD,
  UserRole.WORKER,
];

export class AttendanceController {
  static async recordAttendance(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { userId, eventId, serviceDate, checkInTime, status, isFirstTimer, notes, latitude, longitude, accuracy } =
        request.body as any;

      if (!userId || !serviceDate) {
        return reply.status(400).send({ error: 'User ID and service date are required' });
      }

      // A member may only record their own attendance; staff may record others'.
      if (!canAccessUserRecords(request, reply, userId, ATTENDANCE_RECORDERS)) return;

      const location =
        latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null
          ? { latitude: Number(latitude), longitude: Number(longitude), accuracy: accuracy != null ? Number(accuracy) : undefined }
          : undefined;

      const attendance = await AttendanceService.recordAttendance({
        userId,
        eventId,
        serviceDate: new Date(serviceDate),
        checkInTime: new Date(checkInTime || Date.now()),
        status: status as AttendanceStatus,
        isFirstTimer,
        notes,
        location,
      });

      reply.status(201).send({ attendance });
    } catch (error) {
      if (error instanceof AttendanceLocationError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      console.error('Record attendance error:', error);
      reply.status(500).send({ error: 'Failed to record attendance' });
    }
  }

  static async getUserAttendance(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as any;
      const { startDate, endDate } = request.query as any;

      if (!canAccessUserRecords(request, reply, userId)) return;

      const attendance = await AttendanceService.getAttendanceByUser(
        userId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      reply.send({ attendance });
    } catch (error) {
      console.error('Get user attendance error:', error);
      reply.status(500).send({ error: 'Failed to get attendance' });
    }
  }

  static async getAttendanceByDate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { date } = request.query as any;

      const attendance = await AttendanceService.getAttendanceByDate(new Date(date));

      reply.send({ attendance, total: attendance.length });
    } catch (error) {
      console.error('Get attendance by date error:', error);
      reply.status(500).send({ error: 'Failed to get attendance' });
    }
  }

  static async getAttendanceStats(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as any;

      if (!canAccessUserRecords(request, reply, userId)) return;

      const stats = await AttendanceService.getAttendanceStats(userId);

      reply.send({ stats });
    } catch (error) {
      console.error('Get attendance stats error:', error);
      reply.status(500).send({ error: 'Failed to get attendance stats' });
    }
  }

  static async getAbsentMembers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { date } = request.query as any;

      const absentMembers = await AttendanceService.getAbsentMembers(new Date(date));

      reply.send({ absentMembers, count: absentMembers.length });
    } catch (error) {
      console.error('Get absent members error:', error);
      reply.status(500).send({ error: 'Failed to get absent members' });
    }
  }
}
