import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import CitizenDashboard from './pages/CitizenDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import MapView from './pages/MapView';
import AlertsPage from './pages/AlertsPage';
import PredictionDetail from './pages/PredictionDetail';
import './index.css';

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
          <Route index element={<CitizenDashboard />} />
          <Route path="citizen" element={<CitizenDashboard />} />
          <Route path="authority" element={<AuthorityDashboard />} />
          <Route path="map" element={<MapView />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="prediction/:id" element={<PredictionDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
