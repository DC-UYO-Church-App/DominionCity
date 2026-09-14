import { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/adminController';
import { TeamController } from '../controllers/teamController';
import { CellGroupController } from '../controllers/cellGroupController';
import { CellGroupService } from '../services/cellGroupService';
import { DepartmentService } from '../services/departmentService';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../types';

export async function adminRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/stats',
    {
      onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)],
    },
    AdminController.getDashboardStats
  );

  // Full user registry for the admin Members page (active and deactivated).
  fastify.get(
    '/members',
    {
      onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)],
    },
    AdminController.listMembers
  );

  fastify.get(
    '/members/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    AdminController.getMemberProfile
  );

  fastify.patch(
    '/members/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    AdminController.updateMember
  );

  // Batched email sends to the active / non-active member audiences.
  fastify.get(
    '/email-campaigns/audience',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    AdminController.getEmailAudience
  );

  fastify.get(
    '/email-campaigns',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    AdminController.listEmailCampaigns
  );

  fastify.post(
    '/email-campaigns',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    AdminController.createEmailCampaign
  );

  fastify.get(
    '/email-campaigns/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    AdminController.getEmailCampaign
  );

  fastify.post(
    '/bookshop-managers',
    {
      onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)],
    },
    AdminController.createBookshopManager
  );

  fastify.get(
    '/bookshop-managers',
    {
      onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)],
    },
    AdminController.listBookshopManagers
  );

  fastify.delete(
    '/bookshop-managers/:id',
    {
      onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)],
    },
    AdminController.deleteBookshopManager
  );

  // Team management
  fastify.get(
    '/team',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    TeamController.listTeamMembers
  );

  fastify.post(
    '/team',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    TeamController.addTeamMember
  );

  fastify.put(
    '/team/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    TeamController.updateTeamMember
  );

  fastify.delete(
    '/team/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    TeamController.removeTeamMember
  );

  // User search (for add-member modal)
  fastify.get(
    '/users',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    TeamController.listAllUsers
  );

  // Cell group management (admin view with enriched data)
  fastify.get(
    '/cell-groups',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    async (_req, reply) => {
      try {
        const cellGroups = await CellGroupService.getCellGroupsWithDetails();
        reply.send({ cellGroups });
      } catch (error) {
        console.error('Admin get cell groups error:', error);
        reply.status(500).send({ error: 'Failed to get cell groups' });
      }
    }
  );

  fastify.post(
    '/cell-groups',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    CellGroupController.createCellGroup
  );

  fastify.put(
    '/cell-groups/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    CellGroupController.updateCellGroup
  );

  fastify.delete(
    '/cell-groups/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    CellGroupController.deleteCellGroup
  );

  // Department management
  fastify.get(
    '/departments',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    async (_req, reply) => {
      try {
        const departments = await DepartmentService.getDepartmentsWithDetails();
        reply.send({ departments });
      } catch (error) {
        console.error('Admin get departments error:', error);
        reply.status(500).send({ error: 'Failed to get departments' });
      }
    }
  );

  fastify.post(
    '/departments',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    async (req, reply) => {
      try {
        const body = req.body as { name: string; hodId?: string; assistantId?: string };
        if (!body.name?.trim()) {
          return reply.status(400).send({ error: 'Department name is required' });
        }
        const department = await DepartmentService.createDepartment({
          name: body.name.trim(),
          hodId: body.hodId,
          assistantId: body.assistantId,
        });
        reply.status(201).send({ department });
      } catch (error: any) {
        console.error('Admin create department error:', error);
        if (error.code === '23505') {
          return reply.status(409).send({ error: 'A department with this name already exists' });
        }
        reply.status(500).send({ error: 'Failed to create department' });
      }
    }
  );

  fastify.put(
    '/departments/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    async (req, reply) => {
      try {
        const { id } = req.params as { id: string };
        const body = req.body as { name?: string; hodId?: string; assistantId?: string };
        const department = await DepartmentService.updateDepartment(id, {
          name: body.name?.trim(),
          hodId: body.hodId,
          assistantId: body.assistantId,
        });
        if (!department) {
          return reply.status(404).send({ error: 'Department not found' });
        }
        reply.send({ department });
      } catch (error: any) {
        console.error('Admin update department error:', error);
        if (error.code === '23505') {
          return reply.status(409).send({ error: 'A department with this name already exists' });
        }
        reply.status(500).send({ error: 'Failed to update department' });
      }
    }
  );

  fastify.delete(
    '/departments/:id',
    { onRequest: [authenticate, authorize(UserRole.SUPER_ADMIN)] },
    async (req, reply) => {
      try {
        const { id } = req.params as { id: string };
        const deleted = await DepartmentService.deleteDepartment(id);
        if (!deleted) {
          return reply.status(404).send({ error: 'Department not found' });
        }
        reply.send({ success: true });
      } catch (error) {
        console.error('Admin delete department error:', error);
        reply.status(500).send({ error: 'Failed to delete department' });
      }
    }
  );
}
