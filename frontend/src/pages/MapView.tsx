import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  Popup as LeafletPopup,
  Polygon as LeafletPolygon,
  Polyline as LeafletPolyline,
  Circle as LeafletCircle,
  useMap as useLeafletMap,
} from 'react-leaflet';
import L from 'leaflet';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker as GoogleAdvancedMarker,
  InfoWindow as GoogleInfoWindow,
  useMap as useGoogleMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Eye, EyeOff, Navigation, Building, MapPin,
  Droplets, Users, Clock, X, Maximize2, Minimize2,
  Activity, Zap, RefreshCw, Search, LocateFixed,
} from 'lucide-react';
import { getRiskColor, getRiskBadgeClass, formatNumber } from '../utils/helpers';
import { useAppStore } from '../stores/useAppStore';
import { api } from '../utils/api';

const GMAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// ─── Custom Leaflet Map Controller for Panning & Zooming ──────────────────────
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useLeafletMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// ─── Custom divIcon definitions to avoid static Leaflet icon issues ───────────
const userLocationIcon = L.divIcon({
  html: `<div class="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg shadow-blue-500/50 animate-ping absolute"></div>
         <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg shadow-blue-500/50 relative"></div>`,
  className: 'custom-div-icon-user',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const searchMarkerIcon = L.divIcon({
  html: `<div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white shadow-xl shadow-indigo-500/50 flex items-center justify-center text-sm animate-bounce">📍</div>`,
  className: 'custom-div-icon-search',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const shelterIcon = L.divIcon({
  html: `<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center border-2 border-white shadow-lg shadow-emerald-500/30 text-base">🏠</div>`,
  className: 'custom-div-icon-shelter',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const REPORT_ICONS: Record<string, string> = {
  flood: '🌊', road_blocked: '🚧', blocked_road: '🚧', bridge_damaged: '🌉',
  tree_fallen: '🌳', fallen_trees: '🌳', power_outage: '⚡', fire: '🔥',
  landslide: '🏔️', other: '📍',
};

const getReportIcon = (type: string, severity: number) => {
  const borderColor = severity >= 4 ? 'border-red-500' : 'border-amber-500';
  const emoji = REPORT_ICONS[type] || '📍';
  return L.divIcon({
    html: `<div class="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center border-2 ${borderColor} shadow-lg shadow-slate-900/50 text-sm">${emoji}</div>`,
    className: 'custom-div-icon-report',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Helper: build a bounding box path around coordinates (Leaflet version)
function centerToLatLngBoundsLeaflet(lat: number, lng: number, half = 0.012): [number, number][] {
  return [
    [lat + half, lng - half],
    [lat + half, lng + half],
    [lat - half, lng + half],
    [lat - half, lng - half],
  ];
}

// Helper: build a bounding box path around coordinates (Google version)
function centerToLatLngBoundsGoogle(lat: number, lng: number, half = 0.012) {
  return [
    { lat: lat + half, lng: lng - half },
    { lat: lat + half, lng: lng + half },
    { lat: lat - half, lng: lng + half },
    { lat: lat - half, lng: lng - half },
  ];
}

// ─── Google Maps Helpers ──────────────────────────────────────────────────────

function GoogleFloodZonePolygons({
  zones,
  visible,
  onZoneClick,
}: {
  zones: any[];
  visible: boolean;
  onZoneClick: (pred: any) => void;
}) {
  const map = useGoogleMap();
  const polygonsRef = useRef<google.maps.Polygon[]>([]);

  useEffect(() => {
    if (!map || !visible) {
      polygonsRef.current.forEach((p) => p.setMap(null));
      polygonsRef.current = [];
      return;
    }

    polygonsRef.current.forEach((p) => p.setMap(null));
    polygonsRef.current = [];

    zones.forEach((zone) => {
      const color = getRiskColor(zone.riskLevel);
      const half = 0.008 + (zone.riskScore / 100) * 0.018;
      const paths = centerToLatLngBoundsGoogle(zone.center.lat, zone.center.lng, half);

      const polygon = new google.maps.Polygon({
        paths,
        map,
        strokeColor: color,
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: color,
        fillOpacity: 0.2,
        clickable: true,
        zIndex: zone.riskLevel === 'critical' ? 10 : 5,
      });

      polygon.addListener('click', () => onZoneClick(zone.prediction));
      polygonsRef.current.push(polygon);
    });

    return () => {
      polygonsRef.current.forEach((p) => p.setMap(null));
      polygonsRef.current = [];
    };
  }, [map, zones, visible, onZoneClick]);

  return null;
}

function GoogleHeatmapLayer({
  points,
  visible,
}: {
  points: { lat: number; lng: number; intensity: number }[];
  visible: boolean;
}) {
  const map = useGoogleMap();
  const visualizationLib = useMapsLibrary('visualization') as any;
  const heatmapRef = useRef<any>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    if (!map) return;

    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    let nativeSuccess = false;

    if (visualizationLib) {
      try {
        if (!heatmapRef.current) {
          heatmapRef.current = new visualizationLib.HeatmapLayer({
            map,
            radius: 40,
            opacity: 0.7,
            gradient: [
              'rgba(16, 185, 129, 0)',
              'rgba(16, 185, 129, 1)',
              'rgba(6, 182, 212, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(239, 68, 68, 1)',
            ],
          });
        }
        const data = points.map((p) => new google.maps.LatLng(p.lat, p.lng));
        heatmapRef.current.setData(data);
        heatmapRef.current.setMap(visible ? map : null);
        nativeSuccess = true;
      } catch (err) {
        console.warn('Google HeatmapLayer failed, falling back to Circle overlays:', err);
        if (heatmapRef.current) {
          heatmapRef.current.setMap(null);
          heatmapRef.current = null;
        }
      }
    }

    if (!nativeSuccess && visible && points && points.length > 0) {
      const circles = points.map((p) => {
        const intensity = p.intensity || 0.5;
        const r = Math.round(16 + (239 - 16) * intensity);
        const g = Math.round(185 + (68 - 185) * intensity);
        const b = Math.round(129 + (68 - 129) * intensity);
        const color = `rgb(${r}, ${g}, ${b})`;

        return new google.maps.Circle({
          map,
          center: { lat: p.lat, lng: p.lng },
          radius: 250,
          fillColor: color,
          fillOpacity: intensity * 0.4,
          strokeColor: color,
          strokeOpacity: intensity * 0.6,
          strokeWeight: 1,
          clickable: false,
        });
      });
      circlesRef.current = circles;
    }

    return () => {
      heatmapRef.current?.setMap(null);
      circlesRef.current.forEach((c) => c.setMap(null));
      circlesRef.current = [];
    };
  }, [map, visualizationLib, points, visible]);

  return null;
}

function GoogleEvacuationRoutes({ routes, visible }: { routes: any[]; visible: boolean }) {
  const map = useGoogleMap();
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!visible) return;

    routes.forEach((route) => {
      const origin = route.origin;
      const destination = route.destination;
      const waypoints = route.waypoints || [];
      if (!origin?.lat || !destination?.lat) return;

      const path = [
        { lat: origin.lat, lng: origin.lng },
        ...waypoints.map((wp: any) => ({ lat: wp.lat, lng: wp.lng })),
        { lat: destination.lat, lng: destination.lng },
      ];

      const isRecommended = route.isRecommended || route.is_recommended;

      const polyline = new google.maps.Polyline({
        path,
        map,
        strokeColor: isRecommended ? '#10b981' : '#f59e0b',
        strokeOpacity: 0.85,
        strokeWeight: 4,
        icons: isRecommended
          ? undefined
          : [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 }, offset: '0', repeat: '20px' }],
        clickable: false,
      });

      polylinesRef.current.push(polyline);
    });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routes, visible]);

  return null;
}

function GoogleAutoFitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useGoogleMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!map || points.length === 0 || fitted.current) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, 60);
    fitted.current = true;
  }, [map, points]);

  return null;
}

function GoogleUserLocationMarker({ position }: { position: { lat: number; lng: number } | null }) {
  if (!position) return null;
  return (
    <GoogleAdvancedMarker position={position} title="Your Location">
      <div
        style={{
          width: 18,
          height: 18,
          background: '#3b82f6',
          borderRadius: '50%',
          border: '3px solid white',
          boxShadow: '0 0 0 4px rgba(59,130,246,0.3)',
          animation: 'pulse 2s infinite',
        }}
      />
    </GoogleAdvancedMarker>
  );
}

function GoogleShelterMarker({ shelter, onClick }: { shelter: any; onClick: () => void }) {
  return (
    <GoogleAdvancedMarker
      position={{ lat: shelter.location.lat, lng: shelter.location.lng }}
      onClick={onClick}
      title={shelter.name}
    >
      <div
        style={{
          width: 30, height: 30,
          background: 'linear-gradient(135deg,#10b981,#06b6d4)',
          borderRadius: 8, border: '2px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, boxShadow: '0 2px 10px rgba(16,185,129,0.5)',
          cursor: 'pointer',
        }}
      >🏠</div>
    </GoogleAdvancedMarker>
  );
}

function GoogleReportMarker({ report, onClick }: { report: any; onClick: () => void }) {
  const borderColor = report.severity >= 4 ? '#ef4444' : '#f59e0b';
  return (
    <GoogleAdvancedMarker
      position={{ lat: report.location.lat, lng: report.location.lng }}
      onClick={onClick}
      title={report.type}
    >
      <div
        style={{
          width: 26, height: 26,
          background: 'rgba(15,23,42,0.92)',
          borderRadius: 7, border: `1.5px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          cursor: 'pointer',
        }}
      >{REPORT_ICONS[report.type] ?? '📍'}</div>
    </GoogleAdvancedMarker>
  );
}

function GoogleMapContent({
  activeMapLayers,
  predictions,
  shelters,
  reports,
  evacuationRoutes,
  heatmapPoints,
  onZoneClick,
  userLocation,
  searchMarker,
}: {
  activeMapLayers: string[];
  predictions: any[];
  shelters: any[];
  reports: any[];
  evacuationRoutes: any[];
  heatmapPoints: { lat: number; lng: number; intensity: number }[];
  onZoneClick: (pred: any) => void;
  userLocation: { lat: number; lng: number } | null;
  searchMarker: { lat: number; lng: number; name: string } | null;
}) {
  const [selectedShelter, setSelectedShelter] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const floodZones = predictions.map((pred) => ({
    id: pred.zoneId ?? pred.id,
    name: pred.zoneName,
    riskLevel: pred.riskLevel,
    riskScore: pred.riskScore,
    center: pred.center ?? { lat: 0, lng: 0 },
    prediction: pred,
  }));

  const allPoints = [
    ...predictions.filter((p) => p.center?.lat).map((p) => ({ lat: p.center.lat, lng: p.center.lng })),
    ...shelters.filter((s) => s.location?.lat).map((s) => ({ lat: s.location.lat, lng: s.location.lng })),
    ...reports.filter((r) => r.location?.lat).map((r) => ({ lat: r.location.lat, lng: r.location.lng })),
  ];

  return (
    <>
      <GoogleAutoFitBounds points={allPoints} />

      {/* User Location */}
      <GoogleUserLocationMarker position={userLocation} />

      {/* Search result marker */}
      {searchMarker && (
        <GoogleAdvancedMarker position={{ lat: searchMarker.lat, lng: searchMarker.lng }} title={searchMarker.name}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            border: '2px solid white',
            boxShadow: '0 4px 14px rgba(99,102,241,0.5)',
          }} />
        </GoogleAdvancedMarker>
      )}

      {/* Flood zone polygons */}
      <GoogleFloodZonePolygons
        zones={floodZones}
        visible={activeMapLayers.includes('flood-zones')}
        onZoneClick={onZoneClick}
      />

      {/* Heatmap */}
      <GoogleHeatmapLayer
        points={heatmapPoints}
        visible={activeMapLayers.includes('risk-heatmap')}
      />

      {/* Evacuation routes */}
      <GoogleEvacuationRoutes
        routes={evacuationRoutes}
        visible={activeMapLayers.includes('evacuation')}
      />

      {/* Shelter markers */}
      {activeMapLayers.includes('shelters') &&
        shelters
          .filter((s) => s.location?.lat && s.location?.lng)
          .map((shelter) => (
            <GoogleShelterMarker
              key={shelter.id}
              shelter={shelter}
              onClick={() => { setSelectedShelter(shelter); setSelectedReport(null); }}
            />
          ))}

      {/* Shelter info window */}
      {selectedShelter && (
        <GoogleInfoWindow
          position={{ lat: selectedShelter.location.lat, lng: selectedShelter.location.lng }}
          onCloseClick={() => setSelectedShelter(null)}
        >
          <div style={{ background: '#0f172a', color: 'white', minWidth: 220, padding: 10, borderRadius: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{selectedShelter.name}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>{selectedShelter.address}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
              <span style={{ color: '#94a3b8' }}>Occupancy</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>{selectedShelter.currentOccupancy}/{selectedShelter.capacity}</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', borderRadius: 4, background: '#10b981', width: `${(selectedShelter.currentOccupancy / selectedShelter.capacity) * 100}%` }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              {(selectedShelter.amenities || []).map((a: string) => (
                <span key={a} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.08)' }}>{a}</span>
              ))}
            </div>
            {selectedShelter.location?.lat && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedShelter.location.lat},${selectedShelter.location.lng}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textAlign: 'center', fontSize: 11, color: '#06b6d4', marginTop: 4 }}
              >
                🗺️ Get Directions
              </a>
            )}
          </div>
        </GoogleInfoWindow>
      )}

      {/* Report markers */}
      {activeMapLayers.includes('reports') &&
        reports
          .filter((r) => r.location?.lat && r.location?.lng)
          .map((report) => (
            <GoogleReportMarker
              key={report.id}
              report={report}
              onClick={() => { setSelectedReport(report); setSelectedShelter(null); }}
            />
          ))}

      {/* Report info window */}
      {selectedReport && (
        <GoogleInfoWindow
          position={{ lat: selectedReport.location.lat, lng: selectedReport.location.lng }}
          onCloseClick={() => setSelectedReport(null)}
        >
          <div style={{ background: '#0f172a', color: 'white', minWidth: 210, padding: 10, borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{REPORT_ICONS[selectedReport.type] ?? '📍'}</span>
              <p style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>
                {selectedReport.type?.replace('_', ' ')}
              </p>
              {selectedReport.verified && (
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>✓ Verified</span>
              )}
            </div>
            <p style={{ fontSize: 11, color: '#cbd5e1', marginBottom: 4 }}>{selectedReport.description}</p>
            <p style={{ fontSize: 10, color: '#64748b' }}>
              {selectedReport.userName && `By ${selectedReport.userName} • `}Severity: {selectedReport.severity}/5
            </p>
          </div>
        </GoogleInfoWindow>
      )}
    </>
  );
}

const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1929' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
];

// ─── Map Legend ───────────────────────────────────────────────────────────────
function MapLegend({
  layers,
  toggleLayer,
}: {
  layers: string[];
  toggleLayer: (l: string) => void;
}) {
  const allLayers = [
    { key: 'flood-zones',  label: 'Flood Zones',       icon: Droplets,   color: '#ef4444' },
    { key: 'shelters',     label: 'Shelters',           icon: Building,   color: '#10b981' },
    { key: 'reports',      label: 'Citizen Reports',    icon: MapPin,     color: '#f59e0b' },
    { key: 'evacuation',   label: 'Evacuation Routes',  icon: Navigation, color: '#06b6d4' },
    { key: 'risk-heatmap', label: 'Risk Heatmap',       icon: Activity,   color: '#8b5cf6' },
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000] glass-card-static p-3 min-w-[185px]">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
        <Layers size={14} className="text-cyan-400" />
        <span className="text-xs font-semibold text-white">Map Layers</span>
      </div>
      {allLayers.map((layer) => (
        <button
          key={layer.key}
          onClick={() => toggleLayer(layer.key)}
          className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs transition-colors ${
            layers.includes(layer.key)
              ? 'text-white bg-white/5'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {layers.includes(layer.key)
            ? <Eye size={12} style={{ color: layer.color }} />
            : <EyeOff size={12} />}
          <layer.icon size={12} style={{ color: layers.includes(layer.key) ? layer.color : undefined }} />
          <span>{layer.label}</span>
        </button>
      ))}
      <div className="mt-3 pt-2 border-t border-white/5">
        <p className="text-[10px] text-slate-500 mb-1.5">Risk Levels</p>
        <div className="space-y-1">
          {[
            { label: 'Critical', color: '#ef4444' },
            { label: 'High',     color: '#f59e0b' },
            { label: 'Medium',   color: '#06b6d4' },
            { label: 'Low',      color: '#10b981' },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-2 text-[10px]">
              <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: r.color, opacity: 0.4 }} />
              <span className="text-slate-400">{r.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Zone Info Side-panel ─────────────────────────────────────────────────────
function ZoneInfoPanel({ prediction, onClose }: { prediction: any; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute top-20 left-4 z-[1000] glass-card-static p-5 w-80 max-h-[calc(100vh-14rem)] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">{prediction.zoneName}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
          <X size={14} className="text-slate-400" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-16 h-16">
          <svg width="64" height="64" className="transform -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="26" fill="none"
              stroke={getRiskColor(prediction.riskLevel)}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - prediction.riskScore / 100)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{Math.round(prediction.riskScore)}</span>
          </div>
        </div>
        <div>
          <span className={`badge ${getRiskBadgeClass(prediction.riskLevel)}`}>{prediction.riskLevel}</span>
          <p className="text-xs text-slate-400 mt-1">Confidence: {Math.round(prediction.confidence * 100)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { icon: Droplets, color: 'text-blue-400',   label: 'Depth',       value: `${prediction.predictedDepth}m` },
          { icon: Clock,    color: 'text-amber-400',  label: 'Duration',     value: `${prediction.predictedDuration}h` },
          { icon: Users,    color: 'text-cyan-400',   label: 'People',       value: formatNumber(prediction.affectedPopulation) },
          { icon: Zap,      color: 'text-purple-400', label: 'Probability',  value: `${Math.round(prediction.probability * 100)}%` },
        ].map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="p-2 rounded-lg bg-white/[0.03] text-center">
            <Icon size={14} className={`${color} mx-auto mb-1`} />
            <p className="text-sm font-bold text-white">{value}</p>
            <p className="text-[10px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {prediction.factors?.length > 0 && (
        <div className="border-t border-white/5 pt-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={12} className="text-cyan-400" />
            <span className="text-xs font-semibold text-white">Why This Prediction?</span>
          </div>
          <div className="space-y-2">
            {prediction.factors.slice(0, 4).map((f: any) => (
              <div key={f.name}>
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="text-slate-400">{f.name}</span>
                  <span className="text-slate-300 font-medium">
                    {f.value}{f.unit}
                    <span className={f.trend === 'increasing' ? 'text-red-400' : f.trend === 'decreasing' ? 'text-emerald-400' : 'text-slate-500'}>
                      {' '}{f.trend === 'increasing' ? '↑' : f.trend === 'decreasing' ? '↓' : '→'}
                    </span>
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, f.contribution * 3)}%`, backgroundColor: getRiskColor(prediction.riskLevel) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {prediction.center?.lat && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${prediction.center.lat},${prediction.center.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors border-t border-white/5 pt-3"
        >
          <MapPin size={11} /> View in Google Maps ↗
        </a>
      )}
    </motion.div>
  );
}

// ─── Main MapView ─────────────────────────────────────────────────────────────
export default function MapView() {
  const {
    activeMapLayers, toggleMapLayer,
    predictions, shelters, reports, evacuationRoutes,
    fetchPredictions, fetchShelters, fetchReports, fetchEvacuationRoutes,
  } = useAppStore();

  const [selectedPrediction, setSelectedPrediction] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [heatmapPoints, setHeatmapPoints] = useState<{ lat: number; lng: number; intensity: number }[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number; name: string } | null>(null);
  
  // Dynamic search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [searchedPredictData, setSearchedPredictData] = useState<any>(null);

  // Map settings
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.0827, 80.2707]);
  const [mapZoom, setMapZoom] = useState<number>(12);
  const [mapProvider, setMapProvider] = useState<'leaflet' | 'google'>(
    GMAPS_API_KEY && GMAPS_API_KEY !== 'YOUR_API_KEY_HERE' ? 'google' : 'leaflet'
  );
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    fetchPredictions();
    fetchShelters();
    fetchReports();
    fetchEvacuationRoutes();
    fetchHeatmap();
  }, []);

  async function fetchHeatmap() {
    try {
      const res = await api.get('/predictions/heatmap/data');
      if (res.data?.points?.length > 0) setHeatmapPoints(res.data.points);
    } catch {
      // derive heatmap from predictions as fallback
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    await Promise.all([fetchPredictions(), fetchShelters(), fetchReports(), fetchEvacuationRoutes(), fetchHeatmap()]);
    setIsRefreshing(false);
  }

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation({ lat: loc[0], lng: loc[1] });
        setMapCenter(loc);
        setMapZoom(13);
        if (mapRef) {
          mapRef.panTo({ lat: loc[0], lng: loc[1] });
          mapRef.setZoom(13);
        }
      },
      () => {
        // Fallback to Chennai
        setMapCenter([13.0827, 80.2707]);
        setMapZoom(12);
        if (mapRef) {
          mapRef.panTo({ lat: 13.0827, lng: 80.2707 });
          mapRef.setZoom(12);
        }
      }
    );
  }, [mapRef]);

  // Search input geocoding
  const triggerSearch = async (val: string) => {
    if (!val || val.length < 2) return;
    try {
      const res = await api.get(`/weather/search?query=${encodeURIComponent(val)}`);
      setSearchSuggestions(res.data || []);
    } catch (e) {
      console.error("Geocoding search failed:", e);
    }
  };

  const handleSelectSuggestion = async (s: any) => {
    const lat = s.lat;
    const lng = s.lng;
    const name = s.name.split(',')[0];
    
    setSearchMarker({ lat, lng, name });
    setMapCenter([lat, lng]);
    setMapZoom(13);
    setSearchSuggestions([]);
    setSearchQuery(name);

    if (mapRef) {
      mapRef.panTo({ lat, lng });
      mapRef.setZoom(13);
    }
    
    // Dynamically calculate and predict risk for the searched coordinates!
    try {
      await api.post(`/predictions/generate`);
      // Pull dynamic weather to show details
      const weatherRes = await api.get(`/weather/current?lat=${lat}&lng=${lng}`);
      const weather = weatherRes.data;
      
      const riskScore = weather.rainfall > 50 ? 85 : weather.rainfall > 20 ? 55 : 20;
      const riskLevel = riskScore >= 80 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
      
      setSearchedPredictData({
        zoneName: name,
        riskScore,
        riskLevel,
        confidence: 0.92,
        predictedDepth: round(weather.rainfall * 0.02, 2),
        predictedDuration: weather.rainfall > 10 ? 24 : 0,
        affectedPopulation: 125000,
        probability: riskScore / 100,
        factors: [
          { name: "Rainfall Intensity", value: weather.rainfall, unit: "mm/hr", contribution: weather.rainfall > 50 ? 45 : 15, trend: "stable" },
          { name: "Humidity", value: weather.humidity, unit: "%", contribution: 10, trend: "stable" },
          { name: "Temperature", value: weather.temperature, unit: "C", contribution: 5, trend: "stable" }
        ],
        center: { lat, lng }
      });
    } catch (e) {
      console.error("Failed to generate dynamic predictions for search:", e);
    }
  };

  const round = (num: number, dec: number) => {
    const x = Math.pow(10, dec);
    return Math.round(num * x) / x;
  };

  const effectiveHeatmap =
    heatmapPoints.length > 0
      ? heatmapPoints
      : predictions.flatMap((p) =>
          p.center?.lat ? [{ lat: p.center.lat, lng: p.center.lng, intensity: p.riskScore / 100 }] : []
        );

  const effectiveRoutes = evacuationRoutes.length > 0 ? evacuationRoutes : [];

  const handleZoneClick = useCallback((pred: any) => {
    setSelectedPrediction(pred);
  }, []);

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-[5000] bg-slate-950' : 'h-[calc(100vh-7rem)] rounded-xl overflow-hidden'}`}>
      
      {/* ─── Map Container Switcher ─── */}
      {mapProvider === 'leaflet' ? (
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ width: '100%', height: '100%', background: '#0f172a' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          <MapController center={mapCenter} zoom={mapZoom} />

          {/* User Location */}
          {userLocation && (
            <LeafletMarker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon} />
          )}

          {/* Search Result Marker */}
          {searchMarker && (
            <LeafletMarker position={[searchMarker.lat, searchMarker.lng]} icon={searchMarkerIcon}>
              <LeafletPopup>
                <div className="bg-slate-900 text-white p-2 rounded-lg text-xs min-w-[140px]">
                  <p className="font-bold mb-1">{searchMarker.name}</p>
                  <p className="text-slate-400">Lat: {searchMarker.lat.toFixed(4)}</p>
                  <p className="text-slate-400">Lng: {searchMarker.lng.toFixed(4)}</p>
                </div>
              </LeafletPopup>
            </LeafletMarker>
          )}

          {/* Flood Zone Polygons */}
          {activeMapLayers.includes('flood-zones') &&
            predictions.map((pred) => {
              const lat = pred.center?.lat ?? 0;
              const lng = pred.center?.lng ?? 0;
              if (!lat || !lng) return null;
              
              const half = 0.008 + (pred.riskScore / 100) * 0.012;
              const bounds = centerToLatLngBoundsLeaflet(lat, lng, half);
              return (
                <LeafletPolygon
                  key={pred.id}
                  positions={bounds}
                  pathOptions={{
                    color: getRiskColor(pred.riskLevel),
                    fillColor: getRiskColor(pred.riskLevel),
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => setSelectedPrediction(pred)
                  }}
                />
              );
            })}

          {/* Heatmap Circles */}
          {activeMapLayers.includes('risk-heatmap') &&
            effectiveHeatmap.map((p, idx) => {
              const intensity = p.intensity || 0.5;
              const r = Math.round(16 + (239 - 16) * intensity);
              const g = Math.round(185 + (68 - 185) * intensity);
              const b = Math.round(129 + (68 - 129) * intensity);
              return (
                <LeafletCircle
                  key={idx}
                  center={[p.lat, p.lng]}
                  radius={280}
                  pathOptions={{
                    color: `rgb(${r}, ${g}, ${b})`,
                    fillColor: `rgb(${r}, ${g}, ${b})`,
                    fillOpacity: intensity * 0.35,
                    stroke: false,
                  }}
                />
              );
            })}

          {/* Evacuation Routes */}
          {activeMapLayers.includes('evacuation') &&
            effectiveRoutes.map((route, idx) => {
              const origin = route.origin;
              const destination = route.destination;
              const waypoints = route.waypoints || [];
              if (!origin?.lat || !destination?.lat) return null;
              
              const path: [number, number][] = [
                [origin.lat, origin.lng],
                ...waypoints.map((w: any) => [w.lat, w.lng] as [number, number]),
                [destination.lat, destination.lng]
              ];
              const isRecommended = route.isRecommended || (route as any).is_recommended;
              return (
                <LeafletPolyline
                  key={idx}
                  positions={path}
                  pathOptions={{
                    color: isRecommended ? '#10b981' : '#f59e0b',
                    weight: 4,
                    dashArray: isRecommended ? undefined : '5, 10'
                  }}
                />
              );
            })}

          {/* Shelter Markers */}
          {activeMapLayers.includes('shelters') &&
            shelters
              .filter((s) => s.location?.lat && s.location?.lng)
              .map((shelter) => (
                <LeafletMarker
                  key={shelter.id}
                  position={[shelter.location.lat, shelter.location.lng]}
                  icon={shelterIcon}
                >
                  <LeafletPopup>
                    <div className="bg-slate-900 text-white p-3 rounded-lg text-xs min-w-[210px] border border-white/5 font-sans">
                      <p className="font-bold text-sm mb-1">{shelter.name}</p>
                      <p className="text-slate-400 mb-2">{shelter.address}</p>
                      <div className="flex justify-between mb-1 text-slate-300">
                        <span>Occupancy:</span>
                        <span className="font-bold text-emerald-400">{shelter.currentOccupancy}/{shelter.capacity}</span>
                      </div>
                      {(shelter as any).travelTime && (
                        <div className="flex justify-between mb-1 text-slate-300">
                          <span>Walk Time:</span>
                          <span className="font-bold text-cyan-400">{(shelter as any).travelTime} mins</span>
                        </div>
                      )}
                      <div className="h-1.5 rounded bg-white/10 overflow-hidden mb-2">
                        <div className="h-full bg-emerald-500" style={{ width: `${(shelter.currentOccupancy / shelter.capacity) * 100}%` }} />
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(shelter.amenities || []).map((a: string) => (
                          <span key={a} className="bg-white/5 px-1.5 py-0.5 rounded text-[9px] text-slate-300">{a}</span>
                        ))}
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.location.lat},${shelter.location.lng}&travelmode=walking`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 text-[10px] hover:underline flex items-center justify-center gap-1 mt-1 border-t border-white/5 pt-1"
                      >
                        🗺️ Get Walking Directions ↗
                      </a>
                    </div>
                  </LeafletPopup>
                </LeafletMarker>
              ))}

          {/* Report Markers */}
          {activeMapLayers.includes('reports') &&
            reports
              .filter((r) => r.location?.lat && r.location?.lng)
              .map((report) => (
                <LeafletMarker
                  key={report.id}
                  position={[report.location.lat, report.location.lng]}
                  icon={getReportIcon(report.type, report.severity)}
                >
                  <LeafletPopup>
                    <div className="bg-slate-900 text-white p-3 rounded-lg text-xs min-w-[200px] border border-white/5 font-sans">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-lg">{REPORT_ICONS[report.type] || '📍'}</span>
                        <p className="font-bold text-sm text-white capitalize">{report.type.replace('_', ' ')}</p>
                        {report.verified && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1 py-0.5 rounded ml-auto">✓ Verified</span>
                        )}
                      </div>
                      <p className="text-slate-300 mb-2 leading-relaxed">{report.description}</p>
                      <div className="text-[10px] text-slate-500 flex justify-between border-t border-white/5 pt-1.5">
                        <span>Reporter: {report.userName || 'Citizen'}</span>
                        <span className="font-bold text-amber-500">Severity: {report.severity}/5</span>
                      </div>
                    </div>
                  </LeafletPopup>
                </LeafletMarker>
              ))}
        </MapContainer>
      ) : (
        <APIProvider apiKey={GMAPS_API_KEY} version="3.58" libraries={['visualization']}>
          <GoogleMap
            mapId="geoguard-map"
            center={{ lat: mapCenter[0], lng: mapCenter[1] }}
            zoom={mapZoom}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            mapTypeControl={false}
            streetViewControl={true}
            fullscreenControl={false}
            styles={DARK_STYLE}
            style={{ width: '100%', height: '100%' }}
            onIdle={(e) => setMapRef(e.map)}
          >
            <GoogleMapContent
              activeMapLayers={activeMapLayers}
              predictions={predictions}
              shelters={shelters}
              reports={reports}
              evacuationRoutes={effectiveRoutes}
              heatmapPoints={effectiveHeatmap}
              onZoneClick={handleZoneClick}
              userLocation={userLocation}
              searchMarker={searchMarker}
            />
          </GoogleMap>
        </APIProvider>
      )}

      {/* Floating search input */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-1 min-w-[340px] max-w-[440px]">
        <div className="glass-card-static flex items-center gap-2 px-3 py-2 w-full">
          <Search size={14} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search Tamil Nadu district/location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              triggerSearch(e.target.value);
            }}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
          />
          <button onClick={handleLocate} title="My Location">
            <LocateFixed size={16} className="text-cyan-400 hover:text-cyan-300 transition-colors" />
          </button>
        </div>
        
        {/* Suggestion Dropdown */}
        {searchSuggestions.length > 0 && (
          <div className="glass-card-static w-full max-h-48 overflow-y-auto mt-1 flex flex-col p-1 border border-white/10 shadow-2xl">
            {searchSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSuggestion(s)}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 rounded-lg transition-colors truncate"
              >
                📍 {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Layer Legend */}
      <MapLegend layers={activeMapLayers} toggleLayer={toggleMapLayer} />

      {/* Zone Detail Panel */}
      <AnimatePresence>
        {selectedPrediction && (
          <ZoneInfoPanel
            prediction={selectedPrediction}
            onClose={() => setSelectedPrediction(null)}
          />
        )}
      </AnimatePresence>
      
      {/* Searched Location Risk Card */}
      <AnimatePresence>
        {searchedPredictData && !selectedPrediction && (
          <ZoneInfoPanel
            prediction={searchedPredictData}
            onClose={() => setSearchedPredictData(null)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
        <div className="glass-card-static px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400 font-medium">
              {mapProvider === 'leaflet' ? 'OSM & Leaflet' : 'Google Maps'} • Active
            </span>
          </div>

          {/* Map Provider Toggle */}
          {GMAPS_API_KEY && GMAPS_API_KEY !== 'YOUR_API_KEY_HERE' && (
            <>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg">
                <button
                  onClick={() => setMapProvider('leaflet')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    mapProvider === 'leaflet'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Leaflet
                </button>
                <button
                  onClick={() => setMapProvider('google')}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                    mapProvider === 'google'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Google
                </button>
              </div>
            </>
          )}

          <div className="w-px h-4 bg-white/10" />
          <span className="text-xs text-slate-400">
            {predictions.length} zones • {shelters.length} shelters • {reports.length} reports
          </span>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh data"
          className="glass-card-static p-2 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={`text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="glass-card-static p-2 hover:bg-white/10 transition-colors"
        >
          {isFullscreen
            ? <Minimize2 size={16} className="text-slate-400" />
            : <Maximize2 size={16} className="text-slate-400" />}
        </button>
      </div>
    </div>
  );
}
