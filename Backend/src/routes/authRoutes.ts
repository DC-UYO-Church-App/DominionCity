import { FastifyInstance, FastifyRequest } from 'fastify';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

/**
 * Password reset is a far more attractive target than the rest of the API —
 * it sends mail to arbitrary addresses and guesses at tokens — so these routes
 * get a tighter budget than the global limit.
 */
const resetRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '15 minutes',
    },
  },
};

/**
 * Login gets its own budget, keyed on the account being attacked as well as
 * the source address.
 *
 * The global limiter is 100 requests per 15 minutes per IP shared across every
 * route, which left roughly 9,600 password guesses a day against a single
 * account from one address — and nothing at all stopped a spread of addresses
 * grinding one account. Keying on the identifier means the account is the unit
 * being protected, not just the caller.
 */
const loginRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: '15 minutes',
      // Rate limiting runs in onRequest by default, before the body is
      // parsed — request.body would be undefined and every login would share
      // one key per IP, locking out everyone behind a shared address.
      hook: 'preHandler' as const,
      keyGenerator: (request: FastifyRequest) => {
        const body = (request.body ?? {}) as Record<string, unknown>;
        const identifier = body.identifier ?? body.email ?? body.phoneNumber ?? '';
        return `login:${request.ip}:${String(identifier).trim().toLowerCase()}`;
      },
    },
  },
};

/** Registration is public and creates rows; keep it from being a bulk tool. */
const registerRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '15 minutes',
    },
  },
};

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', registerRateLimit, AuthController.register);
  fastify.post('/login', loginRateLimit, AuthController.login);

  // Password reset (public, deliberately rate limited)
  fastify.post('/forgot-password', resetRateLimit, AuthController.forgotPassword);
  fastify.post('/reset-password', resetRateLimit, AuthController.resetPassword);
  fastify.get('/reset-password/verify', resetRateLimit, AuthController.verifyResetToken);

  // Protected routes
  fastify.get('/profile', { onRequest: [authenticate] }, AuthController.getProfile);
  fastify.put('/profile', { onRequest: [authenticate] }, AuthController.updateProfile);
  fastify.post('/profile/image', { onRequest: [authenticate] }, AuthController.uploadProfileImage);
}
