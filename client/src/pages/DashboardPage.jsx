import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ClipboardList, Mic2, Play, ShieldCheck, Users } from 'lucide-react';
import { PageHeader } from '../components/PageHeader.jsx';
import { Flag } from '../components/Flag.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { GroupTable } from '../components/GroupTable.jsx';
import { MatchCard } from '../components/MatchCard.jsx';
import { PlayerRow } from '../components/PlayerRow.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, getApiError } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { teamName } from '../utils/format.js';

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getTeamId(team) {
  return String(team?._id || team?.id || team);
}

function getOpponent(match, teamId) {
  if (!match) return null;
  return getTeamId(match.home.team) === teamId ? match.away : match.home;
}

function getGroupPosition(groupTable, teamId) {
  const index = groupTable.findIndex((row) => getTeamId(row.team) === teamId);
  return index >= 0 ? index + 1 : null;
}

function buildDashboardMetrics(data) {
  const teamId = getTeamId(data.team);
  const groupPosition = getGroupPosition(data.groupTable, teamId);
  const finalCount = data.squad.finalCount || 0;
  const warningCount = data.squad.evaluation?.warnings?.length || 0;
  const injuryCount = data.squad.injuries?.length || 0;
  const fatigue = data.team.fatigue || 0;
  const pressure = data.pressure || 0;
  const groupBonus = groupPosition ? Math.max(0, 18 - groupPosition * 5) : 4;
  const squadBonus = finalCount >= 26 ? 10 : finalCount >= 23 ? 6 : -8;

  return {
    boardConfidence: clampScore(48 + data.team.morale * 0.22 + data.team.chemistry * 0.22 + groupBonus - pressure * 0.08),
    fanConfidence: clampScore(42 + data.team.morale * 0.28 + data.team.chemistry * 0.16 + groupBonus - fatigue * 0.08),
    mediaPressure: clampScore(pressure),
    tacticalReadiness: clampScore(34 + data.team.chemistry * 0.28 + data.team.morale * 0.18 + squadBonus - warningCount * 4 - injuryCount * 2 - fatigue * 0.08),
    groupPosition,
  };
}

function EmptyState({ children }) {
  return <div className="dashboard-empty">{children}</div>;
}

function ConfidenceCard({ label, value, helper, tone = 'green' }) {
  return (
    <article className={`confidence-card confidence-card--${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}/100</strong>
      </div>
      <div className="confidence-card__bar" aria-hidden="true">
        <span style={{ width: `${value}%` }} />
      </div>
      {helper ? <small>{helper}</small> : null}
    </article>
  );
}

function QuickAction({ icon: Icon, label, to, onClick, disabled, primary = false }) {
  const className = primary ? 'primary-button dashboard-action' : 'ghost-button dashboard-action';

  if (to && !disabled) {
    return (
      <Link className={className} to={to}>
        <Icon size={16} />
        {label}
      </Link>
    );
  }

  return (
    <button className={className} type="button" onClick={onClick} disabled={disabled}>
      <Icon size={16} />
      {label}
    </button>
  );
}

export function DashboardPage() {
  const { t, language, localize } = useLanguage();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    api.get('/manager/dashboard')
      .then((response) => {
        setData(response.data);
        setError('');
      })
      .catch((apiError) => setError(getApiError(apiError, t('dashboard.chooseTeam'))));
  }, [isAuthenticated, t]);

  const metrics = useMemo(() => (data ? buildDashboardMetrics(data) : null), [data]);
  const teamId = data ? getTeamId(data.team) : '';
  const opponent = data ? getOpponent(data.fixtures.upcomingMatch, teamId) : null;
  const topPerformers = data?.squad.topPlayers?.slice(0, 5) || [];
  const injuries = data?.squad.injuries || [];
  const news = data?.news || [];
  const warnings = data?.squad.evaluation?.warnings || [];
  const errors = data?.squad.evaluation?.errors || [];

  const simulateNextMatch = async () => {
    setIsSimulating(true);
    setActionMessage('');
    try {
      await api.post('/manager/simulate-next-match');
      const response = await api.get('/manager/dashboard');
      setData(response.data);
      setActionMessage(t('dashboard.simulationComplete'));
    } catch (apiError) {
      setActionMessage(getApiError(apiError, t('dashboard.simulationFailed')));
    } finally {
      setIsSimulating(false);
    }
  };

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
        <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
        <div className="dashboard-error">
          <strong>{t('dashboard.errorTitle')}</strong>
          <p>{error || t('dashboard.chooseTeam')}</p>
          <Link className="primary-button" to="/teams">{t('nav.teams')}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="manager-home">
      <PageHeader
        title={teamName(data.team, language)}
        subtitle={t('dashboard.subtitle')}
        action={<Flag team={data.team} size="lg" />}
      />

      <section className="dashboard-hero panel">
        <div className="dashboard-hero__identity">
          <Flag team={data.team} size="lg" />
          <div>
            <span>{data.team.fifaCode} / {t('teams.group')} {data.team.group}</span>
            <h2>{teamName(data.team, language)}</h2>
            <p>{t('dashboard.homeSummary')}</p>
          </div>
        </div>
        <div className="dashboard-quick-actions">
          <QuickAction icon={ClipboardList} label={t('dashboard.actions.editTactics')} to="/tactics" primary />
          <QuickAction icon={Users} label={t('dashboard.actions.viewSquad')} to="/squad" />
          <QuickAction icon={BarChart3} label={t('dashboard.actions.opponentAnalysis')} to="/opponent-analysis" disabled={!data.fixtures.upcomingMatch} />
          <QuickAction icon={Play} label={t('dashboard.actions.simulateMatch')} onClick={simulateNextMatch} disabled={!data.fixtures.upcomingMatch || isSimulating} />
          <QuickAction icon={Mic2} label={t('dashboard.actions.pressConference')} to="/press-conference" disabled={!data.fixtures.upcomingMatch} />
        </div>
      </section>

      {actionMessage ? <div className="alert">{actionMessage}</div> : null}

      <div className="manager-dashboard-grid">
        <section className="panel manager-card manager-card--next">
          <div className="panel__head">
            <h2>{t('dashboard.nextMatch')}</h2>
            {opponent ? <span className="chip">{t('dashboard.opponent')}: {language === 'tr' ? opponent.nameTR : opponent.nameEN}</span> : null}
          </div>
          {data.fixtures.upcomingMatch ? (
            <MatchCard match={data.fixtures.upcomingMatch} />
          ) : (
            <EmptyState>{t('dashboard.noNextMatch')}</EmptyState>
          )}
        </section>

        <section className="panel manager-card manager-card--confidence">
          <div className="panel__head"><h2>{t('dashboard.confidenceCenter')}</h2></div>
          <div className="confidence-grid">
            <ConfidenceCard label={t('dashboard.boardConfidence')} value={metrics.boardConfidence} helper={t('dashboard.boardConfidenceHint')} />
            <ConfidenceCard label={t('dashboard.fanConfidence')} value={metrics.fanConfidence} helper={t('dashboard.fanConfidenceHint')} />
            <ConfidenceCard label={t('dashboard.mediaPressure')} value={metrics.mediaPressure} helper={t('dashboard.mediaPressureHint')} tone="danger" />
          </div>
        </section>

        <section className="manager-card manager-card--table">
          <GroupTable group={data.team.group} table={data.groupTable} compact />
        </section>

        <section className="panel manager-card manager-card--squad">
          <div className="panel__head"><h2>{t('dashboard.squadStatus')}</h2></div>
          <div className="squad-status-grid">
            <div><span>{t('dashboard.finalSquad')}</span><strong>{data.squad.finalCount}/26</strong></div>
            <div><span>{t('dashboard.candidatePool')}</span><strong>{data.squad.totalPlayers}</strong></div>
            <div><span>{t('dashboard.injuries')}</span><strong>{injuries.length}</strong></div>
            <div><span>{t('dashboard.squadAlerts')}</span><strong>{warnings.length + errors.length}</strong></div>
          </div>
          {[...errors, ...warnings].length ? (
            <div className="dashboard-warning-list">
              {errors.map((key) => <span key={key} className="dashboard-warning dashboard-warning--danger">{t(key)}</span>)}
              {warnings.map((key) => <span key={key} className="dashboard-warning">{t(key)}</span>)}
            </div>
          ) : (
            <EmptyState>{t('dashboard.squadReady')}</EmptyState>
          )}
        </section>

        <section className="panel manager-card manager-card--tactical">
          <div className="panel__head">
            <h2>{t('dashboard.tacticalReadiness')}</h2>
            <ShieldCheck size={18} />
          </div>
          <div className="readiness-score">
            <strong>{metrics.tacticalReadiness}</strong>
            <span>/100</span>
          </div>
          <div className="readiness-meter" aria-hidden="true">
            <span style={{ width: `${metrics.tacticalReadiness}%` }} />
          </div>
          <dl className="readiness-breakdown">
            <div><dt>{t('dashboard.chemistry')}</dt><dd>{data.team.chemistry}</dd></div>
            <div><dt>{t('dashboard.morale')}</dt><dd>{data.team.morale}</dd></div>
            <div><dt>{t('dashboard.fatigue')}</dt><dd>{data.team.fatigue}</dd></div>
          </dl>
        </section>

        <section className="panel manager-card manager-card--injuries">
          <div className="panel__head"><h2>{t('dashboard.injuries')}</h2></div>
          <div className="stack">
            {injuries.length ? injuries.slice(0, 5).map((player) => <PlayerRow key={player._id} player={player} />) : <EmptyState>{t('dashboard.noInjuries')}</EmptyState>}
          </div>
        </section>

        <section className="panel manager-card manager-card--performers">
          <div className="panel__head"><h2>{t('dashboard.topPerformers')}</h2></div>
          <div className="stack">
            {topPerformers.length ? topPerformers.map((player) => <PlayerRow key={player._id} player={player} statKey="avgRating" />) : <EmptyState>{t('dashboard.noPerformers')}</EmptyState>}
          </div>
        </section>

        <section className="panel manager-card manager-card--news">
          <div className="panel__head"><h2>{t('dashboard.latestNews')}</h2></div>
          <div className="news-list">
            {news.length ? news.map((item) => (
              <article key={item._id}>
                <strong>{localize(item.title)}</strong>
                <p>{localize(item.body)}</p>
              </article>
            )) : <EmptyState>{t('dashboard.noNews')}</EmptyState>}
          </div>
        </section>
      </div>
    </section>
  );
}
