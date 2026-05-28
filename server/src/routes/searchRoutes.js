import { Router } from 'express';
import { globalSearch } from '../controllers/searchController.js';

export const searchRoutes = Router();

searchRoutes.get('/', globalSearch);
