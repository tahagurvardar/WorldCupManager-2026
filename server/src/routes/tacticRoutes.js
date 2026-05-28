import { Router } from 'express';
import { getTactic, saveTactic, tacticSchema } from '../controllers/tacticController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const tacticRoutes = Router();

tacticRoutes.get('/', requireAuth, getTactic);
tacticRoutes.put('/', requireAuth, validate(tacticSchema), saveTactic);
