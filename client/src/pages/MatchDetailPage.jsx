import { AlertTriangle, Play, Shield, Star, Trophy, Zap } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Flag } from '../components/Flag.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, getApiError } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formatDateTime, teamName } from '../utils/format.js';

const keyStats = ['possession', 'xG', 'shots', 'shotsOnTarget'];
const statCards = ['possession', 'xG', 'shots', 'shotsOnTarget', 'fouls', 'yellowCards', 'redCards', 'corners'];
const timelineTypes = new Set(['goal', 'assist', 'yellow_card', 'red_card', 'injury', 'var', 'penalty', 'penalty_missed']);

function getTeamId(team) {
  return String(team?._id || team?.id || team);
}

function stageLabel(match, t) {
  if (match.group) return `${t('teams.group')} ${match.group}`;
  return t(`knockout.${match.stage}`);
}

function scoreDisplay(match) {
  if (match.status !== 'completed') return 'vs';
  return `${match.score.home} - ${match.score.away}`;
}

function statValue(stats, key) {
  if (key === 'xG') return Number(stats.xG || 0).toFixed(2);
  return stats[key] ?? 0;
}

function statLabelKey(key) {
  return key === 'xG' ? 'xg' : key;
}

function statMax(home, away, fallback = 1) {
  return Math.max(Number(home) || 0, Number(away) || 0, fallback);
}

function eventIcon(type, minute) {
  if (type === 'goal' && minute >= 85) return Zap;
  if (type === 'goal' || type === 'penalty') return Star;
  if (type === 'red_card' || type === 'yellow_card') return AlertTriangle;
  if (type === 'injury') return AlertTriangle;
  if (type === 'var') return Shield;
  return Star;
}

function splitRatings(match) {
  const homeCode = match.home.fifaCode;
  const awayCode = match.away.fifaCode;
  const sorted = [...(match.playerRatings || [])].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  return {
    home: sorted.filter((rating) => rating.teamCode === homeCode),
    away: sorted.filter((rating) => rating.teamCode === awayCode),
    top: sorted[0] || null,
  };
}

function managerTeamSide(match, user) {
  const selectedId = user?.selectedTeam?._id || user?.selectedTeam;
  if (!selectedId) return null;
  if (getTeamId(match.home.team) === getTeamId(selectedId)) return 'home';
  if (getTeamId(match.away.team) === getTeamId(selectedId)) return 'away';
  return null;
}

function winningFactor(match, t) {
  if (match.status !== 'completed') return t('match.summary.notPlayed');
  const homeScore = match.score.home;
  const awayScore = match.score.away;
  const homeStats = match.stats.home;
  const awayStats = match.stats.away;
  const winnerSide = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : null;

  if (!winnerSide) return t('match.summary.factors.drawControl');
  const winningStats = winnerSide === 'home' ? homeStats : awayStats;
  const losingStats = winnerSide === 'home' ? awayStats : homeStats;
  if (homeScore === 0 || awayScore === 0) return t('match.summary.factors.cleanSheet');
  if ((winningStats.xG || 0) - (losingStats.xG || 0) >= 0.6) return t('match.summary.factors.chanceQuality');
  if ((winningStats.shotsOnTarget || 0) > (losingStats.shotsOnTarget || 0)) return t('match.summary.factors.shotAccuracy');
  return t('match.summary.factors.efficiency');
}

function turningPoint(match, t, localize) {
  const events = match.events || [];
  const lateGoal = events.find((event) => event.type === 'goal' && event.minute >= 85);
  if (lateGoal) return localize(lateGoal.description);

  const redCard = events.find((event) => event.type === 'red_card');
  if (redCard) return localize(redCard.description);

  const firstGoal = events.find((event) => event.type === 'goal');
  if (firstGoal) return localize(firstGoal.description);

  return t('match.summary.noTurningPoint');
}

function momentumSummary(match, language) {
  const rows = match.momentum || [];
  if (!rows.length) return { home: 50, away: 50, text: '-' };
  const home = Math.round(rows.reduce((sum, item) => sum + (item.home || 0), 0) / rows.length);
  const away = 100 - home;
  const leader = home >= away ? match.home : match.away;
  const label = teamName(leader, language);
  return { home, away, text: `${label} ${Math.max(home, away)}%` };
}

function managerReaction(match, user, t) {
  const side = managerTeamSide(match, user);
  if (!side || match.status !== 'completed') return null;
  const scoreFor = side === 'home' ? match.score.home : match.score.away;
  const scoreAgainst = side === 'home' ? match.score.away : match.score.home;
  if (scoreFor > scoreAgainst) return t('match.summary.managerWin');
  if (scoreFor === scoreAgainst) return t('match.summary.managerDraw');
  return t('match.summary.managerLoss');
}

function TeamBlock({ team, align = 'left' }) {
  const { language } = useLanguage();
  return (
    <div className={`report-team report-team--${align}`}>
      <Flag team={team} size="lg" />
      <div>
        <strong>{teamName(team, language)}</strong>
        <span>{team.fifaCode}</span>
      </div>
    </div>
  );
}

function StatCard({ label, home, away }) {
  return (
    <article className="report-stat-card">
      <span>{label}</span>
      <strong>{home}</strong>
      <b>{away}</b>
    </article>
  );
}

function ComparisonBar({ label, home, away, percentMode = false }) {
  const max = percentMode ? 100 : statMax(home, away);
  const homeWidth = Math.max(4, ((Number(home) || 0) / max) * 100);
  const awayWidth = Math.max(4, ((Number(away) || 0) / max) * 100);
  return (
    <div className="comparison-row">
      <div>
        <b>{home}</b>
        <span>{label}</span>
        <b>{away}</b>
      </div>
      <div className="comparison-row__bars" aria-hidden="true">
        <span style={{ width: `${homeWidth}%` }} />
        <span style={{ width: `${awayWidth}%` }} />
      </div>
    </div>
  );
}

function RatingsTable({ title, ratings }) {
  const { t } = useLanguage();
  return (
    <article className="ratings-table">
      <h3>{title}</h3>
      <div className="table-wrap">
        <table className="data-table data-table--compact">
          <thead>
            <tr>
              <th>{t('match.player')}</th>
              <th>{t('match.position')}</th>
              <th>{t('match.goals')}</th>
              <th>{t('match.assists')}</th>
              <th>{t('match.rating')}</th>
            </tr>
          </thead>
          <tbody>
            {ratings.length ? ratings.map((rating) => (
              <tr key={`${rating.player}-${rating.name}`}>
                <td>{rating.name}</td>
                <td>{rating.position}</td>
                <td>{rating.goals || 0}</td>
                <td>{rating.assists || 0}</td>
                <td><strong>{rating.rating}</strong></td>
              </tr>
            )) : (
              <tr><td colSpan="5">{t('match.noRatings')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export function MatchDetailPage() {
  const { id } = useParams();
  const { t, language, localize } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const [match, setMatch] = useState(null);
  const [news, setNews] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/matches/${id}`),
      api.get('/news', { params: { match: id } }).catch(() => ({ data: { news: [] } })),
    ])
      .then(([matchResponse, newsResponse]) => {
        setMatch(matchResponse.data.match);
        setNews(newsResponse.data.news || []);
        setError('');
      })
      .catch((apiError) => setError(getApiError(apiError, t('match.errorMessage'))));
  }, [id, t]);

  const simulate = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/matches/${id}/simulate`);
      const newsResponse = await api.get('/news', { params: { match: id } });
      setMatch(data.match);
      setNews(newsResponse.data.news || []);
      setError('');
    } catch (apiError) {
      setError(getApiError(apiError, t('match.simulationFailed')));
    } finally {
      setBusy(false);
    }
  };

  const ratings = useMemo(() => (match ? splitRatings(match) : { home: [], away: [], top: null }), [match]);
  const timeline = useMemo(() => (
    match?.events?.filter((event) => timelineTypes.has(event.type) || (event.type === 'goal' && event.minute >= 85)) || []
  ), [match]);
  const momentum = useMemo(() => (match ? momentumSummary(match, language) : null), [match, language]);

  if (!match && !error) return <LoadingState />;

  if (!match) {
    return (
      <section>
        <PageHeader title={t('match.title')} subtitle={t('match.reportSubtitle')} />
        <div className="dashboard-error">
          <strong>{t('match.errorTitle')}</strong>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  const managerSummary = managerReaction(match, user, t);

  return (
    <section className="match-report">
      <PageHeader
        title={t('match.reportTitle')}
        subtitle={`${stageLabel(match, t)} / ${formatDateTime(match.kickoffAt, language)}`}
        action={user?.role === 'admin' && match.status !== 'completed' ? <button className="primary-button" type="button" onClick={simulate} disabled={busy}><Play size={16} />{t('app.simulate')}</button> : null}
      />
      {error ? <div className="alert alert--danger">{error}</div> : null}

      <section className="panel report-hero">
        <TeamBlock team={match.home} />
        <div className="report-scoreboard">
          <span>{stageLabel(match, t)}</span>
          <strong>{scoreDisplay(match)}</strong>
          {match.penalties.home !== null ? <small>{t('match.penalties')}: {match.penalties.home} - {match.penalties.away}</small> : null}
          <small>{match.venue} / {formatDateTime(match.kickoffAt, language)}</small>
          <b>{t(`match.${match.status}`)}</b>
        </div>
        <TeamBlock team={match.away} align="right" />
      </section>

      <section className="report-stat-grid">
        {statCards.map((key) => (
          <StatCard
            key={key}
            label={t(`match.${statLabelKey(key)}`)}
            home={statValue(match.stats.home, key)}
            away={statValue(match.stats.away, key)}
          />
        ))}
      </section>

      <section className="match-report-grid match-report-grid--top">
        <div className="panel report-panel">
          <div className="panel__head"><h2>{t('match.keyComparisons')}</h2></div>
          <div className="comparison-list">
            {keyStats.map((key) => (
              <ComparisonBar
                key={key}
                label={t(`match.${statLabelKey(key)}`)}
                home={statValue(match.stats.home, key)}
                away={statValue(match.stats.away, key)}
                percentMode={key === 'possession'}
              />
            ))}
          </div>
        </div>

        <div className="panel report-panel">
          <div className="panel__head"><h2>{t('match.manOfTheMatch')}</h2><Trophy size={18} /></div>
          {ratings.top ? (
            <article className="motm-card">
              <Star size={20} />
              <div>
                <strong>{ratings.top.name}</strong>
                <span>{ratings.top.teamCode} / {ratings.top.position}</span>
                <small>{ratings.top.goals || 0} {t('match.goals')} / {ratings.top.assists || 0} {t('match.assists')}</small>
              </div>
              <b>{ratings.top.rating}</b>
            </article>
          ) : <div className="dashboard-empty">{t('match.noRatings')}</div>}
        </div>
      </section>

      <section className="match-report-grid">
        <div className="panel report-panel">
          <div className="panel__head"><h2>{t('match.timeline')}</h2></div>
          <div className="report-timeline">
            {timeline.length ? timeline.map((event, index) => {
              const Icon = eventIcon(event.type, event.minute);
              return (
                <article className={event.type === 'goal' && event.minute >= 85 ? 'is-late-goal' : ''} key={`${event.minute}-${event.type}-${index}`}>
                  <span>{event.minute}'</span>
                  <Icon size={16} />
                  <p>{localize(event.description)}</p>
                </article>
              );
            }) : <div className="dashboard-empty">{t('match.noEvents')}</div>}
          </div>
        </div>

        <div className="panel report-panel">
          <div className="panel__head"><h2>{t('match.tacticalSummary')}</h2></div>
          <div className="summary-list">
            <article>
              <span>{t('match.winningFactor')}</span>
              <strong>{winningFactor(match, t)}</strong>
            </article>
            <article>
              <span>{t('match.turningPoint')}</span>
              <strong>{turningPoint(match, t, localize)}</strong>
            </article>
            <article>
              <span>{t('match.teamMomentum')}</span>
              <strong>{momentum.text}</strong>
              <div className="comparison-row__bars" aria-hidden="true">
                <span style={{ width: `${momentum.home}%` }} />
                <span style={{ width: `${momentum.away}%` }} />
              </div>
            </article>
            {managerSummary ? (
              <article>
                <span>{t('match.managerReaction')}</span>
                <strong>{managerSummary}</strong>
              </article>
            ) : null}
          </div>
        </div>
      </section>

      <section className="panel report-panel">
        <div className="panel__head"><h2>{t('match.momentum')}</h2></div>
        {match.momentum?.length ? (
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={match.momentum}>
                <XAxis dataKey="minute" stroke="var(--muted)" />
                <YAxis hide domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="home" stackId="a" fill="var(--accent)" />
                <Bar dataKey="away" stackId="a" fill="var(--blue)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <div className="dashboard-empty">{t('match.noMomentum')}</div>}
      </section>

      <section className="panel report-panel">
        <div className="panel__head"><h2>{t('match.ratings')}</h2></div>
        <div className="ratings-grid">
          <RatingsTable title={teamName(match.home, language)} ratings={ratings.home} />
          <RatingsTable title={teamName(match.away, language)} ratings={ratings.away} />
        </div>
      </section>

      <section className="panel report-panel">
        <div className="panel__head"><h2>{t('match.relatedNews')}</h2></div>
        <div className="news-list">
          {news.length ? news.map((item) => (
            <article key={item._id}>
              <span className="news-category">{t(`newsCategories.${item.category}`)}</span>
              <strong>{localize(item.title)}</strong>
              <p>{localize(item.body)}</p>
            </article>
          )) : <div className="dashboard-empty">{t('match.noRelatedNews')}</div>}
        </div>
      </section>
    </section>
  );
}
