import { useEffect, useMemo, useState } from 'react';
import { Flag } from '../components/Flag.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { PlayerRow } from '../components/PlayerRow.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, getApiError } from '../services/api.js';
import { teamName } from '../utils/format.js';

const defaultSort = { key: 'goals', direction: 'desc' };
const defaultTieBreakers = [
  { key: 'goals', direction: 'desc' },
  { key: 'assists', direction: 'desc' },
  { key: 'avgRating', direction: 'desc' },
  { key: 'appearances', direction: 'desc' },
  { key: 'player', direction: 'asc' },
];

function numberStat(player, key) {
  return Number(player.tournamentStats?.[key] || 0);
}

function cleanSheetsValue(player) {
  if (player.primaryPosition !== 'GK') return null;
  return numberStat(player, 'cleanSheets');
}

function compareValues(left, right, type, direction, language) {
  const leftMissing = left === null || left === undefined || left === '';
  const rightMissing = right === null || right === undefined || right === '';

  if (leftMissing && rightMissing) return 0;
  if (leftMissing) return 1;
  if (rightMissing) return -1;

  const multiplier = direction === 'asc' ? 1 : -1;

  if (type === 'string') {
    return String(left).localeCompare(String(right), language === 'tr' ? 'tr' : 'en', {
      numeric: true,
      sensitivity: 'base',
    }) * multiplier;
  }

  return (Number(left) - Number(right)) * multiplier;
}

export function StatsPage() {
  const { t, language } = useLanguage();
  const [data, setData] = useState(null);
  const [teamFilter, setTeamFilter] = useState('all');
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState(defaultSort);

  useEffect(() => {
    api.get('/tournament/stats')
      .then(({ data: response }) => {
        setData(response);
        setError('');
      })
      .catch((apiError) => setError(getApiError(apiError, t('stats.errorMessage'))));
  }, [t]);

  const sortColumns = useMemo(() => [
    {
      key: 'player',
      label: t('stats.player'),
      type: 'string',
      defaultDirection: 'asc',
      value: (player) => player.fullName || '',
    },
    {
      key: 'team',
      label: t('teams.team'),
      type: 'string',
      defaultDirection: 'asc',
      value: (player) => teamName(player.country, language) || '',
    },
    {
      key: 'position',
      label: t('stats.position'),
      type: 'string',
      defaultDirection: 'asc',
      value: (player) => t(`positions.${player.primaryPosition}`) || player.primaryPosition || '',
    },
    {
      key: 'appearances',
      label: t('stats.apps'),
      type: 'number',
      defaultDirection: 'desc',
      value: (player) => numberStat(player, 'appearances'),
    },
    {
      key: 'goals',
      label: t('stats.goals'),
      type: 'number',
      defaultDirection: 'desc',
      value: (player) => numberStat(player, 'goals'),
    },
    {
      key: 'assists',
      label: t('stats.assists'),
      type: 'number',
      defaultDirection: 'desc',
      value: (player) => numberStat(player, 'assists'),
    },
    {
      key: 'avgRating',
      label: t('stats.ratings'),
      type: 'number',
      defaultDirection: 'desc',
      value: (player) => numberStat(player, 'avgRating'),
    },
    {
      key: 'yellowCards',
      label: t('stats.yellowCards'),
      type: 'number',
      defaultDirection: 'desc',
      value: (player) => numberStat(player, 'yellowCards'),
    },
    {
      key: 'redCards',
      label: t('stats.redCards'),
      type: 'number',
      defaultDirection: 'desc',
      value: (player) => numberStat(player, 'redCards'),
    },
    {
      key: 'cleanSheets',
      label: t('stats.cleanSheets'),
      type: 'number',
      defaultDirection: 'desc',
      value: cleanSheetsValue,
    },
  ], [language, t]);

  const sortColumnMap = useMemo(() => new Map(sortColumns.map((column) => [column.key, column])), [sortColumns]);

  const filteredPlayers = useMemo(() => {
    if (!data) return [];
    if (teamFilter === 'all') return data.players;
    return data.players.filter((player) => player.country?._id === teamFilter);
  }, [data, teamFilter]);

  const sortedPlayers = useMemo(() => {
    const activeColumn = sortColumnMap.get(sortConfig.key) || sortColumnMap.get(defaultSort.key);
    const activeDirection = sortConfig.direction || activeColumn.defaultDirection;
    const tieBreakers = defaultTieBreakers.filter((tieBreaker) => tieBreaker.key !== activeColumn.key);

    return [...filteredPlayers].sort((left, right) => {
      const primary = compareValues(
        activeColumn.value(left),
        activeColumn.value(right),
        activeColumn.type,
        activeDirection,
        language,
      );

      if (primary !== 0) return primary;

      for (const tieBreaker of tieBreakers) {
        const column = sortColumnMap.get(tieBreaker.key);
        const comparison = compareValues(
          column.value(left),
          column.value(right),
          column.type,
          tieBreaker.direction,
          language,
        );
        if (comparison !== 0) return comparison;
      }

      return 0;
    });
  }, [filteredPlayers, language, sortColumnMap, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((current) => {
      const column = sortColumnMap.get(key);
      if (!column) return current;
      if (current.key !== key) return { key, direction: column.defaultDirection };
      return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
    });
  };

  const renderSortHeader = (column) => {
    const active = sortConfig.key === column.key;
    const direction = active ? sortConfig.direction : column.defaultDirection;
    const label = active
      ? t(direction === 'asc' ? 'stats.sortedAscending' : 'stats.sortedDescending', { column: column.label })
      : t('stats.sortBy', { column: column.label });

    return (
      <th key={column.key} className="sortable-cell" aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
        <button
          type="button"
          className={`sort-button ${active ? 'sort-button--active' : ''}`}
          onClick={() => handleSort(column.key)}
          title={label}
          aria-label={label}
        >
          <span>{column.label}</span>
          {active ? <span className="sort-indicator" aria-hidden="true">{direction === 'asc' ? '↑' : '↓'}</span> : null}
        </button>
      </th>
    );
  };

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
              <tr>{sortColumns.map(renderSortHeader)}</tr>
            </thead>
            <tbody>
              {sortedPlayers.length ? sortedPlayers.map((player) => {
                const stats = player.tournamentStats || {};
                return (
                  <tr key={player._id}>
                    <td><strong>{player.fullName}</strong></td>
                    <td><span className="team-cell"><Flag team={player.country} /> {teamName(player.country, language)}</span></td>
                    <td><span className="chip">{t(`positions.${player.primaryPosition}`)}</span></td>
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
                <tr><td colSpan="10">{t('stats.noPlayers')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
