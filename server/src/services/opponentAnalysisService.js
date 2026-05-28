import { clamp, roundTo } from '../utils/random.js';

const roleConfig = {
  goalkeeper: { positions: ['GK'], count: 1, weight: 0.12 },
  defense: { positions: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM'], count: 4, weight: 0.28 },
  midfield: { positions: ['CDM', 'CM', 'CAM', 'LM', 'RM'], count: 3, weight: 0.3 },
  attack: { positions: ['LW', 'RW', 'ST', 'CAM'], count: 3, weight: 0.3 },
};

const importantPositions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];
const statusBonus = { final: 4, provisional: 2, candidate: 0 };

function getId(value) {
  return String(value?._id || value?.id || value);
}

function isAvailable(player) {
  return player.injury?.injuryStatus !== 'injured';
}

function isRolePlayer(player, positions) {
  return positions.includes(player.primaryPosition) || player.secondaryPositions?.some((position) => positions.includes(position));
}

function playerScore(player) {
  const form = player.dynamic?.form ?? 55;
  const fitness = player.dynamic?.fitness ?? 86;
  const fatigue = player.dynamic?.fatigue ?? 16;
  const stats = player.tournamentStats || {};
  const ratingBoost = stats.appearances > 0 ? (Number(stats.avgRating || 6.5) - 6.5) * 3 : 0;
  const productionBoost = (stats.goals || 0) * 0.8 + (stats.assists || 0) * 0.6;
  const injuryPenalty = player.injury?.injuryStatus === 'minor' ? 7 : player.injury?.injuryStatus === 'injured' ? 40 : 0;

  return clamp(
    roundTo(
      player.overall * 0.78
      + form * 0.08
      + fitness * 0.07
      - fatigue * 0.05
      + (statusBonus[player.nationalTeamStatus] || 0)
      + ratingBoost
      + productionBoost
      - injuryPenalty,
      1,
    ),
    0,
    99,
  );
}

function getAnalysisPool(players) {
  const available = players.filter(isAvailable);
  const finalSquad = available.filter((player) => player.nationalTeamStatus === 'final');
  if (finalSquad.length >= 11) return finalSquad;

  const provisional = available.filter((player) => player.nationalTeamStatus !== 'candidate');
  if (provisional.length >= 11) return provisional;

  return available.length ? available : players;
}

function averageTop(players, count) {
  const sorted = [...players].sort((a, b) => playerScore(b) - playerScore(a)).slice(0, count);
  if (!sorted.length) return 0;

  const average = sorted.reduce((sum, player) => sum + playerScore(player), 0) / sorted.length;
  const depthPenalty = Math.max(0, count - sorted.length) * 4;
  return roundTo(clamp(average - depthPenalty, 0, 99), 1);
}

function buildRoleStrengths(players) {
  const pool = getAnalysisPool(players);

  return Object.fromEntries(Object.entries(roleConfig).map(([role, config]) => {
    const rolePlayers = pool.filter((player) => isRolePlayer(player, config.positions));
    const topPlayers = [...rolePlayers]
      .sort((a, b) => playerScore(b) - playerScore(a))
      .slice(0, config.count)
      .map((player) => ({ player, score: playerScore(player) }));

    return [role, {
      score: averageTop(rolePlayers, config.count),
      topPlayers,
    }];
  }));
}

function teamOverall(team, roleStrengths) {
  const roleScore = Object.entries(roleConfig).reduce((sum, [role, config]) => (
    sum + roleStrengths[role].score * config.weight
  ), 0);

  return roundTo(clamp(
    roleScore + (team.morale || 50) * 0.04 + (team.chemistry || 50) * 0.05 - (team.fatigue || 0) * 0.05,
    0,
    99,
  ), 1);
}

function buildPositionDepth(players) {
  const pool = getAnalysisPool(players);

  return importantPositions.map((position) => {
    const count = position === 'GK' ? 1 : 2;
    const matchingPlayers = pool.filter((player) => (
      player.primaryPosition === position || player.secondaryPositions?.includes(position)
    ));
    const score = averageTop(matchingPlayers, count);
    let reason = 'relativeWeakness';

    if (!matchingPlayers.length) reason = 'noNaturalCover';
    else if (matchingPlayers.length < count) reason = 'thinDepth';
    else if (score < 72) reason = 'lowRating';

    return {
      position,
      score,
      reason,
      players: [...matchingPlayers]
        .sort((a, b) => playerScore(b) - playerScore(a))
        .slice(0, count)
        .map((player) => ({ player, score: playerScore(player) })),
    };
  });
}

function buildTeamProfile(team, players) {
  const roleStrengths = buildRoleStrengths(players);
  const pool = getAnalysisPool(players);

  return {
    team,
    overall: teamOverall(team, roleStrengths),
    roles: roleStrengths,
    bestPlayers: [...pool]
      .sort((a, b) => playerScore(b) - playerScore(a))
      .slice(0, 5)
      .map((player) => ({ player, score: playerScore(player) })),
    positionDepth: buildPositionDepth(players),
    pool: {
      total: players.length,
      available: players.filter(isAvailable).length,
      final: players.filter((player) => player.nationalTeamStatus === 'final').length,
      provisional: players.filter((player) => player.nationalTeamStatus !== 'candidate').length,
    },
  };
}

function buildComparison(ours, opponent) {
  const categories = {
    overall: [ours.overall, opponent.overall],
    attack: [ours.roles.attack.score, opponent.roles.attack.score],
    midfield: [ours.roles.midfield.score, opponent.roles.midfield.score],
    defense: [ours.roles.defense.score, opponent.roles.defense.score],
    goalkeeper: [ours.roles.goalkeeper.score, opponent.roles.goalkeeper.score],
  };

  return Object.fromEntries(Object.entries(categories).map(([category, [ourScore, opponentScore]]) => {
    const difference = roundTo(ourScore - opponentScore, 1);
    const edge = Math.abs(difference) < 2 ? 'level' : difference > 0 ? 'ours' : 'opponent';
    return [category, { ours: ourScore, opponent: opponentScore, difference, edge }];
  }));
}

function matchInvolvesTeam(match, teamId) {
  return getId(match.home.team) === teamId || getId(match.away.team) === teamId;
}

function buildRecentForm(teamId, matches) {
  const results = matches
    .filter((match) => match.status === 'completed' && matchInvolvesTeam(match, teamId))
    .slice(0, 5)
    .map((match) => {
      const isHome = getId(match.home.team) === teamId;
      const goalsFor = isHome ? match.score.home : match.score.away;
      const goalsAgainst = isHome ? match.score.away : match.score.home;
      const result = goalsFor > goalsAgainst ? 'W' : goalsFor === goalsAgainst ? 'D' : 'L';

      return {
        matchId: match._id,
        result,
        goalsFor,
        goalsAgainst,
        opponent: isHome ? match.away : match.home,
        kickoffAt: match.kickoffAt,
      };
    });

  return {
    matches: results.length,
    sequence: results.map((item) => item.result),
    wins: results.filter((item) => item.result === 'W').length,
    draws: results.filter((item) => item.result === 'D').length,
    losses: results.filter((item) => item.result === 'L').length,
    points: results.reduce((sum, item) => sum + (item.result === 'W' ? 3 : item.result === 'D' ? 1 : 0), 0),
    goalsFor: results.reduce((sum, item) => sum + item.goalsFor, 0),
    goalsAgainst: results.reduce((sum, item) => sum + item.goalsAgainst, 0),
    results,
  };
}

function threatKey(score) {
  if (score >= 78) return 'elite';
  if (score >= 62) return 'high';
  if (score >= 43) return 'medium';
  return 'low';
}

function buildThreatLevel(ours, opponent, ourForm, opponentForm) {
  const rankingPressure = (ours.team.worldRanking || 80) - (opponent.team.worldRanking || 80);
  const score = clamp(
    50
    + (opponent.overall - ours.overall) * 1.1
    + (opponent.roles.attack.score - ours.roles.defense.score) * 0.55
    + (opponentForm.points - ourForm.points) * 1.6
    + rankingPressure * 0.12,
    0,
    100,
  );

  return {
    score: roundTo(score, 1),
    level: threatKey(score),
  };
}

function strengthReason(score, difference) {
  if (score >= 84) return 'eliteUnit';
  if (difference >= 5) return 'clearEdge';
  return 'stableUnit';
}

function buildOpponentStrengths(ours, opponent) {
  return Object.keys(roleConfig)
    .map((role) => {
      const score = opponent.roles[role].score;
      const difference = roundTo(score - ours.roles[role].score, 1);
      return {
        area: role,
        score,
        difference,
        reason: strengthReason(score, difference),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function buildOpponentWeaknesses(opponent) {
  return opponent.positionDepth
    .sort((a, b) => a.score - b.score)
    .slice(0, 4);
}

function buildTacticalPlan(ours, opponent, threatLevel) {
  const defensiveGap = opponent.roles.attack.score - ours.roles.defense.score;
  const attackingEdge = ours.roles.attack.score - opponent.roles.defense.score;
  const midfieldEdge = ours.roles.midfield.score - opponent.roles.midfield.score;
  const weakBuildUp = opponent.roles.defense.score < 76 || opponent.roles.goalkeeper.score < 75;

  const pressing = weakBuildUp ? 'high' : threatLevel.score >= 66 ? 'balanced' : 'measured';
  const tempo = attackingEdge >= 4 ? 'fast' : midfieldEdge >= 3 ? 'controlled' : 'balanced';
  const defensiveLine = defensiveGap >= 5 ? 'deep' : defensiveGap <= -5 ? 'high' : 'standard';
  const counterAttack = threatLevel.score >= 58 || attackingEdge >= 4 ? 'enabled' : 'selective';
  const keyPlayerToWatch = opponent.bestPlayers[0]?.player || null;

  return {
    pressing: { level: pressing, reason: weakBuildUp ? 'targetBuildUp' : 'manageEnergy' },
    tempo: { level: tempo, reason: attackingEdge >= 4 ? 'attackSpace' : 'controlRhythm' },
    defensiveLine: { level: defensiveLine, reason: defensiveGap >= 5 ? 'protectDepth' : 'compressSpace' },
    counterAttack: { level: counterAttack, reason: attackingEdge >= 4 ? 'exploitTransitions' : 'selectiveBreaks' },
    keyPlayerToWatch,
  };
}

export function buildOpponentAnalysis({
  match,
  ourTeam,
  opponentTeam,
  ourPlayers,
  opponentPlayers,
  recentMatches,
}) {
  const ourProfile = buildTeamProfile(ourTeam, ourPlayers);
  const opponentProfile = buildTeamProfile(opponentTeam, opponentPlayers);
  const ourForm = buildRecentForm(getId(ourTeam), recentMatches);
  const opponentForm = buildRecentForm(getId(opponentTeam), recentMatches);
  const threatLevel = buildThreatLevel(ourProfile, opponentProfile, ourForm, opponentForm);

  return {
    match,
    ourTeam,
    opponent: opponentTeam,
    comparison: buildComparison(ourProfile, opponentProfile),
    ourProfile,
    opponentProfile,
    opponentStrengths: buildOpponentStrengths(ourProfile, opponentProfile),
    opponentWeaknesses: buildOpponentWeaknesses(opponentProfile),
    keyThreats: opponentProfile.bestPlayers,
    recentForm: {
      ours: ourForm,
      opponent: opponentForm,
    },
    threatLevel,
    tacticalPlan: buildTacticalPlan(ourProfile, opponentProfile, threatLevel),
  };
}
