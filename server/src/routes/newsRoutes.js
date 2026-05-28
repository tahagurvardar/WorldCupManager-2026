import { Router } from 'express';
import { listNews } from '../controllers/newsController.js';

export const newsRoutes = Router();

newsRoutes.get('/', listNews);
