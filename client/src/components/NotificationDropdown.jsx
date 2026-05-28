import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext.jsx';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/useAuthStore.js';

export function NotificationDropdown() {
  const { t, localize } = useLanguage();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!open || !isAuthenticated) return;
    api.get('/notifications').then(({ data }) => setItems(data.notifications)).catch(() => setItems([]));
  }, [open, isAuthenticated]);

  return (
    <div className="dropdown">
      <button className="icon-button" type="button" onClick={() => setOpen((value) => !value)} title={t('notifications.title')}>
        <Bell size={18} />
        {items.some((item) => !item.readAt) ? <span className="dot" /> : null}
      </button>
      {open ? (
        <div className="dropdown__panel">
          <h3>{t('notifications.title')}</h3>
          {items.length === 0 ? <p>{t('notifications.empty')}</p> : items.map((item) => (
            <article key={item._id} className="notification-item">
              <strong>{localize(item.title)}</strong>
              <span>{localize(item.message)}</span>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
