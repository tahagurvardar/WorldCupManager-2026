import { CheckCircle2, GripVertical, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';
import { formationSlots, formations, isPositionFit } from '../utils/formations.js';

const defaultSliders = {
  pressing: 58,
  tempo: 56,
  width: 54,
  defensiveLine: 52,
  creativity: 55,
  compactness: 54,
  counterAttack: 50,
};

function buildDefaultLineup(allPlayers, formationName) {
  const used = new Set();

  return formationSlots[formationName].map(([slot, x, y]) => {
    const matching = allPlayers.find((player) => !used.has(player._id) && isPositionFit(slot, player));
    const fallback = allPlayers.find((player) => !used.has(player._id));
    const player = matching || fallback;
    if (player) used.add(player._id);

    return {
      slot,
      x,
      y,
      player: player?._id || null,
    };
  });
}

export function TacticsPage() {
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const teamId = user?.selectedTeam?._id;
  const [players, setPlayers] = useState([]);
  const [formation, setFormation] = useState('4-3-3');
  const [lineup, setLineup] = useState([]);
  const [sliders, setSliders] = useState(defaultSliders);
  const [loading, setLoading] = useState(Boolean(teamId));
  const [saved, setSaved] = useState('');
  const [selectedPoolPlayer, setSelectedPoolPlayer] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');

  useEffect(() => {
    if (!teamId) return;
    Promise.all([
      api.get('/players', { params: { team: teamId, limit: 80 } }),
      api.get('/tactics', { params: { team: teamId } }).catch(() => ({ data: { tactic: null } })),
    ]).then(([playerResponse, tacticResponse]) => {
      const allPlayers = playerResponse.data.players;
      setPlayers(allPlayers);
      if (tacticResponse.data.tactic) {
        setFormation(tacticResponse.data.tactic.formation);
        setLineup(tacticResponse.data.tactic.lineup.map((item) => ({ ...item, player: item.player?._id || item.player })));
        setSliders(tacticResponse.data.tactic.sliders);
      } else {
        setLineup(buildDefaultLineup(allPlayers, '4-3-3'));
      }
    }).finally(() => setLoading(false));
  }, [teamId]);

  const slots = formationSlots[formation];
  const playerById = useMemo(() => new Map(players.map((player) => [player._id, player])), [players]);
  const usedIds = useMemo(() => new Set(lineup.map((item) => item.player).filter(Boolean)), [lineup]);
  const availablePlayers = useMemo(() => players.filter((player) => !usedIds.has(player._id)), [players, usedIds]);
  const recommendationEmptyText = players.length < 11 ? t('tactics.notEnoughPlayers') : t('tactics.noRecommendation');

  const changeFormation = (nextFormation) => {
    setFormation(nextFormation);
    setRecommendation(null);
    setRecommendationError('');
    setLineup(formationSlots[nextFormation].map(([slot, x, y], index) => ({
      slot,
      x,
      y,
      player: lineup[index]?.player || null,
    })));
  };

  const assignPlayer = (slotIndex, playerId) => {
    setLineup((current) => current.map((item, index) => (index === slotIndex ? { ...item, player: playerId } : item)));
    setSelectedPoolPlayer(null);
  };

  const generateRecommendation = async () => {
    setRecommendationLoading(true);
    setRecommendationError('');
    setRecommendation(null);

    try {
      const { data } = await api.get('/manager/recommended-xi', {
        params: { team: teamId, formation },
      });
      setRecommendation(data.recommendation);
    } catch (error) {
      setRecommendationError(error.response?.data?.message || t('tactics.recommendationError'));
    } finally {
      setRecommendationLoading(false);
    }
  };

  const applyRecommendation = () => {
    if (!recommendation?.lineup?.length) return;
    setLineup(recommendation.lineup.map((item) => ({
      slot: item.slot,
      x: item.x,
      y: item.y,
      player: item.player?._id || null,
    })));
    setSelectedPoolPlayer(null);
    setSaved(t('tactics.recommendationApplied'));
  };

  const renderReason = (reason) => {
    const label = t(`tactics.recommendationReasons.${reason.key}`);
    if (['overallRating', 'formScore', 'fitnessScore'].includes(reason.key)) {
      return `${label}: ${reason.value}`;
    }
    return label;
  };

  const onDrop = (event, slotIndex) => {
    const playerId = event.dataTransfer.getData('player');
    assignPlayer(slotIndex, playerId);
  };

  const onSlotClick = (slotIndex) => {
    if (!selectedPoolPlayer) return;
    assignPlayer(slotIndex, selectedPoolPlayer);
  };

  const save = async () => {
    await api.put('/tactics', { teamId, formation, lineup, sliders });
    setSaved(t('app.saved'));
  };

  if (!teamId) return <PageHeader title={t('tactics.title')} subtitle={t('dashboard.chooseTeam')} />;
  if (loading) return <LoadingState />;

  return (
    <section>
      <PageHeader title={t('tactics.title')} subtitle={t('tactics.subtitle')} action={<button className="primary-button" type="button" onClick={save}>{t('app.save')}</button>} />
      {saved ? <div className="alert">{saved}</div> : null}
      <div className="tactics-layout">
        <section className="panel">
          <div className="panel__head">
            <h2>{t('tactics.formation')}</h2>
            <div className="tactics-tools">
              <select value={formation} onChange={(event) => changeFormation(event.target.value)}>
                {formations.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <button className="ghost-button" type="button" onClick={generateRecommendation} disabled={recommendationLoading || players.length < 11}>
                <Sparkles size={16} />
                {recommendationLoading ? t('tactics.generatingRecommendedXi') : t('tactics.recommendedXi')}
              </button>
            </div>
          </div>
          <div className="pitch" aria-label={t('tactics.lineup')}>
            {slots.map(([slot, x, y], index) => {
              const selectedPlayer = playerById.get(lineup[index]?.player);
              const mismatch = selectedPlayer && !isPositionFit(slot, selectedPlayer);
              return (
                <div
                  className={`pitch-slot ${mismatch ? 'pitch-slot--warning' : ''}`}
                  key={`${slot}-${index}`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => onDrop(event, index)}
                  onClick={() => onSlotClick(index)}
                >
                  <span>{t(`positions.${slot}`)}</span>
                  <strong>{selectedPlayer?.fullName || t('tactics.dropHint')}</strong>
                  {mismatch ? <small>{t('tactics.mismatch')}</small> : null}
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <div className="panel__head"><h2>{t('tactics.bench')}</h2></div>
          {selectedPoolPlayer ? <div className="pool-selected">{playerById.get(selectedPoolPlayer)?.fullName}</div> : null}
          <div className="drag-list">
            {availablePlayers.map((player) => (
              <div
                className={`drag-player ${selectedPoolPlayer === player._id ? 'drag-player--selected' : ''}`}
                key={player._id}
                role="button"
                tabIndex={0}
                draggable
                onClick={() => setSelectedPoolPlayer(player._id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setSelectedPoolPlayer(player._id);
                }}
                onDragStart={(event) => event.dataTransfer.setData('player', player._id)}
              >
                <GripVertical size={16} />
                <strong>{player.fullName}</strong>
                <span>{t(`positions.${player.primaryPosition}`)} · {player.overall}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="panel sliders-panel">
          <div className="panel__head"><h2>{t('tactics.title')}</h2></div>
          {Object.keys(defaultSliders).map((key) => (
            <label className="slider-row" key={key}>
              <span>{t(`tactics.${key}`)}</span>
              <input type="range" min="0" max="100" value={sliders[key]} onChange={(event) => setSliders({ ...sliders, [key]: Number(event.target.value) })} />
              <b>{sliders[key]}</b>
            </label>
          ))}
        </section>
      </div>
      <section className="panel recommendation-panel" aria-busy={recommendationLoading}>
        <div className="panel__head">
          <div>
            <h2>{t('tactics.recommendedXiExplanation')}</h2>
            <p>{t('tactics.recommendedXiSubtitle')}</p>
          </div>
          <button className="primary-button" type="button" onClick={applyRecommendation} disabled={!recommendation?.lineup?.length}>
            <CheckCircle2 size={16} />
            {t('tactics.applyRecommendedXi')}
          </button>
        </div>

        {recommendationLoading ? <LoadingState label={t('tactics.generatingRecommendedXi')} /> : null}
        {recommendationError ? <div className="alert alert--danger">{recommendationError}</div> : null}
        {!recommendationLoading && !recommendationError && !recommendation ? (
          <div className="dashboard-empty">{recommendationEmptyText}</div>
        ) : null}

        {recommendation ? (
          <div className="recommendation-grid">
            <article className="recommendation-readiness">
              <span>{t('tactics.readinessScore')}</span>
              <strong>{recommendation.readinessScore}</strong>
              <div className="readiness-meter" aria-hidden="true">
                <span style={{ width: `${recommendation.readinessScore}%` }} />
              </div>
              <small>{t('tactics.recommendationPool', { eligible: recommendation.pool.eligible, total: recommendation.pool.total })}</small>
            </article>

            <article className="recommendation-list">
              <h3>{t('tactics.selectedPlayers')}</h3>
              <div className="recommendation-items">
                {recommendation.lineup.map((item) => (
                  <div className="recommendation-item" key={`${item.slot}-${item.order}`}>
                    <div>
                      <strong>{item.player.fullName}</strong>
                      <span>{t(`positions.${item.slot}`)} · {t('tactics.score')} {item.score}</span>
                    </div>
                    <div className="reason-cloud">
                      {item.reasons.map((reason) => <span key={`${item.player._id}-${item.slot}-${reason.key}`}>{renderReason(reason)}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="recommendation-list">
              <h3>{t('tactics.leftOutPlayers')}</h3>
              <div className="recommendation-items">
                {recommendation.omitted?.length ? recommendation.omitted.map((item) => (
                  <div className="recommendation-item" key={item.player._id}>
                    <div>
                      <strong>{item.player.fullName}</strong>
                      <span>{t(`positions.${item.player.primaryPosition}`)} · {item.player.overall}</span>
                    </div>
                    <div className="reason-cloud">
                      <span>{t(`tactics.leftOutReasons.${item.reason}`)}</span>
                    </div>
                  </div>
                )) : <div className="dashboard-empty">{t('tactics.noLeftOutPlayers')}</div>}
              </div>
            </article>
          </div>
        ) : null}
      </section>
    </section>
  );
}
