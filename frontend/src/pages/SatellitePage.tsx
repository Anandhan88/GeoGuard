import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import {
  Satellite, Eye, AlertTriangle, Clock, Layers,
  CheckCircle, Zap, BarChart2, Cpu, MapPin,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#06b6d4',
  moderate: '#06b6d4',
  low: '#10b981',
  minimal: '#10b981',
};

const MODELS = [
  { name: 'U-Net Flood Segmentation', version: 'v2.1', accuracy: '94.2%', type: 'Image Segmentation', status: 'active' },
  { name: 'SegFormer SAR', version: 'v1.8', accuracy: '91.7%', type: 'Transformer', status: 'active' },
  { name: 'NDWI Change Detector', version: 'v3.0', accuracy: '97.1%', type: 'Index Analysis', status: 'active' },
  { name: 'Building Damage CNN', version: 'v1.4', accuracy: '88.9%', type: 'Classification', status: 'standby' },
];

function ChangeMapView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

export default function SatellitePage() {
  const {
    satelliteImages,
    satelliteStatus,
    fetchSatelliteImages,
    fetchSatelliteStatus,
    triggerSatelliteAnalysis,
    selectedLocation,
  } = useAppStore();

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // Initial fetches
  useEffect(() => {
    fetchSatelliteImages();
    fetchSatelliteStatus();
  }, []);

  // Poll status while job is active
  useEffect(() => {
    let interval: any = null;
    const isJobActive = satelliteStatus && ['Searching', 'Downloading', 'Processing'].includes(satelliteStatus.status);

    if (isJobActive) {
      interval = setInterval(() => {
        fetchSatelliteStatus();
        fetchSatelliteImages();
      }, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [satelliteStatus?.status]);

  const activeImages = satelliteImages || [];
  const selected = activeImages.find((img) => img.id === selectedImageId) || activeImages[0] || null;

  const runAnalysis = async () => {
    if (!selectedLocation) return;
    try {
      await triggerSatelliteAnalysis(selectedLocation.lat, selectedLocation.lng);
    } catch (err) {
      console.error("Failed to run analysis:", err);
    }
  };

  const isPipelineRunning = satelliteStatus && ['Searching', 'Downloading', 'Processing'].includes(satelliteStatus.status);
  const currentProgress = satelliteStatus?.progress ?? 0;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Satellite size={24} className="text-purple-400" />
            Satellite Analysis
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            U-Net & SegFormer models · Real-time flood detection · Damage assessment
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={isPipelineRunning || !selectedLocation}
          className="btn-primary text-xs py-2 gap-2"
        >
          <Cpu size={14} />
          {isPipelineRunning ? `Analyzing... ${currentProgress}%` : 'Run Analysis'}
        </button>
      </div>

      {/* Analysis progress */}
      {isPipelineRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-400 flex items-center gap-2">
              <Cpu size={14} className="animate-spin" /> {satelliteStatus?.status} satellite imagery for {satelliteStatus?.satellite_name}...
            </span>
            <span className="text-sm font-bold text-white">{currentProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              animate={{ width: `${currentProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {currentProgress < 30 ? 'Querying Copernicus CDSE catalog...' :
             currentProgress < 60 ? 'Downloading Sentinel imagery band measurements...' :
             currentProgress < 85 ? 'Executing U-Net flood segmentation model...' :
             'Extracting flood vectors and writing metadata...'}
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image List */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Captures</h2>
          
          {activeImages.length === 0 ? (
            <div className="p-6 text-center rounded-xl border border-white/5 bg-white/[0.02]">
              <Satellite size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No captures found</p>
              <p className="text-xs text-slate-500 mt-1">Click "Run Analysis" to query the catalog</p>
            </div>
          ) : (
            activeImages.map((img, i) => {
              const res = img.analysis_result_json;
              const severity = res?.severity?.toLowerCase() || 'low';
              return (
                <motion.div
                  key={img.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => setSelectedImageId(img.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    (selected?.id === img.id)
                      ? 'border-purple-500/40 bg-purple-500/5'
                      : 'border-white/5 bg-white/[0.02] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {selectedLocation?.name.split(',')[0]} Basin — Post Rain
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-500">{img.source}</span>
                        {res?.anomaly_detected && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                            <AlertTriangle size={9} /> Anomaly
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0"
                      style={{
                        backgroundColor: `${SEVERITY_COLOR[severity] || '#3b82f6'}20`,
                        color: SEVERITY_COLOR[severity] || '#3b82f6',
                      }}
                    >
                      {res?.severity || 'Low'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{res?.flooded_area_km ?? 0} km²</span>
                    <span className="text-emerald-400">+{res?.water_spread_pct ?? 0}%</span>
                    <span>NDWI: {res?.ndwi_score ?? 0}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600">
                    <Clock size={10} />
                    {new Date(img.capture_date).toLocaleString()}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2 space-y-5">
          {selected ? (
            <>
              {/* Imagery Map view */}
              <div className="glass-card-static p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {selectedLocation?.name.split(',')[0]} Basin Flood Extent
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selected.source} · {new Date(selected.capture_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <CheckCircle size={12} className="text-emerald-400" /> {selected.analysis_result_json?.coverage_pct ?? 100}% coverage
                    </span>
                  </div>
                </div>

                {/* Leaflet map overlay for flood vectors */}
                <div className="relative h-96 rounded-xl overflow-hidden bg-slate-900 border border-white/5 z-0">
                  <MapContainer
                    center={[selectedLocation?.lat ?? 13.0827, selectedLocation?.lng ?? 80.2707]}
                    zoom={12}
                    style={{ width: '100%', height: '100%', background: '#0f172a' }}
                    zoomControl={false}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    <ChangeMapView center={[selectedLocation?.lat ?? 13.0827, selectedLocation?.lng ?? 80.2707]} />
                    
                    {selected.analysis_result_json?.polygons && (
                      <GeoJSON
                        key={selected.id}
                        data={{ type: 'FeatureCollection', features: selected.analysis_result_json.polygons } as any}
                        style={(feature) => {
                          const type = feature?.properties?.type;
                          const severity = feature?.properties?.severity?.toLowerCase();
                          
                          let color = '#3b82f6';
                          let fillOpacity = 0.45;
                          
                          if (type === 'river_overflow') {
                            color = '#3b82f6';
                            fillOpacity = 0.5;
                          } else if (type === 'urban_inundation') {
                            color = severity === 'critical' ? '#ef4444' : severity === 'high' ? '#f59e0b' : '#3b82f6';
                            fillOpacity = 0.4;
                          }
                          
                          return {
                            color,
                            weight: 2,
                            fillColor: color,
                            fillOpacity,
                          };
                        }}
                      />
                    )}
                  </MapContainer>
                  
                  {/* Legend overlay */}
                  <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 p-3 rounded-lg bg-black/60 backdrop-blur-md z-[1000] border border-white/5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-blue-500/60" />
                      <span className="text-[10px] text-slate-300">Flood Inundation</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-red-500/60" />
                      <span className="text-[10px] text-slate-300">Critical Risk</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-amber-500/60" />
                      <span className="text-[10px] text-slate-300">High Risk</span>
                    </div>
                  </div>
                  
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md z-[1000] border border-white/5">
                    <p className="text-[10px] text-slate-300 flex items-center gap-1">
                      <MapPin size={10} className="text-purple-400" /> Live Vector Overlay
                    </p>
                  </div>
                </div>
              </div>

              {/* Analysis Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Flooded Area', value: `${selected.analysis_result_json?.flooded_area_km ?? 0} km²`, icon: Layers, color: '#3b82f6' },
                  { label: 'Water Change', value: `+${selected.analysis_result_json?.water_spread_pct ?? 0}%`, icon: BarChart2, color: '#ef4444' },
                  { label: 'NDWI Score', value: (selected.analysis_result_json?.ndwi_score ?? 0).toFixed(2), icon: Eye, color: '#8b5cf6' },
                  { label: 'Model Conf.', value: `${selected.analysis_result_json?.coverage_pct ?? 100}%`, icon: Zap, color: '#10b981' },
                ].map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center"
                  >
                    <m.icon size={18} style={{ color: m.color }} className="mx-auto mb-2" />
                    <p className="text-xl font-bold text-white">{m.value}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{m.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* AI Analysis Text */}
              <div className="glass-card-static p-6">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Cpu size={16} className="text-purple-400" /> AI Analysis Report
                </h3>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {selected.analysis_result_json?.analysis ?? 'No analysis generated.'}
                  </p>
                </div>
                {selected.analysis_result_json?.anomaly_detected && (
                  <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400">
                      ⚠️ Anomaly detected — This event exceeds 2σ from historical baseline. Recommend issuing high-priority evacuation advisory.
                    </p>
                  </div>
                )}
              </div>

              {/* Active ML Models */}
              <div className="glass-card-static p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Cpu size={16} className="text-cyan-400" /> Active ML Models
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {MODELS.map((model) => (
                    <div key={model.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${model.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{model.name}</p>
                        <p className="text-[10px] text-slate-500">{model.type} · {model.version}</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 shrink-0">{model.accuracy}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="glass-card-static p-12 text-center">
              <Satellite size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-white">No Capture Selected</p>
              <p className="text-sm text-slate-400 mt-2">
                Select a capture from the sidebar or click "Run Analysis" to retrieve new imagery.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
