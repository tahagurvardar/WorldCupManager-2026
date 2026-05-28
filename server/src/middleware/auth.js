import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/env.js';
import { HttpError } from '../services/httpError.js';
import { asyncHandler } from '../services/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new HttpError(401, 'Authentication token is required');
  }

  const payload = jwt.verify(token, config.jwtSecret);
  const user = await User.findById(payload.sub).populate('selectedTeam');

  if (!user) {
    throw new HttpError(401, 'Authenticated user no longer exists');
  }

  req.user = user;
  next();
});

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(new HttpError(403, 'Admin permission is required'));
  }

  return next();
}
