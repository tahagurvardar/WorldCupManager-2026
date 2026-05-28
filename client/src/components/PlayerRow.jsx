import { useLanguage } from '../context/LanguageContext.jsx';
import { teamName } from '../utils/format.js';

function statValue(player, statKey) {
  const stats = player.tournamentStats || {};
  const map = {
    goals: stats.goals || 0,
    assists: stats.assists || 0,
    appearances: stats.appearances || 0,
    avgRating: Number(stats.avgRating || 0).toFixed(1),
    yellowCards: stats.yellowCards || 0,
    redCards: stats.redCards || 0,
    cleanSheets: stats.cleanSheets || 0,
  };

  return map[statKey] ?? player.overall;
}

export function PlayerRow({ player, selectable = false, checked = false, onToggle, statKey }) {
  const { t, language } = useLanguage();
  const country = player.country ? teamName(player.country, language) : '';
  const ageLabel = language === 'tr' ? `${player.age} yaş` : `age ${player.age}`;
  const meta = [country || player.country?.fifaCode, ageLabel].filter(Boolean).join(' · ');

  return (
    <div className="player-row">
      {selectable ? (
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle?.(player)}
          aria-label={player.fullName}
        />
      ) : null}
      <div>
        <strong>{player.fullName}</strong>
        <span>{meta}</span>
      </div>
      <span className="chip">{t(`positions.${player.primaryPosition}`)}</span>
      <b>{statValue(player, statKey)}</b>
    </div>
  );
}
