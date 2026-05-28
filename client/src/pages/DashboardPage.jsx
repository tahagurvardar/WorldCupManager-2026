import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { Flag } from '../components/Flag.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { GroupTable } from '../components/GroupTable.jsx';
import { MatchCard } from '../components/MatchCard.jsx';
import { PlayerRow } from '../components/PlayerRow.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, getApiError } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { teamName } from '../utils/format.js';

export function DashboardPage() {
  const { t, language, localize } = useLanguage();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    api.get('/manager/dashboard')
      .then((response) => setData(response.data))
      .catch((apiError) => setError(getApiError(apiError, t('dashboard.chooseTeam'))));
  }, [isAuthenticated, t]);

  if (!isAuthenticated) {
    return (
      <section>
        <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.chooseTeam')} action={<Link className="primary-button" to="/login">{t('auth.login')}</Link>} />
      </section>
    );
  }

  if (!data && !error) return <LoadingState />;

  if (!data) {
    return (
      <section>
        <PageHeader title={t('dashboard.title')} subtitle={error || t('dashboard.chooseTeam')} action={<Link className="primary-button" to="/teams">{t('nav.teams')}</Link>} />
      </section>
    );
  }

  return (
    <section>
      <PageHeader title={teamName(data.team, language)} subtitle={t('dashboard.subtitle')} action={<Flag team={data.team} size="lg" />} />
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel__head"><h2>{t('dashboard.upcomingMatch')}</h2></div>
          {data.fixtures.upcomingMatch ? <MatchCard match={data.fixtures.upcomingMatch} /> : <p>{t('app.empty')}</p>}
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('dashboard.lastMatch')}</h2></div>
          {data.fixtures.lastMatch ? <MatchCard match={data.fixtures.lastMatch} /> : <p>{t('app.empty')}</p>}
        </section>
      </div>
      <div className="dashboard-grid dashboard-grid--wide dashboard-grid--priority">
        <GroupTable group={data.team.group} table={data.groupTable} />
        <section className="panel">
          <div className="panel__head"><h2>{t('dashboard.media')}</h2></div>
          <div className="news-list">
            {data.news.map((item) => (
              <article key={item._id}>
                <strong>{localize(item.title)}</strong>
                <p>{localize(item.body)}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
      <div className="stat-grid">
        <StatCard label={t('dashboard.morale')} value={`${data.team.morale}/100`} />
        <StatCard label={t('dashboard.chemistry')} value={`${data.team.chemistry}/100`} tone="green" />
        <StatCard label={t('dashboard.fatigue')} value={`${data.team.fatigue}/100`} tone="amber" />
        <StatCard label={t('dashboard.pressure')} value={`${Math.round(data.pressure)}/100`} tone="danger" />
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel__head"><h2>{t('dashboard.topPlayers')}</h2></div>
          <div className="stack">
            {data.squad.topPlayers.map((player) => <PlayerRow key={player._id} player={player} />)}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('dashboard.injuryReport')}</h2></div>
          <div className="stack">
            {data.squad.injuries.length ? data.squad.injuries.map((player) => <PlayerRow key={player._id} player={player} />) : <p>{t('app.empty')}</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
