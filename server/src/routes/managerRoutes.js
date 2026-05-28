import { Router } from 'express';
import { getDashboard, selectTeam, selectTeamSchema } from '../controllers/managerController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const managerRoutes = Router();

managerRoutes.get('/dashboard', requireAuth, getDashboard);
managerRoutes.post('/select-team', requireAuth, validate(selectTeamSchema), selectTeam);
