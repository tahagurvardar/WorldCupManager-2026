import { Play, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { KnockoutBracket } from '../components/KnockoutBracket.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, getApiError } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';

const groups = 'ABCDEFGHIJKL'.split('');

export function AdminPage() {
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const [quality, setQuality] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [group, setGroup] = useState('A');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyMatch, setBusyMatch] = useState('');

  const load = () => Promise.all([
    api.get('/admin/data-quality'),
    api.get('/tournament/bracket'),
  ]).then(([qualityResponse, bracketResponse]) => {
    setQuality(qualityResponse.data);
    setBracket(bracketResponse.data);
  });

  useEffect(() => {
    if (user?.role === 'admin') load().catch(() => {});
  }, [user]);

  const run = async (action) => {
    setBusy(true);
    setMessage('');
    try {
      if (action === 'seed') await api.post('/admin/seed');
      if (action === 'group') await api.post(`/admin/groups/${group}/simulate`);
      if (action === 'all') await api.post('/admin/simulate/group-stage');
      await load();
      setMessage(t('app.saved'));
    } catch (error) {
      setMessage(getApiError(error, t('app.error')));
    } finally {
      setBusy(false);
    }
  };

  const simulateBracketMatch = async (match) => {
    setBusyMatch(match._id);
    setMessage('');
    try {
      await api.post(`/admin/matches/${match._id}/simulate`);
      await load();
      setMessage(t('app.saved'));
    } catch (error) {
      setMessage(getApiError(error, t('app.error')));
    } finally {
      setBusyMatch('');
    }
  };

  if (user?.role !== 'admin') {
    return <PageHeader title={t('admin.title')} subtitle={t('admin.adminOnly')} />;
  }

  if (!quality || !bracket) return <LoadingState />;

  return (
    <section>
      <PageHeader title={t('admin.title')} subtitle={t('admin.subtitle')} />
      {message ? <div className="alert">{message}</div> : null}
      <div className="admin-actions">
        <button className="ghost-button" type="button" onClick={() => run('seed')} disabled={busy}><RefreshCw size={16} />{t('admin.reseed')}</button>
        <label>
          <span>{t('admin.groupToSimulate')}</span>
          <select value={group} onChange={(event) => setGroup(event.target.value)}>
            {groups.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button className="primary-button" type="button" onClick={() => run('group')} disabled={busy}><Play size={16} />{t('admin.simulateGroup')}</button>
        <button className="primary-button" type="button" onClick={() => run('all')} disabled={busy}><Play size={16} />{t('admin.simulateAll')}</button>
      </div>
      <div className="stat-grid">
        {Object.entries(quality.totals).map(([key, value]) => <StatCard key={key} label={key} value={value} />)}
      </div>
      <section className="panel">
        <div className="panel__head"><h2>{t('admin.missing')}</h2></div>
        <div className="quality-grid">
          {Object.entries(quality.missing).map(([key, value]) => (
            <div key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="panel admin-bracket">
        <div className="panel__head">
          <h2>{t('knockout.title')}</h2>
          {!bracket.allGroupsComplete ? <span className="chip">{t('knockout.projected')}</span> : null}
        </div>
        <KnockoutBracket bracket={bracket} onSimulate={simulateBracketMatch} busy={busyMatch} />
      </section>
    </section>
  );
}
