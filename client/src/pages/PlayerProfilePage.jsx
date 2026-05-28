import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Flag } from '../components/Flag.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { StatCard } from '../components/StatCard.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';
import { teamName } from '../utils/format.js';

export function PlayerProfilePage() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [player, setPlayer] = useState(null);

  useEffect(() => {
    api.get(`/players/${id}`).then(({ data }) => setPlayer(data.player));
  }, [id]);

  if (!player) return <LoadingState />;

  const stats = player.tournamentStats || {};
  const countryName = teamName(player.country, language);
  const ageLabel = language === 'tr' ? `${player.age} yaş` : `age ${player.age}`;

  return (
    <section>
      <PageHeader title={player.fullName} subtitle={`${countryName} · ${t(`positions.${player.primaryPosition}`)} · ${ageLabel}`} />
      <section className="panel player-profile">
        <div className="player-profile__hero">
          <Flag team={player.country} size="lg" />
          <div>
            <span>{countryName}</span>
            <strong>{player.overall}</strong>
            <small>{language === 'tr' ? 'Genel güç' : 'Overall'}</small>
          </div>
        </div>
        <div className="stat-grid player-profile__stats">
          <StatCard label={language === 'tr' ? 'Oynanan maç' : 'Appearances'} value={stats.appearances || 0} />
          <StatCard label={t('stats.goals')} value={stats.goals || 0} tone="green" />
          <StatCard label={t('stats.assists')} value={stats.assists || 0} />
          <StatCard label={t('stats.ratings')} value={Number(stats.avgRating || 0).toFixed(1)} tone="amber" />
          <StatCard label={language === 'tr' ? 'Sarı kart' : 'Yellow cards'} value={stats.yellowCards || 0} />
          <StatCard label={language === 'tr' ? 'Kırmızı kart' : 'Red cards'} value={stats.redCards || 0} tone="danger" />
          {player.primaryPosition === 'GK' ? <StatCard label={language === 'tr' ? 'Gol yemediği maç' : 'Clean sheets'} value={stats.cleanSheets || 0} tone="green" /> : null}
        </div>
        <div className="attribute-grid">
          {Object.entries(player.attributes || {}).map(([key, value]) => (
            <div key={key}>
              <span>{key}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
