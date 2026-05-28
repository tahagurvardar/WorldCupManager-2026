import { Trophy } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { getApiError } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';

export function LoginPage() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register({ ...form, preferredLanguage: language });
      }
      navigate('/dashboard');
    } catch (apiError) {
      setError(getApiError(apiError, t('auth.loginFailed')));
    } finally {
      setBusy(false);
    }
  };

  const demoLogin = async (role) => {
    setBusy(true);
    setError('');
    try {
      await login(role === 'admin' ? 'admin@wcm.dev' : 'manager@wcm.dev', 'WorldCup2026!');
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (apiError) {
      setError(getApiError(apiError, t('auth.loginFailed')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="auth-brand">
          <span><Trophy size={30} /></span>
          <div>
            <h1>{t('auth.title')}</h1>
            <p>{t('auth.subtitle')}</p>
          </div>
        </div>
        <form onSubmit={submit} className="form-grid">
          {mode === 'register' ? (
            <label>
              <span>{t('auth.name')}</span>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
          ) : null}
          <label>
            <span>{t('auth.email')}</span>
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          </label>
          <label>
            <span>{t('auth.password')}</span>
            <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength={mode === 'register' ? 8 : 1} />
          </label>
          {error ? <div className="alert alert--danger">{error}</div> : null}
          <button className="primary-button" type="submit" disabled={busy}>
            {mode === 'login' ? t('auth.login') : t('auth.register')}
          </button>
        </form>
        <div className="auth-actions">
          <button type="button" className="ghost-button" onClick={() => demoLogin('manager')} disabled={busy}>{t('auth.demoManager')}</button>
          <button type="button" className="ghost-button" onClick={() => demoLogin('admin')} disabled={busy}>{t('auth.demoAdmin')}</button>
        </div>
        <button className="text-button" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? t('auth.needAccount') : t('auth.hasAccount')}
        </button>
      </section>
    </main>
  );
}
