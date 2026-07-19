import { FastifyInstance } from 'fastify';
import { SatelliteChurchController } from '../controllers/satelliteChurchController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

export async function satelliteChurchRoutes(fastify: FastifyInstance) {
  // Member: satellite churches assigned to me ("Visit my Satellite Dashboard")
  fastify.get('/mine', { onRequest: [authenticate] }, SatelliteChurchController.getMySatelliteChurches);

  // Super-admin management
  fastify.get(
    '/',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    SatelliteChurchController.getAllSatelliteChurches
  );

  fastify.get(
    '/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    SatelliteChurchController.getSatelliteChurchById
  );

  fastify.post(
    '/',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    SatelliteChurchController.createSatelliteChurch
  );

  fastify.put(
    '/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    SatelliteChurchController.updateSatelliteChurch
  );

  fastify.delete(
    '/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    SatelliteChurchController.deleteSatelliteChurch
  );
}
