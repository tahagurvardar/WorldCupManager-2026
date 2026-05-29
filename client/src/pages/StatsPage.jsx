import { useEffect, useMemo, useState } from 'react';
import { Flag } from '../components/Flag.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { PlayerRow } from '../components/PlayerRow.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, getApiError } from '../services/api.js';
import { teamName } from '../utils/format.js';

export function StatsPage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [teamFilter, setTeamFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/tournament/stats')
      .then(({ data: response }) => {
        setData(response);
        setError('');
      })
      .catch((apiError) => setError(getApiError(apiError, t('stats.errorMessage'))));
  }, [t]);

  const filteredPlayers = useMemo(() => {
    if (!data) return [];
    if (teamFilter === 'all') return data.players;
    return data.players.filter((player) => player.country?._id === teamFilter);
  }, [data, teamFilter]);

  if (!data && !error) return <LoadingState />;

  if (!data) {
    return (
      <section>
        <PageHeader title={t('stats.title')} subtitle={t('stats.subtitle')} />
        <div className="dashboard-error">
          <strong>{t('stats.errorTitle')}</strong>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <PageHeader
        title={t('stats.title')}
        subtitle={t('stats.subtitle')}
        action={(
          <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
            <option value="all">{t('stats.allTeams')}</option>
            {data.teams.map((team) => <option key={team._id} value={team._id}>{teamName(team, language)}</option>)}
          </select>
        )}
      />
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel__head"><h2>{t('stats.goals')}</h2></div>
          <div className="stack">{data.goals.length ? data.goals.map((player) => <PlayerRow key={player._id} player={player} statKey="goals" />) : <div className="dashboard-empty">{t('stats.noGoals')}</div>}</div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('stats.assists')}</h2></div>
          <div className="stack">{data.assists.length ? data.assists.map((player) => <PlayerRow key={player._id} player={player} statKey="assists" />) : <div className="dashboard-empty">{t('stats.noAssists')}</div>}</div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('stats.ratings')}</h2></div>
          <div className="stack">{data.ratings.length ? data.ratings.map((player) => <PlayerRow key={player._id} player={player} statKey="avgRating" />) : <div className="dashboard-empty">{t('stats.noRatings')}</div>}</div>
        </section>
      </div>
      <section className="panel stats-table-panel">
        <div className="panel__head">
          <h2>{t('stats.teamPlayerStats')}</h2>
          <span className="chip">{filteredPlayers.length}</span>
        </div>
        <div className="table-wrap">
          <table className="data-table stats-table">
            <thead>
              <tr>
                <th>{t('stats.player')}</th>
                <th>{t('teams.team')}</th>
                <th>{t('stats.apps')}</th>
                <th>{t('stats.goals')}</th>
                <th>{t('stats.assists')}</th>
                <th>{t('stats.ratings')}</th>
                <th>{t('stats.yellowCards')}</th>
                <th>{t('stats.redCards')}</th>
                <th>{t('stats.cleanSheets')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length ? filteredPlayers.map((player) => {
                const stats = player.tournamentStats || {};
                return (
                  <tr key={player._id}>
                    <td><strong>{player.fullName}</strong></td>
                    <td><span className="team-cell"><Flag team={player.country} /> {teamName(player.country, language)}</span></td>
                    <td>{stats.appearances || 0}</td>
                    <td>{stats.goals || 0}</td>
                    <td>{stats.assists || 0}</td>
                    <td>{Number(stats.avgRating || 0).toFixed(1)}</td>
                    <td>{stats.yellowCards || 0}</td>
                    <td>{stats.redCards || 0}</td>
                    <td>{player.primaryPosition === 'GK' ? stats.cleanSheets || 0 : '-'}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="9">{t('stats.noPlayers')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
