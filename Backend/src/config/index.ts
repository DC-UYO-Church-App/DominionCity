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
