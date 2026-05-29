import { z } from 'zod';
import { User } from '../models/User.js';
import { NationalTeam } from '../models/NationalTeam.js';
import { Player } from '../models/Player.js';
import { Match } from '../models/Match.js';
import { News } from '../models/News.js';
import { PressConference } from '../models/PressConference.js';
import { HttpError } from '../services/httpError.js';
import { asyncHandler } from '../services/asyncHandler.js';
import { evaluateSquad } from '../services/squadRules.js';
import { calculateGroupStandings } from '../services/standingsService.js';
import { simulateMatchById } from '../services/matchSimulationService.js';
import { buildRecommendedXi } from '../services/recommendedXiService.js';
import { buildOpponentAnalysis } from '../services/opponentAnalysisService.js';
import { addEffects, applyAnswerEffects, buildPressConferenceQuestions, derivePressMetrics } from '../services/pressConferenceService.js';
import { buildTournamentJourney } from '../services/tournamentJourneyService.js';

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

export const pressConferenceAnswerSchema = z.object({
  body: z.object({
    conferenceId: z.string(),
    questionId: z.string(),
    stance: z.enum(['confident', 'balanced', 'defensive']),
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

export const getTournamentJourney = asyncHandler(async (req, res) => {
  if (!req.user.selectedTeam) {
    throw new HttpError(400, 'Manager has not selected a national team');
  }

  const journey = await buildTournamentJourney(req.user);
  if (!journey) {
    throw new HttpError(404, 'Selected team was not found');
  }

  res.json({
    success: true,
    journey,
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

export const getOpponentAnalysis = asyncHandler(async (req, res) => {
  if (!req.user.selectedTeam) {
    throw new HttpError(400, 'Manager has not selected a national team');
  }

  const teamId = req.user.selectedTeam._id || req.user.selectedTeam;
  const nextMatch = await Match.findOne({
    status: 'scheduled',
    $or: [{ 'home.team': teamId }, { 'away.team': teamId }],
  }).sort({ kickoffAt: 1 });

  if (!nextMatch) {
    return res.json({ success: true, analysis: null });
  }

  const homeId = String(nextMatch.home.team);
  const selectedTeamId = String(teamId);
  const opponentTeamId = homeId === selectedTeamId ? nextMatch.away.team : nextMatch.home.team;

  const [ourTeam, opponentTeam, ourPlayers, opponentPlayers, recentMatches] = await Promise.all([
    NationalTeam.findById(teamId).populate('coach'),
    NationalTeam.findById(opponentTeamId).populate('coach'),
    Player.find({ country: teamId }).populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode group'),
    Player.find({ country: opponentTeamId }).populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode group'),
    Match.find({
      status: 'completed',
      $or: [
        { 'home.team': { $in: [teamId, opponentTeamId] } },
        { 'away.team': { $in: [teamId, opponentTeamId] } },
      ],
    }).sort({ kickoffAt: -1 }).limit(12),
  ]);

  if (!ourTeam || !opponentTeam) {
    throw new HttpError(404, 'Team data for opponent analysis was not found');
  }

  const analysis = buildOpponentAnalysis({
    match: nextMatch,
    ourTeam,
    opponentTeam,
    ourPlayers,
    opponentPlayers,
    recentMatches,
  });

  return res.json({
    success: true,
    analysis,
  });
});

function getOpponentTeamId(match, teamId) {
  return String(match.home.team) === String(teamId) ? match.away.team : match.home.team;
}

function mediaReactionNews({ team, opponent, stance }) {
  const stanceLabel = {
    confident: { tr: 'iddialı', en: 'confident' },
    balanced: { tr: 'dengeli', en: 'balanced' },
    defensive: { tr: 'temkinli', en: 'cautious' },
  }[stance];

  return {
    title: {
      tr: `${team.nameTR} cephesinden ${stanceLabel.tr} mesaj`,
      en: `${team.nameEN} send a ${stanceLabel.en} message`,
    },
    body: {
      tr: `${opponent.nameTR} maçı öncesi basın toplantısındaki cevap, takımın maç önü havasını doğrudan etkiledi.`,
      en: `The press conference answer before the ${opponent.nameEN} match directly shaped the team’s pre-match mood.`,
    },
  };
}

export const getPressConference = asyncHandler(async (req, res) => {
  if (!req.user.selectedTeam) {
    throw new HttpError(400, 'Manager has not selected a national team');
  }

  const teamId = req.user.selectedTeam._id || req.user.selectedTeam;
  const nextMatch = await Match.findOne({
    status: 'scheduled',
    $or: [{ 'home.team': teamId }, { 'away.team': teamId }],
  }).sort({ kickoffAt: 1 });

  if (!nextMatch) {
    return res.json({ success: true, conference: null });
  }

  const opponentTeamId = getOpponentTeamId(nextMatch, teamId);
  const existing = await PressConference.findOne({
    user: req.user._id,
    team: teamId,
    match: nextMatch._id,
  });

  const [ourTeam, opponentTeam, ourPlayers, opponentPlayers, recentMatches, groupTeams, groupMatches] = await Promise.all([
    NationalTeam.findById(teamId).populate('coach'),
    NationalTeam.findById(opponentTeamId).populate('coach'),
    Player.find({ country: teamId }).populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode group'),
    Player.find({ country: opponentTeamId }).populate('country', 'nameTR nameEN fifaCode flagEmoji flagCode group'),
    Match.find({
      status: 'completed',
      $or: [
        { 'home.team': { $in: [teamId, opponentTeamId] } },
        { 'away.team': { $in: [teamId, opponentTeamId] } },
      ],
    }).sort({ kickoffAt: -1 }).limit(12),
    NationalTeam.find({ group: req.user.selectedTeam.group }),
    Match.find({ stage: 'group', group: req.user.selectedTeam.group }),
  ]);

  if (!ourTeam || !opponentTeam) {
    throw new HttpError(404, 'Team data for press conference was not found');
  }

  const groupTable = calculateGroupStandings(groupTeams, groupMatches);

  if (existing) {
    return res.json({
      success: true,
      conference: existing,
      match: nextMatch,
      ourTeam,
      opponent: opponentTeam,
      groupTable,
      metrics: derivePressMetrics(ourTeam, existing.impactTotals?.mediaPressure || 0, existing.impactTotals || {}),
    });
  }

  const opponentAnalysis = buildOpponentAnalysis({
    match: nextMatch,
    ourTeam,
    opponentTeam,
    ourPlayers,
    opponentPlayers,
    recentMatches,
  });
  const generated = buildPressConferenceQuestions({
    team: ourTeam,
    opponent: opponentTeam,
    groupTable,
    recentMatches,
    opponentThreatLevel: opponentAnalysis.threatLevel,
  });

  const conference = await PressConference.create({
    user: req.user._id,
    team: teamId,
    opponent: opponentTeamId,
    match: nextMatch._id,
    questions: generated.questions,
    generatedContext: generated.generatedContext,
  });

  return res.json({
    success: true,
    conference,
    match: nextMatch,
    ourTeam,
    opponent: opponentTeam,
    groupTable,
    metrics: derivePressMetrics(ourTeam),
  });
});

export const answerPressConference = asyncHandler(async (req, res) => {
  const { conferenceId, questionId, stance } = req.validated.body;
  const conference = await PressConference.findOne({ _id: conferenceId, user: req.user._id });

  if (!conference) {
    throw new HttpError(404, 'Press conference not found');
  }

  const question = conference.questions.find((item) => item.questionId === questionId);
  if (!question) {
    throw new HttpError(404, 'Press conference question not found');
  }
  if (question.answer) {
    throw new HttpError(409, 'This press conference question has already been answered');
  }

  const choice = question.choices.find((item) => item.stance === stance);
  if (!choice) {
    throw new HttpError(422, 'Invalid answer choice');
  }

  const [team, opponent] = await Promise.all([
    NationalTeam.findById(conference.team),
    NationalTeam.findById(conference.opponent),
  ]);

  if (!team || !opponent) {
    throw new HttpError(404, 'Press conference team data was not found');
  }

  const previousTotals = conference.impactTotals || {};
  const metricsBefore = derivePressMetrics(team, previousTotals.mediaPressure || 0, previousTotals);
  applyAnswerEffects(team, choice.effects);

  const nextTotals = addEffects(previousTotals, choice.effects);
  question.answer = {
    stance,
    responseKey: choice.responseKey,
    reactionKey: choice.reactionKey,
    effects: choice.effects,
    answeredAt: new Date(),
  };
  conference.impactTotals = nextTotals;

  const completed = conference.questions.every((item) => item.questionId === questionId || item.answer);
  if (completed) {
    conference.status = 'completed';
    conference.completedAt = new Date();
  }

  const metricsAfter = derivePressMetrics(team, nextTotals.mediaPressure || 0, nextTotals);
  const newsText = mediaReactionNews({ team, opponent, stance });
  const news = await News.create({
    category: 'media',
    title: newsText.title,
    body: newsText.body,
    team: team._id,
    match: conference.match,
    pressureLevel: metricsAfter.mediaPressure,
  });

  await Promise.all([team.save(), conference.save()]);

  return res.json({
    success: true,
    conference,
    result: {
      questionId,
      stance,
      responseKey: choice.responseKey,
      reactionKey: choice.reactionKey,
      variables: question.variables,
      effects: choice.effects,
      metricsBefore,
      metricsAfter,
      news,
    },
  });
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
