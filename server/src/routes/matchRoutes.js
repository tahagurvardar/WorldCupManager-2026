import { Router } from 'express';
import { getMatch, listMatches, simulateMatch } from '../controllers/matchController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

export const matchRoutes = Router();

matchRoutes.get('/', listMatches);
matchRoutes.get('/:id', getMatch);
matchRoutes.post('/:id/simulate', requireAuth, requireAdmin, simulateMatch);
