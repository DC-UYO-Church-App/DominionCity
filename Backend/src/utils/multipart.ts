import { FastifyRequest } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

/**
 * Error thrown for client-side problems while parsing a multipart form.
 * Controllers can inspect `statusCode` to return the right HTTP status.
 */
export class MultipartError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'MultipartError';
    this.statusCode = statusCode;
  }
}

/**
 * Parse a request that may be either JSON or multipart/form-data. When an image
 * file is present under one of `fileFields`, it is saved to the uploads dir and
 * its public URL returned as `imageUrl`. Non-image file parts are ignored.
 */
export async function parseMultipartForm(
  request: FastifyRequest,
  opts: { fileFields?: string[]; filePrefix?: string } = {}
): Promise<{ fields: Record<string, any>; imageUrl?: string }> {
  const isMultipart = (request as any).isMultipart?.() ?? false;

  if (!isMultipart) {
    return { fields: ((request.body as Record<string, any>) ?? {}) };
  }

  const fileFields = opts.fileFields ?? ['cover', 'image'];
  const fields: Record<string, any> = {};
  let imageUrl: string | undefined;

  const parts = (request as any).parts();
  for await (const part of parts) {
    if (part.type === 'file') {
      if (!fileFields.includes(part.fieldname)) {
        // Drain unrecognised file parts so the stream can continue.
        await part.toBuffer().catch(() => undefined);
        continue;
      }
      if (!part.mimetype || !ALLOWED_IMAGE_TYPES.includes(part.mimetype)) {
        throw new MultipartError('Only JPG or PNG images are allowed');
      }
      await fs.mkdir(config.upload.dir, { recursive: true });
      const safeName = String(part.filename).replace(/[^a-zA-Z0-9._-]/g, '_');
      const prefix = opts.filePrefix ?? 'upload';
      const filename = `${prefix}-${Date.now()}-${safeName}`;
      const buffer = await part.toBuffer();
      await fs.writeFile(path.join(config.upload.dir, filename), buffer);
      imageUrl = `/uploads/${filename}`;
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  return { fields, imageUrl };
}
