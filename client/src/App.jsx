import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { AppShell } from './components/AppShell.jsx';
import { LoadingState } from './components/LoadingState.jsx';
import { useAuthStore } from './store/useAuthStore.js';

const LoginPage = lazy(() => import('./pages/LoginPage.jsx').then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx').then((module) => ({ default: module.DashboardPage })));
const TeamSelectionPage = lazy(() => import('./pages/TeamSelectionPage.jsx').then((module) => ({ default: module.TeamSelectionPage })));
const SquadPage = lazy(() => import('./pages/SquadPage.jsx').then((module) => ({ default: module.SquadPage })));
const TacticsPage = lazy(() => import('./pages/TacticsPage.jsx').then((module) => ({ default: module.TacticsPage })));
const TournamentPage = lazy(() => import('./pages/TournamentPage.jsx').then((module) => ({ default: module.TournamentPage })));
const MatchDetailPage = lazy(() => import('./pages/MatchDetailPage.jsx').then((module) => ({ default: module.MatchDetailPage })));
const PlayerProfilePage = lazy(() => import('./pages/PlayerProfilePage.jsx').then((module) => ({ default: module.PlayerProfilePage })));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx').then((module) => ({ default: module.AdminPage })));
const StatsPage = lazy(() => import('./pages/StatsPage.jsx').then((module) => ({ default: module.StatsPage })));
const KnockoutPage = lazy(() => import('./pages/KnockoutPage.jsx').then((module) => ({ default: module.KnockoutPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx').then((module) => ({ default: module.NotFoundPage })));

function App() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <Suspense fallback={<LoadingState />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AppShell />}>
          <Route index element={<Navigate to={isAuthenticated ? '/dashboard' : '/teams'} replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/teams" element={<TeamSelectionPage />} />
          <Route path="/squad" element={<SquadPage />} />
          <Route path="/tactics" element={<TacticsPage />} />
          <Route path="/tournament" element={<TournamentPage />} />
          <Route path="/knockout" element={<KnockoutPage />} />
          <Route path="/matches/:id" element={<MatchDetailPage />} />
          <Route path="/players/:id" element={<PlayerProfilePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
