import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../middleware/auth';
import { AcademyService } from '../services/academyService';

const COHORT_STATUSES = ['planned', 'open', 'running', 'closed'];
const ENROLLMENT_STATUSES = ['enrolled', 'in_progress', 'completed', 'withdrawn'];
const STAFF_ROLES = ['coordinator', 'facilitator', 'assistant'];
const ATTENDANCE_STATUSES = ['present', 'absent', 'excused'];

/** Academy-wide authority. Everything that shapes the catalogue needs it. */
function requireAcademyAdmin(request: AuthenticatedRequest, reply: FastifyReply): boolean {
  if (!AcademyService.isAcademyAdmin(request.user!.role)) {
    reply.status(403).send({ error: 'Only an academy admin can do this' });
    return false;
  }
  return true;
}

/**
 * Authority over one cohort: an academy admin, or the staff assigned to it.
 * This is the check that keeps a DCA coordinator out of the DLI register.
 */
async function requireCohortAccess(
  request: AuthenticatedRequest,
  reply: FastifyReply,
  cohortId: string | null
): Promise<boolean> {
  if (!cohortId) {
    reply.status(404).send({ error: 'Not found' });
    return false;
  }
  const allowed = await AcademyService.canManageCohort(
    { id: request.user!.id, role: request.user!.role },
    cohortId
  );
  if (!allowed) {
    reply.status(403).send({ error: 'You do not run this cohort' });
    return false;
  }
  return true;
}

export class AcademyController {
  // ---- Member-facing ------------------------------------------------------

  static async getMyProgress(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      reply.send({ progress: await AcademyService.getMemberProgress(request.user!.id) });
    } catch (error) {
      console.error('Academy progress error:', error);
      reply.status(500).send({ error: 'Failed to load academy progress' });
    }
  }

  /** A member's progress as seen by staff, used on the admin member profile. */
  static async getMemberProgress(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      reply.send({ progress: await AcademyService.getMemberProgress(userId) });
    } catch (error) {
      console.error('Academy member progress error:', error);
      reply.status(500).send({ error: 'Failed to load academy progress' });
    }
  }

  /**
   * What this member may do in the academy. The shell calls it to decide
   * whether to admit them and which navigation to show, so a coordinator gets
   * in on their cohort grant alone.
   */
  static async getMyAccess(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const canManageAll = AcademyService.isAcademyAdmin(request.user!.role);
      const cohorts = await AcademyService.getStaffCohorts(request.user!.id);
      reply.send({ canManageAll, cohorts, hasAccess: canManageAll || cohorts.length > 0 });
    } catch (error) {
      console.error('Academy access error:', error);
      reply.status(500).send({ error: 'Failed to check academy access' });
    }
  }

  // ---- Overview -----------------------------------------------------------

  static async getOverview(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      reply.send(await AcademyService.getOverview());
    } catch (error) {
      console.error('Academy overview error:', error);
      reply.status(500).send({ error: 'Failed to load the academy overview' });
    }
  }

  // ---- Tracks -------------------------------------------------------------

  static async listTracks(_request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      reply.send({ tracks: await AcademyService.listTracks() });
    } catch (error) {
      console.error('Academy list tracks error:', error);
      reply.status(500).send({ error: 'Failed to load tracks' });
    }
  }

  static async createTrack(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!requireAcademyAdmin(request, reply)) return;
    try {
      const body = request.body as any;
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) return reply.status(400).send({ error: 'Track name is required' });

      const track = await AcademyService.createTrack({
        name,
        description: body.description?.trim() || null,
        sequence: Number.isFinite(Number(body.sequence)) ? Number(body.sequence) : 0,
        prerequisiteTrackId: body.prerequisiteTrackId || null,
      });
      reply.status(201).send({ track });
    } catch (error: any) {
      if (error?.code === '23505') {
        return reply.status(409).send({ error: 'A track with that name already exists' });
      }
      console.error('Academy create track error:', error);
      reply.status(500).send({ error: 'Failed to create the track' });
    }
  }

  static async updateTrack(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!requireAcademyAdmin(request, reply)) return;
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      if (body.prerequisiteTrackId && body.prerequisiteTrackId === id) {
        return reply.status(400).send({ error: 'A track cannot be its own prerequisite' });
      }

      const track = await AcademyService.updateTrack(id, {
        name: body.name?.trim(),
        description: body.description === undefined ? undefined : body.description?.trim() || null,
        sequence: body.sequence === undefined ? undefined : Number(body.sequence),
        prerequisiteTrackId:
          body.prerequisiteTrackId === undefined ? undefined : body.prerequisiteTrackId || null,
        isActive: body.isActive === undefined ? undefined : Boolean(body.isActive),
      });

      if (!track) return reply.status(404).send({ error: 'Track not found' });
      reply.send({ track });
    } catch (error: any) {
      if (error?.code === '23505') {
        return reply.status(409).send({ error: 'A track with that name already exists' });
      }
      console.error('Academy update track error:', error);
      reply.status(500).send({ error: 'Failed to update the track' });
    }
  }

  static async deleteTrack(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!requireAcademyAdmin(request, reply)) return;
    try {
      const { id } = request.params as { id: string };
      const track = await AcademyService.getTrack(id);
      if (!track) return reply.status(404).send({ error: 'Track not found' });

      // Deleting cascades to cohorts and enrolments, which would erase a
      // member's completion history. Deactivating keeps the record.
      const tracks = await AcademyService.listTracks();
      const withCounts = tracks.find((t) => t.id === id);
      if (withCounts && withCounts.enrollmentCount > 0) {
        return reply.status(409).send({
          error:
            'This track has enrolment history. Deactivate it instead of deleting, so completions are kept.',
        });
      }

      await AcademyService.deleteTrack(id);
      reply.send({ success: true });
    } catch (error) {
      console.error('Academy delete track error:', error);
      reply.status(500).send({ error: 'Failed to delete the track' });
    }
  }

  // ---- Cohorts ------------------------------------------------------------

  /** Admins see every cohort; everyone else sees only the ones they staff. */
  static async listCohorts(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { trackId, status, mine } = request.query as {
        trackId?: string;
        status?: string;
        mine?: string;
      };

      const isAdmin = AcademyService.isAcademyAdmin(request.user!.role);
      const cohorts = await AcademyService.listCohorts({
        trackId,
        status,
        staffUserId: !isAdmin || mine === 'true' ? request.user!.id : undefined,
      });

      reply.send({ cohorts, canManageAll: isAdmin });
    } catch (error) {
      console.error('Academy list cohorts error:', error);
      reply.status(500).send({ error: 'Failed to load cohorts' });
    }
  }

  static async getCohort(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      if (!(await requireCohortAccess(request, reply, id))) return;

      const cohort = await AcademyService.getCohort(id);
      if (!cohort) return reply.status(404).send({ error: 'Cohort not found' });

      reply.send({
        cohort,
        enrollments: await AcademyService.listEnrollments(id),
        sessions: await AcademyService.listSessions(id),
        canManageAll: AcademyService.isAcademyAdmin(request.user!.role),
      });
    } catch (error) {
      console.error('Academy get cohort error:', error);
      reply.status(500).send({ error: 'Failed to load the cohort' });
    }
  }

  static async createCohort(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!requireAcademyAdmin(request, reply)) return;
    try {
      const body = request.body as any;
      const name = typeof body.name === 'string' ? body.name.trim() : '';

      if (!body.trackId) return reply.status(400).send({ error: 'A track is required' });
      if (!name) return reply.status(400).send({ error: 'A cohort name is required' });
      if (body.status && !COHORT_STATUSES.includes(body.status)) {
        return reply.status(400).send({ error: 'Unknown cohort status' });
      }
      if (body.startDate && body.endDate && body.endDate < body.startDate) {
        return reply.status(400).send({ error: 'The end date cannot come before the start date' });
      }

      const cohort = await AcademyService.createCohort({
        trackId: body.trackId,
        name,
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        status: body.status,
        createdBy: request.user!.id,
      });
      reply.status(201).send({ cohort });
    } catch (error: any) {
      if (error?.code === '23503') {
        return reply.status(400).send({ error: 'That track does not exist' });
      }
      console.error('Academy create cohort error:', error);
      reply.status(500).send({ error: 'Failed to create the cohort' });
    }
  }

  /** Coordinators may run their cohort, including moving it through statuses. */
  static async updateCohort(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      if (!(await requireCohortAccess(request, reply, id))) return;

      const body = request.body as any;
      if (body.status && !COHORT_STATUSES.includes(body.status)) {
        return reply.status(400).send({ error: 'Unknown cohort status' });
      }

      // Captured before the update so opening a cohort fires the member
      // notice once, not on every later save that leaves it open.
      const previousStatus = await AcademyService.getCohortStatus(id);

      const cohort = await AcademyService.updateCohort(id, {
        name: body.name?.trim(),
        startDate: body.startDate === undefined ? undefined : body.startDate || null,
        endDate: body.endDate === undefined ? undefined : body.endDate || null,
        status: body.status,
      });

      if (!cohort) return reply.status(404).send({ error: 'Cohort not found' });

      if (body.status === 'open' && previousStatus !== 'open') {
        // Fire-and-forget: a slow or failed notification fan-out must not fail
        // the status change the coordinator actually asked for.
        AcademyService.notifyCohortOpened(id).catch((err) =>
          console.error('Academy notify cohort open error:', err)
        );
      }

      reply.send({ cohort });
    } catch (error) {
      console.error('Academy update cohort error:', error);
      reply.status(500).send({ error: 'Failed to update the cohort' });
    }
  }

  static async deleteCohort(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!requireAcademyAdmin(request, reply)) return;
    try {
      const { id } = request.params as { id: string };
      const deleted = await AcademyService.deleteCohort(id);
      if (!deleted) return reply.status(404).send({ error: 'Cohort not found' });
      reply.send({ success: true });
    } catch (error) {
      console.error('Academy delete cohort error:', error);
      reply.status(500).send({ error: 'Failed to delete the cohort' });
    }
  }

  // ---- Staff --------------------------------------------------------------

  /** Appointing who runs a cohort stays with the academy admin. */
  static async addStaff(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!requireAcademyAdmin(request, reply)) return;
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      if (!body.userId) return reply.status(400).send({ error: 'A member is required' });
      const staffRole = body.staffRole || 'coordinator';
      if (!STAFF_ROLES.includes(staffRole)) {
        return reply.status(400).send({ error: 'Unknown staff role' });
      }

      const cohort = await AcademyService.addStaff({
        cohortId: id,
        userId: body.userId,
        staffRole,
        assignedBy: request.user!.id,
      });
      if (!cohort) return reply.status(404).send({ error: 'Cohort not found' });
      reply.send({ cohort });
    } catch (error: any) {
      if (error?.code === '23503') {
        return reply.status(400).send({ error: 'That member or cohort does not exist' });
      }
      console.error('Academy add staff error:', error);
      reply.status(500).send({ error: 'Failed to assign the member' });
    }
  }

  static async removeStaff(request: AuthenticatedRequest, reply: FastifyReply) {
    if (!requireAcademyAdmin(request, reply)) return;
    try {
      const { id, userId } = request.params as { id: string; userId: string };
      const removed = await AcademyService.removeStaff(id, userId);
      if (!removed) return reply.status(404).send({ error: 'That member does not staff this cohort' });
      reply.send({ success: true });
    } catch (error) {
      console.error('Academy remove staff error:', error);
      reply.status(500).send({ error: 'Failed to remove the member' });
    }
  }

  // ---- Enrolments ---------------------------------------------------------

  static async enroll(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      if (!(await requireCohortAccess(request, reply, id))) return;

      const body = request.body as any;
      const userIds: string[] = Array.isArray(body.userIds)
        ? body.userIds
        : body.userId
        ? [body.userId]
        : [];

      if (userIds.length === 0) {
        return reply.status(400).send({ error: 'At least one member is required' });
      }

      const added = await AcademyService.enroll(id, userIds);
      reply.send({ added, enrollments: await AcademyService.listEnrollments(id) });
    } catch (error: any) {
      if (error?.code === '23503') {
        return reply.status(400).send({ error: 'One of those members does not exist' });
      }
      console.error('Academy enroll error:', error);
      reply.status(500).send({ error: 'Failed to enrol' });
    }
  }

  static async updateEnrollment(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { enrollmentId } = request.params as { enrollmentId: string };
      const cohortId = await AcademyService.getEnrollmentCohort(enrollmentId);
      if (!(await requireCohortAccess(request, reply, cohortId))) return;

      const body = request.body as any;
      if (body.status && !ENROLLMENT_STATUSES.includes(body.status)) {
        return reply.status(400).send({ error: 'Unknown enrolment status' });
      }

      await AcademyService.updateEnrollment(enrollmentId, {
        status: body.status,
        certificateNumber:
          body.certificateNumber === undefined ? undefined : body.certificateNumber?.trim() || null,
        notes: body.notes === undefined ? undefined : body.notes?.trim() || null,
      });

      reply.send({ enrollments: await AcademyService.listEnrollments(cohortId!) });
    } catch (error) {
      console.error('Academy update enrollment error:', error);
      reply.status(500).send({ error: 'Failed to update the enrolment' });
    }
  }

  static async removeEnrollment(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { enrollmentId } = request.params as { enrollmentId: string };
      const cohortId = await AcademyService.getEnrollmentCohort(enrollmentId);
      if (!(await requireCohortAccess(request, reply, cohortId))) return;

      await AcademyService.removeEnrollment(enrollmentId);
      reply.send({ enrollments: await AcademyService.listEnrollments(cohortId!) });
    } catch (error) {
      console.error('Academy remove enrollment error:', error);
      reply.status(500).send({ error: 'Failed to remove the enrolment' });
    }
  }

  // ---- Sessions -----------------------------------------------------------

  static async createSession(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      if (!(await requireCohortAccess(request, reply, id))) return;

      const body = request.body as any;
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (!title) return reply.status(400).send({ error: 'A session title is required' });
      if (!body.sessionDate) return reply.status(400).send({ error: 'A session date is required' });

      await AcademyService.createSession({
        cohortId: id,
        title,
        topic: body.topic?.trim() || null,
        sessionDate: body.sessionDate,
        facilitatorId: body.facilitatorId || null,
      });

      reply.status(201).send({ sessions: await AcademyService.listSessions(id) });
    } catch (error) {
      console.error('Academy create session error:', error);
      reply.status(500).send({ error: 'Failed to create the session' });
    }
  }

  static async deleteSession(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const cohortId = await AcademyService.getSessionCohort(sessionId);
      if (!(await requireCohortAccess(request, reply, cohortId))) return;

      await AcademyService.deleteSession(sessionId);
      reply.send({ sessions: await AcademyService.listSessions(cohortId!) });
    } catch (error) {
      console.error('Academy delete session error:', error);
      reply.status(500).send({ error: 'Failed to delete the session' });
    }
  }

  static async getSessionAttendance(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const cohortId = await AcademyService.getSessionCohort(sessionId);
      if (!(await requireCohortAccess(request, reply, cohortId))) return;

      reply.send({ attendance: await AcademyService.getSessionAttendance(sessionId) });
    } catch (error) {
      console.error('Academy session attendance error:', error);
      reply.status(500).send({ error: 'Failed to load the register' });
    }
  }

  static async recordAttendance(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { sessionId } = request.params as { sessionId: string };
      const cohortId = await AcademyService.getSessionCohort(sessionId);
      if (!(await requireCohortAccess(request, reply, cohortId))) return;

      const body = request.body as any;
      const entries = Array.isArray(body.attendance) ? body.attendance : [];

      for (const entry of entries) {
        if (!entry?.enrollmentId || !ATTENDANCE_STATUSES.includes(entry.status)) {
          return reply.status(400).send({ error: 'Each entry needs an enrolment and a valid status' });
        }
      }

      await AcademyService.recordAttendance(sessionId, entries, request.user!.id);
      reply.send({ attendance: await AcademyService.getSessionAttendance(sessionId) });
    } catch (error) {
      console.error('Academy record attendance error:', error);
      reply.status(500).send({ error: 'Failed to save the register' });
    }
  }

  // ---- Member-initiated enrolment requests --------------------------------

  /** A member asks to join an open cohort. Any signed-in member may try. */
  static async requestJoin(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const result = await AcademyService.requestJoin(request.user!.id, id);
      reply.status(201).send({ request: result });
    } catch (error: any) {
      switch (error?.code) {
        case 'NOT_FOUND':
          return reply.status(404).send({ error: error.message });
        case 'NOT_OPEN':
        case 'ALREADY_ENROLLED':
        case 'PREREQUISITE':
        case 'PENDING_EXISTS':
          return reply.status(409).send({ error: error.message });
        default:
          console.error('Academy request join error:', error);
          reply.status(500).send({ error: 'Failed to send your request' });
      }
    }
  }

  static async getMyRequests(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      reply.send({ requests: await AcademyService.getMyRequests(request.user!.id) });
    } catch (error) {
      console.error('Academy my requests error:', error);
      reply.status(500).send({ error: 'Failed to load your requests' });
    }
  }

  /** Staff on the cohort (or an academy admin) see who is waiting to join. */
  static async listJoinRequests(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      if (!(await requireCohortAccess(request, reply, id))) return;
      reply.send({ requests: await AcademyService.listJoinRequests(id) });
    } catch (error) {
      console.error('Academy list join requests error:', error);
      reply.status(500).send({ error: 'Failed to load join requests' });
    }
  }

  static async acceptJoinRequest(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { requestId } = request.params as { requestId: string };
      const cohortId = await AcademyService.getJoinRequestCohort(requestId);
      if (!(await requireCohortAccess(request, reply, cohortId))) return;

      await AcademyService.acceptJoinRequest(requestId, request.user!.id);
      reply.send({
        requests: await AcademyService.listJoinRequests(cohortId!),
        enrollments: await AcademyService.listEnrollments(cohortId!),
      });
    } catch (error: any) {
      if (error?.code === 'ALREADY_RESOLVED') {
        return reply.status(409).send({ error: error.message });
      }
      console.error('Academy accept join request error:', error);
      reply.status(500).send({ error: 'Failed to accept the request' });
    }
  }

  static async rejectJoinRequest(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { requestId } = request.params as { requestId: string };
      const cohortId = await AcademyService.getJoinRequestCohort(requestId);
      if (!(await requireCohortAccess(request, reply, cohortId))) return;

      await AcademyService.rejectJoinRequest(requestId, request.user!.id);
      reply.send({ requests: await AcademyService.listJoinRequests(cohortId!) });
    } catch (error: any) {
      if (error?.code === 'ALREADY_RESOLVED') {
        return reply.status(409).send({ error: error.message });
      }
      console.error('Academy reject join request error:', error);
      reply.status(500).send({ error: 'Failed to reject the request' });
    }
  }
}
