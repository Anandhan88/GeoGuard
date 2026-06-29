import { create } from 'zustand';
import type { User, Alert, FloodPrediction, Shelter, CitizenReport, DashboardStats, WeatherData, EvacuationRoute, SatelliteImage, SatelliteStatus } from '../types';
import { api } from '../utils/api';

interface SelectedLocation {
  name: string;
  lat: number;
  lng: number;
}

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

  // ─── Selected Location (global search-driven) ───
  selectedLocation: SelectedLocation | null;
  setSelectedLocation: (loc: SelectedLocation | null) => void;
  fetchLocationData: () => Promise<void>;

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
  fetchEvacuationRoutes: (lat?: number, lng?: number) => Promise<void>;

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

  // Satellite
  satelliteImages: SatelliteImage[];
  satelliteStatus: SatelliteStatus | null;
  fetchSatelliteImages: () => Promise<void>;
  fetchSatelliteStatus: () => Promise<void>;
  triggerSatelliteAnalysis: (lat: number, lng: number) => Promise<void>;
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

  // ─── Selected Location ───
  selectedLocation: { name: 'Chennai, Tamil Nadu, India', lat: 13.0827, lng: 80.2707 },

  setSelectedLocation: (loc) => {
    const finalLoc = loc || { name: 'Chennai, Tamil Nadu, India', lat: 13.0827, lng: 80.2707 };
    set({ selectedLocation: finalLoc });
    // Pan map to selected location
    set({ mapCenter: [finalLoc.lat, finalLoc.lng], mapZoom: 12 });
    // Fetch all data for this location
    get().fetchLocationData();
  },

  fetchLocationData: async () => {
    const loc = get().selectedLocation;
    if (!loc) return;
    set({ isLoading: true });
    await Promise.all([
      get().fetchWeather(),
      get().fetchPredictions(),
      get().fetchAlerts(),
      get().fetchShelters(),
      get().fetchReports(),
      get().fetchEvacuationRoutes(loc.lat, loc.lng),
      get().fetchSatelliteImages(),
      get().fetchSatelliteStatus(),
    ]);
    await get().fetchStats();
    set({ isLoading: false });
  },

  // Alerts — empty by default, fetched for location
  alerts: [],
  unreadAlertCount: 0,
  markAlertRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, isActive: false } : a)),
      unreadAlertCount: Math.max(0, s.unreadAlertCount - 1),
    })),

  fetchAlerts: async () => {
    const loc = get().selectedLocation;
    if (!loc) { set({ alerts: [], unreadAlertCount: 0 }); return; }
    try {
      const res = await api.get(`/alerts/for-location?lat=${loc.lat}&lng=${loc.lng}&name=${encodeURIComponent(loc.name)}`);
      const alertsList = res.data.alerts || [];
      set({
        alerts: alertsList,
        unreadAlertCount: alertsList.filter((a: any) => a.isActive).length,
      });
    } catch (err) {
      set({ alerts: [], unreadAlertCount: 0 });
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

  // Predictions — empty by default, fetched for location
  predictions: [],
  selectedPrediction: null,
  selectPrediction: (pred) => set({ selectedPrediction: pred, showXAIPanel: !!pred }),

  fetchPredictions: async () => {
    const loc = get().selectedLocation;
    if (!loc) { set({ predictions: [] }); return; }
    try {
      const res = await api.get(`/predictions/for-location?lat=${loc.lat}&lng=${loc.lng}&name=${encodeURIComponent(loc.name)}`);
      const pred = res.data;
      set({ predictions: pred ? [pred] : [] });
    } catch (err) {
      set({ predictions: [] });
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

  // Shelters — empty by default
  shelters: [],
  fetchShelters: async () => {
    const loc = get().selectedLocation;
    if (!loc) { set({ shelters: [] }); return; }
    try {
      const res = await api.get('/shelters');
      const shelterList = res.data.shelters || [];
      set({ shelters: shelterList });
    } catch (err) {
      set({ shelters: [] });
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

  // Reports — still fetched globally (all user reports)
  reports: [],
  fetchReports: async () => {
    try {
      const res = await api.get('/reports');
      const reportList = res.data.reports || [];
      set({ reports: reportList });
    } catch (err) {
      set({ reports: [] });
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

  // Weather — null by default, fetched for selected location
  weather: null,
  fetchWeather: async () => {
    const loc = get().selectedLocation;
    if (!loc) { set({ weather: null }); return; }
    try {
      const res = await api.get(`/weather/current?lat=${loc.lat}&lng=${loc.lng}`);
      set({ weather: res.data });
    } catch {
      set({ weather: null });
    }
  },

  // Evacuation
  evacuationRoutes: [],
  fetchEvacuationRoutes: async (lat?: number, lng?: number) => {
    const loc = get().selectedLocation;
    const current_lat = lat ?? loc?.lat ?? 0;
    const current_lng = lng ?? loc?.lng ?? 0;
    if (!current_lat || !current_lng) { set({ evacuationRoutes: [] }); return; }
    try {
      const res = await api.get(`/evacuation/routes?origin_lat=${current_lat}&origin_lng=${current_lng}`);
      const routes = res.data.routes || [];
      set({ evacuationRoutes: routes });
    } catch {
      set({ evacuationRoutes: [] });
    }
  },

  // Stats — computed from current data
  stats: { activeAlerts: 0, zonesAtRisk: 0, populationAffected: 0, sheltersActive: 0, citizenReports: 0, resourcesDeployed: 0, predictionsGenerated: 0, avgRiskScore: 0 },
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
      const avgRiskScore = preds.length > 0 ? Math.round(preds.reduce((acc, p) => acc + p.riskScore, 0) / preds.length) : 0;

      set({
        stats: {
          activeAlerts,
          zonesAtRisk,
          populationAffected,
          sheltersActive,
          citizenReports,
          resourcesDeployed: 0,
          predictionsGenerated: preds.length,
          avgRiskScore
        }
      });
    } catch (err) {
      // keep current stats
    }
  },

  // Map — starts at India center
  mapCenter: [20.5937, 78.9629],
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

  // Satellite Initial State & Actions
  satelliteImages: [],
  satelliteStatus: null,

  fetchSatelliteImages: async () => {
    try {
      const res = await api.get('/satellite');
      set({ satelliteImages: res.data || [] });
    } catch (err) {
      console.error("Failed to fetch satellite images", err);
      set({ satelliteImages: [] });
    }
  },

  fetchSatelliteStatus: async () => {
    try {
      const res = await api.get('/satellite/status');
      set({ satelliteStatus: res.data });
    } catch (err) {
      console.error("Failed to fetch satellite status", err);
    }
  },

  triggerSatelliteAnalysis: async (lat, lng) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/satellite/trigger?lat=${lat}&lng=${lng}`);
      set({ isLoading: false });
      await get().fetchSatelliteStatus();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to trigger satellite analysis';
      set({ error: errMsg, isLoading: false });
      throw new Error(errMsg);
    }
  },
}));
