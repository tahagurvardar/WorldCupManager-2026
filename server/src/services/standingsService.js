export function createEmptyStanding(team) {
  return {
    team,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    fairPlay: 0,
  };
}

function applyResult(row, goalsFor, goalsAgainst, yellowCards = 0, redCards = 0) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;
  row.fairPlay -= yellowCards + redCards * 4;

  if (goalsFor > goalsAgainst) {
    row.won += 1;
    row.points += 3;
  } else if (goalsFor === goalsAgainst) {
    row.drawn += 1;
    row.points += 1;
  } else {
    row.lost += 1;
  }
}

export function calculateGroupStandings(teams, matches) {
  const rows = new Map();

  teams.forEach((team) => {
    rows.set(String(team._id), createEmptyStanding(team));
  });

  matches
    .filter((match) => match.stage === 'group' && match.status === 'completed')
    .forEach((match) => {
      const homeId = String(match.home.team?._id || match.home.team);
      const awayId = String(match.away.team?._id || match.away.team);
      const home = rows.get(homeId);
      const away = rows.get(awayId);

      if (!home || !away) return;

      applyResult(home, match.score.home, match.score.away, match.stats.home.yellowCards, match.stats.home.redCards);
      applyResult(away, match.score.away, match.score.home, match.stats.away.yellowCards, match.stats.away.redCards);
    });

  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.fairPlay !== a.fairPlay) return b.fairPlay - a.fairPlay;
    return a.team.worldRanking - b.team.worldRanking;
  });
}

export function calculateQualifiedTeams(groupTables) {
  const direct = [];
  const thirdPlaced = [];

  groupTables.forEach(({ group, table }) => {
    direct.push({ group, seed: `${group}1`, ...table[0] });
    direct.push({ group, seed: `${group}2`, ...table[1] });
    thirdPlaced.push({ group, seed: `${group}3`, ...table[2] });
  });

  const bestThird = thirdPlaced
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.team.worldRanking - b.team.worldRanking;
    })
    .slice(0, 8);

  return [...direct, ...bestThird];
}
