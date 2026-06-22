import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import CitizenDashboard from './pages/CitizenDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import MapView from './pages/MapView';
import AlertsPage from './pages/AlertsPage';
import PredictionDetail from './pages/PredictionDetail';
import ReportPage from './pages/ReportPage';
import SheltersPage from './pages/SheltersPage';
import AIAssistantPage from './pages/AIAssistantPage';
import EvacuationPage from './pages/EvacuationPage';
import SatellitePage from './pages/SatellitePage';
import WeatherPage from './pages/WeatherPage';
import { useAppStore } from './stores/useAppStore';
import './index.css';

function DashboardIndex() {
  const user = useAppStore((s) => s.user);
  const isLoading = useAppStore((s) => s.isLoading);

  if (isLoading || (!user && localStorage.getItem('geoguard_access_token'))) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'authority') {
    return <Navigate to="/app/authority" replace />;
  }

  return <Navigate to="/app/citizen" replace />;
}

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#f1f5f9',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            backdropFilter: 'blur(16px)',
            borderRadius: '12px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardIndex />} />
          <Route path="citizen" element={<CitizenDashboard />} />
          <Route path="citizen/report" element={<ReportPage />} />
          <Route path="authority" element={<AuthorityDashboard />} />
          <Route path="map" element={<MapView />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="shelters" element={<SheltersPage />} />
          <Route path="evacuation" element={<EvacuationPage />} />
          <Route path="assistant" element={<AIAssistantPage />} />
          <Route path="satellite" element={<SatellitePage />} />
          <Route path="weather" element={<WeatherPage />} />
          <Route path="prediction/:id" element={<PredictionDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
