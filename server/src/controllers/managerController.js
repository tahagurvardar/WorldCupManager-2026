import { z } from 'zod';
import { User } from '../models/User.js';
import { NationalTeam } from '../models/NationalTeam.js';
import { Player } from '../models/Player.js';
import { Match } from '../models/Match.js';
import { News } from '../models/News.js';
import { HttpError } from '../services/httpError.js';
import { asyncHandler } from '../services/asyncHandler.js';
import { evaluateSquad } from '../services/squadRules.js';
import { calculateGroupStandings } from '../services/standingsService.js';
import { simulateMatchById } from '../services/matchSimulationService.js';
import { buildRecommendedXi } from '../services/recommendedXiService.js';

export const selectTeamSchema = z.object({
  body: z.object({
    teamId: z.string(),
  }),
});

export const recommendedXiSchema = z.object({
  query: z.object({
    team: z.string().optional(),
    formation: z.enum(['4-3-3', '4-2-3-1', '4-4-2', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1']),
  }),
});

export const selectTeam = asyncHandler(async (req, res) => {
  const team = await NationalTeam.findById(req.validated.body.teamId);
  if (!team) throw new HttpError(404, 'Team not found');

  const user = await User.findByIdAndUpdate(req.user._id, { selectedTeam: team._id }, { new: true }).populate('selectedTeam');
  res.json({ success: true, user, team });
});

export const getDashboard = asyncHandler(async (req, res) => {
  if (!req.user.selectedTeam) {
    throw new HttpError(400, 'Manager has not selected a national team');
  }

  const teamId = req.user.selectedTeam._id || req.user.selectedTeam;
  const [team, players, upcomingMatch, lastMatch, groupMatches, groupTeams, news] = await Promise.all([
    NationalTeam.findById(teamId).populate('coach'),
    Player.find({ country: teamId }).populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode group').sort({ nationalTeamStatus: -1, overall: -1 }),
    Match.findOne({ status: 'scheduled', $or: [{ 'home.team': teamId }, { 'away.team': teamId }] }).sort({ kickoffAt: 1 }),
    Match.findOne({ status: 'completed', $or: [{ 'home.team': teamId }, { 'away.team': teamId }] }).sort({ updatedAt: -1 }),
    Match.find({ stage: 'group', group: req.user.selectedTeam.group }),
    NationalTeam.find({ group: req.user.selectedTeam.group }),
    News.find({ $or: [{ team: teamId }, { team: null }] }).sort({ publishedAt: -1 }).limit(5),
  ]);

  const finalSquad = players.filter((player) => player.nationalTeamStatus === 'final');
  const provisionalSquad = players.filter((player) => player.nationalTeamStatus !== 'candidate');
  const evaluation = evaluateSquad(finalSquad.length > 0 ? finalSquad : provisionalSquad);
  const groupTable = calculateGroupStandings(groupTeams, groupMatches);

  res.json({
    success: true,
    team,
    squad: {
      totalPlayers: players.length,
      finalCount: finalSquad.length,
      evaluation,
      topPlayers: players.slice(0, 8),
      injuries: players.filter((player) => player.injury.injuryStatus !== 'fit'),
    },
    fixtures: {
      upcomingMatch,
      lastMatch,
    },
    groupTable,
    news,
    pressure: Math.min(100, 35 + (100 - team.morale) * 0.35 + (team.worldRanking <= 20 ? 22 : 10)),
  });
});

export const simulateNextMatch = asyncHandler(async (req, res) => {
  if (!req.user.selectedTeam) {
    throw new HttpError(400, 'Manager has not selected a national team');
  }

  const teamId = req.user.selectedTeam._id || req.user.selectedTeam;
  const match = await Match.findOne({
    status: 'scheduled',
    $or: [{ 'home.team': teamId }, { 'away.team': teamId }],
  }).sort({ kickoffAt: 1 });

  if (!match) {
    throw new HttpError(404, 'No scheduled match found for selected team');
  }

  const simulatedMatch = await simulateMatchById(match._id);
  res.json({ success: true, match: simulatedMatch });
});

export const getRecommendedXi = asyncHandler(async (req, res) => {
  const requestedTeam = req.validated.query.team;
  const selectedTeam = req.user.selectedTeam?._id || req.user.selectedTeam;
  const teamId = requestedTeam || selectedTeam;

  if (!teamId) {
    throw new HttpError(400, 'Team selection is required');
  }

  if (selectedTeam && String(teamId) !== String(selectedTeam) && req.user.role !== 'admin') {
    throw new HttpError(403, 'Managers can only request recommendations for their selected team');
  }

  const players = await Player.find({ country: teamId })
    .populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode group')
    .sort({ nationalTeamStatus: -1, overall: -1 });

  if (players.length < 11) {
    throw new HttpError(422, 'Not enough players to build a recommended XI');
  }

  const recommendation = buildRecommendedXi({
    players,
    formation: req.validated.query.formation,
  });

  res.json({
    success: true,
    recommendation,
  });
});
