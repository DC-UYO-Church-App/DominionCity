import { FastifyReply, FastifyRequest } from 'fastify';
import { SatelliteChurchService } from '../services/satelliteChurchService';
import { NotificationService } from '../services/notificationService';
import { AuthenticatedRequest } from '../middleware/auth';
import { NotificationType } from '../types';

export class SatelliteChurchController {
  static async createSatelliteChurch(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const body = (request.body as any) ?? {};
      const { name, location, description, assignedUserId } = body;

      if (!name?.trim()) {
        return reply.status(400).send({ error: 'Name is required' });
      }

      const satellite = await SatelliteChurchService.createSatelliteChurch({
        name: name.trim(),
        location,
        description,
        assignedUserId: assignedUserId || undefined,
        createdBy: request.user!.id,
      });

      if (satellite.assignedUserId) {
        await notifyAssignedMember(satellite.assignedUserId, satellite.name);
      }

      reply.status(201).send({ satelliteChurch: satellite });
    } catch (error) {
      console.error('Create satellite church error:', error);
      reply.status(500).send({ error: 'Failed to create satellite church' });
    }
  }

  static async getAllSatelliteChurches(_request: FastifyRequest, reply: FastifyReply) {
    try {
      const satelliteChurches = await SatelliteChurchService.getAllSatelliteChurches();
      reply.send({ satelliteChurches });
    } catch (error) {
      console.error('Get satellite churches error:', error);
      reply.status(500).send({ error: 'Failed to load satellite churches' });
    }
  }

  static async getSatelliteChurchById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const satellite = await SatelliteChurchService.getSatelliteChurchById(id);
      if (!satellite) {
        return reply.status(404).send({ error: 'Satellite church not found' });
      }
      reply.send({ satelliteChurch: satellite });
    } catch (error) {
      console.error('Get satellite church error:', error);
      reply.status(500).send({ error: 'Failed to load satellite church' });
    }
  }

  /** Satellite churches assigned to the current member (dashboard button). */
  static async getMySatelliteChurches(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const satelliteChurches = await SatelliteChurchService.getSatelliteChurchesForUser(
        request.user!.id
      );
      reply.send({ satelliteChurches });
    } catch (error) {
      console.error('Get my satellite churches error:', error);
      reply.status(500).send({ error: 'Failed to load satellite churches' });
    }
  }

  static async updateSatelliteChurch(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const body = (request.body as any) ?? {};
      const updates: Record<string, any> = {};

      if (body.name !== undefined) updates.name = String(body.name).trim();
      if (body.location !== undefined) updates.location = body.location;
      if (body.description !== undefined) updates.description = body.description;
      if (body.assignedUserId !== undefined) {
        updates.assignedUserId = body.assignedUserId || null;
      }

      const existing = await SatelliteChurchService.getSatelliteChurchById(id);
      if (!existing) {
        return reply.status(404).send({ error: 'Satellite church not found' });
      }

      const satellite = await SatelliteChurchService.updateSatelliteChurch(id, updates);
      if (!satellite) {
        return reply.status(404).send({ error: 'Satellite church not found' });
      }

      // Notify a newly-assigned member.
      if (
        satellite.assignedUserId &&
        satellite.assignedUserId !== existing.assignedUserId
      ) {
        await notifyAssignedMember(satellite.assignedUserId, satellite.name);
      }

      reply.send({ satelliteChurch: satellite });
    } catch (error) {
      console.error('Update satellite church error:', error);
      reply.status(500).send({ error: 'Failed to update satellite church' });
    }
  }

  static async deleteSatelliteChurch(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const success = await SatelliteChurchService.deleteSatelliteChurch(id);
      if (!success) {
        return reply.status(404).send({ error: 'Satellite church not found' });
      }
      reply.send({ message: 'Satellite church deleted' });
    } catch (error) {
      console.error('Delete satellite church error:', error);
      reply.status(500).send({ error: 'Failed to delete satellite church' });
    }
  }
}

/** Notify a member that a satellite church has been assigned to them. */
async function notifyAssignedMember(userId: string, satelliteName: string): Promise<void> {
  try {
    await NotificationService.sendNotification({
      userId,
      type: NotificationType.GENERAL,
      title: 'Satellite Church Assigned',
      message: `You have been assigned to lead "${satelliteName}". Visit your Satellite Dashboard to get started.`,
      metadata: { satelliteName },
    });
  } catch (error) {
    console.error('Failed to notify assigned member:', error);
  }
}
