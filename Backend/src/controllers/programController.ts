import { FastifyReply, FastifyRequest } from 'fastify';
import { ProgramsService } from '../services/programsService';
import { ContributionService } from '../services/contributionService';
import { AuthenticatedRequest } from '../middleware/auth';
import { ContributionSource, ProgramScope, ProgramStatus } from '../types';
import { parseMultipartForm, MultipartError } from '../utils/multipart';

const VALID_SCOPES = Object.values(ProgramScope) as string[];
const VALID_STATUSES = Object.values(ProgramStatus) as string[];

export class ProgramController {
  static async createProgram(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { fields, imageUrl } = await parseMultipartForm(request, {
        filePrefix: request.user!.id,
      });

      const { title, description, scope, location, startDate, status } = fields;

      if (!title) {
        return reply.status(400).send({ error: 'Title is required' });
      }
      if (!scope || !VALID_SCOPES.includes(scope)) {
        return reply.status(400).send({ error: 'Scope must be national or state' });
      }
      if (status && !VALID_STATUSES.includes(status)) {
        return reply.status(400).send({ error: 'Invalid program status' });
      }

      let parsedDate: Date | undefined;
      if (startDate) {
        parsedDate = new Date(startDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return reply.status(400).send({ error: 'Invalid start date' });
        }
      }

      const program = await ProgramsService.createProgram({
        title,
        description,
        scope,
        location,
        startDate: parsedDate,
        status,
        imageUrl,
        createdBy: request.user!.id,
      });

      reply.status(201).send({ program });
    } catch (error) {
      if (error instanceof MultipartError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      console.error('Create program error:', error);
      reply.status(500).send({ error: 'Failed to create program' });
    }
  }

  static async getAllPrograms(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { scope } = request.query as any;
      if (scope && !VALID_SCOPES.includes(scope)) {
        return reply.status(400).send({ error: 'Invalid scope filter' });
      }
      const programs = await ProgramsService.getAllPrograms(scope);
      reply.send({ programs });
    } catch (error) {
      console.error('Get programs error:', error);
      reply.status(500).send({ error: 'Failed to load programs' });
    }
  }

  static async getProgramById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const program = await ProgramsService.getProgramById(id);
      if (!program) {
        return reply.status(404).send({ error: 'Program not found' });
      }
      reply.send({ program });
    } catch (error) {
      console.error('Get program error:', error);
      reply.status(500).send({ error: 'Failed to load program' });
    }
  }

  static async updateProgram(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const { fields, imageUrl } = await parseMultipartForm(request, {
        filePrefix: request.user!.id,
      });
      const updates: Record<string, any> = { ...fields };

      if (updates.scope && !VALID_SCOPES.includes(updates.scope)) {
        return reply.status(400).send({ error: 'Scope must be national or state' });
      }
      if (updates.status && !VALID_STATUSES.includes(updates.status)) {
        return reply.status(400).send({ error: 'Invalid program status' });
      }
      if (updates.startDate) {
        const parsedDate = new Date(updates.startDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return reply.status(400).send({ error: 'Invalid start date' });
        }
        updates.startDate = parsedDate;
      }

      if (imageUrl) {
        updates.imageUrl = imageUrl;
      }

      const program = await ProgramsService.updateProgram(id, updates);
      if (!program) {
        return reply.status(404).send({ error: 'Program not found' });
      }

      reply.send({ program });
    } catch (error) {
      if (error instanceof MultipartError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      console.error('Update program error:', error);
      reply.status(500).send({ error: 'Failed to update program' });
    }
  }

  static async deleteProgram(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const success = await ProgramsService.deleteProgram(id);
      if (!success) {
        return reply.status(404).send({ error: 'Program not found' });
      }
      reply.send({ message: 'Program deleted' });
    } catch (error) {
      console.error('Delete program error:', error);
      reply.status(500).send({ error: 'Failed to delete program' });
    }
  }

  /** Member records a pending contribution toward a program ("Support Program"). */
  static async giveToProgram(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const body = (request.body as any) ?? {};
      const amount = Number(body.amount);

      if (Number.isNaN(amount) || amount <= 0) {
        return reply.status(400).send({ error: 'A valid amount is required' });
      }

      const contribution = await ContributionService.createContribution({
        userId: request.user!.id,
        sourceType: ContributionSource.PROGRAM,
        sourceId: id,
        amount,
        isAnonymous: Boolean(body.isAnonymous),
        note: body.note,
      });

      reply.status(201).send({ contribution });
    } catch (error: any) {
      if (error?.message === 'SOURCE_NOT_FOUND') {
        return reply.status(404).send({ error: 'Program not found' });
      }
      console.error('Give to program error:', error);
      reply.status(500).send({ error: 'Failed to record contribution' });
    }
  }
}
