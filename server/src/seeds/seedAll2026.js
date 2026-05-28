import mongoose from 'mongoose';
import slugify from 'slugify';
import { connectDatabase, closeDatabase } from '../config/db.js';
import { NationalTeam } from '../models/NationalTeam.js';
import { Coach } from '../models/Coach.js';
import { Player } from '../models/Player.js';
import { Match } from '../models/Match.js';
import { News } from '../models/News.js';
import { Notification } from '../models/Notification.js';
import { PressConference } from '../models/PressConference.js';
import { Tactic } from '../models/Tactic.js';
import { User } from '../models/User.js';
import { teams2026 } from './seedTeams2026.js';
import { coaches2026 } from './seedCoaches2026.js';
import { groups2026 } from './seedGroups2026.js';
import { buildFixtureSeeds } from './seedFixtures2026.js';
import { buildPlayerSeeds } from './seedPlayers2026.js';

function teamSlug(name) {
  return slugify(name, { lower: true, strict: true, locale: 'tr' });
}

async function clearSeededCollections() {
  await Promise.all([
    NationalTeam.deleteMany({}),
    Coach.deleteMany({}),
    Player.deleteMany({}),
    Match.deleteMany({}),
    News.deleteMany({}),
    Notification.deleteMany({}),
    PressConference.deleteMany({}),
    Tactic.deleteMany({}),
    User.deleteMany({ email: /@wcm\.dev$/ }),
  ]);
}

async function seedTeams() {
  const docs = await NationalTeam.insertMany(
    teams2026.map((team) => ({
      ...team,
      slug: teamSlug(team.nameEN),
      morale: team.worldRanking <= 15 ? 58 : team.worldRanking <= 45 ? 52 : 47,
      chemistry: team.worldRanking <= 15 ? 59 : team.worldRanking <= 45 ? 53 : 48,
      fatigue: 14 + (team.worldRanking % 10),
      tournamentStatus: 'group_stage',
    })),
  );

  return new Map(docs.map((team) => [team.fifaCode, team]));
}

async function seedCoaches(teamMap) {
  const docs = await Coach.insertMany(
    coaches2026.map((coach) => ({
      fullName: coach.fullName,
      nationality: teamMap.get(coach.fifaCode)?.nameEN || coach.nationality,
      team: teamMap.get(coach.fifaCode)?._id,
      tacticalStyle: coach.tacticalStyle,
      reputation: coach.reputation,
      sourceMetadata: coach.sourceMetadata,
    })),
  );

  await Promise.all(
    docs.map((coach) => NationalTeam.findByIdAndUpdate(coach.team, { coach: coach._id })),
  );
}

async function seedPlayers(teamMap) {
  const seeds = buildPlayerSeeds(teams2026);

  return Player.insertMany(
    seeds.map((player) => ({
      ...player,
      country: teamMap.get(player.fifaCode)._id,
    })),
  );
}

async function seedFixtures(teamMap) {
  const groupedIds = Object.fromEntries(
    Object.entries(groups2026).map(([group, codes]) => [group, codes.map((code) => teamMap.get(code))]),
  );
  const fixtureSeeds = buildFixtureSeeds(groupedIds);

  return Match.insertMany(
    fixtureSeeds.map((fixture) => {
      const home = fixture.homeCode;
      const away = fixture.awayCode;

      return {
        matchNumber: fixture.matchNumber,
        stage: fixture.stage,
        group: fixture.group,
        status: fixture.status,
        kickoffAt: fixture.kickoffAt,
        venue: fixture.venue,
        home: {
          team: home._id,
          nameTR: home.nameTR,
          nameEN: home.nameEN,
          fifaCode: home.fifaCode,
          flagEmoji: home.flagEmoji,
          flagCode: home.flagCode,
        },
        away: {
          team: away._id,
          nameTR: away.nameTR,
          nameEN: away.nameEN,
          fifaCode: away.fifaCode,
          flagEmoji: away.flagEmoji,
          flagCode: away.flagCode,
        },
      };
    }),
  );
}

async function seedNews(teamMap) {
  const favorites = ['FRA', 'ARG', 'BRA', 'ESP', 'ENG'];
  const turkey = teamMap.get('TUR');

  return News.insertMany([
    {
      category: 'tournament',
      pressureLevel: 73,
      title: {
        tr: 'Turnuva favorileri netleşiyor',
        en: 'Tournament favorites are taking shape',
      },
      body: {
        tr: 'Fransa, Arjantin, Brezilya, İspanya ve İngiltere turnuva öncesi en güçlü adaylar arasında gösteriliyor.',
        en: 'France, Argentina, Brazil, Spain and England are considered among the strongest pre-tournament contenders.',
      },
      team: teamMap.get(favorites[0])._id,
    },
    {
      category: 'media',
      pressureLevel: 68,
      title: {
        tr: 'Türkiye D Grubu için iddialı hazırlanıyor',
        en: 'Türkiye prepare ambitiously for Group D',
      },
      body: {
        tr: 'Teknik heyet, ABD, Paraguay ve Avustralya maçları öncesi tempo ile savunma dengesini korumaya odaklandı.',
        en: 'The technical staff are focused on balancing tempo and defensive control before matches against USA, Paraguay and Australia.',
      },
      team: turkey._id,
    },
    {
      category: 'team',
      pressureLevel: 59,
      title: {
        tr: 'Kanat rotasyonları turnuvanın ana başlıklarından biri',
        en: 'Wide rotations become a key tournament storyline',
      },
      body: {
        tr: 'Modern milli takımlar 48 takımlı formatta fiziksel yükü yönetmek için geniş kanat ve bek rotasyonlarına güveniyor.',
        en: 'Modern national teams rely on wide and full-back rotations to manage workload in the 48-team format.',
      },
    },
  ]);
}

async function seedUsers(teamMap) {
  const passwordHash = await User.hashPassword('WorldCup2026!');
  return User.insertMany([
    {
      name: 'Demo Manager',
      email: 'manager@wcm.dev',
      passwordHash,
      role: 'manager',
      selectedTeam: teamMap.get('TUR')._id,
      preferredLanguage: 'tr',
    },
    {
      name: 'Admin Coach',
      email: 'admin@wcm.dev',
      passwordHash,
      role: 'admin',
      selectedTeam: teamMap.get('TUR')._id,
      preferredLanguage: 'tr',
    },
  ]);
}

export async function seedDatabase({ force = false } = {}) {
  const existingTeams = await NationalTeam.countDocuments();
  if (existingTeams > 0 && !force) {
    return { skipped: true, teams: existingTeams };
  }

  if (force) {
    await clearSeededCollections();
  }

  const teamMap = await seedTeams();
  await seedCoaches(teamMap);
  const players = await seedPlayers(teamMap);
  const fixtures = await seedFixtures(teamMap);
  await seedNews(teamMap);
  await seedUsers(teamMap);

  return {
    skipped: false,
    teams: teamMap.size,
    players: players.length,
    matches: fixtures.length,
  };
}

if (process.argv[1] && process.argv[1].endsWith('seedAll2026.js')) {
  try {
    await connectDatabase();
    const summary = await seedDatabase({ force: process.argv.includes('--force') });
    console.log(`WorldCupManager 2026 seed complete: ${JSON.stringify(summary)}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await closeDatabase();
    }
  }
}
