import { Match } from '../models/Match.js';
import { NationalTeam } from '../models/NationalTeam.js';
import { Player } from '../models/Player.js';
import { News } from '../models/News.js';
import { asyncHandler } from '../services/asyncHandler.js';
import { seedDatabase } from '../seeds/seedAll2026.js';
import { simulateMatchById } from '../services/matchSimulationService.js';

export const reseed = asyncHandler(async (req, res) => {
  const summary = await seedDatabase({ force: true });
  res.json({ success: true, summary });
});

export const simulateOne = asyncHandler(async (req, res) => {
  const match = await simulateMatchById(req.params.id);
  res.json({ success: true, match });
});

export const simulateGroup = asyncHandler(async (req, res) => {
  const group = req.params.group?.toUpperCase();
  const matches = await Match.find({ group, status: { $ne: 'completed' } }).sort({ matchNumber: 1 });
  const simulated = [];

  for (const match of matches) {
    simulated.push(await simulateMatchById(match._id));
  }

  res.json({ success: true, simulatedCount: simulated.length, matches: simulated });
});

export const simulateAllGroupStage = asyncHandler(async (req, res) => {
  const matches = await Match.find({ stage: 'group', status: { $ne: 'completed' } }).sort({ matchNumber: 1 });
  const simulated = [];

  for (const match of matches) {
    simulated.push(await simulateMatchById(match._id));
  }

  res.json({ success: true, simulatedCount: simulated.length });
});

export const dataQuality = asyncHandler(async (req, res) => {
  const [teams, players, matches, news] = await Promise.all([
    NationalTeam.find(),
    Player.find(),
    Match.find(),
    News.find(),
  ]);

  const missing = {
    teamsWithoutCoach: teams.filter((team) => !team.coach).length,
    teamsWithoutOfficialMetadata: teams.filter((team) => team.sourceMetadata.verificationStatus !== 'official').length,
    playersWithoutClub: players.filter((player) => !player.club).length,
    teamsUnderMinCandidates: teams.filter((team) => players.filter((player) => String(player.country) === String(team._id)).length < 26).length,
    unsimulatedGroupMatches: matches.filter((match) => match.stage === 'group' && match.status !== 'completed').length,
    newsItems: news.length,
  };

  res.json({
    success: true,
    totals: {
      teams: teams.length,
      players: players.length,
      matches: matches.length,
      news: news.length,
    },
    missing,
  });
});
