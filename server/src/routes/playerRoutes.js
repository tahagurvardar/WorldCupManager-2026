import { Router } from 'express';
import { getPlayer, listPlayers, playerUpdateSchema, squadSchema, updateFinalSquad, updatePlayer } from '../controllers/playerController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const playerRoutes = Router();

playerRoutes.get('/', listPlayers);
playerRoutes.get('/:id', getPlayer);
playerRoutes.patch('/:id', requireAuth, requireAdmin, validate(playerUpdateSchema), updatePlayer);
playerRoutes.put('/squad/final', requireAuth, validate(squadSchema), updateFinalSquad);
