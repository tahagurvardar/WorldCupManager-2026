import { Match } from '../models/Match.js';
import { NationalTeam } from '../models/NationalTeam.js';
import { News } from '../models/News.js';
import { Notification } from '../models/Notification.js';
import { PressConference } from '../models/PressConference.js';
import { calculateGroupStandings } from './standingsService.js';
import { clamp } from '../utils/random.js';

export async function createNews(item) {
  if (!item.dedupeKey) {
    return News.create(item);
  }

  return News.findOneAndUpdate(
    { dedupeKey: item.dedupeKey },
    { $setOnInsert: item },
    { upsert: true, new: true },
  );
}

export async function notifyUser(userId, notification) {
  if (!userId) return null;
  return Notification.create({
    user: userId,
    ...notification,
  });
}

function getId(value) {
  return String(value?._id || value?.id || value);
}

function sideForTeam(match, teamId) {
  return getId(match.home.team) === getId(teamId) ? 'home' : 'away';
}

function opponentForTeam(match, teamId) {
  return sideForTeam(match, teamId) === 'home' ? match.away : match.home;
}

function scoreForSide(match, side) {
  return {
    for: side === 'home' ? match.score.home : match.score.away,
    against: side === 'home' ? match.score.away : match.score.home,
  };
}

function resultContext(match) {
  const isDraw = !match.winner;
  const homeWon = getId(match.winner) === getId(match.home.team);
  const winner = isDraw ? null : homeWon ? match.home : match.away;
  const loser = isDraw ? null : homeWon ? match.away : match.home;
  const margin = Math.abs(match.score.home - match.score.away);

  return {
    isDraw,
    winner,
    loser,
    margin,
    scoreText: `${match.score.home}-${match.score.away}`,
    bigWin: margin >= 3,
    heavyDefeat: margin >= 3,
  };
}

function topRating(match) {
  return [...(match.playerRatings || [])]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || null;
}

function lateGoal(match) {
  return [...(match.events || [])]
    .filter((event) => event.type === 'goal' && event.minute >= 85)
    .sort((a, b) => b.minute - a.minute)[0] || null;
}

function firstEvent(match, type) {
  return (match.events || []).find((event) => event.type === type) || null;
}

function cleanSheetGoalkeeper(match) {
  const cleanSheetCodes = [];
  if (match.score.away === 0) cleanSheetCodes.push(match.home.fifaCode);
  if (match.score.home === 0) cleanSheetCodes.push(match.away.fifaCode);

  if (!cleanSheetCodes.length) return null;

  return [...(match.playerRatings || [])]
    .filter((rating) => rating.position === 'GK' && cleanSheetCodes.includes(rating.teamCode))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0] || null;
}

function pressureForResult(match, teamSnapshot) {
  const context = resultContext(match);
  if (context.isDraw) return 52;
  const won = getId(context.winner.team) === getId(teamSnapshot.team);
  if (won && context.bigWin) return 38;
  if (won) return 44;
  if (context.heavyDefeat) return 82;
  return 68;
}

function derivedReactionMetrics(match, teamSnapshot, pressTone = 'balanced') {
  const context = resultContext(match);
  const side = sideForTeam(match, teamSnapshot.team);
  const score = scoreForSide(match, side);
  const won = !context.isDraw && getId(context.winner.team) === getId(teamSnapshot.team);
  const lost = !context.isDraw && !won;
  const draw = context.isDraw;
  const tonePressure = pressTone === 'confident' ? 6 : pressTone === 'defensive' ? -4 : 0;
  const base = won ? 10 : draw ? 1 : -9;
  const marginBoost = won ? context.margin * 2 : lost ? -context.margin * 2 : 0;
  const cleanSheetBoost = score.against === 0 ? 3 : 0;

  return {
    boardConfidence: Math.round(clamp(55 + base + marginBoost + cleanSheetBoost, 0, 100)),
    fanConfidence: Math.round(clamp(52 + base * 1.2 + marginBoost * 1.5 + cleanSheetBoost, 0, 100)),
    mediaPressure: Math.round(clamp(pressureForResult(match, teamSnapshot) + tonePressure, 0, 100)),
    tacticalReadinessReaction: Math.round(clamp(54 + base + (score.for - score.against) * 3 + cleanSheetBoost, 0, 100)),
  };
}

async function groupOutcome(match) {
  if (match.stage !== 'group' || !match.group) return null;

  const groupMatches = await Match.find({ stage: 'group', group: match.group });
  if (!groupMatches.length || groupMatches.some((groupMatch) => groupMatch.status !== 'completed')) return null;

  const teams = await NationalTeam.find({ group: match.group });
  const table = calculateGroupStandings(teams, groupMatches);

  return {
    group: match.group,
    table,
    qualified: table.slice(0, 2).map((row) => row.team),
    third: table[2]?.team,
    eliminated: table.slice(3).map((row) => row.team),
  };
}

function knockoutOutcome(match) {
  if (match.stage === 'group' || !match.winner) return null;
  const context = resultContext(match);
  return {
    winner: context.winner,
    eliminated: context.loser,
  };
}

async function pressContext(match, teamSnapshot) {
  const conference = await PressConference.findOne({
    match: match._id,
    team: teamSnapshot.team?._id || teamSnapshot.team,
    status: { $in: ['open', 'completed'] },
  }).sort({ updatedAt: -1 });

  const answers = conference?.questions?.map((question) => question.answer).filter(Boolean) || [];
  const stanceCounts = answers.reduce((counts, answer) => {
    counts[answer.stance] = (counts[answer.stance] || 0) + 1;
    return counts;
  }, {});
  const dominant = Object.entries(stanceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'balanced';

  return {
    conference,
    answeredCount: answers.length,
    dominantStance: dominant,
  };
}

function baseMetadata(match, teamSnapshot, press) {
  return {
    matchNumber: match.matchNumber,
    stage: match.stage,
    teamCode: teamSnapshot.fifaCode,
    pressConference: {
      answeredCount: press.answeredCount,
      dominantStance: press.dominantStance,
    },
    managerImpact: derivedReactionMetrics(match, teamSnapshot, press.dominantStance),
  };
}

function createStory(match, category, key, teamSnapshot, title, body, pressureLevel, metadata = {}) {
  const teamId = teamSnapshot.team?._id || teamSnapshot.team;

  return {
    category,
    dedupeKey: `match:${match._id}:${category}:${key}:${getId(teamId)}`,
    match: match._id,
    team: teamId,
    pressureLevel,
    title,
    body,
    metadata,
  };
}

function matchReportStory(match, teamSnapshot, press, outcome) {
  const context = resultContext(match);
  const side = sideForTeam(match, teamSnapshot.team);
  const opponent = opponentForTeam(match, teamSnapshot.team);
  const score = scoreForSide(match, side);
  const won = !context.isDraw && getId(context.winner.team) === getId(teamSnapshot.team);
  const lost = !context.isDraw && !won;
  const groupEliminated = Array.isArray(outcome?.eliminated) && outcome.eliminated.some((team) => getId(team) === getId(teamSnapshot.team));
  const knockoutEliminated = outcome?.eliminated?.team && getId(outcome.eliminated.team) === getId(teamSnapshot.team);
  const qualifier = Array.isArray(outcome?.qualified) && outcome.qualified.some((team) => getId(team) === getId(teamSnapshot.team));
  const eliminated = groupEliminated || knockoutEliminated;
  const suffixTR = qualifier ? ' ve üst tura çıktı' : eliminated ? ' ve turnuvaya veda etti' : '';
  const suffixEN = qualifier ? ' and qualified' : eliminated ? ' and were eliminated' : '';
  const resultTextTR = won ? 'kazandı' : lost ? 'kaybetti' : 'berabere kaldı';
  const resultTextEN = won ? 'won' : lost ? 'lost' : 'drew';

  return createStory(
    match,
    'match_report',
    'result',
    teamSnapshot,
    {
      tr: `${teamSnapshot.nameTR}, ${opponent.nameTR} karşısında ${resultTextTR}`,
      en: `${teamSnapshot.nameEN} ${resultTextEN} against ${opponent.nameEN}`,
    },
    {
      tr: `${teamSnapshot.nameTR}, ${opponent.nameTR} maçından ${score.for}-${score.against} sonuçla ayrıldı${suffixTR}. Maçın ardından soyunma odasında ana gündem tempo, disiplin ve bir sonraki maç planı oldu.`,
      en: `${teamSnapshot.nameEN} finished ${score.for}-${score.against} against ${opponent.nameEN}${suffixEN}. After full-time, the dressing room focus turned to tempo, discipline and the next match plan.`,
    },
    pressureForResult(match, teamSnapshot),
    { ...baseMetadata(match, teamSnapshot, press), result: { won, lost, draw: context.isDraw, score } },
  );
}

function mediaReactionStory(match, teamSnapshot, press) {
  const context = resultContext(match);
  const opponent = opponentForTeam(match, teamSnapshot.team);
  const won = !context.isDraw && getId(context.winner.team) === getId(teamSnapshot.team);
  const toneTR = press.dominantStance === 'confident' ? 'iddialı' : press.dominantStance === 'defensive' ? 'temkinli' : 'dengeli';
  const toneEN = press.dominantStance === 'confident' ? 'confident' : press.dominantStance === 'defensive' ? 'cautious' : 'balanced';
  const angleTR = won ? 'medya özgüveni sonuçla ilişkilendirdi' : context.isDraw ? 'medya açıklamaları ölçülü buldu' : 'medya maç önü sözleri yeniden tartışmaya açtı';
  const angleEN = won ? 'media linked the tone to the result' : context.isDraw ? 'media viewed the message as measured' : 'media reopened debate around the pre-match message';

  return createStory(
    match,
    'media_reaction',
    'press-tone',
    teamSnapshot,
    {
      tr: `${teamSnapshot.nameTR} cephesinde basın tonu gündem oldu`,
      en: `${teamSnapshot.nameEN} media tone becomes a talking point`,
    },
    {
      tr: `${opponent.nameTR} maçı sonrası basın, teknik ekibin maç öncesi ${toneTR} mesajını öne çıkardı; ${angleTR}.`,
      en: `After the ${opponent.nameEN} match, outlets highlighted the staff’s ${toneEN} pre-match message; ${angleEN}.`,
    },
    pressureForResult(match, teamSnapshot),
    baseMetadata(match, teamSnapshot, press),
  );
}

function fanReactionStory(match, teamSnapshot, press) {
  const context = resultContext(match);
  const opponent = opponentForTeam(match, teamSnapshot.team);
  const side = sideForTeam(match, teamSnapshot.team);
  const score = scoreForSide(match, side);
  const won = !context.isDraw && getId(context.winner.team) === getId(teamSnapshot.team);
  const moodTR = won && context.bigWin ? 'coşkulu' : won ? 'umutlu' : context.isDraw ? 'karışık' : context.heavyDefeat ? 'sert' : 'endişeli';
  const moodEN = won && context.bigWin ? 'delighted' : won ? 'encouraged' : context.isDraw ? 'mixed' : context.heavyDefeat ? 'angry' : 'concerned';

  return createStory(
    match,
    'fan_reaction',
    'supporters',
    teamSnapshot,
    {
      tr: `${teamSnapshot.nameTR} taraftarında ${moodTR} hava`,
      en: `${teamSnapshot.nameEN} supporters react with a ${moodEN} mood`,
    },
    {
      tr: `${score.for}-${score.against} biten ${opponent.nameTR} maçından sonra taraftarların ana yorumu mücadele seviyesi, skorun ağırlığı ve teknik tercihler üzerine yoğunlaştı.`,
      en: `After the ${score.for}-${score.against} result against ${opponent.nameEN}, supporters focused on intensity, the weight of the scoreline and the tactical choices.`,
    },
    won ? 42 : context.isDraw ? 58 : 76,
    baseMetadata(match, teamSnapshot, press),
  );
}

function tacticalStory(match, teamSnapshot, press) {
  const side = sideForTeam(match, teamSnapshot.team);
  const opponentSide = side === 'home' ? 'away' : 'home';
  const opponent = opponentForTeam(match, teamSnapshot.team);
  const stats = match.stats?.[side] || {};
  const opponentStats = match.stats?.[opponentSide] || {};
  const possessionEdge = (stats.possession || 50) - (opponentStats.possession || 50);
  const shotEdge = (stats.shots || 0) - (opponentStats.shots || 0);
  const labelTR = possessionEdge >= 6 ? 'top kontrolü' : shotEdge >= 3 ? 'direkt hücum' : 'denge';
  const labelEN = possessionEdge >= 6 ? 'ball control' : shotEdge >= 3 ? 'direct attacking' : 'balance';

  return createStory(
    match,
    'tactical_analysis',
    'match-plan',
    teamSnapshot,
    {
      tr: `${teamSnapshot.nameTR} için taktik rapor: ${labelTR}`,
      en: `${teamSnapshot.nameEN} tactical report: ${labelEN}`,
    },
    {
      tr: `${opponent.nameTR} karşısında topla oynama ${stats.possession || 50}%, şut dengesi ${stats.shots || 0}-${opponentStats.shots || 0} oldu. Teknik ekip, maç planının geçiş savunması ve karar kalitesi bölümünü yeniden değerlendirecek.`,
      en: `Against ${opponent.nameEN}, possession finished at ${stats.possession || 50}% and the shot balance was ${stats.shots || 0}-${opponentStats.shots || 0}. The staff will review transition defense and decision quality in the match plan.`,
    },
    pressureForResult(match, teamSnapshot),
    baseMetadata(match, teamSnapshot, press),
  );
}

function playerSpotlightStory(match, teamSnapshot, press) {
  const top = topRating(match);
  if (!top || top.rating < 7.4) return null;

  return createStory(
    match,
    'player_spotlight',
    `top-${top.player || top.name}`,
    teamSnapshot,
    {
      tr: `${top.name} performansıyla öne çıktı`,
      en: `${top.name} takes the spotlight`,
    },
    {
      tr: `${top.name}, ${top.rating} rating, ${top.goals || 0} gol ve ${top.assists || 0} asistle maçın en dikkat çeken isimlerinden biri oldu.`,
      en: `${top.name} became one of the standout names with a ${top.rating} rating, ${top.goals || 0} goals and ${top.assists || 0} assists.`,
    },
    48,
    baseMetadata(match, teamSnapshot, press),
  );
}

function boardReactionStory(match, teamSnapshot, press) {
  const metrics = derivedReactionMetrics(match, teamSnapshot, press.dominantStance);
  const opponent = opponentForTeam(match, teamSnapshot.team);
  const positive = metrics.boardConfidence >= 58;

  return createStory(
    match,
    'board_reaction',
    'confidence',
    teamSnapshot,
    {
      tr: `${teamSnapshot.nameTR} yönetimi maç sonrası tabloyu değerlendirdi`,
      en: `${teamSnapshot.nameEN} board assesses the aftermath`,
    },
    {
      tr: `${opponent.nameTR} maçının ardından yönetim güveni ${metrics.boardConfidence}/100, taraftar güveni ${metrics.fanConfidence}/100 ve medya baskısı ${metrics.mediaPressure}/100 olarak okunuyor. ${positive ? 'Sonuç, teknik ekibe alan açtı.' : 'Teknik ekip üzerindeki baskı hissedilir şekilde arttı.'}`,
      en: `After the ${opponent.nameEN} match, board confidence reads ${metrics.boardConfidence}/100, fan confidence ${metrics.fanConfidence}/100 and media pressure ${metrics.mediaPressure}/100. ${positive ? 'The result gives the staff more room.' : 'Pressure on the staff has clearly increased.'}`,
    },
    metrics.mediaPressure,
    baseMetadata(match, teamSnapshot, press),
  );
}

function eventDrivenStories(match, teamSnapshot, press) {
  const stories = [];
  const late = lateGoal(match);
  const red = firstEvent(match, 'red_card');
  const injury = firstEvent(match, 'injury');
  const keeper = cleanSheetGoalkeeper(match);

  if (late) {
    stories.push(createStory(
      match,
      'media_reaction',
      `late-goal-${late.minute}`,
      teamSnapshot,
      {
        tr: `${late.playerName || 'Son dakika golü'} maçın hikayesini değiştirdi`,
        en: `${late.playerName || 'A late goal'} changes the match story`,
      },
      {
        tr: `${late.minute}. dakikadaki gol, skorun ve maç sonrası medya tonunun ana kırılma anı olarak öne çıktı.`,
        en: `The goal in minute ${late.minute} became the key turning point for both the scoreline and the post-match media tone.`,
      },
      66,
      baseMetadata(match, teamSnapshot, press),
    ));
  }

  if (red) {
    stories.push(createStory(
      match,
      'tactical_analysis',
      `red-card-${red.minute}`,
      teamSnapshot,
      {
        tr: `${red.playerName || 'Kırmızı kart'} planları bozdu`,
        en: `${red.playerName || 'A red card'} disrupts the plan`,
      },
      {
        tr: `${red.minute}. dakikadaki kırmızı kart sonrası teknik planın dengesi değişti ve maçın kontrolü yeniden şekillendi.`,
        en: `After the red card in minute ${red.minute}, the tactical balance changed and control of the match was reshaped.`,
      },
      75,
      baseMetadata(match, teamSnapshot, press),
    ));
  }

  if (injury) {
    stories.push(createStory(
      match,
      'player_spotlight',
      `injury-${injury.player || injury.minute}`,
      teamSnapshot,
      {
        tr: `${injury.playerName || 'Sakatlık'} teknik ekibi düşündürdü`,
        en: `${injury.playerName || 'An injury'} worries the staff`,
      },
      {
        tr: `${injury.playerName || 'Oyuncunun'} yaşadığı problem, maç sonrası rotasyon ve kondisyon planlarını yeniden gündeme taşıdı.`,
        en: `${injury.playerName || 'The player’s'} issue brought rotation and fitness planning back into focus after the match.`,
      },
      70,
      baseMetadata(match, teamSnapshot, press),
    ));
  }

  if (keeper) {
    stories.push(createStory(
      match,
      'player_spotlight',
      `clean-sheet-${keeper.player || keeper.name}`,
      teamSnapshot,
      {
        tr: `${keeper.name} kalesini gole kapattı`,
        en: `${keeper.name} protects the clean sheet`,
      },
      {
        tr: `${keeper.name}, yaptığı kurtarışlar ve temiz sayfasıyla maçın savunma hikayesinin merkezinde yer aldı.`,
        en: `${keeper.name} stood at the center of the defensive story with key saves and a clean sheet.`,
      },
      42,
      baseMetadata(match, teamSnapshot, press),
    ));
  }

  return stories;
}

async function qualificationStories(match, teamSnapshot, press, group, knockout) {
  const stories = [];
  const teamId = getId(teamSnapshot.team);

  if (group?.qualified?.some((team) => getId(team) === teamId)) {
    stories.push(createStory(
      match,
      'board_reaction',
      'qualified',
      teamSnapshot,
      {
        tr: `${teamSnapshot.nameTR} gruptan çıkmayı garantiledi`,
        en: `${teamSnapshot.nameEN} secure group qualification`,
      },
      {
        tr: `${teamSnapshot.nameTR}, ${group.group} Grubu sonunda ilk iki sıraya girerek eleme turlarına doğrudan yükseldi.`,
        en: `${teamSnapshot.nameEN} finished inside the top two in Group ${group.group} and moved directly into the knockouts.`,
      },
      35,
      baseMetadata(match, teamSnapshot, press),
    ));
  }

  if (group?.eliminated?.some((team) => getId(team) === teamId)) {
    stories.push(createStory(
      match,
      'board_reaction',
      'eliminated-group',
      teamSnapshot,
      {
        tr: `${teamSnapshot.nameTR} için turnuva sona erdi`,
        en: `${teamSnapshot.nameEN} bow out of the tournament`,
      },
      {
        tr: `${teamSnapshot.nameTR}, grup aşamasını ilk üç dışında tamamlayarak turnuvaya veda etti.`,
        en: `${teamSnapshot.nameEN} finished outside the top three in the group stage and exited the tournament.`,
      },
      88,
      baseMetadata(match, teamSnapshot, press),
    ));
  }

  if (knockout?.winner && getId(knockout.winner.team) === teamId) {
    stories.push(createStory(
      match,
      'board_reaction',
      `advanced-${match.stage}`,
      teamSnapshot,
      {
        tr: `${teamSnapshot.nameTR} eleme turunu geçti`,
        en: `${teamSnapshot.nameEN} advance in the knockouts`,
      },
      {
        tr: `${teamSnapshot.nameTR}, ${match.stage} aşamasındaki kritik galibiyetle turnuva yolculuğunu sürdürdü.`,
        en: `${teamSnapshot.nameEN} kept their tournament run alive with a crucial ${match.stage} win.`,
      },
      32,
      baseMetadata(match, teamSnapshot, press),
    ));
  }

  if (knockout?.eliminated && getId(knockout.eliminated.team) === teamId) {
    stories.push(createStory(
      match,
      'board_reaction',
      `eliminated-${match.stage}`,
      teamSnapshot,
      {
        tr: `${teamSnapshot.nameTR} eleme turunda veda etti`,
        en: `${teamSnapshot.nameEN} are eliminated in the knockouts`,
      },
      {
        tr: `${teamSnapshot.nameTR}, ${match.stage} aşamasındaki yenilginin ardından Dünya Kupası yolculuğunu tamamladı.`,
        en: `${teamSnapshot.nameEN} ended their World Cup run after defeat in the ${match.stage}.`,
      },
      90,
      baseMetadata(match, teamSnapshot, press),
    ));
  }

  return stories;
}

async function storiesForTeam(match, teamSnapshot, group, knockout) {
  const press = await pressContext(match, teamSnapshot);
  const spotlight = playerSpotlightStory(match, teamSnapshot, press);

  return [
    matchReportStory(match, teamSnapshot, press, group || knockout),
    mediaReactionStory(match, teamSnapshot, press),
    fanReactionStory(match, teamSnapshot, press),
    tacticalStory(match, teamSnapshot, press),
    boardReactionStory(match, teamSnapshot, press),
    spotlight,
    ...eventDrivenStories(match, teamSnapshot, press),
    ...(await qualificationStories(match, teamSnapshot, press, group, knockout)),
  ].filter(Boolean);
}

export async function buildPostMatchNews(match) {
  const populatedMatch = await Match.findById(match._id)
    .populate('home.team')
    .populate('away.team')
    .populate('winner');

  if (!populatedMatch || populatedMatch.status !== 'completed') return [];

  const [group, knockout] = await Promise.all([
    groupOutcome(populatedMatch),
    Promise.resolve(knockoutOutcome(populatedMatch)),
  ]);

  const stories = [
    ...(await storiesForTeam(populatedMatch, populatedMatch.home, group, knockout)),
    ...(await storiesForTeam(populatedMatch, populatedMatch.away, group, knockout)),
  ];

  return Promise.all(stories.map((story) => createNews(story)));
}

export async function buildResultNews(match) {
  return buildPostMatchNews(match);
}
