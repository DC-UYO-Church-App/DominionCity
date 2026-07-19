import { FastifyReply, FastifyRequest } from 'fastify';
import { ProjectService } from '../services/projectService';
import { ContributionService } from '../services/contributionService';
import { AuthenticatedRequest } from '../middleware/auth';
import { ContributionSource, ProjectStatus } from '../types';
import { parseMultipartForm, MultipartError } from '../utils/multipart';

const VALID_STATUSES = Object.values(ProjectStatus) as string[];

export class ProjectController {
  static async createProject(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { fields, imageUrl } = await parseMultipartForm(request, {
        filePrefix: request.user!.id,
      });

      const { title, description, targetAmount, status } = fields;

      if (!title) {
        return reply.status(400).send({ error: 'Title is required' });
      }

      let parsedTarget: number | undefined;
      if (targetAmount !== undefined && targetAmount !== '' && targetAmount !== null) {
        parsedTarget = Number(targetAmount);
        if (Number.isNaN(parsedTarget) || parsedTarget < 0) {
          return reply.status(400).send({ error: 'Invalid target amount' });
        }
      }

      if (status && !VALID_STATUSES.includes(status)) {
        return reply.status(400).send({ error: 'Invalid project status' });
      }

      const project = await ProjectService.createProject({
        title,
        description,
        imageUrl,
        targetAmount: parsedTarget,
        status,
        createdBy: request.user!.id,
      });

      reply.status(201).send({ project });
    } catch (error) {
      if (error instanceof MultipartError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      console.error('Create project error:', error);
      reply.status(500).send({ error: 'Failed to create project' });
    }
  }

  static async getAllProjects(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const projects = await ProjectService.getAllProjects();
      reply.send({ projects });
    } catch (error) {
      console.error('Get projects error:', error);
      reply.status(500).send({ error: 'Failed to load projects' });
    }
  }

  static async getProjectById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const project = await ProjectService.getProjectById(id);
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }
      const givers = await ProjectService.getProjectGivers(id);
      reply.send({ project, givers });
    } catch (error) {
      console.error('Get project error:', error);
      reply.status(500).send({ error: 'Failed to load project' });
    }
  }

  static async updateProject(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const { fields, imageUrl } = await parseMultipartForm(request, {
        filePrefix: request.user!.id,
      });
      const updates: Record<string, any> = { ...fields };

      if (updates.targetAmount !== undefined && updates.targetAmount !== '') {
        const parsedTarget = Number(updates.targetAmount);
        if (Number.isNaN(parsedTarget) || parsedTarget < 0) {
          return reply.status(400).send({ error: 'Invalid target amount' });
        }
        updates.targetAmount = parsedTarget;
      } else {
        delete updates.targetAmount;
      }

      if (updates.status && !VALID_STATUSES.includes(updates.status)) {
        return reply.status(400).send({ error: 'Invalid project status' });
      }

      if (imageUrl) {
        updates.imageUrl = imageUrl;
      }

      const project = await ProjectService.updateProject(id, updates);
      if (!project) {
        return reply.status(404).send({ error: 'Project not found' });
      }

      reply.send({ project });
    } catch (error) {
      if (error instanceof MultipartError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      console.error('Update project error:', error);
      reply.status(500).send({ error: 'Failed to update project' });
    }
  }

  static async deleteProject(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const success = await ProjectService.deleteProject(id);
      if (!success) {
        return reply.status(404).send({ error: 'Project not found' });
      }
      reply.send({ message: 'Project deleted' });
    } catch (error) {
      console.error('Delete project error:', error);
      reply.status(500).send({ error: 'Failed to delete project' });
    }
  }

  /** Member records a pending contribution toward a project ("I've paid"). */
  static async giveToProject(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const body = (request.body as any) ?? {};
      const amount = Number(body.amount);

      if (Number.isNaN(amount) || amount <= 0) {
        return reply.status(400).send({ error: 'A valid amount is required' });
      }

      const contribution = await ContributionService.createContribution({
        userId: request.user!.id,
        sourceType: ContributionSource.PROJECT,
        sourceId: id,
        amount,
        isAnonymous: Boolean(body.isAnonymous),
        note: body.note,
      });

      reply.status(201).send({ contribution });
    } catch (error: any) {
      if (error?.message === 'SOURCE_NOT_FOUND') {
        return reply.status(404).send({ error: 'Project not found' });
      }
      console.error('Give to project error:', error);
      reply.status(500).send({ error: 'Failed to record contribution' });
    }
  }
}
