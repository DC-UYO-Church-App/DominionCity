import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const missing: string[] = [];
const invalid: string[] = [];

// A variable that is present but empty is treated as missing, so a blank value
// in the environment fails loudly instead of silently becoming ''.
function str(name: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    missing.push(name);
    return '';
  }
  return value;
}

function int(name: string): number {
  const value = str(name);
  if (value === '') return 0; // already recorded as missing
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    invalid.push(`${name} (expected an integer, got "${value}")`);
    return 0;
  }
  return parsed;
}

// Optional settings. Unlike str()/int() these never add to `missing`, so an
// unconfigured feature leaves the app booting normally; the feature itself
// reports that it is not configured when someone tries to use it.
function optionalStr(name: string, fallback = ''): string {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? fallback : value;
}

function optionalFloat(name: string, fallback: number): number {
  const value = optionalStr(name);
  if (value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  server: {
    nodeEnv: str('NODE_ENV'),
    port: int('PORT'),
    host: str('HOST'),
  },
  database: {
    host: str('DB_HOST'),
    port: int('DB_PORT'),
    name: str('DB_NAME'),
    user: str('DB_USER'),
    password: str('DB_PASSWORD'),
  },
  jwt: {
    secret: str('JWT_SECRET'),
    expiresIn: str('JWT_EXPIRES_IN'),
  },
  redis: {
    host: str('REDIS_HOST'),
    port: int('REDIS_PORT'),
    password: str('REDIS_PASSWORD'),
  },
  resend: {
    apiKey: str('RESEND_API_KEY'),
    fromEmail: str('RESEND_FROM_EMAIL'),
    fromName: str('RESEND_FROM_NAME'),
  },
  upload: {
    dir: path.resolve(str('UPLOAD_DIR')),
    maxFileSize: int('MAX_FILE_SIZE'),
  },
  cors: {
    origin: str('CORS_ORIGIN'),
  },
  rateLimit: {
    max: int('RATE_LIMIT_MAX'),
    timeWindow: int('RATE_LIMIT_TIMEWINDOW'),
  },
  church: {
    name: str('CHURCH_NAME'),
    email: str('CHURCH_EMAIL'),
    phone: str('CHURCH_PHONE'),
    address: str('CHURCH_ADDRESS'),
  },
  notifications: {
    absenceWarningThreshold: int('ABSENCE_WARNING_THRESHOLD'),
    absenceCriticalThreshold: int('ABSENCE_CRITICAL_THRESHOLD'),
    titheReminderThreshold: int('TITHE_REMINDER_THRESHOLD'),
  },
  // Facial recognition. Optional: the face endpoints report "not configured"
  // rather than crashing boot when these are unset.
  face: {
    serviceUrl: optionalStr('FACE_SERVICE_URL'),
    serviceApiKey: optionalStr('FACE_SERVICE_API_KEY'),
    // Cosine similarity above which two faces are treated as the same person.
    // ArcFace normed embeddings sit well below this for strangers; tune per
    // deployment. 0.38 is a conservative starting point.
    matchThreshold: optionalFloat('FACE_MATCH_THRESHOLD', 0.38),
  },
  // Cloudflare R2 (S3-compatible) object storage for enrolment images.
  r2: {
    accountId: optionalStr('R2_ACCOUNT_ID'),
    accessKeyId: optionalStr('R2_ACCESS_KEY_ID'),
    secretAccessKey: optionalStr('R2_SECRET_ACCESS_KEY'),
    bucket: optionalStr('R2_BUCKET'),
    // Optional explicit endpoint; otherwise derived from the account id.
    endpoint: optionalStr('R2_ENDPOINT'),
  },
};

if (missing.length > 0 || invalid.length > 0) {
  const lines = ['Invalid environment configuration:'];
  if (missing.length > 0) {
    lines.push(`  Missing or empty: ${missing.join(', ')}`);
  }
  if (invalid.length > 0) {
    lines.push(`  Invalid: ${invalid.join(', ')}`);
  }
  lines.push('  See Backend/.env.example for the full list of required variables.');
  throw new Error(lines.join('\n'));
}
