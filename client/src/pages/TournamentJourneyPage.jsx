import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Crown, Flag as FlagIcon, Newspaper, ShieldCheck, Star, Trophy, Users } from 'lucide-react';
import { Flag } from '../components/Flag.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, getApiError } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formatDateTime, teamName } from '../utils/format.js';

function stageLabel(match, t) {
  if (!match) return '-';
  return match.stage === 'group' ? `${t('teams.group')} ${match.group}` : t(`knockout.${match.stage}`);
}

function resultTone(result) {
  if (result === 'W') return 'green';
  if (result === 'L') return 'danger';
  if (result === 'D') return 'amber';
  return 'neutral';
}

function scoreLabel(match) {
  if (!match) return '-';
  return match.status === 'completed' ? match.scoreText : 'vs';
}

function SummaryCard({ label, value, tone = 'green' }) {
  return (
    <article className={`journey-summary-card journey-summary-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function MatchTimelineItem({ match }) {
  const { t, language } = useLanguage();
  return (
    <Link className={`journey-timeline-item journey-timeline-item--${resultTone(match.result)}`} to={`/matches/${match._id}`}>
      <div>
        <span>{formatDateTime(match.kickoffAt, language)}</span>
        <strong>{stageLabel(match, t)}</strong>
      </div>
      <div>
        <span>{t('dashboard.opponent')}</span>
        <strong><Flag team={match.opponent} /> {teamName(match.opponent, language)}</strong>
      </div>
      <div>
        <span>{match.venue}</span>
        <b>{scoreLabel(match)}</b>
      </div>
      <em>{t(`journey.results.${match.result}`)}</em>
    </Link>
  );
}

function KeyPlayerCard({ title, player, statLabel }) {
  const { t } = useLanguage();
  if (!player) {
    return (
      <article className="journey-player-card">
        <span>{title}</span>
        <div className="dashboard-empty">{t('journey.noPlayerData')}</div>
      </article>
    );
  }

  const value = statLabel === 'avgRating' ? Number(player.tournamentStats?.avgRating || 0).toFixed(1) : player.value;

  return (
    <article className="journey-player-card">
      <span>{title}</span>
      <strong>{player.fullName}</strong>
      <small>{t(`positions.${player.primaryPosition}`)} / {player.club}</small>
      <b>{value}</b>
    </article>
  );
}

function GradeBreakdown({ label, value }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="journey-breakdown-row">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="journey-meter" aria-hidden="true">
        <span style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

function ReactionCard({ icon: Icon, title, reaction }) {
  const { t } = useLanguage();
  return (
    <article className="journey-reaction-card">
      <Icon size={18} />
      <div>
        <span>{title}</span>
        <strong>{t(`journey.reactions.${reaction.key}`)}</strong>
      </div>
      <b>{reaction.value}/100</b>
    </article>
  );
}

export function TournamentJourneyPage() {
  const { t, language } = useLanguage();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [journey, setJourney] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;

    api.get('/manager/tournament-journey')
      .then(({ data }) => {
        setJourney(data.journey);
        setError('');
      })
      .catch((apiError) => setError(getApiError(apiError, t('journey.errorMessage'))));
  }, [isAuthenticated, t]);

  const allMatches = useMemo(() => {
    if (!journey) return [];
    return [...journey.matches.groupStage, ...journey.matches.knockout].sort((a, b) => new Date(a.kickoffAt) - new Date(b.kickoffAt));
  }, [journey]);

  if (!isAuthenticated) {
    return (
      <section>
        <PageHeader title={t('journey.title')} subtitle={t('dashboard.chooseTeam')} action={<Link className="primary-button" to="/login">{t('auth.login')}</Link>} />
      </section>
    );
  }

  if (!journey && !error) return <LoadingState />;

  if (!journey) {
    return (
      <section>
        <PageHeader title={t('journey.title')} subtitle={t('journey.subtitle')} />
        <div className="dashboard-error">
          <strong>{t('journey.errorTitle')}</strong>
          <p>{error}</p>
          <Link className="primary-button" to="/teams">{t('nav.teams')}</Link>
        </div>
      </section>
    );
  }

  const performance = journey.managerPerformance;
  const summary = journey.summary;

  return (
    <section className="journey-page">
      <PageHeader
        title={t('journey.title')}
        subtitle={t('journey.subtitle')}
        action={<Link className="ghost-button" to="/tournament">{t('nav.tournament')}</Link>}
      />

      <section className={`panel journey-hero ${journey.status.champion ? 'journey-hero--champion' : ''}`}>
        <div className="journey-hero__identity">
          <Flag team={journey.team} size="lg" />
          <div>
            <span>{journey.team.fifaCode} / {t('teams.group')} {journey.team.group}</span>
            <h2>{teamName(journey.team, language)}</h2>
            <p>{t(`journey.statusLabels.${journey.status.currentStatus}`)}</p>
          </div>
        </div>
        <div className="journey-grade-card">
          <span>{t('journey.managerGrade')}</span>
          <strong>{performance.grade}</strong>
          <small>{performance.score}/100</small>
        </div>
        <div className="journey-status-card">
          <span>{t('journey.currentStatus')}</span>
          <strong>{t(`journey.statusLabels.${journey.status.currentStatus}`)}</strong>
          <small>{t('journey.expectation')}: {t(`journey.expectations.${performance.expectation.key}`)}</small>
        </div>
      </section>

      {journey.championCelebration ? (
        <section className="panel journey-celebration">
          <Crown size={24} />
          <div>
            <h2>{t('journey.championTitle')}</h2>
            <p>{t('journey.championBody', { team: teamName(journey.team, language) })}</p>
          </div>
        </section>
      ) : null}

      {journey.eliminationReport ? (
        <section className="panel journey-elimination">
          <ShieldCheck size={22} />
          <div>
            <h2>{t('journey.eliminationTitle')}</h2>
            <p>{t(`journey.eliminationReasons.${journey.eliminationReport.reasonKey}`, {
              position: journey.eliminationReport.groupPosition || '-',
              points: journey.eliminationReport.groupPoints || 0,
            })}</p>
          </div>
        </section>
      ) : null}

      <section className="journey-summary-grid">
        <SummaryCard label={t('journey.wins')} value={summary.wins} />
        <SummaryCard label={t('journey.draws')} value={summary.draws} tone="amber" />
        <SummaryCard label={t('journey.losses')} value={summary.losses} tone="danger" />
        <SummaryCard label={t('journey.goalsForAgainst')} value={`${summary.goalsFor}-${summary.goalsAgainst}`} />
        <SummaryCard label={t('journey.cleanSheets')} value={summary.cleanSheets} />
        <SummaryCard label={t('journey.played')} value={summary.played} />
      </section>

      <div className="journey-grid journey-grid--top">
        <section className="panel">
          <div className="panel__head"><h2>{t('journey.journeyTimeline')}</h2></div>
          <div className="journey-timeline">
            {allMatches.length ? allMatches.map((match) => <MatchTimelineItem key={match._id} match={match} />) : (
              <div className="dashboard-empty">{t('journey.noMatches')}</div>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel__head"><h2>{t('journey.mostImportantMatch')}</h2><Star size={18} /></div>
          {journey.mostImportantMatch ? (
            <article className="journey-important-card">
              <span>{t(`journey.importantReasons.${journey.mostImportantMatch.reason}`)}</span>
              <strong>{stageLabel(journey.mostImportantMatch.match, t)}</strong>
              <p>{teamName(journey.team, language)} {scoreLabel(journey.mostImportantMatch.match)} {teamName(journey.mostImportantMatch.match.opponent, language)}</p>
              <Link className="text-button" to={`/matches/${journey.mostImportantMatch.match._id}`}>{t('app.view')}</Link>
            </article>
          ) : (
            <div className="dashboard-empty">{t('journey.noImportantMatch')}</div>
          )}
        </section>
      </div>

      <div className="journey-grid">
        <section className="panel">
          <div className="panel__head"><h2>{t('journey.keyPlayers')}</h2><Users size={18} /></div>
          <div className="journey-player-grid">
            <KeyPlayerCard title={t('journey.bestRatedPlayer')} player={journey.keyPlayers.bestRatedPlayer} statLabel="avgRating" />
            <KeyPlayerCard title={t('journey.topScorer')} player={journey.keyPlayers.topScorer} statLabel="goals" />
            <KeyPlayerCard title={t('journey.topAssister')} player={journey.keyPlayers.topAssister} statLabel="assists" />
          </div>
        </section>

        <section className="panel">
          <div className="panel__head"><h2>{t('journey.resultsSummary')}</h2><BarChart3 size={18} /></div>
          <div className="summary-list">
            <article>
              <span>{t('journey.biggestWin')}</span>
              <strong>{summary.biggestWin ? `${scoreLabel(summary.biggestWin)} ${teamName(summary.biggestWin.opponent, language)}` : t('journey.noneYet')}</strong>
            </article>
            <article>
              <span>{t('journey.worstDefeat')}</span>
              <strong>{summary.worstDefeat ? `${scoreLabel(summary.worstDefeat)} ${teamName(summary.worstDefeat.opponent, language)}` : t('journey.noneYet')}</strong>
            </article>
            <article>
              <span>{t('journey.groupPosition')}</span>
              <strong>{journey.status.groupPosition || '-'} / {journey.status.groupPoints} {t('opponentAnalysis.points')}</strong>
            </article>
          </div>
        </section>
      </div>

      <div className="journey-grid">
        <section className="panel">
          <div className="panel__head"><h2>{t('journey.managerPerformance')}</h2><Trophy size={18} /></div>
          <div className="journey-performance">
            <div className="journey-performance__grade">
              <span>{t('journey.managerGrade')}</span>
              <strong>{performance.grade}</strong>
              <small>{performance.score}/100</small>
            </div>
            <div className="journey-breakdown">
              <GradeBreakdown label={t('journey.breakdown.matchResults')} value={performance.breakdown.matchResults} />
              <GradeBreakdown label={t('journey.breakdown.groupPerformance')} value={performance.breakdown.groupPerformance} />
              <GradeBreakdown label={t('journey.breakdown.knockoutProgress')} value={performance.breakdown.knockoutProgress} />
              <GradeBreakdown label={t('journey.breakdown.mediaControl')} value={performance.breakdown.mediaControl} />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel__head"><h2>{t('journey.reactionSummary')}</h2><Newspaper size={18} /></div>
          <div className="journey-reaction-grid">
            <ReactionCard icon={ShieldCheck} title={t('dashboard.boardConfidence')} reaction={performance.reactions.board} />
            <ReactionCard icon={Users} title={t('dashboard.fanConfidence')} reaction={performance.reactions.fan} />
            <ReactionCard icon={FlagIcon} title={t('dashboard.mediaPressure')} reaction={performance.reactions.media} />
          </div>
        </section>
      </div>
    </section>
  );
}
