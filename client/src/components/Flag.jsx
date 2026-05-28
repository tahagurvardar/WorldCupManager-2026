import { flagUrl } from '../utils/flags.js';

export function Flag({ team, size = 'md' }) {
  const url = flagUrl(team, size === 'lg' ? 160 : 80);
  const className = `flag-img flag-img--${size}`;
  const label = team?.nameTR || team?.nameEN || team?.fifaCode || 'flag';

  if (!url) {
    return <span className={className}>{team?.flagEmoji || ''}</span>;
  }

  return (
    <img
      className={className}
      src={url}
      alt={`${label} flag`}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}
