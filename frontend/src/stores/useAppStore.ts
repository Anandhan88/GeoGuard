import { create } from 'zustand';
import type { User, Alert, FloodPrediction } from '../types';
import { mockAlerts, mockPredictions } from '../data/mockData';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Alerts
  alerts: Alert[];
  unreadAlertCount: number;
  markAlertRead: (id: string) => void;

  // Predictions
  predictions: FloodPrediction[];
  selectedPrediction: FloodPrediction | null;
  selectPrediction: (pred: FloodPrediction | null) => void;

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

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),

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

  // Predictions
  predictions: mockPredictions,
  selectedPrediction: null,
  selectPrediction: (pred) => set({ selectedPrediction: pred, showXAIPanel: !!pred }),

  // Map
  mapCenter: [13.0827, 80.2707], // Chennai
  mapZoom: 12,
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
