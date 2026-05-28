const defensivePositions = new Set(['CB', 'LB', 'RB', 'LWB', 'RWB']);
const widePositions = new Set(['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB']);

export function evaluateSquad(players) {
  const total = players.length;
  const keepers = players.filter((player) => player.primaryPosition === 'GK').length;
  const defenders = players.filter((player) => defensivePositions.has(player.primaryPosition)).length;
  const wide = players.filter((player) => widePositions.has(player.primaryPosition)).length;
  const strikerDepth = players.filter((player) => player.primaryPosition === 'ST').length;

  const errors = [];
  const warnings = [];

  if (total < 23) errors.push('squad.errors.minPlayers');
  if (total > 26) errors.push('squad.errors.maxPlayers');
  if (keepers < 3) errors.push('squad.errors.minGoalkeepers');

  if (defenders < 7) warnings.push('squad.warnings.lowDefenders');
  if (keepers === 3) warnings.push('squad.warnings.lowBackupGoalkeepers');
  if (wide < 4) warnings.push('squad.warnings.weakWings');
  if (strikerDepth < 2) warnings.push('squad.warnings.lowStrikers');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    counts: {
      total,
      keepers,
      defenders,
      wide,
      strikerDepth,
    },
  };
}
