import { z } from 'zod';
import { Player } from '../models/Player.js';
import { NationalTeam } from '../models/NationalTeam.js';
import { HttpError } from '../services/httpError.js';
import { asyncHandler } from '../services/asyncHandler.js';
import { evaluateSquad } from '../services/squadRules.js';

export const squadSchema = z.object({
  body: z.object({
    teamId: z.string(),
    playerIds: z.array(z.string()).min(1),
  }),
});

export const playerUpdateSchema = z.object({
  body: z.object({
    club: z.string().min(2).optional(),
    age: z.number().min(16).max(45).optional(),
    primaryPosition: z.string().optional(),
    overall: z.number().min(1).max(99).optional(),
    potential: z.number().min(1).max(99).optional(),
    nationalTeamStatus: z.enum(['candidate', 'provisional', 'final']).optional(),
  }),
  params: z.object({ id: z.string() }),
});

export const listPlayers = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.team) filter.country = req.query.team;
  if (req.query.status) filter.nationalTeamStatus = req.query.status;
  if (req.query.position) filter.primaryPosition = req.query.position;

  const players = await Player.find(filter)
    .populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode group')
    .sort({ overall: -1, fullName: 1 })
    .limit(Math.min(Number(req.query.limit || 500), 1500));

  res.json({ success: true, players });
});

export const getPlayer = asyncHandler(async (req, res) => {
  const player = await Player.findById(req.params.id).populate('country');
  if (!player) throw new HttpError(404, 'Player not found');
  res.json({ success: true, player });
});

export const updatePlayer = asyncHandler(async (req, res) => {
  const player = await Player.findByIdAndUpdate(req.validated.params.id, req.validated.body, {
    new: true,
    runValidators: true,
  });
  if (!player) throw new HttpError(404, 'Player not found');
  res.json({ success: true, player });
});

export const updateFinalSquad = asyncHandler(async (req, res) => {
  const { teamId, playerIds } = req.validated.body;
  const team = await NationalTeam.findById(teamId);
  if (!team) throw new HttpError(404, 'Team not found');

  const players = await Player.find({ _id: { $in: playerIds }, country: teamId });
  const evaluation = evaluateSquad(players);

  if (!evaluation.valid) {
    throw new HttpError(422, 'Final squad does not satisfy FIFA rules', evaluation);
  }

  await Player.updateMany({ country: teamId }, { nationalTeamStatus: 'candidate' });
  await Player.updateMany({ country: teamId, _id: { $in: playerIds } }, { nationalTeamStatus: 'final' });
  const finalSquad = await Player.find({ country: teamId, nationalTeamStatus: 'final' }).sort({ primaryPosition: 1, overall: -1 });

  res.json({
    success: true,
    team,
    squad: finalSquad,
    evaluation,
  });
});
