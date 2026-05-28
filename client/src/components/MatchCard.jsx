import { Link } from 'react-router-dom';
import { Flag } from './Flag.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatDateTime } from '../utils/format.js';

export function MatchCard({ match }) {
  const { t, language } = useLanguage();
  const status = match.status === 'completed' ? t('match.completed') : t('match.scheduled');

  return (
    <Link className="match-card" to={`/matches/${match._id}`}>
      <div className="match-card__meta">
        <span>{match.group ? `${t('teams.group')} ${match.group}` : t(`knockout.${match.stage}`)}</span>
        <span>{status}</span>
      </div>
      <div className="match-card__teams">
        <span><Flag team={match.home} /> {language === 'tr' ? match.home.nameTR : match.home.nameEN}</span>
        <strong>{match.status === 'completed' ? `${match.score.home} - ${match.score.away}` : 'vs'}</strong>
        <span><Flag team={match.away} /> {language === 'tr' ? match.away.nameTR : match.away.nameEN}</span>
      </div>
      <div className="match-card__meta">
        <span>{formatDateTime(match.kickoffAt, language)}</span>
        <span>{match.venue}</span>
      </div>
    </Link>
  );
}
