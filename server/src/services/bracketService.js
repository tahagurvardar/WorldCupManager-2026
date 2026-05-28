import { Match } from '../models/Match.js';

const roundOf32Template = [
  { matchNumber: 73, homeSeed: 'A2', awaySeed: 'B2' },
  { matchNumber: 74, homeSeed: 'E1', awaySeed: 'T1' },
  { matchNumber: 75, homeSeed: 'F1', awaySeed: 'C2' },
  { matchNumber: 76, homeSeed: 'C1', awaySeed: 'F2' },
  { matchNumber: 77, homeSeed: 'I1', awaySeed: 'T2' },
  { matchNumber: 78, homeSeed: 'E2', awaySeed: 'I2' },
  { matchNumber: 79, homeSeed: 'A1', awaySeed: 'T3' },
  { matchNumber: 80, homeSeed: 'L1', awaySeed: 'T4' },
  { matchNumber: 81, homeSeed: 'D1', awaySeed: 'T5' },
  { matchNumber: 82, homeSeed: 'G1', awaySeed: 'T6' },
  { matchNumber: 83, homeSeed: 'K2', awaySeed: 'L2' },
  { matchNumber: 84, homeSeed: 'H1', awaySeed: 'J2' },
  { matchNumber: 85, homeSeed: 'B1', awaySeed: 'T7' },
  { matchNumber: 86, homeSeed: 'J1', awaySeed: 'H2' },
  { matchNumber: 87, homeSeed: 'K1', awaySeed: 'T8' },
  { matchNumber: 88, homeSeed: 'D2', awaySeed: 'G2' },
];

const advancementTemplate = {
  round_of_16: [
    { matchNumber: 89, homeFrom: 73, awayFrom: 75 },
    { matchNumber: 90, homeFrom: 74, awayFrom: 77 },
    { matchNumber: 91, homeFrom: 76, awayFrom: 78 },
    { matchNumber: 92, homeFrom: 79, awayFrom: 80 },
    { matchNumber: 93, homeFrom: 83, awayFrom: 84 },
    { matchNumber: 94, homeFrom: 81, awayFrom: 82 },
    { matchNumber: 95, homeFrom: 86, awayFrom: 88 },
    { matchNumber: 96, homeFrom: 85, awayFrom: 87 },
  ],
  quarter_final: [
    { matchNumber: 97, homeFrom: 89, awayFrom: 90 },
    { matchNumber: 98, homeFrom: 93, awayFrom: 94 },
    { matchNumber: 99, homeFrom: 91, awayFrom: 92 },
    { matchNumber: 100, homeFrom: 95, awayFrom: 96 },
  ],
  semi_final: [
    { matchNumber: 101, homeFrom: 97, awayFrom: 98 },
    { matchNumber: 102, homeFrom: 99, awayFrom: 100 },
  ],
  third_place: [
    { matchNumber: 103, homeFrom: 101, awayFrom: 102, loserMatch: true },
  ],
  final: [
    { matchNumber: 104, homeFrom: 101, awayFrom: 102 },
  ],
};

const stageByNumber = new Map([
  ...roundOf32Template.map((item) => [item.matchNumber, 'round_of_32']),
  ...Object.entries(advancementTemplate).flatMap(([stage, items]) => items.map((item) => [item.matchNumber, stage])),
]);

const knockoutSchedule = {
  73: ['2026-06-28T23:00:00.000Z', 'Los Angeles Stadium'],
  74: ['2026-06-29T19:00:00.000Z', 'Boston Stadium'],
  75: ['2026-06-29T22:00:00.000Z', 'Monterrey Stadium'],
  76: ['2026-06-30T01:00:00.000Z', 'Houston Stadium'],
  77: ['2026-06-30T19:00:00.000Z', 'New York New Jersey Stadium'],
  78: ['2026-06-30T22:00:00.000Z', 'Dallas Stadium'],
  79: ['2026-07-01T01:00:00.000Z', 'Mexico City Stadium'],
  80: ['2026-07-01T19:00:00.000Z', 'Atlanta Stadium'],
  81: ['2026-07-01T22:00:00.000Z', 'San Francisco Bay Area Stadium'],
  82: ['2026-07-02T01:00:00.000Z', 'Seattle Stadium'],
  83: ['2026-07-02T19:00:00.000Z', 'Toronto Stadium'],
  84: ['2026-07-02T22:00:00.000Z', 'Los Angeles Stadium'],
  85: ['2026-07-03T01:00:00.000Z', 'BC Place Vancouver'],
  86: ['2026-07-03T19:00:00.000Z', 'Miami Stadium'],
  87: ['2026-07-03T22:00:00.000Z', 'Kansas City Stadium'],
  88: ['2026-07-04T01:00:00.000Z', 'Dallas Stadium'],
  89: ['2026-07-04T19:00:00.000Z', 'Philadelphia Stadium'],
  90: ['2026-07-04T22:00:00.000Z', 'Houston Stadium'],
  91: ['2026-07-05T19:00:00.000Z', 'New York New Jersey Stadium'],
  92: ['2026-07-05T22:00:00.000Z', 'Mexico City Stadium'],
  93: ['2026-07-06T19:00:00.000Z', 'Dallas Stadium'],
  94: ['2026-07-06T22:00:00.000Z', 'Seattle Stadium'],
  95: ['2026-07-07T19:00:00.000Z', 'Atlanta Stadium'],
  96: ['2026-07-07T22:00:00.000Z', 'BC Place Vancouver'],
  97: ['2026-07-09T22:00:00.000Z', 'Boston Stadium'],
  98: ['2026-07-10T22:00:00.000Z', 'Los Angeles Stadium'],
  99: ['2026-07-11T22:00:00.000Z', 'Miami Stadium'],
  100: ['2026-07-12T01:00:00.000Z', 'Kansas City Stadium'],
  101: ['2026-07-14T22:00:00.000Z', 'Dallas Stadium'],
  102: ['2026-07-15T22:00:00.000Z', 'Atlanta Stadium'],
  103: ['2026-07-18T22:00:00.000Z', 'Miami Stadium'],
  104: ['2026-07-19T22:00:00.000Z', 'New York New Jersey Stadium'],
};

function sortedThirdPlaced(groupTables) {
  return groupTables
    .map(({ group, table }) => ({ group, seed: `${group}3`, ...table[2] }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      if (b.fairPlay !== a.fairPlay) return b.fairPlay - a.fairPlay;
      return a.team.worldRanking - b.team.worldRanking;
    });
}

function snapshot(team) {
  if (!team) return null;
  return {
    team: team._id || team.team,
    nameTR: team.nameTR,
    nameEN: team.nameEN,
    fifaCode: team.fifaCode,
    flagEmoji: team.flagEmoji,
    flagCode: team.flagCode,
  };
}

function seedMapFromTables(groupTables) {
  const seeds = new Map();

  groupTables.forEach(({ group, table }) => {
    table.slice(0, 3).forEach((row, index) => {
      seeds.set(`${group}${index + 1}`, { ...row, seed: `${group}${index + 1}`, group });
    });
  });

  sortedThirdPlaced(groupTables).slice(0, 8).forEach((row, index) => {
    seeds.set(`T${index + 1}`, { ...row, bestThirdRank: index + 1 });
  });

  return seeds;
}

function seedLabel(seed) {
  if (seed.startsWith('T')) return `Best 3rd #${seed.replace('T', '')}`;
  return `${seed[0]}${seed[1]}`;
}

function winnerSnapshot(match) {
  if (!match?.winner) return null;
  const winnerId = String(match.winner._id || match.winner);
  return String(match.home.team._id || match.home.team) === winnerId ? match.home : match.away;
}

function loserSnapshot(match) {
  if (!match?.winner) return null;
  const winnerId = String(match.winner._id || match.winner);
  return String(match.home.team._id || match.home.team) === winnerId ? match.away : match.home;
}

function normalizeMatch(match, fallback = {}) {
  if (!match) return fallback;
  const plain = match.toObject ? match.toObject() : match;
  return {
    ...fallback,
    ...plain,
    slot: plain.matchNumber,
    sourceHome: fallback.sourceHome,
    sourceAway: fallback.sourceAway,
  };
}

function scheduleFor(matchNumber) {
  const [kickoffAt, venue] = knockoutSchedule[matchNumber];
  return { kickoffAt: new Date(kickoffAt), venue };
}

async function createMatch(matchNumber, home, away) {
  if (!home || !away) return null;
  const existing = await Match.findOne({ matchNumber });
  if (existing) return existing;

  const stage = stageByNumber.get(matchNumber);
  const schedule = scheduleFor(matchNumber);

  return Match.create({
    matchNumber,
    stage,
    status: 'scheduled',
    kickoffAt: schedule.kickoffAt,
    venue: schedule.venue,
    home: snapshot(home),
    away: snapshot(away),
  });
}

async function ensureRoundOf32(groupTables) {
  const seeds = seedMapFromTables(groupTables);

  for (const item of roundOf32Template) {
    const home = seeds.get(item.homeSeed)?.team;
    const away = seeds.get(item.awaySeed)?.team;
    await createMatch(item.matchNumber, home, away);
  }
}

async function ensureAdvancementRounds(matchesByNumber) {
  for (const [stage, matches] of Object.entries(advancementTemplate)) {
    for (const item of matches) {
      const existing = matchesByNumber.get(item.matchNumber) || await Match.findOne({ matchNumber: item.matchNumber });
      if (existing) {
        matchesByNumber.set(item.matchNumber, existing);
        continue;
      }

      const homeSource = matchesByNumber.get(item.homeFrom) || await Match.findOne({ matchNumber: item.homeFrom });
      const awaySource = matchesByNumber.get(item.awayFrom) || await Match.findOne({ matchNumber: item.awayFrom });

      if (homeSource) matchesByNumber.set(item.homeFrom, homeSource);
      if (awaySource) matchesByNumber.set(item.awayFrom, awaySource);

      if (homeSource?.status !== 'completed' || awaySource?.status !== 'completed') continue;

      const home = item.loserMatch ? loserSnapshot(homeSource) : winnerSnapshot(homeSource);
      const away = item.loserMatch ? loserSnapshot(awaySource) : winnerSnapshot(awaySource);
      const created = await createMatch(item.matchNumber, home, away);
      if (created) matchesByNumber.set(item.matchNumber, created);
    }

    const createdInStage = await Match.find({ stage }).sort({ matchNumber: 1 });
    createdInStage.forEach((match) => matchesByNumber.set(match.matchNumber, match));
  }
}

function projectedRoundOf32(groupTables, matchesByNumber) {
  const seeds = seedMapFromTables(groupTables);
  return roundOf32Template.map((item) => {
    const schedule = scheduleFor(item.matchNumber);
    return normalizeMatch(matchesByNumber.get(item.matchNumber), {
      stage: 'round_of_32',
      slot: item.matchNumber,
      matchNumber: item.matchNumber,
      kickoffAt: schedule.kickoffAt,
      venue: schedule.venue,
      home: snapshot(seeds.get(item.homeSeed)?.team),
      away: snapshot(seeds.get(item.awaySeed)?.team),
      sourceHome: seedLabel(item.homeSeed),
      sourceAway: seedLabel(item.awaySeed),
      projected: true,
    });
  });
}

function projectedAdvancementRound(stage, matchesByNumber) {
  return advancementTemplate[stage].map((item) => {
    const schedule = scheduleFor(item.matchNumber);
    return normalizeMatch(matchesByNumber.get(item.matchNumber), {
      stage,
      slot: item.matchNumber,
      matchNumber: item.matchNumber,
      kickoffAt: schedule.kickoffAt,
      venue: schedule.venue,
      home: null,
      away: null,
      sourceHome: item.loserMatch ? `L${item.homeFrom}` : `W${item.homeFrom}`,
      sourceAway: item.loserMatch ? `L${item.awayFrom}` : `W${item.awayFrom}`,
      projected: true,
    });
  });
}

export async function buildKnockoutBracket(groupTables, { ensure = false } = {}) {
  const groupMatches = await Match.find({ stage: 'group' });
  const allGroupsComplete = groupMatches.length > 0 && groupMatches.every((match) => match.status === 'completed');

  if (ensure && allGroupsComplete) {
    await ensureRoundOf32(groupTables);
  }

  const knockoutMatches = await Match.find({ stage: { $ne: 'group' } }).sort({ matchNumber: 1 });
  const matchesByNumber = new Map(knockoutMatches.map((match) => [match.matchNumber, match]));

  if (ensure && allGroupsComplete) {
    await ensureAdvancementRounds(matchesByNumber);
  }

  const refreshedMatches = await Match.find({ stage: { $ne: 'group' } }).sort({ matchNumber: 1 });
  const refreshedByNumber = new Map(refreshedMatches.map((match) => [match.matchNumber, match]));
  const bestThird = sortedThirdPlaced(groupTables).slice(0, 8);

  return {
    allGroupsComplete,
    qualified: [
      ...groupTables.flatMap(({ group, table }) => table.slice(0, 2).map((row, index) => ({ group, seed: `${group}${index + 1}`, ...row }))),
      ...bestThird,
    ],
    bestThird,
    rounds: {
      round_of_32: projectedRoundOf32(groupTables, refreshedByNumber),
      round_of_16: projectedAdvancementRound('round_of_16', refreshedByNumber),
      quarter_final: projectedAdvancementRound('quarter_final', refreshedByNumber),
      semi_final: projectedAdvancementRound('semi_final', refreshedByNumber),
      third_place: projectedAdvancementRound('third_place', refreshedByNumber),
      final: projectedAdvancementRound('final', refreshedByNumber),
    },
  };
}
