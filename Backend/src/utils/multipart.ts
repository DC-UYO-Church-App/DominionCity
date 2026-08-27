import { FastifyRequest } from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

/**
 * Builds the name an upload is stored under.
 *
 * The extension comes from the validated mime type, never from the uploaded
 * filename. Uploads used to keep whatever extension they arrived with — the
 * sanitiser deliberately preserves "." — and @fastify/static picks the
 * Content-Type off that extension. Since `mimetype` is just a client-supplied
 * multipart header, "payload.html" declared as image/png was stored as .html
 * and served back as text/html: stored XSS on the API origin.
 *
 * The original name is kept only as a readable, extension-stripped hint.
 */
export function buildStoredFilename(prefix: string, originalName: string, mimetype: string): string {
  const extension = mimetype === 'image/png' ? 'png' : 'jpg';
  const base =
    String(originalName)
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.[^.]*$/, '')   // drop the uploaded extension
      .replace(/\.+/g, '.')      // collapse dot runs, so ".." cannot survive
      .replace(/^[.\-]+/, '')    // no leading dot or dash (dotfiles, arg-lookalikes)
      .replace(/[.\-]+$/, '')    // no trailing dot, which would double up with the extension
      .slice(0, 40) || 'image';
  return `${prefix}-${Date.now()}-${base}.${extension}`;
}

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
      const prefix = opts.filePrefix ?? 'upload';
      const filename = buildStoredFilename(prefix, part.filename, part.mimetype);
      const buffer = await part.toBuffer();
      await fs.writeFile(path.join(config.upload.dir, filename), buffer);
      imageUrl = `/uploads/${filename}`;
    } else {
      fields[part.fieldname] = part.value;
    }
  }

  return { fields, imageUrl };
}
