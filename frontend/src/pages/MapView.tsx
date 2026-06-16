import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, CircleMarker, Polyline, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers, Eye, EyeOff, Navigation, Building, MapPin,
  AlertTriangle, Droplets, Users, Shield, Clock, X,
  ChevronRight, Maximize2, Minimize2, Crosshair,
  Radio, Activity, Zap,
} from 'lucide-react';
import {
  mockFloodZones, mockShelters, mockReports, mockPredictions,
  mockEvacuationRoutes, mockHeatmapPoints,
} from '../data/mockData';
import { getRiskColor, getRiskBadgeClass, formatNumber } from '../utils/helpers';
import { useAppStore } from '../stores/useAppStore';

// Custom marker icons
const createIcon = (color: string, size: number = 10) =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:2px solid white;box-shadow:0 0 8px ${color}80;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const shelterIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="width:28px;height:28px;background:linear-gradient(135deg,#10b981,#06b6d4);border-radius:8px;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(16,185,129,0.4);">🏠</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const reportIcons: Record<string, string> = {
  flood: '🌊',
  road_blocked: '🚧',
  bridge_damaged: '🌉',
  tree_fallen: '🌳',
  power_outage: '⚡',
  fire: '🔥',
  landslide: '🏔️',
  other: '📍',
};

function MapLegend({ layers, toggleLayer }: { layers: string[]; toggleLayer: (l: string) => void }) {
  const allLayers = [
    { key: 'flood-zones', label: 'Flood Zones', icon: Droplets, color: '#ef4444' },
    { key: 'shelters', label: 'Shelters', icon: Building, color: '#10b981' },
    { key: 'reports', label: 'Citizen Reports', icon: MapPin, color: '#f59e0b' },
    { key: 'evacuation', label: 'Evacuation Routes', icon: Navigation, color: '#06b6d4' },
    { key: 'risk-heatmap', label: 'Risk Heatmap', icon: Activity, color: '#8b5cf6' },
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000] glass-card-static p-3 min-w-[180px]">
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
          {layers.includes(layer.key) ? (
            <Eye size={12} style={{ color: layer.color }} />
          ) : (
            <EyeOff size={12} />
          )}
          <layer.icon size={12} style={{ color: layers.includes(layer.key) ? layer.color : undefined }} />
          <span>{layer.label}</span>
        </button>
      ))}

      {/* Legend Colors */}
      <div className="mt-3 pt-2 border-t border-white/5">
        <p className="text-[10px] text-slate-500 mb-1.5">Risk Levels</p>
        <div className="space-y-1">
          {[
            { label: 'Critical', color: '#ef4444' },
            { label: 'High', color: '#f59e0b' },
            { label: 'Medium', color: '#06b6d4' },
            { label: 'Low', color: '#10b981' },
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

function ZoneInfoPanel({ prediction, onClose }: { prediction: typeof mockPredictions[0]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute top-4 left-4 z-[1000] glass-card-static p-5 w-80"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-white">{prediction.zoneName}</h3>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/5">
          <X size={14} className="text-slate-400" />
        </button>
      </div>

      {/* Risk Score */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-16 h-16">
          <svg width="64" height="64" className="transform -rotate-90">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth="6" />
            <circle
              cx="32" cy="32" r="26"
              fill="none"
              stroke={getRiskColor(prediction.riskLevel)}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 26}`}
              strokeDashoffset={`${2 * Math.PI * 26 * (1 - prediction.riskScore / 100)}`}
              style={{ filter: `drop-shadow(0 0 4px ${getRiskColor(prediction.riskLevel)}50)` }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-white">{prediction.riskScore}</span>
          </div>
        </div>
        <div>
          <span className={`badge ${getRiskBadgeClass(prediction.riskLevel)}`}>{prediction.riskLevel}</span>
          <p className="text-xs text-slate-400 mt-1">Confidence: {Math.round(prediction.confidence * 100)}%</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2 rounded-lg bg-white/[0.03] text-center">
          <Droplets size={14} className="text-blue-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{prediction.predictedDepth}m</p>
          <p className="text-[10px] text-slate-500">Depth</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.03] text-center">
          <Clock size={14} className="text-amber-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{prediction.predictedDuration}h</p>
          <p className="text-[10px] text-slate-500">Duration</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.03] text-center">
          <Users size={14} className="text-cyan-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{formatNumber(prediction.affectedPopulation)}</p>
          <p className="text-[10px] text-slate-500">People</p>
        </div>
        <div className="p-2 rounded-lg bg-white/[0.03] text-center">
          <Zap size={14} className="text-purple-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-white">{Math.round(prediction.probability * 100)}%</p>
          <p className="text-[10px] text-slate-500">Probability</p>
        </div>
      </div>

      {/* XAI Factors */}
      <div className="border-t border-white/5 pt-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Zap size={12} className="text-cyan-400" />
          <span className="text-xs font-semibold text-white">Why This Prediction?</span>
        </div>
        <div className="space-y-2">
          {prediction.factors.slice(0, 4).map((factor) => (
            <div key={factor.name}>
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-slate-400">{factor.name}</span>
                <span className="text-slate-300 font-medium">
                  {factor.value}{factor.unit} 
                  <span className={factor.trend === 'increasing' ? 'text-red-400' : factor.trend === 'decreasing' ? 'text-emerald-400' : 'text-slate-500'}>
                    {' '}{factor.trend === 'increasing' ? '↑' : factor.trend === 'decreasing' ? '↓' : '→'}
                  </span>
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${factor.contribution * 3}%`,
                    backgroundColor: getRiskColor(prediction.riskLevel),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function MapView() {
  const { activeMapLayers, toggleMapLayer } = useAppStore();
  const [selectedPrediction, setSelectedPrediction] = useState<typeof mockPredictions[0] | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-7rem)] rounded-xl overflow-hidden'}`}>
      {/* Map */}
      <MapContainer
        center={[13.0500, 80.2200]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Flood Zone Polygons */}
        {activeMapLayers.includes('flood-zones') &&
          mockFloodZones.map((zone) => {
            const color = getRiskColor(zone.riskLevel);
            return (
              <Polygon
                key={zone.id}
                positions={zone.coordinates.map(([lat, lng]) => [lat, lng] as [number, number])}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.2,
                  weight: 2,
                  dashArray: zone.riskLevel === 'critical' ? undefined : '5 5',
                }}
                eventHandlers={{
                  click: () => {
                    const pred = mockPredictions.find((p) => p.zoneName.includes(zone.name.split(' ')[0]));
                    if (pred) setSelectedPrediction(pred);
                  },
                }}
              >
                <Popup>
                  <div className="text-white min-w-[150px]">
                    <p className="font-semibold text-sm">{zone.name}</p>
                    <p className="text-xs mt-1 capitalize">Risk: <span style={{ color }}>{zone.riskLevel}</span></p>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

        {/* Risk Heatmap Points */}
        {activeMapLayers.includes('risk-heatmap') &&
          mockHeatmapPoints.map((point, i) => (
            <CircleMarker
              key={`heat-${i}`}
              center={[point.lat, point.lng]}
              radius={point.intensity * 20}
              pathOptions={{
                color: 'transparent',
                fillColor: point.intensity > 0.7 ? '#ef4444' : point.intensity > 0.4 ? '#f59e0b' : '#10b981',
                fillOpacity: point.intensity * 0.4,
              }}
            />
          ))}

        {/* Shelter Markers */}
        {activeMapLayers.includes('shelters') &&
          mockShelters.map((shelter) => (
            <Marker
              key={shelter.id}
              position={[shelter.location.lat, shelter.location.lng]}
              icon={shelterIcon}
            >
              <Popup>
                <div className="text-white min-w-[200px]">
                  <p className="font-semibold text-sm">{shelter.name}</p>
                  <p className="text-xs text-slate-400 mt-1">{shelter.address}</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Capacity</span>
                      <span>{shelter.currentOccupancy}/{shelter.capacity}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${(shelter.currentOccupancy / shelter.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {shelter.amenities.map((a) => (
                      <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5">{a}</span>
                    ))}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Citizen Report Markers */}
        {activeMapLayers.includes('reports') &&
          mockReports.map((report) => {
            const icon = L.divIcon({
              className: 'custom-marker',
              html: `<div style="width:24px;height:24px;background:rgba(15,23,42,0.9);border-radius:6px;border:1px solid ${
                report.severity >= 4 ? '#ef4444' : '#f59e0b'
              };display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${
                reportIcons[report.type] || '📍'
              }</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            });

            return (
              <Marker
                key={report.id}
                position={[report.location.lat, report.location.lng]}
                icon={icon}
              >
                <Popup>
                  <div className="text-white min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{reportIcons[report.type]}</span>
                      <p className="font-semibold text-sm capitalize">{report.type.replace('_', ' ')}</p>
                      {report.verified && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">✓ Verified</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{report.description}</p>
                    <p className="text-[10px] text-slate-500 mt-1">By {report.userName} • Severity: {report.severity}/5</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Evacuation Routes */}
        {activeMapLayers.includes('evacuation') &&
          mockEvacuationRoutes.map((route) => (
            <Polyline
              key={route.id}
              positions={[
                [route.origin.lat, route.origin.lng],
                ...route.waypoints.map((wp) => [wp.lat, wp.lng] as [number, number]),
                [route.destination.lat, route.destination.lng],
              ]}
              pathOptions={{
                color: route.isRecommended ? '#10b981' : '#f59e0b',
                weight: 4,
                opacity: 0.8,
                dashArray: route.isRecommended ? undefined : '10 6',
              }}
            >
              <Popup>
                <div className="text-white min-w-[180px]">
                  <p className="font-semibold text-sm">{route.name}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <p className="text-slate-400">Distance</p>
                      <p className="font-medium">{route.distance} km</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Est. Time</p>
                      <p className="font-medium">{route.estimatedTime} min</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Route Risk</p>
                      <p className="font-medium" style={{ color: route.riskAlongRoute > 50 ? '#ef4444' : '#10b981' }}>
                        {route.riskAlongRoute}%
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">To</p>
                      <p className="font-medium">{route.shelterName.split(' ').slice(0, 2).join(' ')}</p>
                    </div>
                  </div>
                </div>
              </Popup>
            </Polyline>
          ))}
      </MapContainer>

      {/* Layer Controls */}
      <MapLegend layers={activeMapLayers} toggleLayer={toggleMapLayer} />

      {/* Zone Info Panel */}
      <AnimatePresence>
        {selectedPrediction && (
          <ZoneInfoPanel
            prediction={selectedPrediction}
            onClose={() => setSelectedPrediction(null)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
        <div className="glass-card-static px-4 py-2 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-400">Live Feed Active</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-xs text-slate-400">
            {mockFloodZones.length} flood zones • {mockShelters.length} shelters • {mockReports.length} reports
          </span>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="glass-card-static p-2 hover:bg-white/10 transition-colors"
        >
          {isFullscreen ? <Minimize2 size={16} className="text-slate-400" /> : <Maximize2 size={16} className="text-slate-400" />}
        </button>
      </div>
    </div>
  );
}
