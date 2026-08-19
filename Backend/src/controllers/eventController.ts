import { FastifyRequest, FastifyReply } from 'fastify';
import { EventService } from '../services/eventService';
import { AuthenticatedRequest } from '../middleware/auth';
import { EventStatus } from '../types';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { replyWithError } from '../utils/apiError';

export class EventController {
  static async createEvent(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const isMultipart = (request as any).isMultipart?.() ?? false;
      let fields: Record<string, any> = {};
      let imageUrl: string | undefined;
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];

      if (isMultipart) {
        const parts = (request as any).parts();
        for await (const part of parts) {
          if (part.type === 'file') {
            if (!part.mimetype || !allowedImageTypes.includes(part.mimetype)) {
              return reply.status(400).send({ error: 'Only JPG or PNG images are allowed' });
            }
            if (part.fieldname !== 'cover' && part.fieldname !== 'image') {
              continue;
            }
            await fs.mkdir(config.upload.dir, { recursive: true });
            const safeName = part.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filename = `${request.user!.id}-${Date.now()}-${safeName}`;
            const filePath = path.join(config.upload.dir, filename);
            const buffer = await part.toBuffer();
            await fs.writeFile(filePath, buffer);
            imageUrl = `/uploads/${filename}`;
          } else {
            fields[part.fieldname] = part.value;
          }
        }
      } else {
        fields = request.body as any;
      }

      const { title, description, eventDate, address, status } = fields;

      if (!title || !eventDate) {
        return reply.status(400).send({ error: 'Title and event date are required' });
      }

      const parsedDate = new Date(eventDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return reply.status(400).send({ error: 'Invalid event date' });
      }

      if (status && status !== EventStatus.SCHEDULED && status !== EventStatus.CANCELLED) {
        return reply.status(400).send({ error: 'Invalid event status' });
      }

      const event = await EventService.createEvent({
        title,
        description,
        eventDate: parsedDate,
        address,
        status,
        imageUrl,
        createdBy: request.user!.id,
      });

      reply.status(201).send({ event });
    } catch (error) {
      replyWithError(reply, 'Failed to create event', error);
    }
  }

  static async getEventById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;

      const event = await EventService.getEventById(id);

      if (!event) {
        return reply.status(404).send({ error: 'Event not found' });
      }

      reply.send({ event });
    } catch (error) {
      replyWithError(reply, 'Failed to get event', error);
    }
  }

  static async getAllEvents(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { startDate, endDate, limit, offset } = request.query as any;

      const result = await EventService.getAllEvents({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });

      reply.send(result);
    } catch (error) {
      replyWithError(reply, 'Failed to get events', error);
    }
  }

  static async updateEvent(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;
      const isMultipart = (request as any).isMultipart?.() ?? false;
      let updates: Record<string, any> = {};
      let imageUrl: string | undefined;
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];

      if (isMultipart) {
        const parts = (request as any).parts();
        for await (const part of parts) {
          if (part.type === 'file') {
            if (!part.mimetype || !allowedImageTypes.includes(part.mimetype)) {
              return reply.status(400).send({ error: 'Only JPG or PNG images are allowed' });
            }
            if (part.fieldname !== 'cover' && part.fieldname !== 'image') {
              continue;
            }
            await fs.mkdir(config.upload.dir, { recursive: true });
            const safeName = part.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filename = `${request.user!.id}-${Date.now()}-${safeName}`;
            const filePath = path.join(config.upload.dir, filename);
            const buffer = await part.toBuffer();
            await fs.writeFile(filePath, buffer);
            imageUrl = `/uploads/${filename}`;
          } else {
            updates[part.fieldname] = part.value;
          }
        }
      } else {
        updates = request.body as any;
      }

      if (updates.eventDate) {
        const parsedDate = new Date(updates.eventDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return reply.status(400).send({ error: 'Invalid event date' });
        }
        updates.eventDate = parsedDate;
      }

      if (updates.status && updates.status !== EventStatus.SCHEDULED && updates.status !== EventStatus.CANCELLED) {
        return reply.status(400).send({ error: 'Invalid event status' });
      }

      if (imageUrl) {
        updates.imageUrl = imageUrl;
      }

      const event = await EventService.updateEvent(id, updates);

      if (!event) {
        return reply.status(404).send({ error: 'Event not found' });
      }

      reply.send({ event });
    } catch (error) {
      replyWithError(reply, 'Failed to update event', error);
    }
  }

  static async deleteEvent(request: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as any;

      const success = await EventService.deleteEvent(id);

      if (!success) {
        return reply.status(404).send({ error: 'Event not found' });
      }

      reply.send({ message: 'Event deleted successfully' });
    } catch (error) {
      replyWithError(reply, 'Failed to delete event', error);
    }
  }
}
