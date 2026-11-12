import { randomUUID } from 'crypto';
import { query } from '../config/database';
import { config } from '../config';
import { deleteFaceImage, getFaceImage, isR2Configured, uploadFaceImage } from './faceStorage';

/**
 * Orchestrates facial recognition. This service owns the data; the Python face
 * service (InsightFace) is a stateless helper that only turns an image into an
 * embedding. The split keeps biometric records and images inside our own
 * infrastructure — Postgres for embeddings, R2 for the stills.
 */

/** Carries an HTTP status and a short code so the controller can map cleanly. */
export class FaceError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type FaceResult = { embedding: number[]; bbox: number[]; det_score: number };

export interface ParsedImage {
  buffer: Buffer;
  base64: string;
  contentType: string;
}

export class FaceService {
  static isFaceServiceConfigured(): boolean {
    return Boolean(config.face.serviceUrl);
  }

  /** Enrolment needs both the embedding service and somewhere to keep the image. */
  static enrollmentReady(): { ok: boolean; reason?: string } {
    if (!this.isFaceServiceConfigured()) {
      return { ok: false, reason: 'The face service is not configured (set FACE_SERVICE_URL)' };
    }
    if (!isR2Configured()) {
      return { ok: false, reason: 'Image storage is not configured (set the R2_* variables)' };
    }
    return { ok: true };
  }

  /**
   * Accepts either a data URL (`data:image/jpeg;base64,...`) or bare base64 and
   * normalises both to raw bytes plus the base64 the Python service expects.
   */
  static parseImage(input: unknown): ParsedImage {
    if (typeof input !== 'string' || input.length === 0) {
      throw new FaceError(400, 'NO_IMAGE', 'An image is required');
    }
    let contentType = 'image/jpeg';
    let base64 = input;

    const match = input.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
    if (match) {
      contentType = match[1];
      base64 = match[2];
    }

    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64, 'base64');
    } catch {
      throw new FaceError(400, 'BAD_IMAGE', 'The image is not valid base64');
    }
    if (buffer.length === 0) {
      throw new FaceError(400, 'BAD_IMAGE', 'The image is empty');
    }
    // Re-encode to canonical base64 so an odd data URL cannot slip through.
    return { buffer, base64: buffer.toString('base64'), contentType };
  }

  /** Calls the Python service and returns the detected faces, strongest first. */
  private static async analyze(base64: string, enroll: boolean): Promise<FaceResult[]> {
    const url = `${config.face.serviceUrl.replace(/\/$/, '')}/analyze`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.face.serviceApiKey,
        },
        body: JSON.stringify({ image_base64: base64, enroll }),
      });
    } catch {
      throw new FaceError(503, 'SERVICE_DOWN', 'The face service could not be reached');
    }

    if (response.status === 422 || response.status === 400 || response.status === 413) {
      const body = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new FaceError(422, 'NO_FACE', body.detail || 'No usable face in the image');
    }
    if (!response.ok) {
      throw new FaceError(502, 'SERVICE_ERROR', 'The face service returned an error');
    }

    const data = (await response.json()) as { faces: FaceResult[] };
    return data.faces || [];
  }

  /**
   * Registers (or re-registers) a member's face. Replaces any previous
   * enrolment, deleting the old image so one member keeps exactly one face on
   * file. `consent` must be explicitly true — biometric data is not captured
   * on an implied yes.
   */
  static async enroll(params: {
    userId: string;
    image: unknown;
    consent: boolean;
    enrolledBy: string;
  }) {
    const ready = this.enrollmentReady();
    if (!ready.ok) throw new FaceError(503, 'NOT_CONFIGURED', ready.reason!);
    if (params.consent !== true) {
      throw new FaceError(400, 'NO_CONSENT', 'Consent is required to register a face');
    }

    const parsed = this.parseImage(params.image);
    const faces = await this.analyze(parsed.base64, true);
    if (faces.length === 0) {
      throw new FaceError(422, 'NO_FACE', 'No face was detected');
    }
    const face = faces[0];

    const ext = parsed.contentType === 'image/png' ? 'png' : 'jpg';
    const imageKey = `faces/${params.userId}/${Date.now()}-${randomUUID()}.${ext}`;
    await uploadFaceImage(imageKey, parsed.buffer, parsed.contentType);

    // Replace atomically-ish: read the old key, upsert, then best-effort delete
    // the old image once the row no longer points at it.
    const existing = await query(`SELECT image_key FROM face_enrollments WHERE user_id = $1`, [
      params.userId,
    ]);
    const oldKey: string | undefined = existing.rows[0]?.image_key;

    await query(
      `INSERT INTO face_enrollments (user_id, embedding, image_key, det_score, consent_at, enrolled_by)
       VALUES ($1, $2::jsonb, $3, $4, CURRENT_TIMESTAMP, $5)
       ON CONFLICT (user_id) DO UPDATE
         SET embedding = EXCLUDED.embedding,
             image_key = EXCLUDED.image_key,
             det_score = EXCLUDED.det_score,
             consent_at = CURRENT_TIMESTAMP,
             enrolled_by = EXCLUDED.enrolled_by,
             updated_at = CURRENT_TIMESTAMP`,
      [params.userId, JSON.stringify(face.embedding), imageKey, face.det_score, params.enrolledBy]
    );

    if (oldKey && oldKey !== imageKey) {
      await deleteFaceImage(oldKey).catch((err) =>
        console.error('Failed to delete replaced face image:', err)
      );
    }

    return { enrolled: true, detScore: face.det_score };
  }

  /**
   * Identifies a face against the register. Returns the best match above the
   * configured threshold, plus the runners-up for a human to sanity-check.
   */
  static async recognize(image: unknown) {
    if (!this.isFaceServiceConfigured()) {
      throw new FaceError(503, 'NOT_CONFIGURED', 'The face service is not configured');
    }
    const parsed = this.parseImage(image);
    const faces = await this.analyze(parsed.base64, false);
    if (faces.length === 0) {
      throw new FaceError(422, 'NO_FACE', 'No face was detected');
    }

    const register = await query(
      `SELECT e.user_id, e.embedding,
              u.first_name, u.last_name, u.email, u.profile_image, u.role
         FROM face_enrollments e
         JOIN users u ON u.id = e.user_id
        WHERE u.is_active = true`
    );

    // Compare the strongest detected face against everyone on file.
    const probe = faces[0].embedding;
    const scored = register.rows
      .map((row) => ({
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        profileImage: row.profile_image,
        role: row.role,
        score: cosine(probe, row.embedding as number[]),
      }))
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const matched = Boolean(best && best.score >= config.face.matchThreshold);

    return {
      matched,
      threshold: config.face.matchThreshold,
      facesDetected: faces.length,
      match: matched ? best : null,
      // Top few either way, so an operator can see a near-miss.
      candidates: scored.slice(0, 5).map((c) => ({ ...c, score: round(c.score) })),
    };
  }

  static async getEnrollment(userId: string) {
    const result = await query(
      `SELECT user_id, det_score, consent_at, created_at, updated_at
         FROM face_enrollments WHERE user_id = $1`,
      [userId]
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      userId: row.user_id,
      detScore: row.det_score,
      consentAt: row.consent_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Returns the stored enrolment still for a user, fetched from R2, so the
   * technical dashboard can display the face on file. 404s when the user has no
   * enrolment.
   */
  static async getEnrollmentImage(
    userId: string
  ): Promise<{ body: Buffer; contentType: string }> {
    if (!isR2Configured()) {
      throw new FaceError(503, 'NOT_CONFIGURED', 'Image storage is not configured');
    }
    const result = await query(
      `SELECT image_key FROM face_enrollments WHERE user_id = $1`,
      [userId]
    );
    const key: string | undefined = result.rows[0]?.image_key;
    if (!key) {
      throw new FaceError(404, 'NO_ENROLLMENT', 'That user has no face registered');
    }
    return getFaceImage(key);
  }

  static async deleteEnrollment(userId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM face_enrollments WHERE user_id = $1 RETURNING image_key`,
      [userId]
    );
    const key = result.rows[0]?.image_key;
    if (!key) return false;
    await deleteFaceImage(key).catch((err) =>
      console.error('Failed to delete face image on unenrol:', err)
    );
    return true;
  }
}

/** Dot product; embeddings arrive L2-normalised, so this is cosine similarity. */
function cosine(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return -1;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
