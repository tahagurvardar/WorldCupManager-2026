import { Router } from 'express';
import { listNotifications, markRead } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);
notificationRoutes.get('/', listNotifications);
notificationRoutes.patch('/:id/read', markRead);
