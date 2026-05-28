import { teams2026 } from './seedTeams2026.js';

export const groups2026 = teams2026.reduce((groups, team) => {
  const current = groups[team.group] || [];
  return {
    ...groups,
    [team.group]: [...current, team.fifaCode],
  };
}, {});
