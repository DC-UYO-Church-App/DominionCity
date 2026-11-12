import { FastifyInstance } from 'fastify';
import { FaceController } from '../controllers/faceController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

/**
 * Facial recognition. Members manage their own registration; the technical
 * dashboard (the new `technical` role, plus super admins) lists users and runs
 * the identify scan.
 */
export async function faceRoutes(fastify: FastifyInstance) {
  // A member's own face registration.
  fastify.post('/enroll', { onRequest: [authenticate] }, FaceController.enrollMe);
  fastify.get('/my-enrollment', { onRequest: [authenticate] }, FaceController.getMyEnrollment);
  fastify.delete('/my-enrollment', { onRequest: [authenticate] }, FaceController.deleteMyEnrollment);

  // Technical dashboard.
  const technical = { onRequest: [authenticate, authorize(UserRole.TECHNICAL, UserRole.SUPER_ADMIN)] };
  fastify.get('/users', technical, FaceController.listUsers);
  fastify.get('/users/:userId/image', technical, FaceController.getUserEnrollmentImage);
  fastify.post('/recognize', technical, FaceController.recognize);
  fastify.delete('/users/:userId/enrollment', technical, FaceController.deleteUserEnrollment);
}
