import { Router } from 'express';
import { getTeam, listCoaches, listTeams, teamUpdateSchema, updateTeam } from '../controllers/teamController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const teamRoutes = Router();

teamRoutes.get('/', listTeams);
teamRoutes.get('/coaches', listCoaches);
teamRoutes.get('/:id', getTeam);
teamRoutes.patch('/:id', requireAuth, requireAdmin, validate(teamUpdateSchema), updateTeam);
