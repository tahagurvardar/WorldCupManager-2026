import { z } from 'zod';
import slugify from 'slugify';
import { NationalTeam } from '../models/NationalTeam.js';
import { Coach } from '../models/Coach.js';
import { Player } from '../models/Player.js';
import { HttpError } from '../services/httpError.js';
import { asyncHandler } from '../services/asyncHandler.js';

export const teamUpdateSchema = z.object({
  body: z.object({
    nameTR: z.string().min(2).optional(),
    nameEN: z.string().min(2).optional(),
    confederation: z.enum(['AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC', 'UEFA']).optional(),
    worldRanking: z.number().min(1).max(210).optional(),
    group: z.string().regex(/^[A-L]$/).optional(),
    morale: z.number().min(0).max(100).optional(),
    chemistry: z.number().min(0).max(100).optional(),
    fatigue: z.number().min(0).max(100).optional(),
    tournamentStatus: z.string().optional(),
  }),
  params: z.object({ id: z.string() }),
});

export const listTeams = asyncHandler(async (req, res) => {
  const teams = await NationalTeam.find()
    .populate('coach')
    .sort({ group: 1, worldRanking: 1, nameEN: 1 });

  res.json({ success: true, teams });
});

export const getTeam = asyncHandler(async (req, res) => {
  const team = await NationalTeam.findById(req.params.id).populate('coach');
  if (!team) throw new HttpError(404, 'Team not found');

  const players = await Player.find({ country: team._id }).sort({ nationalTeamStatus: -1, overall: -1 });

  res.json({
    success: true,
    team,
    players,
  });
});

export const updateTeam = asyncHandler(async (req, res) => {
  const patch = req.validated.body;
  if (patch.nameEN) patch.slug = slugify(patch.nameEN, { lower: true, strict: true, locale: 'tr' });

  const team = await NationalTeam.findByIdAndUpdate(req.validated.params.id, patch, { new: true, runValidators: true });
  if (!team) throw new HttpError(404, 'Team not found');

  res.json({ success: true, team });
});

export const listCoaches = asyncHandler(async (req, res) => {
  const coaches = await Coach.find().populate('team').sort({ fullName: 1 });
  res.json({ success: true, coaches });
});
