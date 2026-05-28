import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Flag } from './Flag.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';
import { teamName } from '../utils/format.js';

export function SearchCommand() {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ teams: [], players: [], matches: [] });

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }

    const timeout = window.setTimeout(() => {
      api.get('/search', { params: { q: query } }).then(({ data }) => setResults(data)).catch(() => {});
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [query]);

  const visibleResults = query.trim().length >= 2 ? results : { teams: [], players: [], matches: [] };
  const hasResults = visibleResults.teams.length || visibleResults.players.length || visibleResults.matches.length;

  return (
    <div className="search-box">
      <Search size={18} />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('app.search')} />
      {hasResults ? (
        <div className="search-results">
          {visibleResults.teams.map((team) => (
            <Link key={team._id} to={`/teams`} onClick={() => setQuery('')}>
              <Flag team={team} /> {teamName(team, language)}
            </Link>
          ))}
          {visibleResults.players.map((player) => (
            <Link key={player._id} to={`/players/${player._id}`} onClick={() => setQuery('')}>
              <Flag team={player.country} /> {player.fullName} · {teamName(player.country, language)} · {t(`positions.${player.primaryPosition}`)}
            </Link>
          ))}
          {visibleResults.matches.map((match) => (
            <Link key={match._id} to={`/matches/${match._id}`} onClick={() => setQuery('')}>
              <Flag team={match.home} /> {language === 'tr' ? match.home.nameTR : match.home.nameEN} - <Flag team={match.away} /> {language === 'tr' ? match.away.nameTR : match.away.nameEN}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
