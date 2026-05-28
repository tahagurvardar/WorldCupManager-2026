import { useLanguage } from '../context/LanguageContext.jsx';
import { Flag } from './Flag.jsx';
import { teamName } from '../utils/format.js';

export function GroupTable({ group, table, compact = false }) {
  const { t, language } = useLanguage();

  return (
    <section className="panel">
      <div className="panel__head">
        <h2>{t('teams.group')} {group}</h2>
      </div>
      <div className="table-wrap">
        <table className={compact ? 'data-table data-table--compact' : 'data-table'}>
          <thead>
            <tr>
              <th>{t('teams.team')}</th>
              <th>{t('tournament.played')}</th>
              <th>{t('tournament.won')}</th>
              <th>{t('tournament.drawn')}</th>
              <th>{t('tournament.lost')}</th>
              <th>{t('tournament.gd')}</th>
              <th>{t('tournament.points')}</th>
            </tr>
          </thead>
          <tbody>
            {table.map((row, index) => (
              <tr key={row.team._id} className={index < 2 ? 'is-qualified' : index === 2 ? 'is-third' : ''}>
                <td>
                  <span className="team-cell">
                    <Flag team={row.team} />
                    <span>{teamName(row.team, language)}</span>
                  </span>
                </td>
                <td>{row.played}</td>
                <td>{row.won}</td>
                <td>{row.drawn}</td>
                <td>{row.lost}</td>
                <td>{row.goalDifference}</td>
                <td><strong>{row.points}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
