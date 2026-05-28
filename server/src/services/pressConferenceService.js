import { clamp } from '../utils/random.js';

const baseChoices = {
  confident: {
    responseKey: 'confidentDefault',
    reactionKey: 'confidentReaction',
    effects: {
      morale: 4,
      chemistry: 1,
      mediaPressure: 7,
      fanConfidence: 5,
      boardConfidence: 1,
    },
  },
  balanced: {
    responseKey: 'balancedDefault',
    reactionKey: 'balancedReaction',
    effects: {
      morale: 2,
      chemistry: 3,
      mediaPressure: 0,
      fanConfidence: 2,
      boardConfidence: 3,
    },
  },
  defensive: {
    responseKey: 'defensiveDefault',
    reactionKey: 'defensiveReaction',
    effects: {
      morale: -1,
      chemistry: 2,
      mediaPressure: -5,
      fanConfidence: -2,
      boardConfidence: 4,
    },
  },
};

function getId(value) {
  return String(value?._id || value?.id || value);
}

function localizedTeam(team) {
  return {
    tr: team.nameTR,
    en: team.nameEN,
    code: team.fifaCode,
  };
}

function matchInvolvesTeam(match, teamId) {
  return getId(match.home.team) === teamId || getId(match.away.team) === teamId;
}

export function buildRecentForm(teamId, matches) {
  const results = matches
    .filter((match) => match.status === 'completed' && matchInvolvesTeam(match, teamId))
    .slice(0, 5)
    .map((match) => {
      const isHome = getId(match.home.team) === teamId;
      const goalsFor = isHome ? match.score.home : match.score.away;
      const goalsAgainst = isHome ? match.score.away : match.score.home;
      return goalsFor > goalsAgainst ? 'W' : goalsFor === goalsAgainst ? 'D' : 'L';
    });

  return {
    matches: results.length,
    sequence: results,
    points: results.reduce((sum, result) => sum + (result === 'W' ? 3 : result === 'D' ? 1 : 0), 0),
  };
}

function groupContext(groupTable, teamId) {
  const index = groupTable.findIndex((row) => getId(row.team) === teamId);
  const row = index >= 0 ? groupTable[index] : null;

  return {
    position: index >= 0 ? index + 1 : null,
    points: row?.points ?? 0,
    played: row?.played ?? 0,
  };
}

function makeChoice(stance, overrides = {}) {
  const base = baseChoices[stance];
  return {
    stance,
    responseKey: overrides.responseKey || base.responseKey,
    reactionKey: overrides.reactionKey || base.reactionKey,
    effects: {
      ...base.effects,
      ...(overrides.effects || {}),
    },
  };
}

function choicesFor(questionKey) {
  const map = {
    opponentThreat: [
      makeChoice('confident', { responseKey: 'confidentThreat', reactionKey: 'confidentThreatReaction', effects: { mediaPressure: 9, fanConfidence: 6 } }),
      makeChoice('balanced', { responseKey: 'balancedThreat', reactionKey: 'balancedThreatReaction' }),
      makeChoice('defensive', { responseKey: 'defensiveThreat', reactionKey: 'defensiveThreatReaction', effects: { morale: 0, mediaPressure: -6, boardConfidence: 5 } }),
    ],
    groupSituation: [
      makeChoice('confident', { responseKey: 'confidentGroup', reactionKey: 'confidentGroupReaction' }),
      makeChoice('balanced', { responseKey: 'balancedGroup', reactionKey: 'balancedGroupReaction' }),
      makeChoice('defensive', { responseKey: 'defensiveGroup', reactionKey: 'defensiveGroupReaction' }),
    ],
    moraleCheck: [
      makeChoice('confident', { responseKey: 'confidentMorale', reactionKey: 'confidentMoraleReaction', effects: { morale: 5, chemistry: 1 } }),
      makeChoice('balanced', { responseKey: 'balancedMorale', reactionKey: 'balancedMoraleReaction', effects: { morale: 3, chemistry: 4 } }),
      makeChoice('defensive', { responseKey: 'defensiveMorale', reactionKey: 'defensiveMoraleReaction', effects: { morale: 0, mediaPressure: -4 } }),
    ],
    recentForm: [
      makeChoice('confident', { responseKey: 'confidentForm', reactionKey: 'confidentFormReaction' }),
      makeChoice('balanced', { responseKey: 'balancedForm', reactionKey: 'balancedFormReaction' }),
      makeChoice('defensive', { responseKey: 'defensiveForm', reactionKey: 'defensiveFormReaction' }),
    ],
    favoritePressure: [
      makeChoice('confident', { responseKey: 'confidentFavorite', reactionKey: 'confidentFavoriteReaction', effects: { mediaPressure: 10, fanConfidence: 6, boardConfidence: 0 } }),
      makeChoice('balanced', { responseKey: 'balancedFavorite', reactionKey: 'balancedFavoriteReaction' }),
      makeChoice('defensive', { responseKey: 'defensiveFavorite', reactionKey: 'defensiveFavoriteReaction', effects: { morale: -2, mediaPressure: -3, boardConfidence: 5 } }),
    ],
    underdogPlan: [
      makeChoice('confident', { responseKey: 'confidentUnderdog', reactionKey: 'confidentUnderdogReaction', effects: { morale: 5, fanConfidence: 5, mediaPressure: 5 } }),
      makeChoice('balanced', { responseKey: 'balancedUnderdog', reactionKey: 'balancedUnderdogReaction' }),
      makeChoice('defensive', { responseKey: 'defensiveUnderdog', reactionKey: 'defensiveUnderdogReaction', effects: { mediaPressure: -6, boardConfidence: 5 } }),
    ],
  };

  return map[questionKey] || [
    makeChoice('confident'),
    makeChoice('balanced'),
    makeChoice('defensive'),
  ];
}

function pickQuestionCandidates({ team, opponent, group, ourForm, opponentThreatLevel }) {
  const rankingGap = (opponent.worldRanking || 80) - (team.worldRanking || 80);
  const candidates = [];

  if (opponentThreatLevel?.score >= 60) {
    candidates.push({ key: 'opponentThreat', priority: 100 + opponentThreatLevel.score });
  }

  if (group.played > 0) {
    candidates.push({ key: 'groupSituation', priority: 86 + (group.position && group.position > 2 ? 10 : 0) });
  }

  if ((team.morale || 50) < 58) {
    candidates.push({ key: 'moraleCheck', priority: 84 + (58 - team.morale) });
  }

  if (ourForm.matches > 0) {
    candidates.push({ key: 'recentForm', priority: 76 + ourForm.points });
  }

  if (rankingGap >= 15) {
    candidates.push({ key: 'favoritePressure', priority: 74 + rankingGap * 0.2 });
  }

  if (rankingGap <= -10) {
    candidates.push({ key: 'underdogPlan', priority: 78 + Math.abs(rankingGap) * 0.25 });
  }

  if (!candidates.length) {
    candidates.push(
      { key: 'opponentThreat', priority: 70 },
      { key: 'groupSituation', priority: 66 },
      { key: 'recentForm', priority: 62 },
    );
  }

  return candidates.sort((a, b) => b.priority - a.priority);
}

export function buildPressConferenceQuestions({
  team,
  opponent,
  groupTable,
  recentMatches,
  opponentThreatLevel,
}) {
  const teamId = getId(team);
  const ourForm = buildRecentForm(teamId, recentMatches);
  const group = groupContext(groupTable, teamId);
  const variables = {
    team: localizedTeam(team),
    opponent: localizedTeam(opponent),
    group: team.group,
    groupPosition: group.position || '-',
    groupPoints: group.points,
    morale: team.morale,
    formSequence: ourForm.sequence.length ? ourForm.sequence.join(' ') : '-',
    threatLevel: opponentThreatLevel?.level || 'medium',
    threatScore: opponentThreatLevel?.score || 50,
  };

  const selected = pickQuestionCandidates({
    team,
    opponent,
    group,
    ourForm,
    opponentThreatLevel,
  }).slice(0, 3);

  return {
    questions: selected.map((item, index) => ({
      questionId: `q${index + 1}-${item.key}`,
      key: item.key,
      variables,
      context: {
        priority: item.priority,
        group,
        recentForm: ourForm,
        opponentThreatLevel,
      },
      choices: choicesFor(item.key),
    })),
    generatedContext: {
      group,
      recentForm: ourForm,
      opponentThreatLevel,
    },
  };
}

export function derivePressMetrics(team, pressureDelta = 0, confidenceDelta = {}) {
  const mediaPressure = clamp(35 + (100 - team.morale) * 0.35 + (team.worldRanking <= 20 ? 22 : 10) + pressureDelta, 0, 100);
  const boardConfidence = clamp(48 + team.morale * 0.22 + team.chemistry * 0.22 - mediaPressure * 0.08 + (confidenceDelta.boardConfidence || 0), 0, 100);
  const fanConfidence = clamp(42 + team.morale * 0.28 + team.chemistry * 0.16 - (team.fatigue || 0) * 0.08 + (confidenceDelta.fanConfidence || 0), 0, 100);

  return {
    morale: Math.round(team.morale),
    chemistry: Math.round(team.chemistry),
    mediaPressure: Math.round(mediaPressure),
    fanConfidence: Math.round(fanConfidence),
    boardConfidence: Math.round(boardConfidence),
  };
}

export function applyAnswerEffects(team, effects) {
  team.morale = clamp(Math.round((team.morale || 50) + (effects.morale || 0)), 0, 100);
  team.chemistry = clamp(Math.round((team.chemistry || 50) + (effects.chemistry || 0)), 0, 100);
  return team;
}

export function addEffects(left = {}, right = {}) {
  return {
    morale: (left.morale || 0) + (right.morale || 0),
    chemistry: (left.chemistry || 0) + (right.chemistry || 0),
    mediaPressure: (left.mediaPressure || 0) + (right.mediaPressure || 0),
    fanConfidence: (left.fanConfidence || 0) + (right.fanConfidence || 0),
    boardConfidence: (left.boardConfidence || 0) + (right.boardConfidence || 0),
  };
}
