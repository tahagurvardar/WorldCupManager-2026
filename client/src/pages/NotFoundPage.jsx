import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';

export function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <h1>{t('app.empty')}</h1>
        <Link className="primary-button" to="/dashboard">{t('nav.dashboard')}</Link>
      </section>
    </main>
  );
}
