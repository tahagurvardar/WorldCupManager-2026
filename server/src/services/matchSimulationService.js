import { Match } from '../models/Match.js';
import { Player } from '../models/Player.js';
import { NationalTeam } from '../models/NationalTeam.js';
import { Tactic } from '../models/Tactic.js';
import { HttpError } from './httpError.js';
import { simulateMatchEngine } from './matchEngine.js';
import { buildResultNews } from './newsService.js';

async function playersForTeam(teamId) {
  const final = await Player.find({ country: teamId, nationalTeamStatus: 'final' }).sort({ overall: -1 });
  if (final.length >= 11) return final;
  return Player.find({ country: teamId }).sort({ nationalTeamStatus: -1, overall: -1 }).limit(26);
}

async function latestTactic(teamId) {
  return Tactic.findOne({ team: teamId }).sort({ updatedAt: -1 });
}

async function applyPlayerStats(match, matchResult) {
  const appearanceIds = matchResult.playerRatings.map((rating) => rating.player).filter(Boolean);
  const goalEvents = matchResult.events.filter((event) => event.type === 'goal' && event.player);
  const assistEvents = matchResult.events.filter((event) => event.type === 'assist' && event.relatedPlayer);
  const yellowEvents = matchResult.events.filter((event) => event.type === 'yellow_card' && event.player);
  const redEvents = matchResult.events.filter((event) => event.type === 'red_card' && event.player);
  const currentPlayers = await Player.find({ _id: { $in: appearanceIds } }).select('tournamentStats');
  const currentById = new Map(currentPlayers.map((player) => [String(player._id), player]));

  const operations = [];

  appearanceIds.forEach((id) => {
    const rating = matchResult.playerRatings.find((item) => String(item.player) === String(id));
    const current = currentById.get(String(id));
    const appearances = current?.tournamentStats?.appearances || 0;
    const currentAverage = current?.tournamentStats?.avgRating || 6.5;
    const nextAverage = ((currentAverage * appearances) + rating.rating) / (appearances + 1);

    operations.push({
      updateOne: {
        filter: { _id: id },
        update: {
          $inc: { 'tournamentStats.appearances': 1 },
          $set: { 'tournamentStats.avgRating': Number(nextAverage.toFixed(2)) },
        },
      },
    });
  });

  goalEvents.forEach((event) => operations.push({ updateOne: { filter: { _id: event.player }, update: { $inc: { 'tournamentStats.goals': 1 } } } }));
  assistEvents.forEach((event) => operations.push({ updateOne: { filter: { _id: event.relatedPlayer }, update: { $inc: { 'tournamentStats.assists': 1 } } } }));
  yellowEvents.forEach((event) => operations.push({ updateOne: { filter: { _id: event.player }, update: { $inc: { 'tournamentStats.yellowCards': 1 } } } }));
  redEvents.forEach((event) => operations.push({ updateOne: { filter: { _id: event.player }, update: { $inc: { 'tournamentStats.redCards': 1 } } } }));

  const cleanSheetTeamCodes = [];
  if (matchResult.score.away === 0) cleanSheetTeamCodes.push(match.home.fifaCode);
  if (matchResult.score.home === 0) cleanSheetTeamCodes.push(match.away.fifaCode);

  matchResult.playerRatings
    .filter((rating) => rating.position === 'GK' && cleanSheetTeamCodes.includes(rating.teamCode))
    .forEach((rating) => {
      operations.push({
        updateOne: {
          filter: { _id: rating.player },
          update: { $inc: { 'tournamentStats.cleanSheets': 1 } },
        },
      });
    });

  if (operations.length > 0) {
    await Player.bulkWrite(operations);
  }
}

async function updateTeamDynamics(match, result) {
  const homeWon = String(result.winner) === String(match.home.team._id || match.home.team);
  const awayWon = String(result.winner) === String(match.away.team._id || match.away.team);

  await Promise.all([
    NationalTeam.findByIdAndUpdate(match.home.team._id || match.home.team, {
      $inc: {
        morale: homeWon ? 4 : awayWon ? -3 : 1,
        chemistry: homeWon ? 2 : 0,
        fatigue: 7,
      },
    }),
    NationalTeam.findByIdAndUpdate(match.away.team._id || match.away.team, {
      $inc: {
        morale: awayWon ? 4 : homeWon ? -3 : 1,
        chemistry: awayWon ? 2 : 0,
        fatigue: 7,
      },
    }),
  ]);
}

export async function simulateMatchById(matchId) {
  const match = await Match.findById(matchId).populate('home.team').populate('away.team');
  if (!match) throw new HttpError(404, 'Match not found');
  if (match.status === 'completed') return match;

  const [homePlayers, awayPlayers, homeTactic, awayTactic] = await Promise.all([
    playersForTeam(match.home.team._id),
    playersForTeam(match.away.team._id),
    latestTactic(match.home.team._id),
    latestTactic(match.away.team._id),
  ]);

  if (homePlayers.length < 11 || awayPlayers.length < 11) {
    throw new HttpError(422, 'Both teams need at least 11 available players to simulate');
  }

  const result = simulateMatchEngine({
    match,
    homePlayers,
    awayPlayers,
    homeTactic: homeTactic || {},
    awayTactic: awayTactic || {},
  });

  match.status = 'completed';
  match.score = result.score;
  match.penalties = result.penalties;
  match.winner = result.winner;
  match.stats = result.stats;
  match.events = result.events;
  match.momentum = result.momentum;
  match.playerRatings = result.playerRatings;
  match.tacticalContext = {
    home: homeTactic?.toObject?.() || {},
    away: awayTactic?.toObject?.() || {},
  };

  await match.save();
  await applyPlayerStats(match, result);
  await updateTeamDynamics(match, result);

  if (result.winner) {
    await buildResultNews(match);
  }

  return Match.findById(match._id).populate('home.team').populate('away.team').populate('winner');
}
