import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { PlayerRow } from '../components/PlayerRow.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, getApiError } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';

const defensive = new Set(['CB', 'LB', 'RB', 'LWB', 'RWB']);
const wide = new Set(['LW', 'RW', 'LM', 'RM', 'LWB', 'RWB']);

function evaluate(players) {
  const counts = {
    total: players.length,
    keepers: players.filter((player) => player.primaryPosition === 'GK').length,
    defenders: players.filter((player) => defensive.has(player.primaryPosition)).length,
    wide: players.filter((player) => wide.has(player.primaryPosition)).length,
    strikerDepth: players.filter((player) => player.primaryPosition === 'ST').length,
  };
  const errors = [];
  const warnings = [];
  if (counts.total < 23) errors.push('squad.errors.minPlayers');
  if (counts.total > 26) errors.push('squad.errors.maxPlayers');
  if (counts.keepers < 3) errors.push('squad.errors.minGoalkeepers');
  if (counts.defenders < 7) warnings.push('squad.warnings.lowDefenders');
  if (counts.keepers === 3) warnings.push('squad.warnings.lowBackupGoalkeepers');
  if (counts.wide < 4) warnings.push('squad.warnings.weakWings');
  if (counts.strikerDepth < 2) warnings.push('squad.warnings.lowStrikers');
  return { counts, errors, warnings };
}

export function SquadPage() {
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const [players, setPlayers] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(Boolean(user?.selectedTeam));
  const [message, setMessage] = useState('');
  const teamId = user?.selectedTeam?._id;

  useEffect(() => {
    if (!teamId) return;
    api.get('/players', { params: { team: teamId } })
      .then(({ data }) => {
        setPlayers(data.players);
        const initial = data.players
          .filter((player) => player.nationalTeamStatus === 'final')
          .map((player) => player._id);
        setSelected(new Set(initial.length ? initial : data.players.slice(0, 26).map((player) => player._id)));
      })
      .finally(() => setLoading(false));
  }, [teamId]);

  const selectedPlayers = useMemo(() => players.filter((player) => selected.has(player._id)), [players, selected]);
  const evaluation = useMemo(() => evaluate(selectedPlayers), [selectedPlayers]);

  const toggle = (player) => {
    setMessage('');
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(player._id)) next.delete(player._id);
      else next.add(player._id);
      return next;
    });
  };

  const save = async () => {
    setMessage('');
    try {
      await api.put('/players/squad/final', { teamId, playerIds: [...selected] });
      setMessage(t('app.saved'));
    } catch (error) {
      setMessage(getApiError(error, t('app.error')));
    }
  };

  if (!teamId) return <PageHeader title={t('squad.title')} subtitle={t('dashboard.chooseTeam')} />;
  if (loading) return <LoadingState />;

  return (
    <section>
      <PageHeader title={t('squad.title')} subtitle={t('squad.subtitle')} action={<button className="primary-button" type="button" onClick={save}>{t('squad.saveFinal')}</button>} />
      <div className="stat-grid">
        <StatCard label={t('squad.selected')} value={`${evaluation.counts.total}/26`} />
        <StatCard label={t('squad.goalkeepers')} value={evaluation.counts.keepers} />
        <StatCard label={t('squad.defenders')} value={evaluation.counts.defenders} />
        <StatCard label={t('squad.wide')} value={evaluation.counts.wide} />
      </div>
      {message ? <div className="alert">{message}</div> : null}
      {[...evaluation.errors, ...evaluation.warnings].length ? (
        <div className="alert-stack">
          {evaluation.errors.map((key) => <div className="alert alert--danger" key={key}>{t(key)}</div>)}
          {evaluation.warnings.map((key) => <div className="alert alert--warning" key={key}>{t(key)}</div>)}
        </div>
      ) : null}
      <section className="panel">
        <div className="player-table">
          {players.map((player) => (
            <PlayerRow key={player._id} player={player} selectable checked={selected.has(player._id)} onToggle={toggle} />
          ))}
        </div>
      </section>
    </section>
  );
}
