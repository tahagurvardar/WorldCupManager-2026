import { HttpError } from './httpError.js';
import { clamp, roundTo } from '../utils/random.js';

const formationSlots = {
  '4-3-3': [
    ['GK', 50, 90], ['LB', 18, 72], ['CB', 38, 73], ['CB', 62, 73], ['RB', 82, 72],
    ['CM', 28, 52], ['CDM', 50, 56], ['CM', 72, 52],
    ['LW', 22, 25], ['ST', 50, 20], ['RW', 78, 25],
  ],
  '4-2-3-1': [
    ['GK', 50, 90], ['LB', 18, 72], ['CB', 38, 73], ['CB', 62, 73], ['RB', 82, 72],
    ['CDM', 42, 56], ['CDM', 58, 56], ['LW', 25, 36], ['CAM', 50, 34], ['RW', 75, 36],
    ['ST', 50, 18],
  ],
  '4-4-2': [
    ['GK', 50, 90], ['LB', 18, 72], ['CB', 38, 73], ['CB', 62, 73], ['RB', 82, 72],
    ['LM', 20, 48], ['CM', 40, 52], ['CM', 60, 52], ['RM', 80, 48],
    ['ST', 42, 22], ['ST', 58, 22],
  ],
  '3-5-2': [
    ['GK', 50, 90], ['CB', 35, 72], ['CB', 50, 75], ['CB', 65, 72],
    ['LWB', 18, 50], ['CM', 38, 52], ['CDM', 50, 56], ['CM', 62, 52], ['RWB', 82, 50],
    ['ST', 42, 20], ['ST', 58, 20],
  ],
  '3-4-3': [
    ['GK', 50, 90], ['CB', 35, 72], ['CB', 50, 75], ['CB', 65, 72],
    ['LM', 22, 52], ['CM', 43, 54], ['CM', 57, 54], ['RM', 78, 52],
    ['LW', 25, 25], ['ST', 50, 19], ['RW', 75, 25],
  ],
  '5-3-2': [
    ['GK', 50, 90], ['LWB', 16, 70], ['CB', 34, 74], ['CB', 50, 76], ['CB', 66, 74], ['RWB', 84, 70],
    ['CM', 38, 50], ['CDM', 50, 55], ['CM', 62, 50],
    ['ST', 42, 22], ['ST', 58, 22],
  ],
  '4-1-4-1': [
    ['GK', 50, 90], ['LB', 18, 72], ['CB', 38, 73], ['CB', 62, 73], ['RB', 82, 72],
    ['CDM', 50, 58], ['LM', 20, 43], ['CM', 40, 48], ['CM', 60, 48], ['RM', 80, 43],
    ['ST', 50, 20],
  ],
};

const positionFamilies = {
  GK: ['GK'],
  CB: ['CB', 'LB', 'RB', 'CDM'],
  LB: ['LB', 'LWB', 'CB', 'RB'],
  RB: ['RB', 'RWB', 'CB', 'LB'],
  LWB: ['LWB', 'LB', 'LM', 'LW'],
  RWB: ['RWB', 'RB', 'RM', 'RW'],
  CDM: ['CDM', 'CM', 'CB'],
  CM: ['CM', 'CDM', 'CAM', 'RM', 'LM'],
  CAM: ['CAM', 'CM', 'RW', 'LW', 'ST'],
  LM: ['LM', 'LW', 'LWB', 'CM'],
  RM: ['RM', 'RW', 'RWB', 'CM'],
  LW: ['LW', 'LM', 'ST', 'CAM'],
  RW: ['RW', 'RM', 'ST', 'CAM'],
  ST: ['ST', 'LW', 'RW', 'CAM'],
};

function hasSecondary(player, slot) {
  return player.secondaryPositions?.includes(slot);
}

function positionScore(player, slot) {
  if (player.primaryPosition === slot) return { value: 20, key: 'exactFit' };
  if (hasSecondary(player, slot)) return { value: 12, key: 'secondaryFit' };
  if (positionFamilies[slot]?.includes(player.primaryPosition)) return { value: 4, key: 'roleFit' };
  return { value: -18, key: 'positionRisk' };
}

function statusScore(player) {
  if (player.nationalTeamStatus === 'final') return { value: 12, key: 'finalSquad' };
  if (player.nationalTeamStatus === 'provisional') return { value: 5, key: 'provisionalSquad' };
  return { value: 0, key: 'candidatePool' };
}

function formScore(player) {
  const dynamicForm = player.dynamic?.form ?? 55;
  const avgRating = player.tournamentStats?.avgRating || 6.5;
  const appearances = player.tournamentStats?.appearances || 0;
  const ratingBoost = appearances > 0 ? (avgRating - 6.5) * 4 : 0;
  return roundTo((dynamicForm - 50) * 0.12 + ratingBoost, 2);
}

function fitnessScore(player) {
  const fitness = player.dynamic?.fitness ?? 85;
  const fatigue = player.dynamic?.fatigue ?? 15;
  const minorPenalty = player.injury?.injuryStatus === 'minor' ? 8 : 0;
  return roundTo((fitness - 75) * 0.12 - fatigue * 0.08 - minorPenalty, 2);
}

function scorePlayerForSlot(player, slot) {
  const fit = positionScore(player, slot);
  const status = statusScore(player);
  const form = formScore(player);
  const fitness = fitnessScore(player);
  const overall = player.overall * 0.82;
  const total = roundTo(overall + fit.value + status.value + form + fitness, 2);

  return {
    total,
    reasons: [
      { key: fit.key, value: fit.value },
      { key: status.key, value: status.value },
      { key: 'overallRating', value: player.overall },
      { key: 'formScore', value: form },
      { key: 'fitnessScore', value: fitness },
    ],
  };
}

function leftOutReason(player, selectedIds) {
  if (player.injury?.injuryStatus === 'injured') return 'injured';
  if (player.injury?.injuryStatus === 'minor') return 'minorInjury';
  if (selectedIds.has(String(player._id))) return 'selected';
  if (player.nationalTeamStatus !== 'final') return 'notFinalSquad';
  if ((player.dynamic?.fitness ?? 100) < 72) return 'lowFitness';
  return 'lowerScore';
}

export function buildRecommendedXi({ players, formation }) {
  const slots = formationSlots[formation];
  if (!slots) {
    throw new HttpError(422, 'Unsupported formation');
  }

  const excludedInjured = players.filter((player) => player.injury?.injuryStatus === 'injured');
  const eligible = players
    .filter((player) => player.injury?.injuryStatus !== 'injured')
    .sort((a, b) => {
      const statusDiff = statusScore(b).value - statusScore(a).value;
      if (statusDiff !== 0) return statusDiff;
      return b.overall - a.overall;
    });

  if (eligible.length < 11) {
    throw new HttpError(422, 'Not enough eligible players for a recommended XI');
  }

  const usedIds = new Set();
  const lineup = slots.map(([slot, x, y], index) => {
    const candidates = eligible
      .filter((player) => !usedIds.has(String(player._id)))
      .map((player) => ({
        player,
        score: scorePlayerForSlot(player, slot),
      }))
      .sort((a, b) => b.score.total - a.score.total);

    const selected = candidates[0];
    usedIds.add(String(selected.player._id));

    return {
      slot,
      x,
      y,
      order: index + 1,
      player: selected.player,
      score: selected.score.total,
      reasons: selected.score.reasons,
    };
  });

  const readinessScore = clamp(
    lineup.reduce((sum, item) => sum + item.score, 0) / lineup.length,
    0,
    100,
  );

  const omitted = players
    .filter((player) => !usedIds.has(String(player._id)))
    .sort((a, b) => b.overall - a.overall)
    .slice(0, 8)
    .map((player) => ({
      player,
      reason: leftOutReason(player, usedIds),
    }));

  return {
    formation,
    readinessScore: roundTo(readinessScore, 1),
    lineup,
    omitted,
    pool: {
      total: players.length,
      eligible: eligible.length,
      excludedInjured: excludedInjured.length,
    },
  };
}
