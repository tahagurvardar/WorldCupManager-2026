import { teams2026 } from './seedTeams2026.js';

const coachSource = {
  sourceName: 'Manual national team coach seed compiled from federation/public squad references',
  sourceUrl: 'https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/teams',
  verificationStatus: 'provisional',
  lastVerifiedAt: new Date('2026-05-15T00:00:00.000Z'),
};

export const coaches2026 = teams2026.map((team) => ({
  fullName: team.coachName,
  nationality: team.nameEN,
  fifaCode: team.fifaCode,
  tacticalStyle: team.worldRanking <= 15 ? 'Front-foot control' : team.worldRanking <= 45 ? 'Balanced transition' : 'Compact underdog block',
  reputation: Math.max(48, 92 - team.worldRanking / 2),
  sourceMetadata: coachSource,
}));
