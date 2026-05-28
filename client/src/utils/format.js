export function formatDateTime(value, language = 'tr') {
  if (!value) return '-';
  return new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function teamName(team, language = 'tr') {
  if (!team) return '';
  return language === 'tr' ? team.nameTR : team.nameEN;
}

export function percent(value) {
  return `${Math.round(value || 0)}%`;
}
