import { useEffect, useState } from 'react';
import { KnockoutBracket } from '../components/KnockoutBracket.jsx';
import { PageHeader } from '../components/PageHeader.jsx';
import { LoadingState } from '../components/LoadingState.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';

export function KnockoutPage() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/tournament/bracket').then(({ data: response }) => setData(response));
  }, []);

  if (!data) return <LoadingState />;

  return (
    <section>
      <PageHeader title={t('knockout.title')} subtitle={t('knockout.subtitle')} />
      <section className="panel">
        <div className="panel__head">
          <h2>{t('knockout.qualified')}</h2>
          {!data.allGroupsComplete ? <span className="chip">{t('knockout.projected')}</span> : null}
        </div>
        <KnockoutBracket bracket={data} />
      </section>
    </section>
  );
}
