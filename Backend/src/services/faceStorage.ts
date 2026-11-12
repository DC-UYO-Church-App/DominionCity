import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from '../config';

/**
 * Cloudflare R2 (S3-compatible) storage for face enrolment images.
 *
 * The client is built lazily and cached, so the backend boots fine when R2 is
 * not configured; only an actual enrolment needs it. `isConfigured()` lets the
 * face endpoints fail with a clear message instead of a cryptic SDK error.
 */
let client: S3Client | null = null;

export function isR2Configured(): boolean {
  const { accountId, accessKeyId, secretAccessKey, bucket, endpoint } = config.r2;
  return Boolean((accountId || endpoint) && accessKeyId && secretAccessKey && bucket);
}

function getClient(): S3Client {
  if (client) return client;

  const { accountId, accessKeyId, secretAccessKey, endpoint } = config.r2;
  client = new S3Client({
    region: 'auto',
    endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export async function uploadFaceImage(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: config.r2.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/**
 * Fetches an enrolment still back from R2 so the technical dashboard can show
 * it. Returns the raw bytes and content type; the backend streams them to the
 * operator rather than exposing a public URL, keeping biometric images behind
 * authentication.
 */
export async function getFaceImage(
  key: string
): Promise<{ body: Buffer; contentType: string }> {
  const res = await getClient().send(
    new GetObjectCommand({ Bucket: config.r2.bucket, Key: key })
  );
  if (!res.Body) {
    throw new Error('R2 returned an empty body for the face image');
  }
  const bytes = await res.Body.transformToByteArray();
  return { body: Buffer.from(bytes), contentType: res.ContentType || 'image/jpeg' };
}

export async function deleteFaceImage(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: config.r2.bucket, Key: key })
  );
}
