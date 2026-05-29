import { Router } from 'express';
import { answerPressConference, getDashboard, getOpponentAnalysis, getPressConference, getRecommendedXi, getTournamentJourney, pressConferenceAnswerSchema, recommendedXiSchema, selectTeam, selectTeamSchema, simulateNextMatch } from '../controllers/managerController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const managerRoutes = Router();

managerRoutes.get('/dashboard', requireAuth, getDashboard);
managerRoutes.get('/tournament-journey', requireAuth, getTournamentJourney);
managerRoutes.get('/opponent-analysis', requireAuth, getOpponentAnalysis);
managerRoutes.get('/press-conference', requireAuth, getPressConference);
managerRoutes.post('/press-conference/answer', requireAuth, validate(pressConferenceAnswerSchema), answerPressConference);
managerRoutes.get('/recommended-xi', requireAuth, validate(recommendedXiSchema), getRecommendedXi);
managerRoutes.post('/select-team', requireAuth, validate(selectTeamSchema), selectTeam);
managerRoutes.post('/simulate-next-match', requireAuth, simulateNextMatch);
