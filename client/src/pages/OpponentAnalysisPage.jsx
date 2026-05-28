import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Eye, Gauge, ShieldAlert, Target } from 'lucide-react';
import { Flag } from '../components/Flag.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, getApiError } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formatDateTime, teamName } from '../utils/format.js';

const comparisonOrder = ['overall', 'attack', 'midfield', 'defense', 'goalkeeper'];

function scoreWidth(value) {
  return `${Math.max(0, Math.min(100, Number(value) || 0))}%`;
}

function formSummary(form, t) {
  if (!form?.matches) return t('opponentAnalysis.noRecentForm');
  return `${form.sequence.join(' ')} / ${form.points} ${t('opponentAnalysis.points')} / ${form.goalsFor}-${form.goalsAgainst}`;
}

function ComparisonCard({ category, item }) {
  const { t } = useLanguage();

  return (
    <article className={`analysis-card analysis-card--${item.edge}`}>
      <div className="analysis-card__head">
        <span>{t(`opponentAnalysis.categories.${category}`)}</span>
        <strong>{t(`opponentAnalysis.edges.${item.edge}`)}</strong>
      </div>
      <div className="comparison-bars">
        <div>
          <span>{t('opponentAnalysis.ours')}</span>
          <b>{item.ours}</b>
          <div className="readiness-meter" aria-hidden="true"><span style={{ width: scoreWidth(item.ours) }} /></div>
        </div>
        <div>
          <span>{t('opponentAnalysis.opponent')}</span>
          <b>{item.opponent}</b>
          <div className="readiness-meter readiness-meter--danger" aria-hidden="true"><span style={{ width: scoreWidth(item.opponent) }} /></div>
        </div>
      </div>
    </article>
  );
}

function PlayerThreat({ threat }) {
  const { t } = useLanguage();
  const player = threat.player || threat;

  return (
    <article className="analysis-player">
      <div>
        <strong>{player.fullName}</strong>
        <span>{t(`positions.${player.primaryPosition}`)} / {player.club}</span>
      </div>
      <b>{threat.score || player.overall}</b>
    </article>
  );
}

function PlanRow({ icon: Icon, labelKey, plan }) {
  const { t } = useLanguage();

  return (
    <article className="plan-row">
      <Icon size={18} />
      <div>
        <span>{t(`opponentAnalysis.plan.${labelKey}`)}</span>
        <strong>{t(`opponentAnalysis.planLevels.${plan.level}`)}</strong>
        <small>{t(`opponentAnalysis.planReasons.${plan.reason}`)}</small>
      </div>
    </article>
  );
}

export function OpponentAnalysisPage() {
  const { t, language } = useLanguage();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [analysis, setAnalysis] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    api.get('/manager/opponent-analysis')
      .then((response) => {
        setAnalysis(response.data.analysis);
        setError('');
      })
      .catch((apiError) => {
        setError(getApiError(apiError, t('opponentAnalysis.errorMessage')));
        setAnalysis(null);
      })
      .finally(() => setLoaded(true));
  }, [isAuthenticated, t]);

  const comparisonCards = useMemo(() => (
    comparisonOrder.map((category) => [category, analysis?.comparison?.[category]]).filter(([, item]) => item)
  ), [analysis]);

  if (!isAuthenticated) {
    return (
      <section>
        <PageHeader title={t('opponentAnalysis.title')} subtitle={t('dashboard.chooseTeam')} action={<Link className="primary-button" to="/login">{t('auth.login')}</Link>} />
      </section>
    );
  }

  if (!loaded) return <LoadingState label={t('opponentAnalysis.loading')} />;

  if (error) {
    return (
      <section>
        <PageHeader title={t('opponentAnalysis.title')} subtitle={t('opponentAnalysis.subtitle')} />
        <div className="dashboard-error">
          <strong>{t('opponentAnalysis.errorTitle')}</strong>
          <p>{error}</p>
          <Link className="primary-button" to="/dashboard">{t('nav.dashboard')}</Link>
        </div>
      </section>
    );
  }

  if (!analysis) {
    return (
      <section>
        <PageHeader title={t('opponentAnalysis.title')} subtitle={t('opponentAnalysis.subtitle')} />
        <div className="dashboard-empty">{t('opponentAnalysis.noUpcomingMatch')}</div>
      </section>
    );
  }

  const keyPlayer = analysis.tacticalPlan.keyPlayerToWatch;

  return (
    <section className="opponent-analysis">
      <PageHeader title={t('opponentAnalysis.title')} subtitle={t('opponentAnalysis.subtitle')} action={<Link className="ghost-button" to="/dashboard">{t('nav.dashboard')}</Link>} />

      <section className="panel opponent-hero">
        <div className="opponent-hero__teams">
          <div>
            <Flag team={analysis.match.home} size="lg" />
            <strong>{teamName(analysis.match.home, language)}</strong>
          </div>
          <span>{t('match.scheduled')}</span>
          <div>
            <Flag team={analysis.match.away} size="lg" />
            <strong>{teamName(analysis.match.away, language)}</strong>
          </div>
        </div>
        <div className="opponent-hero__meta">
          <span>{formatDateTime(analysis.match.kickoffAt, language)}</span>
          <span>{analysis.match.venue}</span>
          <strong>{t('opponentAnalysis.threatLevel')}: {t(`opponentAnalysis.threatLevels.${analysis.threatLevel.level}`)} / {analysis.threatLevel.score}</strong>
        </div>
      </section>

      <section className="analysis-grid analysis-grid--comparison">
        {comparisonCards.map(([category, item]) => <ComparisonCard key={category} category={category} item={item} />)}
      </section>

      <section className="analysis-grid">
        <div className="panel analysis-panel">
          <div className="panel__head">
            <h2>{t('opponentAnalysis.opponentStrengths')}</h2>
            <Target size={18} />
          </div>
          <div className="analysis-list">
            {analysis.opponentStrengths.map((item) => (
              <article className="analysis-list-item" key={item.area}>
                <div>
                  <strong>{t(`opponentAnalysis.categories.${item.area}`)}</strong>
                  <span>{t(`opponentAnalysis.strengthReasons.${item.reason}`)}</span>
                </div>
                <b>{item.score}</b>
              </article>
            ))}
          </div>
        </div>

        <div className="panel analysis-panel">
          <div className="panel__head">
            <h2>{t('opponentAnalysis.opponentWeaknesses')}</h2>
            <ShieldAlert size={18} />
          </div>
          <div className="analysis-list">
            {analysis.opponentWeaknesses.map((item) => (
              <article className="analysis-list-item" key={item.position}>
                <div>
                  <strong>{t(`positions.${item.position}`)}</strong>
                  <span>{t(`opponentAnalysis.weaknessReasons.${item.reason}`)}</span>
                </div>
                <b>{item.score}</b>
              </article>
            ))}
          </div>
        </div>

        <div className="panel analysis-panel">
          <div className="panel__head">
            <h2>{t('opponentAnalysis.keyThreats')}</h2>
            <Eye size={18} />
          </div>
          <div className="analysis-list">
            {analysis.keyThreats.length ? analysis.keyThreats.map((threat) => <PlayerThreat key={threat.player._id} threat={threat} />) : (
              <div className="dashboard-empty">{t('opponentAnalysis.noThreats')}</div>
            )}
          </div>
        </div>
      </section>

      <section className="analysis-grid analysis-grid--plan">
        <div className="panel analysis-panel">
          <div className="panel__head">
            <h2>{t('opponentAnalysis.recommendedPlan')}</h2>
            <BarChart3 size={18} />
          </div>
          <div className="plan-grid">
            <PlanRow icon={Activity} labelKey="pressing" plan={analysis.tacticalPlan.pressing} />
            <PlanRow icon={Gauge} labelKey="tempo" plan={analysis.tacticalPlan.tempo} />
            <PlanRow icon={ShieldAlert} labelKey="defensiveLine" plan={analysis.tacticalPlan.defensiveLine} />
            <PlanRow icon={Target} labelKey="counterAttack" plan={analysis.tacticalPlan.counterAttack} />
          </div>
          {keyPlayer ? (
            <div className="key-watch">
              <AlertTriangle size={18} />
              <div>
                <span>{t('opponentAnalysis.keyPlayerToWatch')}</span>
                <strong>{keyPlayer.fullName}</strong>
                <small>{t(`positions.${keyPlayer.primaryPosition}`)} / {keyPlayer.overall}</small>
              </div>
            </div>
          ) : null}
        </div>

        <div className="panel analysis-panel">
          <div className="panel__head"><h2>{t('opponentAnalysis.recentForm')}</h2></div>
          <div className="form-grid">
            <article>
              <span>{teamName(analysis.ourTeam, language)}</span>
              <strong>{formSummary(analysis.recentForm.ours, t)}</strong>
            </article>
            <article>
              <span>{teamName(analysis.opponent, language)}</span>
              <strong>{formSummary(analysis.recentForm.opponent, t)}</strong>
            </article>
          </div>
        </div>
      </section>
    </section>
  );
}
