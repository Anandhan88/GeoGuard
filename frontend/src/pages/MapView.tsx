import { useState, useEffect, useCallback, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Eye, EyeOff, Navigation, Building, MapPin,
  Droplets, Users, Clock, X, Maximize2, Minimize2,
  Activity, Zap, RefreshCw, Search, LocateFixed,
  AlertTriangle,
} from 'lucide-react';
import { mockEvacuationRoutes } from '../data/mockData';
import { getRiskColor, getRiskBadgeClass, formatNumber } from '../utils/helpers';
import { useAppStore } from '../stores/useAppStore';
import { api } from '../utils/api';

const GMAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

// ─── Helper: build a small square polygon around a center ────────────────────
function centerToLatLngBounds(lat: number, lng: number, half = 0.012) {
  return [
    { lat: lat + half, lng: lng - half },
    { lat: lat + half, lng: lng + half },
    { lat: lat - half, lng: lng + half },
    { lat: lat - half, lng: lng - half },
  ];
}

// ─── Flood Zone Polygons drawn via Maps JavaScript API ────────────────────────
function FloodZonePolygons({
  zones,
  visible,
  onZoneClick,
}: {
  zones: any[];
  visible: boolean;
  onZoneClick: (pred: any) => void;
}) {
  const map = useMap();
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
      const paths = centerToLatLngBounds(zone.center.lat, zone.center.lng, half);

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

function HeatmapLayer({
  points,
  visible,
}: {
  points: { lat: number; lng: number; intensity: number }[];
  visible: boolean;
}) {
  const map = useMap();
  const visualizationLib = useMapsLibrary('visualization') as any;
  const heatmapRef = useRef<any>(null);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear any existing fallback circle overlays
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
        console.warn('HeatmapLayer failed, falling back to Circle overlays:', err);
        if (heatmapRef.current) {
          heatmapRef.current.setMap(null);
          heatmapRef.current = null;
        }
      }
    }

    // Fallback: draw circle overlays if native HeatmapLayer is unavailable
    if (!nativeSuccess && visible && points && points.length > 0) {
      const circles = points.map((p) => {
        const intensity = p.intensity || 0.5;
        // Interpolate colors from green (16, 185, 129) to red (239, 68, 68)
        const r = Math.round(16 + (239 - 16) * intensity);
        const g = Math.round(185 + (68 - 185) * intensity);
        const b = Math.round(129 + (68 - 129) * intensity);
        const color = `rgb(${r}, ${g}, ${b})`;

        return new google.maps.Circle({
          map,
          center: { lat: p.lat, lng: p.lng },
          radius: 250, // radius in meters
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

// ─── Evacuation Route Polylines ───────────────────────────────────────────────
function EvacuationRoutes({ routes, visible }: { routes: any[]; visible: boolean }) {
  const map = useMap();
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

// ─── Auto-fit map to data bounds ──────────────────────────────────────────────
function AutoFitBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
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

// ─── Places Search Box ────────────────────────────────────────────────────────
function PlacesSearchBox({
  onPlaceSelect,
}: {
  onPlaceSelect: (lat: number, lng: number, name: string) => void;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places') as any;
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !placesLib || !inputRef.current) return;

    autocompleteRef.current = new placesLib.Autocomplete(inputRef.current, {
      bounds: new google.maps.LatLngBounds(
        { lat: 12.7, lng: 79.9 },
        { lat: 13.3, lng: 80.5 }
      ),
      componentRestrictions: { country: 'in' },
      fields: ['geometry', 'name', 'formatted_address'],
      strictBounds: false,
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        onPlaceSelect(lat, lng, place.name || place.formatted_address || '');
        map.panTo({ lat, lng });
        map.setZoom(14);
      }
    });
  }, [map, placesLib, onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search location in Chennai..."
      className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
    />
  );
}

// ─── User Location Marker ─────────────────────────────────────────────────────
function UserLocationMarker({ position }: { position: { lat: number; lng: number } | null }) {
  if (!position) return null;
  return (
    <AdvancedMarker position={position} title="Your Location">
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
    </AdvancedMarker>
  );
}

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
    <div className="absolute top-4 right-4 z-[100] glass-card-static p-3 min-w-[185px]">
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
      className="absolute top-20 left-4 z-[100] glass-card-static p-5 w-80"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">{prediction.zoneName}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
          <X size={14} className="text-slate-400" />
        </button>
      </div>

      {/* Circular risk gauge */}
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
              style={{ filter: `drop-shadow(0 0 4px ${getRiskColor(prediction.riskLevel)}50)` }}
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

      {/* Stat grid */}
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

      {/* XAI factors */}
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

      {/* Open in Google Maps button */}
      {prediction.center?.lat && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${prediction.center.lat},${prediction.center.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <MapPin size={11} /> View in Google Maps ↗
        </a>
      )}
    </motion.div>
  );
}

// ─── Custom Shelter Pin ───────────────────────────────────────────────────────
function ShelterMarker({ shelter, onClick }: { shelter: any; onClick: () => void }) {
  return (
    <AdvancedMarker
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
    </AdvancedMarker>
  );
}

// ─── Custom Report Pin ────────────────────────────────────────────────────────
const REPORT_ICONS: Record<string, string> = {
  flood: '🌊', road_blocked: '🚧', bridge_damaged: '🌉',
  tree_fallen: '🌳', power_outage: '⚡', fire: '🔥',
  landslide: '🏔️', other: '📍',
};

function ReportMarker({ report, onClick }: { report: any; onClick: () => void }) {
  const borderColor = report.severity >= 4 ? '#ef4444' : '#f59e0b';
  return (
    <AdvancedMarker
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
    </AdvancedMarker>
  );
}

// ─── Dark Google Maps style ───────────────────────────────────────────────────
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

// ─── Inner map content (needs to be inside APIProvider + Map) ─────────────────
function MapContent({
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
      <AutoFitBounds points={allPoints} />

      {/* User Location */}
      <UserLocationMarker position={userLocation} />

      {/* Search result marker */}
      {searchMarker && (
        <AdvancedMarker position={{ lat: searchMarker.lat, lng: searchMarker.lng }} title={searchMarker.name}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            border: '2px solid white',
            boxShadow: '0 4px 14px rgba(99,102,241,0.5)',
          }} />
        </AdvancedMarker>
      )}

      {/* Flood zone polygons */}
      <FloodZonePolygons
        zones={floodZones}
        visible={activeMapLayers.includes('flood-zones')}
        onZoneClick={onZoneClick}
      />

      {/* Heatmap */}
      <HeatmapLayer
        points={heatmapPoints}
        visible={activeMapLayers.includes('risk-heatmap')}
      />

      {/* Evacuation routes */}
      <EvacuationRoutes
        routes={evacuationRoutes}
        visible={activeMapLayers.includes('evacuation')}
      />

      {/* Shelter markers */}
      {activeMapLayers.includes('shelters') &&
        shelters
          .filter((s) => s.location?.lat && s.location?.lng)
          .map((shelter) => (
            <ShelterMarker
              key={shelter.id}
              shelter={shelter}
              onClick={() => { setSelectedShelter(shelter); setSelectedReport(null); }}
            />
          ))}

      {/* Shelter info window */}
      {selectedShelter && (
        <InfoWindow
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
        </InfoWindow>
      )}

      {/* Report markers */}
      {activeMapLayers.includes('reports') &&
        reports
          .filter((r) => r.location?.lat && r.location?.lng)
          .map((report) => (
            <ReportMarker
              key={report.id}
              report={report}
              onClick={() => { setSelectedReport(report); setSelectedShelter(null); }}
            />
          ))}

      {/* Report info window */}
      {selectedReport && (
        <InfoWindow
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
        </InfoWindow>
      )}
    </>
  );
}

// ─── Search Bar Component (placed inside APIProvider) ─────────────────────────
function SearchBar({ onSearch, onLocate }: { onSearch: (lat: number, lng: number, name: string) => void; onLocate: () => void }) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2">
      <div className="glass-card-static flex items-center gap-2 px-3 py-2 min-w-[320px] max-w-[420px]">
        <Search size={14} className="text-slate-500 shrink-0" />
        <PlacesSearchBox onPlaceSelect={onSearch} />
      </div>
      <button
        onClick={onLocate}
        className="glass-card-static p-2.5 hover:bg-white/10 transition-colors"
        title="Go to my location"
      >
        <LocateFixed size={16} className="text-cyan-400" />
      </button>
    </div>
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

  const handleZoneClick = useCallback((pred: any) => {
    setSelectedPrediction(pred);
  }, []);

  const handleLocate = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        if (mapRef) {
          mapRef.panTo(loc);
          mapRef.setZoom(14);
        }
      },
      () => {
        // fallback to Chennai center
        const chennai = { lat: 13.0827, lng: 80.2707 };
        if (mapRef) {
          mapRef.panTo(chennai);
          mapRef.setZoom(12);
        }
      }
    );
  }, [mapRef]);

  const handleSearchResult = useCallback((lat: number, lng: number, name: string) => {
    setSearchMarker({ lat, lng, name });
  }, []);

  const effectiveHeatmap =
    heatmapPoints.length > 0
      ? heatmapPoints
      : predictions.flatMap((p) =>
          p.center?.lat ? [{ lat: p.center.lat, lng: p.center.lng, intensity: p.riskScore / 100 }] : []
        );

  const effectiveRoutes = evacuationRoutes.length > 0 ? evacuationRoutes : mockEvacuationRoutes;

  if (!GMAPS_API_KEY || GMAPS_API_KEY === 'YOUR_API_KEY_HERE') {
    return (
      <div className={`relative flex items-center justify-center bg-slate-900 rounded-xl ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-7rem)]'}`}>
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-xl font-bold text-white mb-2">Google Maps API Key Required</h2>
          <p className="text-slate-400 text-sm mb-6">
            To activate the live disaster map with flood zones, shelter markers, heatmaps and evacuation routes, add your Google Maps API key.
          </p>

          <div className="bg-slate-800/80 border border-white/5 rounded-xl p-4 text-left mb-4">
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <AlertTriangle size={11} /> <span>Step 1: Get a free API key at</span>
            </p>
            <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener noreferrer"
              className="text-xs text-cyan-400 underline break-all">
              console.cloud.google.com/google/maps-apis/credentials
            </a>
          </div>

          <div className="bg-slate-800/80 border border-white/5 rounded-xl p-4 text-left mb-4">
            <p className="text-xs text-slate-500 mb-2">Step 2: Enable these APIs in your project:</p>
            <div className="space-y-1">
              {['Maps JavaScript API', 'Places API', 'Directions API'].map((api) => (
                <div key={api} className="flex items-center gap-2 text-xs text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {api}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4 text-left font-mono text-sm">
            <p className="text-slate-500 text-[11px] mb-2"># frontend/.env</p>
            <p className="text-emerald-400">VITE_GOOGLE_MAPS_API_KEY=<span className="text-cyan-400">your_key_here</span></p>
          </div>
          <p className="text-slate-600 text-xs mt-3">Then restart the dev server with <code className="text-cyan-400">npm run dev</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-7rem)] rounded-xl overflow-hidden'}`}>
      <APIProvider apiKey={GMAPS_API_KEY} version="3.58" libraries={['visualization', 'places']}>
        <Map
          mapId="geoguard-map"
          defaultCenter={{ lat: 13.0827, lng: 80.2707 }}
          defaultZoom={12}
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
          {/* Search bar (inside APIProvider so Places lib is available) */}
          <SearchBar onSearch={handleSearchResult} onLocate={handleLocate} />

          <MapContent
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
        </Map>
      </APIProvider>

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

      {/* Bottom Status Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2">
        <div className="glass-card-static px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400">Google Maps • Live</span>
          </div>
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
