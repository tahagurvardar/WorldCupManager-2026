import { z } from 'zod';
import { Tactic } from '../models/Tactic.js';
import { HttpError } from '../services/httpError.js';
import { asyncHandler } from '../services/asyncHandler.js';

export const tacticSchema = z.object({
  body: z.object({
    teamId: z.string(),
    formation: z.enum(['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1']),
    lineup: z.array(z.object({
      player: z.string(),
      slot: z.string(),
      x: z.number(),
      y: z.number(),
    })).max(11),
    sliders: z.object({
      pressing: z.number().min(0).max(100),
      tempo: z.number().min(0).max(100),
      width: z.number().min(0).max(100),
      defensiveLine: z.number().min(0).max(100),
      creativity: z.number().min(0).max(100),
      compactness: z.number().min(0).max(100),
      counterAttack: z.number().min(0).max(100),
    }),
  }),
});

export const getTactic = asyncHandler(async (req, res) => {
  const team = req.query.team || req.user.selectedTeam?._id;
  if (!team) throw new HttpError(400, 'Team selection is required');

  const tactic = await Tactic.findOne({ user: req.user._id, team }).populate('lineup.player');
  res.json({ success: true, tactic });
});

export const saveTactic = asyncHandler(async (req, res) => {
  const { teamId, formation, lineup, sliders } = req.validated.body;

  const tactic = await Tactic.findOneAndUpdate(
    { user: req.user._id, team: teamId },
    { formation, lineup, sliders },
    { upsert: true, new: true, runValidators: true },
  ).populate('lineup.player');

  res.json({ success: true, tactic });
});
