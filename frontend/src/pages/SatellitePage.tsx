import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Satellite, Eye, AlertTriangle, Clock, Layers,
  CheckCircle, Zap, BarChart2, Cpu,
} from 'lucide-react';

interface SatelliteImage {
  id: string;
  name: string;
  source: string;
  captureDate: string;
  floodedAreaKm: number;
  waterBodyChange: string;
  ndwiScore: number;
  coveragePct: number;
  anomalyDetected: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  thumbnail: string;
  analysis: string;
}

const MOCK_IMAGES: SatelliteImage[] = [
  {
    id: 'sat-001',
    name: 'Chennai Adyar Basin — Post Rain',
    source: 'Sentinel-2',
    captureDate: '2026-06-18T06:00:00Z',
    floodedAreaKm: 14.8,
    waterBodyChange: '+340%',
    ndwiScore: 0.82,
    coveragePct: 94,
    anomalyDetected: true,
    severity: 'critical',
    thumbnail: '',
    analysis: 'Large-scale inundation detected in Adyar river floodplain. Water body extent has expanded by 340% compared to baseline. U-Net model confidence: 94%. Immediate action recommended.',
  },
  {
    id: 'sat-002',
    name: 'Velachery Lake Overflow',
    source: 'Landsat-9',
    captureDate: '2026-06-18T07:30:00Z',
    floodedAreaKm: 8.2,
    waterBodyChange: '+210%',
    ndwiScore: 0.71,
    coveragePct: 89,
    anomalyDetected: true,
    severity: 'high',
    thumbnail: '',
    analysis: 'Velachery lake overflow extending into residential areas. Pallikaranai marshland at 85% saturation. Road network disruption visible in SE quadrant.',
  },
  {
    id: 'sat-003',
    name: 'Cooum River Corridor',
    source: 'Sentinel-2',
    captureDate: '2026-06-18T05:15:00Z',
    floodedAreaKm: 6.1,
    waterBodyChange: '+185%',
    ndwiScore: 0.63,
    coveragePct: 87,
    anomalyDetected: true,
    severity: 'high',
    thumbnail: '',
    analysis: 'Cooum River banks overflowing. Bankside settlements showing 6.1 km² under water stress. Debris flow risk along upper stretches.',
  },
  {
    id: 'sat-004',
    name: 'Tambaram — Southern Suburbs',
    source: 'Landsat-9',
    captureDate: '2026-06-17T20:00:00Z',
    floodedAreaKm: 2.3,
    waterBodyChange: '+67%',
    ndwiScore: 0.38,
    coveragePct: 81,
    anomalyDetected: false,
    severity: 'medium',
    thumbnail: '',
    analysis: 'Moderate waterlogging in low-lying areas. Agricultural zones showing saturation stress. No critical infrastructure impact detected yet.',
  },
];

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#06b6d4',
  low: '#10b981',
};

const MODELS = [
  { name: 'U-Net Flood Segmentation', version: 'v2.1', accuracy: '94.2%', type: 'Image Segmentation', status: 'active' },
  { name: 'SegFormer SAR', version: 'v1.8', accuracy: '91.7%', type: 'Transformer', status: 'active' },
  { name: 'NDWI Change Detector', version: 'v3.0', accuracy: '97.1%', type: 'Index Analysis', status: 'active' },
  { name: 'Building Damage CNN', version: 'v1.4', accuracy: '88.9%', type: 'Classification', status: 'standby' },
];

export default function SatellitePage() {
  const [selected, setSelected] = useState<SatelliteImage>(MOCK_IMAGES[0]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const runAnalysis = () => {
    setAnalyzing(true);
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 100) {
        setProgress(100);
        setAnalyzing(false);
        clearInterval(interval);
      } else {
        setProgress(Math.floor(p));
      }
    }, 120);
  };

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
          disabled={analyzing}
          className="btn-primary text-xs py-2 gap-2"
        >
          <Cpu size={14} />
          {analyzing ? `Analyzing... ${progress}%` : 'Run Analysis'}
        </button>
      </div>

      {/* Analysis progress */}
      {analyzing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-400 flex items-center gap-2">
              <Cpu size={14} className="animate-spin" /> Running satellite imagery analysis...
            </span>
            <span className="text-sm font-bold text-white">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {progress < 30 ? 'Loading Sentinel-2 imagery...' :
             progress < 60 ? 'Applying U-Net segmentation model...' :
             progress < 85 ? 'Computing NDWI change detection...' :
             'Generating impact overlay...'}
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image List */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Captures</h2>
          {MOCK_IMAGES.map((img, i) => (
            <motion.div
              key={img.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setSelected(img)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selected.id === img.id
                  ? 'border-purple-500/40 bg-purple-500/5'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/15'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{img.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-slate-500">{img.source}</span>
                    {img.anomalyDetected && (
                      <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                        <AlertTriangle size={9} /> Anomaly
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0"
                  style={{ backgroundColor: `${SEVERITY_COLOR[img.severity]}20`, color: SEVERITY_COLOR[img.severity] }}
                >
                  {img.severity}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{img.floodedAreaKm} km²</span>
                <span className="text-emerald-400">{img.waterBodyChange}</span>
                <span>NDWI: {img.ndwiScore}</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600">
                <Clock size={10} />
                {new Date(img.captureDate).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2 space-y-5">
          {/* Imagery Placeholder */}
          <div className="glass-card-static p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white">{selected.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{selected.source} · {new Date(selected.captureDate).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <CheckCircle size={12} className="text-emerald-400" /> {selected.coveragePct}% coverage
                </span>
              </div>
            </div>

            {/* Fake satellite image overlay */}
            <div className="relative h-64 rounded-xl overflow-hidden bg-bg-tertiary border border-white/5">
              {/* Simulated satellite imagery with CSS */}
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(ellipse at 40% 60%, rgba(6,182,212,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(59,130,246,0.12) 0%, transparent 50%), linear-gradient(135deg, #060a13 0%, #0c1220 50%, #111827 100%)',
              }}>
                {/* Flood zone overlay */}
                <div className="absolute inset-0 opacity-60">
                  <svg className="w-full h-full" viewBox="0 0 800 256" preserveAspectRatio="xMidYMid slice">
                    {/* Simulated water bodies */}
                    <ellipse cx="320" cy="150" rx="180" ry="70" fill="rgba(59,130,246,0.3)" />
                    <ellipse cx="500" cy="100" rx="100" ry="45" fill="rgba(6,182,212,0.25)" />
                    <path d="M 150 120 Q 250 80 350 140 Q 450 200 550 160 Q 650 120 750 150" 
                          stroke="rgba(59,130,246,0.5)" strokeWidth="20" fill="none" strokeLinecap="round" />
                    {/* Critical zones */}
                    <circle cx="300" cy="140" r="30" fill="rgba(239,68,68,0.3)" />
                    <circle cx="480" cy="110" r="20" fill="rgba(245,158,11,0.3)" />
                  </svg>
                </div>
                {/* Legend */}
                <div className="absolute bottom-3 left-3 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-blue-500/60" />
                    <span className="text-[10px] text-slate-400">Flood water</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-red-500/60" />
                    <span className="text-[10px] text-slate-400">Critical zones</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-amber-500/60" />
                    <span className="text-[10px] text-slate-400">High risk</span>
                  </div>
                </div>
                {/* Source badge */}
                <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm">
                  <p className="text-[10px] text-slate-400">{selected.source} · Simulated Overlay</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Flooded Area', value: `${selected.floodedAreaKm} km²`, icon: Layers, color: '#3b82f6' },
              { label: 'Water Change', value: selected.waterBodyChange, icon: BarChart2, color: '#ef4444' },
              { label: 'NDWI Score', value: selected.ndwiScore.toFixed(2), icon: Eye, color: '#8b5cf6' },
              { label: 'Model Conf.', value: `${selected.coveragePct}%`, icon: Zap, color: '#10b981' },
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
              <p className="text-sm text-slate-300 leading-relaxed">{selected.analysis}</p>
            </div>
            {selected.anomalyDetected && (
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
        </div>
      </div>
    </div>
  );
}
