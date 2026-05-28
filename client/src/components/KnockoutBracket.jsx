import { Play } from 'lucide-react';
import { Flag } from './Flag.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatDateTime, teamName } from '../utils/format.js';

const roundOrder = ['round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'final', 'third_place'];

function teamId(value) {
  return String(value?._id || value || '');
}

function isWinner(match, team) {
  if (!match?.winner || !team) return false;
  return teamId(match.winner) === teamId(team.team);
}

function TeamLine({ match, team, fallback }) {
  const { language } = useLanguage();
  const winner = isWinner(match, team);

  return (
    <div className={`bracket-team ${winner ? 'bracket-team--winner' : ''}`}>
      {team ? <Flag team={team} /> : <span className="bracket-team__seed">{fallback}</span>}
      <span>{team ? teamName(team, language) : fallback}</span>
    </div>
  );
}

function BracketCard({ match, onSimulate, busy }) {
  const { t, language } = useLanguage();
  const canSimulate = Boolean(onSimulate && match._id && match.home && match.away && match.status !== 'completed');

  return (
    <article className={`bracket-card bracket-card--${match.stage}`}>
      <div className="bracket-card__meta">
        <span>#{match.matchNumber}</span>
        <span>{t(`knockout.${match.stage}`)}</span>
      </div>
      <TeamLine match={match} team={match.home} fallback={match.sourceHome || '-'} />
      <TeamLine match={match} team={match.away} fallback={match.sourceAway || '-'} />
      <div className="bracket-card__foot">
        <span>{match.kickoffAt ? formatDateTime(match.kickoffAt, language) : ''}</span>
        {match.status === 'completed' ? <strong>{match.score.home}-{match.score.away}</strong> : null}
        {canSimulate ? (
          <button className="icon-button" type="button" onClick={() => onSimulate(match)} disabled={busy === match._id} aria-label={t('app.simulate')}>
            <Play size={15} />
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function KnockoutBracket({ bracket, onSimulate, busy }) {
  const { t } = useLanguage();

  return (
    <div className="knockout-scroll">
      <div className="knockout-board">
        {roundOrder.map((round) => (
          <section className="bracket-round" key={round}>
            <h2>{t(`knockout.${round}`)}</h2>
            <div className="bracket-round__matches">
              {(bracket.rounds[round] || []).map((match) => (
                <BracketCard key={match.matchNumber} match={match} onSimulate={onSimulate} busy={busy} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
