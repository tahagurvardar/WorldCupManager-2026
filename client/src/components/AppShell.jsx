import {
  Activity,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  Swords,
  Table2,
  Trophy,
  Users,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LanguageToggle } from './LanguageToggle.jsx';
import { NotificationDropdown } from './NotificationDropdown.jsx';
import { SearchCommand } from './SearchCommand.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuthStore } from '../store/useAuthStore.js';

const navItems = [
  ['dashboard', '/dashboard', LayoutDashboard],
  ['teams', '/teams', Shield],
  ['squad', '/squad', Users],
  ['tactics', '/tactics', Activity],
  ['journey', '/journey', Trophy],
  ['tournament', '/tournament', Table2],
  ['knockout', '/knockout', Swords],
  ['stats', '/stats', BarChart3],
  ['admin', '/admin', Settings],
];

export function AppShell() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <span className="brand__mark"><Trophy size={22} /></span>
          <div>
            <strong>{t('app.shortName')}</strong>
            <small>{t('app.tagline')}</small>
          </div>
        </div>
        <nav className="nav">
          {navItems.map(([key, href, Icon]) => (
            <NavLink key={key} to={href} onClick={() => setSidebarOpen(false)}>
              <Icon size={18} />
              <span>{t(`nav.${key}`)}</span>
            </NavLink>
          ))}
        </nav>
        {user ? (
          <button className="sidebar__logout" type="button" onClick={handleLogout}>
            <LogOut size={18} />
            {t('nav.logout')}
          </button>
        ) : null}
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button className="icon-button topbar__menu" type="button" onClick={() => setSidebarOpen((value) => !value)}>
            <Menu size={20} />
          </button>
          <SearchCommand />
          <div className="topbar__actions">
            <LanguageToggle />
            <ThemeToggle />
            <NotificationDropdown />
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
