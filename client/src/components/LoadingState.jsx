import { useLanguage } from '../context/LanguageContext.jsx';

export function LoadingState({ label }) {
  const { t } = useLanguage();
  return (
    <div className="loading-state">
      <span className="loading-state__pulse" />
      {label || t('app.loading')}
    </div>
  );
}
