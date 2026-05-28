import { News } from '../models/News.js';
import { Notification } from '../models/Notification.js';

export async function createNews(item) {
  return News.create(item);
}

export async function notifyUser(userId, notification) {
  if (!userId) return null;
  return Notification.create({
    user: userId,
    ...notification,
  });
}

export async function buildResultNews(match) {
  const homeWon = match.score.home > match.score.away || match.penalties.home > match.penalties.away;
  const winner = homeWon ? match.home : match.away;
  const loser = homeWon ? match.away : match.home;

  return createNews({
    category: 'result',
    match: match._id,
    team: winner.team,
    pressureLevel: 62,
    title: {
      tr: `${winner.nameTR} kritik galibiyet aldı`,
      en: `${winner.nameEN} earn an important win`,
    },
    body: {
      tr: `${winner.nameTR}, ${loser.nameTR} karşısında ${match.score.home}-${match.score.away} skorla turnuvadaki yoluna güç kattı.`,
      en: `${winner.nameEN} strengthened their tournament path with a ${match.score.home}-${match.score.away} result against ${loser.nameEN}.`,
    },
  });
}
