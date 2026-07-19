import { FastifyReply, FastifyRequest } from 'fastify';
import { WeeklyActivityService } from '../services/weeklyActivityService';
import { AuthenticatedRequest } from '../middleware/auth';
import { parseMultipartForm, MultipartError } from '../utils/multipart';

function parseBool(value: any): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
}

export class WeeklyActivityController {
  static async createActivity(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { fields, imageUrl } = await parseMultipartForm(request, {
        filePrefix: request.user!.id,
      });

      const { title, description, dayOfWeek, startTime, endTime, location } = fields;

      if (!title || !dayOfWeek) {
        return reply.status(400).send({ error: 'Title and day of week are required' });
      }
      if (!WeeklyActivityService.isValidDay(dayOfWeek)) {
        return reply.status(400).send({ error: 'Invalid day of week' });
      }

      const activity = await WeeklyActivityService.createActivity({
        title,
        description,
        dayOfWeek,
        startTime,
        endTime,
        location,
        imageUrl,
        isActive: parseBool(fields.isActive),
        createdBy: request.user!.id,
      });

      reply.status(201).send({ activity });
    } catch (error) {
      if (error instanceof MultipartError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      console.error('Create weekly activity error:', error);
      reply.status(500).send({ error: 'Failed to create activity' });
    }
  }

  static async getAllActivities(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { active } = request.query as any;
      const onlyActive = active === 'true' || active === '1';
      const activities = await WeeklyActivityService.getAllActivities(onlyActive);
      reply.send({ activities });
    } catch (error) {
      console.error('Get weekly activities error:', error);
      reply.status(500).send({ error: 'Failed to load activities' });
    }
  }

  static async updateActivity(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const { fields, imageUrl } = await parseMultipartForm(request, {
        filePrefix: request.user!.id,
      });
      const updates: Record<string, any> = { ...fields };

      if (updates.dayOfWeek && !WeeklyActivityService.isValidDay(updates.dayOfWeek)) {
        return reply.status(400).send({ error: 'Invalid day of week' });
      }
      if (updates.isActive !== undefined) {
        updates.isActive = parseBool(updates.isActive);
      }
      if (imageUrl) {
        updates.imageUrl = imageUrl;
      }

      const activity = await WeeklyActivityService.updateActivity(id, updates);
      if (!activity) {
        return reply.status(404).send({ error: 'Activity not found' });
      }

      reply.send({ activity });
    } catch (error) {
      if (error instanceof MultipartError) {
        return reply.status(error.statusCode).send({ error: error.message });
      }
      console.error('Update weekly activity error:', error);
      reply.status(500).send({ error: 'Failed to update activity' });
    }
  }

  static async deleteActivity(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const success = await WeeklyActivityService.deleteActivity(id);
      if (!success) {
        return reply.status(404).send({ error: 'Activity not found' });
      }
      reply.send({ message: 'Activity deleted' });
    } catch (error) {
      console.error('Delete weekly activity error:', error);
      reply.status(500).send({ error: 'Failed to delete activity' });
    }
  }
}
