import { NationalTeam } from '../models/NationalTeam.js';
import { Match } from '../models/Match.js';
import { Player } from '../models/Player.js';
import { News } from '../models/News.js';
import { asyncHandler } from '../services/asyncHandler.js';
import { buildKnockoutBracket } from '../services/bracketService.js';
import { calculateGroupStandings } from '../services/standingsService.js';

async function buildGroupTables() {
  const [teams, matches] = await Promise.all([
    NationalTeam.find().sort({ group: 1, worldRanking: 1 }),
    Match.find({ stage: 'group' }).sort({ matchNumber: 1 }),
  ]);

  return [...new Set(teams.map((team) => team.group))].sort().map((group) => ({
    group,
    table: calculateGroupStandings(
      teams.filter((team) => team.group === group),
      matches.filter((match) => match.group === group),
    ),
  }));
}

export const getStandings = asyncHandler(async (req, res) => {
  const groups = await buildGroupTables();
  res.json({ success: true, groups });
});

export const getTournamentCenter = asyncHandler(async (req, res) => {
  const [groups, upcomingMatches, completedMatches, topScorers, topAssists, news, injuredPlayers] = await Promise.all([
    buildGroupTables(),
    Match.find({ status: 'scheduled' }).sort({ kickoffAt: 1 }).limit(8),
    Match.find({ status: 'completed' }).sort({ updatedAt: -1 }).limit(8),
    Player.find().populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode').sort({ 'tournamentStats.goals': -1, 'tournamentStats.assists': -1, overall: -1 }).limit(10),
    Player.find().populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode').sort({ 'tournamentStats.assists': -1, 'tournamentStats.goals': -1, overall: -1 }).limit(10),
    News.find().populate('team', 'nameTR nameEN fifaCode flagEmoji flagCode').sort({ publishedAt: -1 }).limit(8),
    Player.find({ 'injury.injuryStatus': { $ne: 'fit' } }).populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode').sort({ 'injury.injuryDays': -1 }).limit(12),
  ]);

  res.json({
    success: true,
    groups,
    upcomingMatches,
    completedMatches,
    leaders: {
      goals: topScorers,
      assists: topAssists,
    },
    news,
    injuredPlayers,
  });
});

export const getKnockoutBracket = asyncHandler(async (req, res) => {
  const groupTables = await buildGroupTables();
  const bracket = await buildKnockoutBracket(groupTables, { ensure: true });

  res.json({
    success: true,
    ...bracket,
  });
});

export const getStats = asyncHandler(async (req, res) => {
  const [teams, players, goals, assists, ratings] = await Promise.all([
    NationalTeam.find().sort({ group: 1, worldRanking: 1 }),
    Player.find().populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode group').sort({ 'country.group': 1, overall: -1 }).limit(1500),
    Player.find().populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode').sort({ 'tournamentStats.goals': -1, overall: -1 }).limit(25),
    Player.find().populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode').sort({ 'tournamentStats.assists': -1, overall: -1 }).limit(25),
    Player.find({ 'tournamentStats.appearances': { $gt: 0 } }).populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode').sort({ 'tournamentStats.avgRating': -1 }).limit(25),
  ]);

  res.json({ success: true, teams, players, goals, assists, ratings });
});
