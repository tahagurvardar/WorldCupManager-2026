import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { teamRoutes } from './teamRoutes.js';
import { playerRoutes } from './playerRoutes.js';
import { tacticRoutes } from './tacticRoutes.js';
import { matchRoutes } from './matchRoutes.js';
import { tournamentRoutes } from './tournamentRoutes.js';
import { managerRoutes } from './managerRoutes.js';
import { adminRoutes } from './adminRoutes.js';
import { searchRoutes } from './searchRoutes.js';
import { newsRoutes } from './newsRoutes.js';
import { notificationRoutes } from './notificationRoutes.js';

export const apiRoutes = Router();

apiRoutes.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'WorldCupManager 2026 API',
    timestamp: new Date().toISOString(),
  });
});

apiRoutes.use('/auth', authRoutes);
apiRoutes.use('/teams', teamRoutes);
apiRoutes.use('/players', playerRoutes);
apiRoutes.use('/tactics', tacticRoutes);
apiRoutes.use('/matches', matchRoutes);
apiRoutes.use('/tournament', tournamentRoutes);
apiRoutes.use('/manager', managerRoutes);
apiRoutes.use('/admin', adminRoutes);
apiRoutes.use('/search', searchRoutes);
apiRoutes.use('/news', newsRoutes);
apiRoutes.use('/notifications', notificationRoutes);
