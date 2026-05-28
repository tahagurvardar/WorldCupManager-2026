import { Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '../components/PageHeader.jsx';
import { Flag } from '../components/Flag.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formatDateTime } from '../utils/format.js';

export function MatchDetailPage() {
  const { id } = useParams();
  const { t, language, localize } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const [match, setMatch] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/matches/${id}`).then(({ data }) => setMatch(data.match));
  }, [id]);

  const simulate = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/matches/${id}/simulate`);
      setMatch(data.match);
    } finally {
      setBusy(false);
    }
  };

  if (!match) return <LoadingState />;

  const statRows = [
    ['possession', match.stats.home.possession, match.stats.away.possession],
    ['xg', match.stats.home.xG, match.stats.away.xG],
    ['shots', match.stats.home.shots, match.stats.away.shots],
    ['shotsOnTarget', match.stats.home.shotsOnTarget, match.stats.away.shotsOnTarget],
    ['corners', match.stats.home.corners, match.stats.away.corners],
    ['cards', match.stats.home.yellowCards + match.stats.home.redCards, match.stats.away.yellowCards + match.stats.away.redCards],
  ];

  return (
    <section>
      <PageHeader
        title={t('match.title')}
        subtitle={`${t('match.venue')}: ${match.venue} · ${t('match.kickoff')}: ${formatDateTime(match.kickoffAt, language)}`}
        action={user?.role === 'admin' && match.status !== 'completed' ? <button className="primary-button" type="button" onClick={simulate} disabled={busy}><Play size={16} />{t('app.simulate')}</button> : null}
      />
      <section className="match-hero panel">
        <div className="match-team">
          <Flag team={match.home} size="lg" />
          <h2>{language === 'tr' ? match.home.nameTR : match.home.nameEN}</h2>
        </div>
        <div className="scoreboard">
          <span>{t(`match.${match.status}`)}</span>
          <strong>{match.status === 'completed' ? `${match.score.home} - ${match.score.away}` : 'vs'}</strong>
          {match.penalties.home !== null ? <small>{match.penalties.home} - {match.penalties.away}</small> : null}
        </div>
        <div className="match-team">
          <Flag team={match.away} size="lg" />
          <h2>{language === 'tr' ? match.away.nameTR : match.away.nameEN}</h2>
        </div>
      </section>
      <div className="dashboard-grid dashboard-grid--wide">
        <section className="panel">
          <div className="panel__head"><h2>{t('match.stats')}</h2></div>
          <div className="match-stats">
            {statRows.map(([key, home, away]) => (
              <div key={key}>
                <b>{home}</b>
                <span>{t(`match.${key}`)}</span>
                <b>{away}</b>
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('match.momentum')}</h2></div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={match.momentum}>
                <XAxis dataKey="minute" stroke="var(--muted)" />
                <YAxis hide domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="home" stackId="a" fill="var(--accent)" />
                <Bar dataKey="away" stackId="a" fill="var(--blue)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('match.timeline')}</h2></div>
          <div className="timeline">
            {match.events.length ? match.events.map((event, index) => (
              <article key={`${event.minute}-${event.type}-${index}`}>
                <span>{event.minute}'</span>
                <p>{localize(event.description)}</p>
              </article>
            )) : <p>{t('app.empty')}</p>}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('match.ratings')}</h2></div>
          <div className="rating-list">
            {match.playerRatings.map((rating) => (
              <div key={`${rating.player}-${rating.name}`}>
                <span>{rating.name}</span>
                <small>{rating.teamCode} · {rating.position}</small>
                <strong>{rating.rating}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
