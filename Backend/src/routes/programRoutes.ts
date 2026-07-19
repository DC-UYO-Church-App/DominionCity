import { FastifyInstance } from 'fastify';
import { ProgramController } from '../controllers/programController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

export async function programRoutes(fastify: FastifyInstance) {
  // Public / member-visible reads (supports ?scope=national|state)
  fastify.get('/', ProgramController.getAllPrograms);
  fastify.get('/:id', ProgramController.getProgramById);

  // Any authenticated member can support a program
  fastify.post('/:id/give', { onRequest: [authenticate] }, ProgramController.giveToProgram);

  // Admin management
  fastify.post(
    '/',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    ProgramController.createProgram
  );

  fastify.put(
    '/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    ProgramController.updateProgram
  );

  fastify.delete(
    '/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    ProgramController.deleteProgram
  );
}
