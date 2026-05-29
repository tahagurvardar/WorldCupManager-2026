import { Match } from '../models/Match.js';
import { NationalTeam } from '../models/NationalTeam.js';
import { Player } from '../models/Player.js';
import { PressConference } from '../models/PressConference.js';
import { derivePressMetrics } from './pressConferenceService.js';
import { calculateGroupStandings } from './standingsService.js';
import { clamp } from '../utils/random.js';

const progressScores = {
  group_stage: 42,
  round_of_32: 55,
  round_of_16: 64,
  quarter_final: 72,
  semi_final: 82,
  third_place: 84,
  final: 92,
  champion: 100,
  eliminated: 32,
};

const knockoutOrder = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final'];

function getId(value) {
  return String(value?._id || value?.id || value);
}

function matchInvolvesTeam(match, teamId) {
  return getId(match.home.team) === getId(teamId) || getId(match.away.team) === getId(teamId);
}

function sideForTeam(match, teamId) {
  return getId(match.home.team) === getId(teamId) ? 'home' : 'away';
}

function opponentForTeam(match, teamId) {
  return sideForTeam(match, teamId) === 'home' ? match.away : match.home;
}

function scoreForTeam(match, teamId) {
  const side = sideForTeam(match, teamId);
  const goalsFor = side === 'home' ? match.score.home : match.score.away;
  const goalsAgainst = side === 'home' ? match.score.away : match.score.home;
  return { side, goalsFor, goalsAgainst };
}

function resultForTeam(match, teamId) {
  if (match.status !== 'completed') return 'scheduled';
  const { goalsFor, goalsAgainst } = scoreForTeam(match, teamId);
  if (goalsFor > goalsAgainst) return 'W';
  if (goalsFor === goalsAgainst) return 'D';
  return 'L';
}

function buildGroupTables(teams, groupMatches) {
  return [...new Set(teams.map((team) => team.group))].sort().map((group) => ({
    group,
    table: calculateGroupStandings(
      teams.filter((team) => team.group === group),
      groupMatches.filter((match) => match.group === group),
    ),
  }));
}

function qualifiedTeamIds(groupTables) {
  const direct = groupTables.flatMap(({ table }) => table.slice(0, 2).map((row) => getId(row.team)));
  const bestThird = groupTables
    .map(({ table }) => table[2])
    .filter(Boolean)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      if (b.fairPlay !== a.fairPlay) return b.fairPlay - a.fairPlay;
      return a.team.worldRanking - b.team.worldRanking;
    })
    .slice(0, 8)
    .map((row) => getId(row.team));

  return new Set([...direct, ...bestThird]);
}

function summarizeMatch(match, teamId) {
  const { side, goalsFor, goalsAgainst } = scoreForTeam(match, teamId);
  const opponent = opponentForTeam(match, teamId);
  const result = resultForTeam(match, teamId);

  return {
    _id: match._id,
    matchNumber: match.matchNumber,
    stage: match.stage,
    group: match.group,
    status: match.status,
    kickoffAt: match.kickoffAt,
    venue: match.venue,
    side,
    opponent,
    goalsFor,
    goalsAgainst,
    scoreText: match.status === 'completed' ? `${goalsFor}-${goalsAgainst}` : 'vs',
    result,
    penalties: match.penalties,
  };
}

function aggregateSummary(completedMatches, teamId) {
  const base = {
    played: completedMatches.length,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    cleanSheets: 0,
    biggestWin: null,
    worstDefeat: null,
  };

  completedMatches.forEach((match) => {
    const score = scoreForTeam(match, teamId);
    const result = resultForTeam(match, teamId);
    const margin = score.goalsFor - score.goalsAgainst;
    base.goalsFor += score.goalsFor;
    base.goalsAgainst += score.goalsAgainst;
    if (score.goalsAgainst === 0) base.cleanSheets += 1;
    if (result === 'W') base.wins += 1;
    if (result === 'D') base.draws += 1;
    if (result === 'L') base.losses += 1;

    if (margin > 0 && (!base.biggestWin || margin > base.biggestWin.margin)) {
      base.biggestWin = { ...summarizeMatch(match, teamId), margin };
    }

    if (margin < 0 && (!base.worstDefeat || margin < base.worstDefeat.margin)) {
      base.worstDefeat = { ...summarizeMatch(match, teamId), margin };
    }
  });

  return base;
}

function playerSnapshot(player, statKey) {
  if (!player) return null;
  return {
    _id: player._id,
    fullName: player.fullName,
    club: player.club,
    primaryPosition: player.primaryPosition,
    overall: player.overall,
    tournamentStats: player.tournamentStats,
    value: player.tournamentStats?.[statKey] || 0,
  };
}

function keyPlayers(players) {
  const appeared = players.filter((player) => (player.tournamentStats?.appearances || 0) > 0);
  const bestRated = [...appeared].sort((a, b) => (b.tournamentStats?.avgRating || 0) - (a.tournamentStats?.avgRating || 0))[0];
  const topScorer = [...appeared].sort((a, b) => {
    if ((b.tournamentStats?.goals || 0) !== (a.tournamentStats?.goals || 0)) return (b.tournamentStats?.goals || 0) - (a.tournamentStats?.goals || 0);
    return b.overall - a.overall;
  })[0];
  const topAssister = [...appeared].sort((a, b) => {
    if ((b.tournamentStats?.assists || 0) !== (a.tournamentStats?.assists || 0)) return (b.tournamentStats?.assists || 0) - (a.tournamentStats?.assists || 0);
    return b.overall - a.overall;
  })[0];

  return {
    bestRatedPlayer: bestRated ? playerSnapshot(bestRated, 'avgRating') : null,
    topScorer: topScorer && (topScorer.tournamentStats?.goals || 0) > 0 ? playerSnapshot(topScorer, 'goals') : null,
    topAssister: topAssister && (topAssister.tournamentStats?.assists || 0) > 0 ? playerSnapshot(topAssister, 'assists') : null,
  };
}

function latestCompleted(matches) {
  return [...matches].filter((match) => match.status === 'completed').sort((a, b) => new Date(b.kickoffAt) - new Date(a.kickoffAt))[0] || null;
}

function mostImportantMatch({ matches, knockoutMatches, summary, teamId, champion }) {
  const finalMatch = matches.find((match) => match.stage === 'final' && match.status === 'completed');
  if (champion && finalMatch) return { reason: 'championFinal', match: summarizeMatch(finalMatch, teamId) };

  const knockoutLoss = [...knockoutMatches].reverse().find((match) => match.status === 'completed' && resultForTeam(match, teamId) === 'L');
  if (knockoutLoss) return { reason: 'elimination', match: summarizeMatch(knockoutLoss, teamId) };

  const latestKnockout = latestCompleted(knockoutMatches);
  if (latestKnockout) return { reason: 'knockoutProgress', match: summarizeMatch(latestKnockout, teamId) };

  if (summary.biggestWin) return { reason: 'biggestWin', match: summary.biggestWin };
  if (summary.worstDefeat) return { reason: 'worstDefeat', match: summary.worstDefeat };

  const recent = latestCompleted(matches);
  if (recent) return { reason: 'latestResult', match: summarizeMatch(recent, teamId) };

  const next = matches.find((match) => match.status === 'scheduled');
  return next ? { reason: 'nextFixture', match: summarizeMatch(next, teamId) } : null;
}

function expectationForTeam(team) {
  const ranking = team.worldRanking || 80;
  if (ranking <= 5) return { key: 'winOrFinal', targetStage: 'final', targetScore: 92 };
  if (ranking <= 10) return { key: 'semiFinal', targetStage: 'semi_final', targetScore: 82 };
  if (ranking <= 20) return { key: 'quarterFinal', targetStage: 'quarter_final', targetScore: 72 };
  if (ranking <= 32) return { key: 'knockoutRun', targetStage: 'round_of_16', targetScore: 64 };
  return { key: 'groupCompete', targetStage: 'round_of_32', targetScore: 55 };
}

function progressFromStatus(status, eliminationStage) {
  if (status === 'eliminated' && eliminationStage) {
    return Math.max(28, (progressScores[eliminationStage] || 42) - 12);
  }
  return progressScores[status] || progressScores.group_stage;
}

function resultScore(match, team, teamsById) {
  const result = resultForTeam(match, team._id);
  const opponent = teamsById.get(getId(opponentForTeam(match, team._id).team));
  const rankingGap = (team.worldRanking || 80) - (opponent?.worldRanking || 80);

  if (result === 'W') return clamp(76 + rankingGap * 0.35, 65, 96);
  if (result === 'D') return clamp(52 + rankingGap * 0.25, 35, 78);
  return clamp(28 + rankingGap * 0.2, 10, 55);
}

function groupScore(groupRow, groupComplete, qualified) {
  if (!groupRow || groupRow.played === 0) return 50;
  if (groupComplete) {
    if (groupRow.position === 1) return 90;
    if (groupRow.position === 2) return 80;
    if (groupRow.position === 3 && qualified) return 68;
    if (groupRow.position === 3) return 48;
    return 30;
  }

  const pointsPerMatch = groupRow.points / Math.max(1, groupRow.played);
  return clamp(42 + pointsPerMatch * 16 + Math.max(0, groupRow.goalDifference) * 3, 32, 86);
}

function gradeFromScore(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 68) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

function reactionKeys({ grade, eliminated, champion }) {
  if (champion) {
    return { board: 'championBoard', fan: 'championFans', media: 'championMedia' };
  }
  if (eliminated && (grade === 'C' || grade === 'D')) {
    return { board: 'eliminationConcern', fan: 'eliminationFrustration', media: 'eliminationScrutiny' };
  }
  if (grade === 'A+' || grade === 'A') {
    return { board: 'boardExcellent', fan: 'fansInspired', media: 'mediaPraise' };
  }
  if (grade === 'B') {
    return { board: 'boardStable', fan: 'fansCautious', media: 'mediaBalanced' };
  }
  if (grade === 'C') {
    return { board: 'boardUneasy', fan: 'fansRestless', media: 'mediaQuestions' };
  }
  return { board: 'boardCritical', fan: 'fansAngry', media: 'mediaPressure' };
}

function buildStatus({ team, teamId, matches, groupTable, groupComplete, qualifiedSet }) {
  const finalMatch = matches.find((match) => match.stage === 'final' && match.status === 'completed');
  const champion = team.tournamentStatus === 'champion' || (finalMatch && getId(finalMatch.winner) === getId(teamId));
  const lostKnockout = [...matches]
    .filter((match) => match.stage !== 'group' && match.stage !== 'third_place' && match.status === 'completed')
    .sort((a, b) => knockoutOrder.indexOf(b.stage) - knockoutOrder.indexOf(a.stage))
    .find((match) => resultForTeam(match, teamId) === 'L');
  const groupEliminated = groupComplete && !qualifiedSet.has(getId(teamId));
  const eliminated = !champion && (team.tournamentStatus === 'eliminated' || Boolean(lostKnockout) || groupEliminated);
  const latestKnockout = [...matches]
    .filter((match) => match.stage !== 'group')
    .sort((a, b) => knockoutOrder.indexOf(b.stage) - knockoutOrder.indexOf(a.stage))[0];
  const currentStatus = champion ? 'champion' : eliminated ? 'eliminated' : latestKnockout?.stage || team.tournamentStatus || 'group_stage';
  const groupPosition = groupTable.findIndex((row) => getId(row.team) === getId(teamId)) + 1 || null;
  const groupRow = groupTable.find((row) => getId(row.team) === getId(teamId)) || null;

  return {
    currentStatus,
    champion,
    eliminated,
    eliminationStage: lostKnockout?.stage || (groupEliminated ? 'group_stage' : null),
    eliminationMatch: lostKnockout ? summarizeMatch(lostKnockout, teamId) : null,
    groupPosition,
    groupPoints: groupRow?.points || 0,
    qualifiedFromGroup: qualifiedSet.has(getId(teamId)),
  };
}

function performanceGrade({ team, matches, completedMatches, status, groupRow, groupComplete, qualified, metrics, teamsById }) {
  const expectation = expectationForTeam(team);
  const averageResult = completedMatches.length
    ? completedMatches.reduce((sum, match) => sum + resultScore(match, team, teamsById), 0) / completedMatches.length
    : 52;
  const groupPerformance = groupScore(groupRow, groupComplete, qualified);
  const progress = progressFromStatus(status.currentStatus, status.eliminationStage);
  const pressureScore = 100 - (metrics.mediaPressure || 50);
  const expectationAdjustment = progress - expectation.targetScore;
  const score = clamp(
    averageResult * 0.36 +
    groupPerformance * 0.22 +
    progress * 0.26 +
    pressureScore * 0.08 +
    58 * 0.08 +
    expectationAdjustment * 0.18,
    20,
    100,
  );
  const roundedScore = Math.round(score);
  const grade = gradeFromScore(roundedScore);
  const reactions = reactionKeys({ grade, eliminated: status.eliminated, champion: status.champion });

  return {
    grade,
    score: roundedScore,
    expectation,
    boardConfidence: metrics.boardConfidence,
    fanConfidence: metrics.fanConfidence,
    mediaPressure: metrics.mediaPressure,
    breakdown: {
      matchResults: Math.round(averageResult),
      groupPerformance: Math.round(groupPerformance),
      knockoutProgress: Math.round(progress),
      expectationAdjustment: Math.round(expectationAdjustment),
      mediaControl: Math.round(pressureScore),
      matchesEvaluated: completedMatches.length || matches.length,
    },
    reactions: {
      board: { key: reactions.board, value: metrics.boardConfidence },
      fan: { key: reactions.fan, value: metrics.fanConfidence },
      media: { key: reactions.media, value: metrics.mediaPressure },
    },
  };
}

function impactTotals(conferences) {
  return conferences.reduce((totals, conference) => ({
    morale: totals.morale + (conference.impactTotals?.morale || 0),
    chemistry: totals.chemistry + (conference.impactTotals?.chemistry || 0),
    mediaPressure: totals.mediaPressure + (conference.impactTotals?.mediaPressure || 0),
    fanConfidence: totals.fanConfidence + (conference.impactTotals?.fanConfidence || 0),
    boardConfidence: totals.boardConfidence + (conference.impactTotals?.boardConfidence || 0),
  }), {
    morale: 0,
    chemistry: 0,
    mediaPressure: 0,
    fanConfidence: 0,
    boardConfidence: 0,
  });
}

export async function buildTournamentJourney(user) {
  const teamId = user.selectedTeam?._id || user.selectedTeam;
  const [team, players, matches, teams, groupMatches, conferences] = await Promise.all([
    NationalTeam.findById(teamId).populate('coach'),
    Player.find({ country: teamId }).sort({ 'tournamentStats.avgRating': -1, overall: -1 }),
    Match.find({ $or: [{ 'home.team': teamId }, { 'away.team': teamId }] }).sort({ kickoffAt: 1, matchNumber: 1 }),
    NationalTeam.find().sort({ group: 1, worldRanking: 1 }),
    Match.find({ stage: 'group' }),
    PressConference.find({ user: user._id, team: teamId }),
  ]);

  if (!team) return null;

  const teamIdString = getId(teamId);
  const groupTables = buildGroupTables(teams, groupMatches);
  const selectedGroup = groupTables.find((group) => group.group === team.group) || { group: team.group, table: [] };
  const qualifiedSet = qualifiedTeamIds(groupTables);
  const groupFixtureMatches = groupMatches.filter((match) => match.group === team.group);
  const groupComplete = groupFixtureMatches.length > 0 && groupFixtureMatches.every((match) => match.status === 'completed');
  const status = buildStatus({
    team,
    teamId,
    matches,
    groupTable: selectedGroup.table,
    groupComplete,
    qualifiedSet,
  });
  const completedMatches = matches.filter((match) => match.status === 'completed');
  const groupStageMatches = matches.filter((match) => match.stage === 'group').map((match) => summarizeMatch(match, teamIdString));
  const knockoutMatches = matches.filter((match) => match.stage !== 'group').map((match) => summarizeMatch(match, teamIdString));
  const summary = aggregateSummary(completedMatches, teamIdString);
  const totals = impactTotals(conferences);
  const metrics = derivePressMetrics(team, totals.mediaPressure, totals);
  const groupRow = selectedGroup.table.find((row) => getId(row.team) === teamIdString);
  const teamsById = new Map(teams.map((item) => [getId(item), item]));
  const managerPerformance = performanceGrade({
    team,
    matches,
    completedMatches,
    status,
    groupRow: groupRow ? { ...groupRow, position: status.groupPosition } : null,
    groupComplete,
    qualified: status.qualifiedFromGroup,
    metrics,
    teamsById,
  });
  const important = mostImportantMatch({
    matches,
    knockoutMatches: matches.filter((match) => match.stage !== 'group'),
    summary,
    teamId: teamIdString,
    champion: status.champion,
  });

  return {
    team,
    status,
    matches: {
      groupStage: groupStageMatches,
      knockout: knockoutMatches,
    },
    summary,
    keyPlayers: keyPlayers(players),
    mostImportantMatch: important,
    managerPerformance,
    eliminationReport: status.eliminated ? {
      stage: status.eliminationStage,
      match: status.eliminationMatch,
      reasonKey: status.eliminationStage === 'group_stage' ? 'groupElimination' : 'knockoutElimination',
      groupPosition: status.groupPosition,
      groupPoints: status.groupPoints,
    } : null,
    championCelebration: status.champion ? {
      match: matches.find((match) => match.stage === 'final') ? summarizeMatch(matches.find((match) => match.stage === 'final'), teamIdString) : null,
      reasonKey: 'champion',
    } : null,
  };
}
