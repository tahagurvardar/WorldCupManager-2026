import { Router } from 'express';
import { getKnockoutBracket, getStandings, getStats, getTournamentCenter } from '../controllers/tournamentController.js';

export const tournamentRoutes = Router();

tournamentRoutes.get('/center', getTournamentCenter);
tournamentRoutes.get('/standings', getStandings);
tournamentRoutes.get('/bracket', getKnockoutBracket);
tournamentRoutes.get('/stats', getStats);
