import { FastifyInstance } from 'fastify';
import { ProjectController } from '../controllers/projectController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

export async function projectRoutes(fastify: FastifyInstance) {
  // Public / member-visible reads
  fastify.get('/', ProjectController.getAllProjects);
  fastify.get('/:id', ProjectController.getProjectById);

  // Any authenticated member can give toward a project ("I've paid")
  fastify.post('/:id/give', { onRequest: [authenticate] }, ProjectController.giveToProject);

  // Admin management
  fastify.post(
    '/',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    ProjectController.createProject
  );

  fastify.put(
    '/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    ProjectController.updateProject
  );

  fastify.delete(
    '/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN, UserRole.ADMIN)] },
    ProjectController.deleteProject
  );
}
