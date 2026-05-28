import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Mic2, Newspaper, TrendingUp } from 'lucide-react';
import { Flag } from '../components/Flag.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, getApiError } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formatDateTime, teamName } from '../utils/format.js';

const effectKeys = ['morale', 'chemistry', 'mediaPressure', 'fanConfidence', 'boardConfidence'];

function metricValue(value) {
  return Math.round(Number(value) || 0);
}

function localizedVariables(rawVariables = {}, language, t) {
  return Object.fromEntries(Object.entries(rawVariables).map(([key, value]) => {
    if (key === 'threatLevel') return [key, t(`opponentAnalysis.threatLevels.${value}`)];
    if (value && typeof value === 'object' && ('tr' in value || 'en' in value)) {
      return [key, value[language] || value.tr || value.en || ''];
    }
    return [key, value];
  }));
}

function EffectsList({ effects }) {
  const { t } = useLanguage();

  return (
    <div className="effects-list">
      {effectKeys.map((key) => {
        const value = effects?.[key] || 0;
        const tone = value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral';
        return (
          <span className={`effect-chip effect-chip--${tone}`} key={key}>
            {t(`pressConference.effects.${key}`)} {value > 0 ? '+' : ''}{value}
          </span>
        );
      })}
    </div>
  );
}

function MetricCard({ label, before, after }) {
  const delta = metricValue(after) - metricValue(before);

  return (
    <article className="press-metric">
      <span>{label}</span>
      <strong>{metricValue(after)}</strong>
      <small>{delta > 0 ? '+' : ''}{delta}</small>
    </article>
  );
}

function AnswerResult({ result, variables, news }) {
  const { t, localize } = useLanguage();

  if (!result) return null;

  return (
    <div className="answer-result">
      <div>
        <CheckCircle2 size={18} />
        <strong>{t(`pressConference.reactions.${result.reactionKey}`, variables)}</strong>
      </div>
      <EffectsList effects={result.effects} />
      {result.metricsBefore && result.metricsAfter ? (
        <div className="press-metrics-grid">
          <MetricCard label={t('pressConference.effects.morale')} before={result.metricsBefore.morale} after={result.metricsAfter.morale} />
          <MetricCard label={t('pressConference.effects.chemistry')} before={result.metricsBefore.chemistry} after={result.metricsAfter.chemistry} />
          <MetricCard label={t('pressConference.effects.mediaPressure')} before={result.metricsBefore.mediaPressure} after={result.metricsAfter.mediaPressure} />
          <MetricCard label={t('pressConference.effects.fanConfidence')} before={result.metricsBefore.fanConfidence} after={result.metricsAfter.fanConfidence} />
          <MetricCard label={t('pressConference.effects.boardConfidence')} before={result.metricsBefore.boardConfidence} after={result.metricsAfter.boardConfidence} />
        </div>
      ) : null}
      {news ? (
        <article className="media-reaction">
          <Newspaper size={18} />
          <div>
            <strong>{localize(news.title)}</strong>
            <p>{localize(news.body)}</p>
          </div>
        </article>
      ) : null}
    </div>
  );
}

function QuestionCard({ question, onAnswer, busyQuestionId, latestResult }) {
  const { t, language } = useLanguage();
  const variables = localizedVariables(question.variables, language, t);
  const answered = latestResult?.questionId === question.questionId ? latestResult : question.answer;
  const disabled = Boolean(question.answer) || Boolean(busyQuestionId);

  return (
    <article className={`question-card ${question.answer ? 'question-card--answered' : ''}`}>
      <div className="question-card__head">
        <span>{t('pressConference.mediaQuestion')}</span>
        {question.answer ? <strong>{t('pressConference.answered')}</strong> : null}
      </div>
      <h2>{t(`pressConference.questions.${question.key}`, variables)}</h2>
      <div className="answer-choice-grid">
        {question.choices.map((choice) => (
          <button
            className="answer-choice"
            type="button"
            key={choice.stance}
            onClick={() => onAnswer(question.questionId, choice.stance)}
            disabled={disabled}
          >
            <strong>{t(`pressConference.stances.${choice.stance}`)}</strong>
            <span>{t(`pressConference.responses.${choice.responseKey}`, variables)}</span>
            <EffectsList effects={choice.effects} />
          </button>
        ))}
      </div>
      <AnswerResult result={answered} variables={variables} news={latestResult?.questionId === question.questionId ? latestResult.news : null} />
    </article>
  );
}

export function PressConferencePage() {
  const { t, language } = useLanguage();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [payload, setPayload] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busyQuestionId, setBusyQuestionId] = useState('');
  const [latestResult, setLatestResult] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    api.get('/manager/press-conference')
      .then((response) => {
        setPayload(response.data);
        setError('');
      })
      .catch((apiError) => {
        setError(getApiError(apiError, t('pressConference.errorMessage')));
        setPayload(null);
      })
      .finally(() => setLoaded(true));
  }, [isAuthenticated, t]);

  const answeredCount = useMemo(() => (
    payload?.conference?.questions?.filter((question) => question.answer).length || 0
  ), [payload]);

  const answerQuestion = async (questionId, stance) => {
    if (!payload?.conference?._id) return;

    setBusyQuestionId(questionId);
    setLatestResult(null);
    try {
      const { data } = await api.post('/manager/press-conference/answer', {
        conferenceId: payload.conference._id,
        questionId,
        stance,
      });
      setPayload((current) => ({
        ...current,
        conference: data.conference,
        metrics: data.result.metricsAfter,
      }));
      setLatestResult(data.result);
    } catch (apiError) {
      setError(getApiError(apiError, t('pressConference.answerError')));
    } finally {
      setBusyQuestionId('');
    }
  };

  if (!isAuthenticated) {
    return (
      <section>
        <PageHeader title={t('pressConference.title')} subtitle={t('dashboard.chooseTeam')} action={<Link className="primary-button" to="/login">{t('auth.login')}</Link>} />
      </section>
    );
  }

  if (!loaded) return <LoadingState label={t('pressConference.loading')} />;

  if (error && !payload) {
    return (
      <section>
        <PageHeader title={t('pressConference.title')} subtitle={t('pressConference.subtitle')} />
        <div className="dashboard-error">
          <strong>{t('pressConference.errorTitle')}</strong>
          <p>{error}</p>
          <Link className="primary-button" to="/dashboard">{t('nav.dashboard')}</Link>
        </div>
      </section>
    );
  }

  if (!payload?.conference) {
    return (
      <section>
        <PageHeader title={t('pressConference.title')} subtitle={t('pressConference.subtitle')} />
        <div className="dashboard-empty">{t('pressConference.noUpcomingMatch')}</div>
      </section>
    );
  }

  const { conference, match, ourTeam, opponent, metrics } = payload;

  return (
    <section className="press-conference">
      <PageHeader title={t('pressConference.title')} subtitle={t('pressConference.subtitle')} action={<Link className="ghost-button" to="/dashboard">{t('nav.dashboard')}</Link>} />

      <section className="panel press-hero">
        <div className="press-hero__match">
          <div><Flag team={match.home} size="lg" /><strong>{teamName(match.home, language)}</strong></div>
          <span>{t('match.scheduled')}</span>
          <div><Flag team={match.away} size="lg" /><strong>{teamName(match.away, language)}</strong></div>
        </div>
        <div className="press-hero__meta">
          <span>{formatDateTime(match.kickoffAt, language)}</span>
          <span>{match.venue}</span>
          <strong>{teamName(ourTeam, language)} {t('pressConference.versus')} {teamName(opponent, language)}</strong>
        </div>
      </section>

      {error ? <div className="alert alert--danger">{error}</div> : null}

      <section className="press-status-grid">
        <article className="panel press-status">
          <Mic2 size={20} />
          <div>
            <span>{t('pressConference.progress')}</span>
            <strong>{answeredCount}/{conference.questions.length}</strong>
          </div>
        </article>
        <article className="panel press-status">
          <TrendingUp size={20} />
          <div>
            <span>{t('pressConference.currentMood')}</span>
            <strong>{metrics.morale} / {metrics.mediaPressure}</strong>
          </div>
        </article>
      </section>

      <section className="questions-grid">
        {conference.questions.map((question) => (
          <QuestionCard
            key={question.questionId}
            question={question}
            onAnswer={answerQuestion}
            busyQuestionId={busyQuestionId}
            latestResult={latestResult}
          />
        ))}
      </section>
    </section>
  );
}
