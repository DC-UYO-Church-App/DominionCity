import { FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../config/database';
import { UserRole } from '../types';

export type AuthenticatedRequest = FastifyRequest;

/**
 * Verifies the token, then refreshes the caller's role and active flag from
 * the database.
 *
 * The role used to be taken from the token payload and trusted for the token's
 * whole life. Because tokens are long-lived, demoting someone or deactivating
 * their account had no effect until the token expired — a dismissed admin kept
 * admin. Re-reading on each request means a revoked account stops working on
 * its very next call.
 */
export const authenticate = async (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  const result = await query(
    `SELECT role, is_active FROM users WHERE id = $1`,
    [request.user.id]
  );

  const row = result.rows[0];
  if (!row || row.is_active === false) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  // Authorisation decisions downstream read this, not the token claim.
  request.user.role = row.role as UserRole;
};

export const authorize = (...roles: UserRole[]) => {
  return async (request: AuthenticatedRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'Forbidden: Insufficient permissions' });
    }
  };
};
