import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag } from '../components/Flag.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api, getApiError } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { teamName } from '../utils/format.js';

export function TeamSelectionPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/teams')
      .then(({ data }) => setTeams(data.teams))
      .catch((apiError) => setError(getApiError(apiError, t('app.error'))))
      .finally(() => setLoading(false));
  }, [t]);

  const groups = useMemo(() => teams.reduce((acc, team) => {
    acc[team.group] = [...(acc[team.group] || []), team];
    return acc;
  }, {}), [teams]);

  const selectTeam = async (teamId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const { data } = await api.post('/manager/select-team', { teamId });
    setUser(data.user);
    navigate('/dashboard');
  };

  if (loading) return <LoadingState />;

  return (
    <section>
      <PageHeader title={t('teams.title')} subtitle={t('teams.subtitle')} />
      {error ? <div className="alert alert--danger">{error}</div> : null}
      <div className="group-grid">
        {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([group, groupTeams]) => (
          <section className="panel" key={group}>
            <div className="panel__head">
              <h2>{t('teams.group')} {group}</h2>
            </div>
            <div className="team-list">
              {groupTeams.map((team) => (
                <article className="team-card" key={team._id}>
                  <div className="team-card__identity">
                    <Flag team={team} size="lg" />
                    <div>
                      <strong>{teamName(team, language)}</strong>
                      <span>{team.fifaCode} · {team.confederation}</span>
                    </div>
                  </div>
                  <dl className="mini-metrics">
                    <div><dt>{t('teams.ranking')}</dt><dd>{team.worldRanking}</dd></div>
                    <div><dt>{t('dashboard.morale')}</dt><dd>{team.morale}</dd></div>
                    <div><dt>{t('dashboard.chemistry')}</dt><dd>{team.chemistry}</dd></div>
                  </dl>
                  <button className={user?.selectedTeam?._id === team._id ? 'primary-button is-selected' : 'ghost-button'} type="button" onClick={() => selectTeam(team._id)}>
                    {user?.selectedTeam?._id === team._id ? t('teams.selected') : t('teams.becomeManager')}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
