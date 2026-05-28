import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { HttpError } from '../services/httpError.js';
import { asyncHandler } from '../services/asyncHandler.js';
import { config } from '../config/env.js';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    preferredLanguage: z.enum(['tr', 'en']).default('tr'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    selectedTeam: user.selectedTeam,
    preferredLanguage: user.preferredLanguage,
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, preferredLanguage } = req.validated.body;
  const existing = await User.findOne({ email });

  if (existing) {
    throw new HttpError(409, 'Email is already registered');
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name, email, passwordHash, preferredLanguage });

  res.status(201).json({
    success: true,
    token: signToken(user),
    user: serializeUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email }).populate('selectedTeam');

  if (!user || !(await user.comparePassword(password))) {
    throw new HttpError(401, 'Invalid email or password');
  }

  res.json({
    success: true,
    token: signToken(user),
    user: serializeUser(user),
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: serializeUser(req.user),
  });
});
