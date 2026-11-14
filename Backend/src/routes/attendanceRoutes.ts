import { FastifyInstance } from 'fastify';
import { AttendanceController } from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

export async function attendanceRoutes(fastify: FastifyInstance) {
  // All attendance routes require authentication
  fastify.addHook('onRequest', authenticate);

  // Record attendance. Any authenticated user may check themselves in (the
  // controller enforces that a member can only record their own attendance);
  // workers/HODs/pastors/admins may record on another member's behalf.
  fastify.post('/', AttendanceController.recordAttendance);

  // Get user's attendance
  fastify.get('/user/:userId', AttendanceController.getUserAttendance);

  // Get attendance stats
  fastify.get('/user/:userId/stats', AttendanceController.getAttendanceStats);

  // Get attendance by date (admins, pastors, HODs)
  fastify.get(
    '/date',
    {
      onRequest: [authorize(UserRole.ADMIN, UserRole.PASTOR, UserRole.HOD)],
    },
    AttendanceController.getAttendanceByDate
  );

  // Get absent members (admins, pastors, HODs)
  fastify.get(
    '/absent',
    {
      onRequest: [authorize(UserRole.ADMIN, UserRole.PASTOR, UserRole.HOD)],
    },
    AttendanceController.getAbsentMembers
  );
}
