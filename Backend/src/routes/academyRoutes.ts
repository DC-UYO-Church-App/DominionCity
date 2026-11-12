import { FastifyInstance } from 'fastify';
import { AcademyController } from '../controllers/academyController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

/**
 * Authority here comes in two layers. Shaping the academy — tracks, cohorts,
 * appointing coordinators — needs the academy admin role, checked inside each
 * handler. Running a cohort needs only a staff grant on that cohort, so those
 * routes authenticate any member and let the handler decide.
 */
export async function academyRoutes(fastify: FastifyInstance) {
  // Member's own progress: what the profile card reads.
  fastify.get('/my-progress', { onRequest: [authenticate] }, AcademyController.getMyProgress);

  fastify.get('/my-access', { onRequest: [authenticate] }, AcademyController.getMyAccess);

  // A member's own pending requests to join a cohort.
  fastify.get('/my-requests', { onRequest: [authenticate] }, AcademyController.getMyRequests);

  fastify.get(
    '/members/:userId/progress',
    { onRequest: [authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN)] },
    AcademyController.getMemberProgress
  );

  fastify.get(
    '/overview',
    { onRequest: [authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN)] },
    AcademyController.getOverview
  );

  // Tracks. Readable by any signed-in member so a coordinator can pick one;
  // writes are gated on the academy admin inside the handler.
  fastify.get('/tracks', { onRequest: [authenticate] }, AcademyController.listTracks);
  fastify.post('/tracks', { onRequest: [authenticate] }, AcademyController.createTrack);
  fastify.patch('/tracks/:id', { onRequest: [authenticate] }, AcademyController.updateTrack);
  fastify.delete('/tracks/:id', { onRequest: [authenticate] }, AcademyController.deleteTrack);

  // Cohorts.
  fastify.get('/cohorts', { onRequest: [authenticate] }, AcademyController.listCohorts);
  fastify.post('/cohorts', { onRequest: [authenticate] }, AcademyController.createCohort);
  fastify.get('/cohorts/:id', { onRequest: [authenticate] }, AcademyController.getCohort);
  fastify.patch('/cohorts/:id', { onRequest: [authenticate] }, AcademyController.updateCohort);
  fastify.delete('/cohorts/:id', { onRequest: [authenticate] }, AcademyController.deleteCohort);

  // Who runs a cohort.
  fastify.post('/cohorts/:id/staff', { onRequest: [authenticate] }, AcademyController.addStaff);
  fastify.delete(
    '/cohorts/:id/staff/:userId',
    { onRequest: [authenticate] },
    AcademyController.removeStaff
  );

  // Member-initiated enrolment requests. A member asks to join; the cohort's
  // staff accept or reject. The listing and decision routes authenticate any
  // member and let requireCohortAccess decide, like the other cohort routes.
  fastify.post('/cohorts/:id/join', { onRequest: [authenticate] }, AcademyController.requestJoin);
  fastify.get(
    '/cohorts/:id/join-requests',
    { onRequest: [authenticate] },
    AcademyController.listJoinRequests
  );
  fastify.put(
    '/join-requests/:requestId/accept',
    { onRequest: [authenticate] },
    AcademyController.acceptJoinRequest
  );
  fastify.put(
    '/join-requests/:requestId/reject',
    { onRequest: [authenticate] },
    AcademyController.rejectJoinRequest
  );

  // Enrolments.
  fastify.post('/cohorts/:id/enrollments', { onRequest: [authenticate] }, AcademyController.enroll);
  fastify.patch(
    '/enrollments/:enrollmentId',
    { onRequest: [authenticate] },
    AcademyController.updateEnrollment
  );
  fastify.delete(
    '/enrollments/:enrollmentId',
    { onRequest: [authenticate] },
    AcademyController.removeEnrollment
  );

  // Sessions and their registers.
  fastify.post(
    '/cohorts/:id/sessions',
    { onRequest: [authenticate] },
    AcademyController.createSession
  );
  fastify.delete(
    '/sessions/:sessionId',
    { onRequest: [authenticate] },
    AcademyController.deleteSession
  );
  fastify.get(
    '/sessions/:sessionId/attendance',
    { onRequest: [authenticate] },
    AcademyController.getSessionAttendance
  );
  fastify.put(
    '/sessions/:sessionId/attendance',
    { onRequest: [authenticate] },
    AcademyController.recordAttendance
  );
}
