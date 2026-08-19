import { FastifyReply } from 'fastify';
import { config } from '../config';

/**
 * Postgres SQLSTATE codes worth translating into client-facing responses.
 * Anything not listed here is a genuine server fault and stays a 500.
 */
const PG_STATUS: Record<string, { status: number; error: string }> = {
  '23505': { status: 409, error: 'Already exists' },
  '23503': { status: 400, error: 'Referenced record does not exist' },
  '23502': { status: 400, error: 'A required field is missing' },
  '23514': { status: 400, error: 'A field failed a validation rule' },
  '22001': { status: 400, error: 'A field is too long' },
  '22007': { status: 400, error: 'Invalid date format' },
  '22008': { status: 400, error: 'Date is out of range' },
  '22P02': { status: 400, error: 'A field has the wrong type' },
};

/** Column name out of a unique-violation, so the message can name the field. */
function conflictingField(detail?: string): string | null {
  const match = /Key \((?<column>[^)]+)\)=/.exec(detail ?? '');
  return match?.groups?.column ?? null;
}

const FIELD_LABELS: Record<string, string> = {
  email: 'email address',
  phone_number: 'phone number',
};

/**
 * Turns a thrown error into a response that says something useful.
 *
 * Client-caused failures (constraint violations, bad input) get a 4xx naming
 * the problem. Everything else stays a 500 with a generic body, since the
 * detail could expose internals — outside production the cause is included to
 * make local debugging possible without reading the server log.
 */
export function replyWithError(reply: FastifyReply, context: string, error: unknown): void {
  console.error(`${context}:`, error);

  const pgCode = (error as { code?: string })?.code;
  const mapped = pgCode ? PG_STATUS[pgCode] : undefined;

  if (mapped) {
    let message = mapped.error;

    if (pgCode === '23505') {
      const column = conflictingField((error as { detail?: string }).detail);
      const label = column ? (FIELD_LABELS[column] ?? column.replace(/_/g, ' ')) : null;
      message = label
        ? `That ${label} is already registered`
        : 'That record already exists';
    }

    reply.status(mapped.status).send({ error: message });
    return;
  }

  const body: { error: string; detail?: string } = { error: context };
  if (config.server.nodeEnv !== 'production') {
    body.detail = error instanceof Error ? error.message : String(error);
  }

  reply.status(500).send(body);
}
