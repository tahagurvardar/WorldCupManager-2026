import { Router } from 'express';
import { dataQuality, reseed, simulateAllGroupStage, simulateGroup, simulateOne } from '../controllers/adminController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);
adminRoutes.post('/seed', reseed);
adminRoutes.get('/data-quality', dataQuality);
adminRoutes.post('/matches/:id/simulate', simulateOne);
adminRoutes.post('/groups/:group/simulate', simulateGroup);
adminRoutes.post('/simulate/group-stage', simulateAllGroupStage);
