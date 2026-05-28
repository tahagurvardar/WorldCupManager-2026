const venues = [
  'Mexico City Stadium',
  'BC Place Vancouver',
  'Miami Stadium',
  'Los Angeles Stadium',
  'New York New Jersey Stadium',
  'Toronto Stadium',
  'Atlanta Stadium',
  'Dallas Stadium',
  'Seattle Stadium',
  'Houston Stadium',
  'Philadelphia Stadium',
  'Kansas City Stadium',
  'Boston Stadium',
  'San Francisco Bay Area Stadium',
  'Guadalajara Stadium',
  'Monterrey Stadium',
];

const pairings = [
  [0, 1],
  [2, 3],
  [0, 2],
  [3, 1],
  [0, 3],
  [1, 2],
];

export function buildFixtureSeeds(groupedTeams) {
  let matchNumber = 1;
  const fixtures = [];
  const groups = Object.keys(groupedTeams).sort();
  const start = new Date('2026-06-11T19:00:00.000Z');

  groups.forEach((group, groupIndex) => {
    const teams = groupedTeams[group];
    pairings.forEach(([homeIndex, awayIndex], pairingIndex) => {
      const kickoffAt = new Date(start.getTime());
      kickoffAt.setUTCDate(start.getUTCDate() + Math.floor((matchNumber - 1) / 4));
      kickoffAt.setUTCHours([17, 20, 23, 2][(matchNumber - 1) % 4], 0, 0, 0);

      fixtures.push({
        matchNumber,
        stage: 'group',
        group,
        status: 'scheduled',
        kickoffAt,
        venue: venues[(groupIndex * 2 + pairingIndex) % venues.length],
        homeCode: teams[homeIndex],
        awayCode: teams[awayIndex],
      });
      matchNumber += 1;
    });
  });

  return fixtures;
}
