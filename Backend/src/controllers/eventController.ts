import { FastifyRequest, FastifyReply } from 'fastify';
import { EventService } from '../services/eventService';
import { AuthenticatedRequest } from '../middleware/auth';
import { EventStatus } from '../types';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';
import { replyWithError } from '../utils/apiError';
import { buildStoredFilename } from '../utils/multipart';

/**
 * Reads the optional geofence fields (latitude, longitude, geofenceRadiusM)
 * out of a create/update payload. Fields arrive as strings over multipart and
 * as strings or numbers over JSON, so each is coerced with Number().
 *
 * Returns `{ error }` when the input is invalid, or an object whose three keys
 * are each either a parsed number or `undefined` (field absent / cleared).
 * A geofence is all-or-nothing: on create, supplying some but not all three is
 * rejected; callers pass `partial: true` for updates, where a single field may
 * change on its own.
 */
function parseGeofence(
  source: Record<string, any>,
  partial = false
):
  | { error: string }
  | { latitude?: number; longitude?: number; geofenceRadiusM?: number } {
  const has = (k: string) => source[k] !== undefined && source[k] !== null && source[k] !== '';

  const parsed: { latitude?: number; longitude?: number; geofenceRadiusM?: number } = {};

  if (has('latitude')) {
    const lat = Number(source.latitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return { error: 'Latitude must be a number between -90 and 90' };
    }
    parsed.latitude = lat;
  }

  if (has('longitude')) {
    const lng = Number(source.longitude);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return { error: 'Longitude must be a number between -180 and 180' };
    }
    parsed.longitude = lng;
  }

  if (has('geofenceRadiusM')) {
    const radius = Number(source.geofenceRadiusM);
    if (!Number.isInteger(radius) || radius <= 0) {
      return { error: 'Check-in radius must be a whole number of metres greater than 0' };
    }
    parsed.geofenceRadiusM = radius;
  }

  const provided = ['latitude', 'longitude', 'geofenceRadiusM'].filter(has);
  if (!partial && provided.length > 0 && provided.length < 3) {
    return {
      error: 'To set a check-in area, provide latitude, longitude, and radius together',
    };
  }

  return parsed;
}

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
            const filename = buildStoredFilename(request.user!.id, part.filename, part.mimetype);
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

      const geofence = parseGeofence(fields);
      if ('error' in geofence) {
        return reply.status(400).send({ error: geofence.error });
      }

      const event = await EventService.createEvent({
        title,
        description,
        eventDate: parsedDate,
        address,
        status,
        imageUrl,
        latitude: geofence.latitude,
        longitude: geofence.longitude,
        geofenceRadiusM: geofence.geofenceRadiusM,
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
            const filename = buildStoredFilename(request.user!.id, part.filename, part.mimetype);
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

      // Geofence fields need coercing and validating before they reach the raw
      // UPDATE. Sending any of the three as empty clears the whole geofence
      // (the three move as a unit), so the event checks in from anywhere again.
      const geofenceKeys = ['latitude', 'longitude', 'geofenceRadiusM'] as const;
      if (geofenceKeys.some((key) => key in updates)) {
        const cleared = geofenceKeys.some(
          (key) => key in updates && (updates[key] === '' || updates[key] === null)
        );
        const rawGeofence = { ...updates };
        geofenceKeys.forEach((key) => delete updates[key]);

        if (cleared) {
          updates.latitude = null;
          updates.longitude = null;
          updates.geofenceRadiusM = null;
        } else {
          const geofence = parseGeofence(rawGeofence, true);
          if ('error' in geofence) {
            return reply.status(400).send({ error: geofence.error });
          }
          Object.assign(updates, geofence);
        }
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
