import { clamp, pickWeighted, roundTo, seededRandom } from '../utils/random.js';

const eventWeights = [
  { value: 'shot', weight: 26 },
  { value: 'corner', weight: 11 },
  { value: 'foul', weight: 16 },
  { value: 'save', weight: 12 },
  { value: 'offside', weight: 8 },
  { value: 'yellow_card', weight: 5 },
  { value: 'woodwork', weight: 3 },
  { value: 'var', weight: 2 },
  { value: 'injury', weight: 2 },
  { value: 'penalty', weight: 2 },
];

const attackingPositions = ['ST', 'LW', 'RW', 'CAM', 'LM', 'RM', 'CM'];
const providerPositions = ['CAM', 'CM', 'LW', 'RW', 'LM', 'RM', 'CDM', 'ST'];
const defensivePositions = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM'];

function choosePlayer(players, rand, preferredPositions) {
  const pool = players.filter((player) => preferredPositions.includes(player.primaryPosition));
  const fallback = pool.length > 0 ? pool : players;
  const weighted = fallback.map((player) => ({
    value: player,
    weight: Math.max(1, player.overall - 50) + (player.dynamic?.form || 50) / 12,
  }));

  return pickWeighted(weighted, rand);
}

function teamStrength(team, players, tactic = {}) {
  const sorted = [...players].sort((a, b) => b.overall - a.overall);
  const topEleven = sorted.slice(0, 11);
  const averageOverall = topEleven.reduce((sum, player) => sum + player.overall, 0) / Math.max(topEleven.length, 1);
  const starBonus = sorted.slice(0, 3).reduce((sum, player) => sum + Math.max(0, player.overall - 82), 0) * 0.4;
  const tacticalIntent =
    (tactic.sliders?.pressing || 55) * 0.04 +
    (tactic.sliders?.tempo || 55) * 0.035 +
    (tactic.sliders?.creativity || 55) * 0.03 +
    (tactic.sliders?.compactness || 55) * 0.015 -
    Math.max(0, (tactic.sliders?.defensiveLine || 50) - 78) * 0.05;

  const rankBonus = clamp((80 - team.worldRanking) * 0.12, -8, 10);
  const chemistryBonus = (team.chemistry - 50) * 0.07;
  const moraleBonus = (team.morale - 50) * 0.06;
  const fatiguePenalty = team.fatigue * 0.06;

  return averageOverall + starBonus + tacticalIntent + rankBonus + chemistryBonus + moraleBonus - fatiguePenalty;
}

function buildDescription(type, context) {
  const minuteTextTR = `(dk. ${context.minute})`;
  const minuteTextEN = `(${context.minute}')`;
  const scoreTR = `${context.homeNameTR} ${context.score.home}-${context.score.away} ${context.awayNameTR}`;
  const scoreEN = `${context.homeNameEN} ${context.score.home}-${context.score.away} ${context.awayNameEN}`;

  const templates = {
    goal: {
      tr: `⚽ ${context.playerName} harika bitirdi! ${scoreTR}. ${minuteTextTR}`,
      en: `⚽ ${context.playerName} finishes brilliantly! ${scoreEN}. ${minuteTextEN}`,
    },
    assist: {
      tr: `${context.relatedPlayerName}, ${context.playerName} için çok akıllı bir pas çıkardı. ${minuteTextTR}`,
      en: `${context.relatedPlayerName} plays a clever ball for ${context.playerName}. ${minuteTextEN}`,
    },
    shot: {
      tr: `${context.playerName} ceza sahası çevresinden şansını denedi. ${minuteTextTR}`,
      en: `${context.playerName} tries his luck from the edge of the area. ${minuteTextEN}`,
    },
    save: {
      tr: `🧤 ${context.playerName} kritik bir kurtarış yaptı. ${minuteTextTR}`,
      en: `🧤 ${context.playerName} makes a crucial save. ${minuteTextEN}`,
    },
    woodwork: {
      tr: `${context.playerName} direğe takıldı; tribünler ayağa kalktı. ${minuteTextTR}`,
      en: `${context.playerName} hits the woodwork and the stadium gasps. ${minuteTextEN}`,
    },
    corner: {
      tr: `${context.teamNameTR} baskıyı artırdı ve korner kazandı. ${minuteTextTR}`,
      en: `${context.teamNameEN} increases the pressure and wins a corner. ${minuteTextEN}`,
    },
    foul: {
      tr: `${context.playerName} orta alanda taktik faul yaptı. ${minuteTextTR}`,
      en: `${context.playerName} commits a tactical foul in midfield. ${minuteTextEN}`,
    },
    yellow_card: {
      tr: `🟨 ${context.playerName} geç müdahale sonrası sarı kart gördü. ${minuteTextTR}`,
      en: `🟨 ${context.playerName} is booked after a late challenge. ${minuteTextEN}`,
    },
    red_card: {
      tr: `🟥 ${context.playerName} için maç erken bitti; kırmızı kart çıktı. ${minuteTextTR}`,
      en: `🟥 ${context.playerName}'s match ends early with a red card. ${minuteTextEN}`,
    },
    injury: {
      tr: `🚑 ${context.playerName} kısa bir tedavi sonrası oyuna devam etmeye çalışıyor. ${minuteTextTR}`,
      en: `🚑 ${context.playerName} receives treatment and tries to continue. ${minuteTextEN}`,
    },
    substitution: {
      tr: `${context.teamNameTR} kulübesinden hamle geldi: ${context.playerName} oyuna dahil oldu. ${minuteTextTR}`,
      en: `${context.teamNameEN} make a change: ${context.playerName} comes on. ${minuteTextEN}`,
    },
    offside: {
      tr: `${context.playerName} savunma arkasına sarktı ama bayrak havada. ${minuteTextTR}`,
      en: `${context.playerName} runs in behind, but the flag is up. ${minuteTextEN}`,
    },
    var: {
      tr: `VAR incelemesi tamamlandı; hakem oyunu devam ettiriyor. ${minuteTextTR}`,
      en: `VAR check complete; the referee lets play continue. ${minuteTextEN}`,
    },
    penalty: {
      tr: `Penaltı! ${context.playerName} topun başında. ${minuteTextTR}`,
      en: `Penalty! ${context.playerName} steps up. ${minuteTextEN}`,
    },
    penalty_missed: {
      tr: `${context.playerName} penaltıyı değerlendiremedi. ${minuteTextTR}`,
      en: `${context.playerName} fails to convert from the spot. ${minuteTextEN}`,
    },
  };

  return templates[type] || templates.shot;
}

function eventSide(homeStrength, awayStrength, rand) {
  const homeChance = clamp(homeStrength / (homeStrength + awayStrength), 0.36, 0.64);
  return rand() <= homeChance ? 'home' : 'away';
}

function addPlayerRating(map, player, teamCode, bump) {
  if (!player) return;
  const key = String(player._id);
  const current = map.get(key) || {
    player: player._id,
    name: player.fullName,
    teamCode,
    position: player.primaryPosition,
    rating: 6.4,
    goals: 0,
    assists: 0,
  };

  current.rating = clamp(roundTo(current.rating + bump, 1), 4.8, 10);
  map.set(key, current);
}

function buildEvent({ type, minute, side, match, player, relatedPlayer, score }) {
  const teamSnapshot = side === 'home' ? match.home : match.away;
  const context = {
    minute,
    score,
    playerName: player?.fullName || 'Unknown player',
    relatedPlayerName: relatedPlayer?.fullName || '',
    teamNameTR: teamSnapshot.nameTR,
    teamNameEN: teamSnapshot.nameEN,
    homeNameTR: match.home.nameTR,
    homeNameEN: match.home.nameEN,
    awayNameTR: match.away.nameTR,
    awayNameEN: match.away.nameEN,
  };

  return {
    minute,
    type,
    team: teamSnapshot.team,
    player: player?._id,
    relatedPlayer: relatedPlayer?._id,
    playerName: player?.fullName,
    relatedPlayerName: relatedPlayer?.fullName,
    score: { ...score },
    description: buildDescription(type, context),
  };
}

function createPenaltyShootout(rand, homeStrength, awayStrength) {
  let home = 0;
  let away = 0;
  let kicks = 5;

  for (let index = 0; index < kicks; index += 1) {
    if (rand() < clamp(0.72 + homeStrength / 600, 0.68, 0.86)) home += 1;
    if (rand() < clamp(0.72 + awayStrength / 600, 0.68, 0.86)) away += 1;
  }

  while (home === away) {
    if (rand() < clamp(0.72 + homeStrength / 600, 0.68, 0.86)) home += 1;
    if (rand() < clamp(0.72 + awayStrength / 600, 0.68, 0.86)) away += 1;
    kicks += 1;
    if (kicks > 10 && home === away) home += homeStrength >= awayStrength ? 1 : 0;
    if (kicks > 10 && home === away) away += awayStrength > homeStrength ? 1 : 0;
  }

  return { home, away };
}

export function simulateMatchEngine({ match, homePlayers, awayPlayers, homeTactic = {}, awayTactic = {} }) {
  const rand = seededRandom(`${match.matchNumber}-${match.home.fifaCode}-${match.away.fifaCode}`);
  const homeStrength = teamStrength(match.home.team, homePlayers, homeTactic);
  const awayStrength = teamStrength(match.away.team, awayPlayers, awayTactic);
  const eventCount = Math.round(22 + rand() * 16 + Math.abs(homeStrength - awayStrength) / 5);
  const events = [];
  const ratingMap = new Map();
  const score = { home: 0, away: 0 };
  const stats = {
    home: { possession: 50, xG: 0, shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0, saves: 0 },
    away: { possession: 50, xG: 0, shots: 0, shotsOnTarget: 0, corners: 0, fouls: 0, yellowCards: 0, redCards: 0, saves: 0 },
  };
  const momentum = [];
  const usedMinutes = new Set();

  const homePossession = clamp(50 + (homeStrength - awayStrength) * 1.2 + (homeTactic.sliders?.tempo || 50) * 0.03 - (awayTactic.sliders?.pressing || 50) * 0.02, 35, 65);
  stats.home.possession = Math.round(homePossession);
  stats.away.possession = 100 - stats.home.possession;

  for (let index = 0; index < eventCount; index += 1) {
    let minute = Math.floor(2 + rand() * 90);
    while (usedMinutes.has(minute)) minute += 1;
    usedMinutes.add(minute);

    const side = eventSide(homeStrength, awayStrength, rand);
    const attacking = side === 'home' ? homePlayers : awayPlayers;
    const defending = side === 'home' ? awayPlayers : homePlayers;
    const activeStats = stats[side];
    const opposingStats = stats[side === 'home' ? 'away' : 'home'];
    let type = pickWeighted(eventWeights, rand);
    let player = choosePlayer(attacking, rand, attackingPositions);
    let relatedPlayer = null;

    const goalLikelihood = clamp(0.045 + (side === 'home' ? homeStrength - awayStrength : awayStrength - homeStrength) / 900, 0.025, 0.075);
    if ((type === 'shot' || type === 'penalty') && rand() < goalLikelihood + (type === 'penalty' ? 0.38 : 0)) {
      type = 'goal';
    }

    if (type === 'penalty' && rand() > 0.74) {
      type = 'penalty_missed';
    }

    if (type === 'yellow_card' && rand() < 0.12) {
      type = 'red_card';
    }

    if (type === 'save') {
      player = choosePlayer(defending, rand, ['GK']);
      opposingStats.shots += 1;
      opposingStats.shotsOnTarget += 1;
      activeStats.saves += 1;
      addPlayerRating(ratingMap, player, side === 'home' ? match.away.fifaCode : match.home.fifaCode, 0.25);
    }

    if (type === 'goal') {
      score[side] += 1;
      activeStats.shots += 1;
      activeStats.shotsOnTarget += 1;
      activeStats.xG += roundTo(0.18 + rand() * 0.42, 2);
      relatedPlayer = rand() > 0.22 ? choosePlayer(attacking, rand, providerPositions) : null;
      addPlayerRating(ratingMap, player, side === 'home' ? match.home.fifaCode : match.away.fifaCode, 1.1);
      addPlayerRating(ratingMap, relatedPlayer, side === 'home' ? match.home.fifaCode : match.away.fifaCode, 0.55);

      if (relatedPlayer) {
        events.push(buildEvent({ type: 'assist', minute, side, match, player, relatedPlayer, score }));
      }
    }

    if (type === 'shot' || type === 'woodwork' || type === 'penalty_missed') {
      activeStats.shots += 1;
      activeStats.shotsOnTarget += type === 'shot' && rand() > 0.45 ? 1 : 0;
      activeStats.xG += roundTo(type === 'penalty_missed' ? 0.76 : 0.04 + rand() * 0.22, 2);
      addPlayerRating(ratingMap, player, side === 'home' ? match.home.fifaCode : match.away.fifaCode, type === 'woodwork' ? 0.2 : 0.05);
    }

    if (type === 'corner') activeStats.corners += 1;
    if (type === 'foul') activeStats.fouls += 1;
    if (type === 'yellow_card') activeStats.yellowCards += 1;
    if (type === 'red_card') activeStats.redCards += 1;

    events.push(buildEvent({ type, minute, side, match, player, relatedPlayer, score }));
  }

  events.sort((a, b) => a.minute - b.minute);

  if (match.stage !== 'group' && score.home === score.away) {
    const extraHome = rand() < clamp(0.15 + homeStrength / 900, 0.12, 0.23) ? 1 : 0;
    const extraAway = rand() < clamp(0.15 + awayStrength / 900, 0.12, 0.23) ? 1 : 0;
    score.home += extraHome;
    score.away += extraAway;

    if (extraHome || extraAway) {
      const side = extraHome ? 'home' : 'away';
      const attacking = side === 'home' ? homePlayers : awayPlayers;
      const player = choosePlayer(attacking, rand, attackingPositions);
      events.push(buildEvent({
        type: 'goal',
        minute: Math.floor(94 + rand() * 25),
        side,
        match,
        player,
        score,
      }));
    }
  }

  const penalties = match.stage !== 'group' && score.home === score.away ? createPenaltyShootout(rand, homeStrength, awayStrength) : { home: null, away: null };

  for (let minute = 5; minute <= 90; minute += 5) {
    const homeValue = clamp(48 + (homeStrength - awayStrength) * 0.7 + Math.sin(minute / 11) * 8 + (rand() - 0.5) * 18, 8, 92);
    momentum.push({
      minute,
      home: Math.round(homeValue),
      away: Math.round(100 - homeValue),
    });
  }

  const winner =
    score.home > score.away || penalties.home > penalties.away
      ? match.home.team
      : score.away > score.home || penalties.away > penalties.home
        ? match.away.team
        : null;

  const allStarters = [...homePlayers.slice(0, 11), ...awayPlayers.slice(0, 11)];
  allStarters.forEach((player) => {
    addPlayerRating(ratingMap, player, homePlayers.includes(player) ? match.home.fifaCode : match.away.fifaCode, (rand() - 0.35) * 0.8);
  });

  return {
    score,
    penalties,
    winner,
    stats: {
      home: { ...stats.home, xG: roundTo(stats.home.xG, 2) },
      away: { ...stats.away, xG: roundTo(stats.away.xG, 2) },
    },
    events,
    momentum,
    playerRatings: [...ratingMap.values()].map((rating) => ({
      ...rating,
      rating: roundTo(rating.rating, 1),
      goals: events.filter((event) => event.type === 'goal' && String(event.player) === String(rating.player)).length,
      assists: events.filter((event) => event.type === 'assist' && String(event.relatedPlayer) === String(rating.player)).length,
    })),
  };
}
