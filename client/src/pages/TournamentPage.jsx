import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { GroupTable } from '../components/GroupTable.jsx';
import { MatchCard } from '../components/MatchCard.jsx';
import { PlayerRow } from '../components/PlayerRow.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';

export function TournamentPage() {
  const { t, localize } = useLanguage();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/tournament/center').then(({ data: response }) => setData(response));
  }, []);

  if (!data) return <LoadingState />;

  return (
    <section>
      <PageHeader title={t('tournament.title')} subtitle={t('tournament.subtitle')} />
      <div className="dashboard-grid dashboard-grid--wide">
        <section className="section-block panel--span">
          <div className="panel__head"><h2>{t('tournament.standings')}</h2></div>
          <div className="standings-grid">
            {data.groups.map((group) => <GroupTable key={group.group} group={group.group} table={group.table} compact />)}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('tournament.upcoming')}</h2></div>
          <div className="stack">
            {data.upcomingMatches.map((match) => <MatchCard key={match._id} match={match} />)}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('tournament.completed')}</h2></div>
          <div className="stack">
            {data.completedMatches.length ? data.completedMatches.map((match) => <MatchCard key={match._id} match={match} />) : <p>{t('app.empty')}</p>}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('tournament.goals')}</h2></div>
          <div className="stack">{data.leaders.goals.slice(0, 8).map((player) => <PlayerRow key={player._id} player={player} statKey="goals" />)}</div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('tournament.assists')}</h2></div>
          <div className="stack">{data.leaders.assists.slice(0, 8).map((player) => <PlayerRow key={player._id} player={player} statKey="assists" />)}</div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('tournament.news')}</h2></div>
          <div className="news-list">
            {data.news.map((item) => (
              <article key={item._id}>
                <strong>{localize(item.title)}</strong>
                <p>{localize(item.body)}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('tournament.injuries')}</h2></div>
          <div className="stack">
            {data.injuredPlayers.length ? data.injuredPlayers.map((player) => <PlayerRow key={player._id} player={player} />) : <p>{t('app.empty')}</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
