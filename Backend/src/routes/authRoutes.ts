import { FastifyInstance } from 'fastify';
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

export async function authRoutes(fastify: FastifyInstance) {
  // Public routes
  fastify.post('/register', AuthController.register);
  fastify.post('/login', AuthController.login);

  // Password reset (public, deliberately rate limited)
  fastify.post('/forgot-password', resetRateLimit, AuthController.forgotPassword);
  fastify.post('/reset-password', resetRateLimit, AuthController.resetPassword);
  fastify.get('/reset-password/verify', resetRateLimit, AuthController.verifyResetToken);

  // Protected routes
  fastify.get('/profile', { onRequest: [authenticate] }, AuthController.getProfile);
  fastify.put('/profile', { onRequest: [authenticate] }, AuthController.updateProfile);
  fastify.post('/profile/image', { onRequest: [authenticate] }, AuthController.uploadProfileImage);
}
