import { create } from 'zustand';
import type { User, Alert, FloodPrediction, Shelter, CitizenReport, DashboardStats, WeatherData, EvacuationRoute } from '../types';
import { mockAlerts, mockPredictions, mockShelters, mockReports, mockDashboardStats, mockWeatherData, mockEvacuationRoutes } from '../data/mockData';
import { api } from '../utils/api';

interface AppState {
  // Loading & Error States
  isLoading: boolean;
  error: string | null;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  currentLanguage: 'en' | 'ta' | 'hi';
  login: (user: User) => void;
  logout: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  setLanguage: (lang: 'en' | 'ta' | 'hi') => Promise<void>;
  updateProfile: (profileData: { name?: string; phone?: string; languagePref?: 'en' | 'ta' | 'hi' }) => Promise<void>;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Alerts
  alerts: Alert[];
  unreadAlertCount: number;
  markAlertRead: (id: string) => void;
  fetchAlerts: () => Promise<void>;
  createAlert: (alertData: { alert_type: string; severity: string; message: string; target_zone?: string }) => Promise<void>;

  // Predictions
  predictions: FloodPrediction[];
  selectedPrediction: FloodPrediction | null;
  selectPrediction: (pred: FloodPrediction | null) => void;
  fetchPredictions: () => Promise<void>;
  triggerPredictions: () => Promise<void>;

  // Shelters
  shelters: Shelter[];
  fetchShelters: () => Promise<void>;
  updateShelterOccupancy: (shelterId: string, occupancy: number) => Promise<void>;

  // Reports
  reports: CitizenReport[];
  fetchReports: () => Promise<void>;
  submitReport: (formData: FormData) => Promise<void>;
  verifyReport: (reportId: string) => Promise<void>;

  // Weather
  weather: WeatherData | null;
  fetchWeather: () => Promise<void>;

  // Evacuation
  evacuationRoutes: EvacuationRoute[];
  fetchEvacuationRoutes: () => Promise<void>;

  // Stats
  stats: DashboardStats;
  fetchStats: () => Promise<void>;

  // Map
  mapCenter: [number, number];
  mapZoom: number;
  setMapView: (center: [number, number], zoom: number) => void;
  activeMapLayers: string[];
  toggleMapLayer: (layer: string) => void;

  // UI
  showXAIPanel: boolean;
  toggleXAIPanel: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Loading & Error States
  isLoading: false,
  error: null,

  // Auth
  user: null,
  isAuthenticated: false,
  currentLanguage: 'en',
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => {
    localStorage.removeItem('geoguard_access_token');
    localStorage.removeItem('geoguard_refresh_token');
    set({ user: null, isAuthenticated: false, currentLanguage: 'en' });
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, refresh_token, user } = res.data;
      localStorage.setItem('geoguard_access_token', access_token);
      localStorage.setItem('geoguard_refresh_token', refresh_token);
      
      const mappedUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        languagePref: user.language_pref || 'en',
        phone: user.phone,
      };
      
      set({ user: mappedUser, isAuthenticated: true, currentLanguage: mappedUser.languagePref, isLoading: false });
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to sign in';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  signUp: async (email, password, name, role) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { email, password, name, role });
      const { access_token, refresh_token, user } = res.data;
      localStorage.setItem('geoguard_access_token', access_token);
      localStorage.setItem('geoguard_refresh_token', refresh_token);
      
      const mappedUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        languagePref: user.language_pref || 'en',
        phone: user.phone,
      };
      
      set({ user: mappedUser, isAuthenticated: true, currentLanguage: mappedUser.languagePref, isLoading: false });
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to register';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  loadCurrentUser: async () => {
    const token = localStorage.getItem('geoguard_access_token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      const user = res.data;
      const mappedUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        languagePref: user.language_pref || 'en',
        phone: user.phone,
      };
      set({ user: mappedUser, isAuthenticated: true, currentLanguage: mappedUser.languagePref });
    } catch (err) {
      // Clear token if invalid
      localStorage.removeItem('geoguard_access_token');
    }
  },

  setLanguage: async (lang) => {
    set({ currentLanguage: lang });
    const { user, isAuthenticated } = get();
    if (isAuthenticated && user) {
      try {
        const res = await api.put('/auth/me', { language_pref: lang });
        const updatedUser = { ...user, languagePref: res.data.language_pref as any };
        set({ user: updatedUser });
      } catch (err) {
        console.error("Failed to sync language preference to backend", err);
      }
    }
  },

  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    const { user } = get();
    if (!user) return;
    try {
      const payload: any = {};
      if (profileData.name !== undefined) payload.name = profileData.name;
      if (profileData.phone !== undefined) payload.phone = profileData.phone;
      if (profileData.languagePref !== undefined) payload.language_pref = profileData.languagePref;
      
      const res = await api.put('/auth/me', payload);
      const updated = res.data;
      const mappedUser: User = {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role as any,
        languagePref: updated.language_pref || 'en',
        phone: updated.phone,
      };
      set({ 
        user: mappedUser, 
        currentLanguage: mappedUser.languagePref,
        isLoading: false 
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to update profile';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Alerts
  alerts: mockAlerts,
  unreadAlertCount: mockAlerts.length,
  markAlertRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, isActive: false } : a)),
      unreadAlertCount: Math.max(0, s.unreadAlertCount - 1),
    })),

  fetchAlerts: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/alerts');
      const alertsList = res.data.alerts;
      set({
        alerts: alertsList.length > 0 ? alertsList : mockAlerts,
        unreadAlertCount: alertsList.filter((a: any) => a.isActive).length,
        isLoading: false
      });
    } catch (err) {
      set({ alerts: mockAlerts, unreadAlertCount: mockAlerts.length, isLoading: false });
    }
  },

  createAlert: async (alertData) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/alerts', alertData);
      set({ isLoading: false });
      await get().fetchAlerts();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to create alert';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  // Predictions
  predictions: mockPredictions,
  selectedPrediction: null,
  selectPrediction: (pred) => set({ selectedPrediction: pred, showXAIPanel: !!pred }),

  fetchPredictions: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/predictions');
      const predList = res.data.predictions;
      set({
        predictions: predList.length > 0 ? predList : mockPredictions,
        isLoading: false
      });
    } catch (err) {
      set({ predictions: mockPredictions, isLoading: false });
    }
  },

  triggerPredictions: async () => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/predictions/generate');
      set({ isLoading: false });
      await get().fetchPredictions();
      await get().fetchStats();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to run prediction pipeline';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  // Shelters
  shelters: mockShelters,
  fetchShelters: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/shelters');
      const shelterList = res.data.shelters;
      set({
        shelters: shelterList.length > 0 ? shelterList : mockShelters,
        isLoading: false
      });
    } catch (err) {
      set({ shelters: mockShelters, isLoading: false });
    }
  },

  updateShelterOccupancy: async (shelterId, occupancy) => {
    set({ isLoading: true });
    try {
      await api.put(`/shelters/${shelterId}/occupancy`, null, {
        params: { occupancy }
      });
      set({ isLoading: false });
      await get().fetchShelters();
    } catch (err: any) {
      set({ isLoading: false });
    }
  },

  // Reports
  reports: mockReports,
  fetchReports: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/reports');
      const reportList = res.data.reports;
      set({
        reports: reportList.length > 0 ? reportList : mockReports,
        isLoading: false
      });
    } catch (err) {
      set({ reports: mockReports, isLoading: false });
    }
  },

  submitReport: async (formData) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      set({ isLoading: false });
      await get().fetchReports();
      await get().fetchStats();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to submit report';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },

  verifyReport: async (reportId) => {
    set({ isLoading: true });
    try {
      await api.put(`/reports/${reportId}/verify`);
      set({ isLoading: false });
      await get().fetchReports();
    } catch (err) {
      set({ isLoading: false });
    }
  },

  // Weather
  weather: null,
  fetchWeather: async () => {
    try {
      const res = await api.get('/weather/current');
      set({ weather: res.data });
    } catch {
      set({ weather: mockWeatherData });
    }
  },

  // Evacuation
  evacuationRoutes: mockEvacuationRoutes,
  fetchEvacuationRoutes: async (lat?: number, lng?: number) => {
    try {
      const current_lat = lat ?? 10.7905;
      const current_lng = lng ?? 78.7047;
      const res = await api.get(`/evacuation/routes?origin_lat=${current_lat}&origin_lng=${current_lng}`);
      const routes = res.data.routes;
      set({ evacuationRoutes: routes.length > 0 ? routes : mockEvacuationRoutes });
    } catch {
      set({ evacuationRoutes: mockEvacuationRoutes });
    }
  },

  // Stats
  stats: mockDashboardStats,
  fetchStats: async () => {
    try {
      const preds = get().predictions;
      const sheltersList = get().shelters;
      const alertsList = get().alerts;
      const reportsList = get().reports;

      const activeAlerts = alertsList.filter(a => a.isActive).length;
      const zonesAtRisk = preds.filter(p => p.riskScore >= 60).length;
      const populationAffected = preds.reduce((acc, p) => p.riskScore >= 60 ? acc + p.affectedPopulation : acc, 0);
      const sheltersActive = sheltersList.length;
      const citizenReports = reportsList.length;
      const avgRiskScore = preds.length > 0 ? Math.round(preds.reduce((acc, p) => acc + p.riskScore, 0) / preds.length) : 50;

      set({
        stats: {
          activeAlerts,
          zonesAtRisk,
          populationAffected,
          sheltersActive,
          citizenReports,
          resourcesDeployed: 89,
          predictionsGenerated: 156,
          avgRiskScore
        }
      });
    } catch (err) {
      set({ stats: mockDashboardStats });
    }
  },

  // Map
  mapCenter: [20.5937, 78.9629], // India center — map auto-fits to actual data
  mapZoom: 5,
  setMapView: (center, zoom) => set({ mapCenter: center, mapZoom: zoom }),
  activeMapLayers: ['risk-heatmap', 'flood-zones', 'shelters'],
  toggleMapLayer: (layer) =>
    set((s) => ({
      activeMapLayers: s.activeMapLayers.includes(layer)
        ? s.activeMapLayers.filter((l) => l !== layer)
        : [...s.activeMapLayers, layer],
    })),

  // UI
  showXAIPanel: false,
  toggleXAIPanel: () => set((s) => ({ showXAIPanel: !s.showXAIPanel })),
}));
