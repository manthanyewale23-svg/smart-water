import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Eagerly loaded pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ConsumptionPage from './pages/admin/ConsumptionPage';
import WaterLossPage from './pages/admin/WaterLossPage';
import SensorsPage from './pages/admin/SensorsPage';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';
import MaintenancePage from './pages/admin/MaintenancePage';
import ReportsPage from './pages/admin/ReportsPage';
import AlertsPage from './pages/admin/AlertsPage';
import UsersPage from './pages/admin/UsersPage';
import SettingsPage from './pages/admin/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerTasksPage from './pages/worker/WorkerTasksPage';
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import CitizenConsumptionPage from './pages/citizen/CitizenConsumptionPage';
import ReportProblemPage from './pages/citizen/ReportProblemPage';
import CitizenComplaintsPage from './pages/citizen/CitizenComplaintsPage';
import ProfilePage from './pages/ProfilePage';

// LAZY LOAD the map - this is the critical performance requirement
// The map is NEVER loaded unless the user navigates to /*/map
const WaterMapPage = lazy(() => import('./pages/WaterMapPage'));

const MapLoadingFallback = () => (
  <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl border border-gray-200">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
    <p className="text-gray-600 font-medium">Loading Water Network Map...</p>
    <p className="text-sm text-gray-400 mt-1">Map data is loading. Dashboard remains available.</p>
  </div>
);

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><LoadingSpinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}/dashboard`} replace />;
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin"><AppLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="consumption" element={<ConsumptionPage />} />
        <Route path="water-loss" element={<WaterLossPage />} />
        <Route path="sensors" element={<SensorsPage />} />
        <Route path="map" element={
          <Suspense fallback={<MapLoadingFallback />}>
            <WaterMapPage />
          </Suspense>
        } />
        <Route path="complaints" element={<AdminComplaintsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Worker routes */}
      <Route path="/worker" element={
        <ProtectedRoute role="worker"><AppLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="/worker/dashboard" replace />} />
        <Route path="dashboard" element={<WorkerDashboard />} />
        <Route path="tasks" element={<WorkerTasksPage />} />
        <Route path="map" element={
          <Suspense fallback={<MapLoadingFallback />}>
            <WaterMapPage />
          </Suspense>
        } />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Citizen routes */}
      <Route path="/citizen" element={
        <ProtectedRoute role="citizen"><AppLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="/citizen/dashboard" replace />} />
        <Route path="dashboard" element={<CitizenDashboard />} />
        <Route path="consumption" element={<CitizenConsumptionPage />} />
        <Route path="report" element={<ReportProblemPage />} />
        <Route path="complaints" element={<CitizenComplaintsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
