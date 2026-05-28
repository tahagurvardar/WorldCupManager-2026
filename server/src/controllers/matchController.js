import { Match } from '../models/Match.js';
import { HttpError } from '../services/httpError.js';
import { asyncHandler } from '../services/asyncHandler.js';
import { simulateMatchById } from '../services/matchSimulationService.js';

export const listMatches = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.group) filter.group = req.query.group;
  if (req.query.status) filter.status = req.query.status;

  const matches = await Match.find(filter)
    .populate('home.team', 'nameTR nameEN fifaCode flagEmoji flagCode worldRanking')
    .populate('away.team', 'nameTR nameEN fifaCode flagEmoji flagCode worldRanking')
    .sort({ kickoffAt: 1, matchNumber: 1 });

  res.json({ success: true, matches });
});

export const getMatch = asyncHandler(async (req, res) => {
  const match = await Match.findById(req.params.id)
    .populate('home.team')
    .populate('away.team')
    .populate('winner');

  if (!match) throw new HttpError(404, 'Match not found');
  res.json({ success: true, match });
});

export const simulateMatch = asyncHandler(async (req, res) => {
  const match = await simulateMatchById(req.params.id);
  res.json({ success: true, match });
});
