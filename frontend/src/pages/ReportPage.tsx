import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText, MapPin, AlertTriangle, Send, ArrowLeft,
  Droplets, Zap, Navigation, Flame, TreePine, Mountain,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { value: 'flood', label: 'Flooding', icon: Droplets, color: '#3b82f6', description: 'Water inundation / waterlogging' },
  { value: 'road_blocked', label: 'Road Blocked', icon: Navigation, color: '#f59e0b', description: 'Road inaccessible due to debris or water' },
  { value: 'power_outage', label: 'Power Outage', icon: Zap, color: '#8b5cf6', description: 'Electricity disruption' },
  { value: 'fire', label: 'Fire', icon: Flame, color: '#ef4444', description: 'Fire or smoke observed' },
  { value: 'tree_fallen', label: 'Tree Fallen', icon: TreePine, color: '#10b981', description: 'Fallen tree blocking access' },
  { value: 'landslide', label: 'Landslide', icon: Mountain, color: '#6b7280', description: 'Slope collapse or mud movement' },
  { value: 'other', label: 'Other', icon: AlertTriangle, color: '#06b6d4', description: 'Other emergency situation' },
];

const SEVERITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Minor', color: '#10b981' },
  2: { label: 'Low', color: '#06b6d4' },
  3: { label: 'Moderate', color: '#f59e0b' },
  4: { label: 'High', color: '#f97316' },
  5: { label: 'Critical', color: '#ef4444' },
};

export default function ReportPage() {
  const navigate = useNavigate();
  const { submitReport, isLoading, isAuthenticated } = useAppStore();

  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [lat, setLat] = useState(13.0067);
  const [lng, setLng] = useState(80.2206);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setUseCurrentLocation(true);
        setLocationLoading(false);
        toast.success('Location detected');
      },
      () => {
        setLocationLoading(false);
        toast.error('Failed to get location. Using default Chennai coordinates.');
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) {
      toast.error('Please select a report type');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please log in to submit a report');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('report_type', selectedType);
    formData.append('description', description);
    formData.append('severity', severity.toString());
    formData.append('lat', lat.toString());
    formData.append('lng', lng.toString());

    try {
      await submitReport(formData);
      toast.success('Report submitted successfully! Thank you for helping your community.', {
        duration: 4000,
        icon: '✅',
      });
      navigate('/app/citizen');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit report');
    }
  };

  const currentSeverity = SEVERITY_LABELS[severity];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
        >
          <ArrowLeft size={18} className="text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={22} className="text-cyan-400" />
            Submit Incident Report
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Help authorities respond faster by reporting ground situations
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Type */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-static p-6"
        >
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">1</span>
            Select Incident Type
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {REPORT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-opacity-50 bg-opacity-10'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10'
                  }`}
                  style={isSelected ? {
                    borderColor: `${type.color}50`,
                    backgroundColor: `${type.color}10`,
                  } : {}}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: isSelected ? `${type.color}20` : 'rgba(255,255,255,0.04)' }}
                  >
                    <Icon size={20} style={{ color: isSelected ? type.color : '#64748b' }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-center" style={{ color: isSelected ? type.color : '#e2e8f0' }}>
                      {type.label}
                    </p>
                    <p className="text-[10px] text-slate-500 text-center mt-0.5">{type.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card-static p-6"
        >
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">2</span>
            Describe the Situation
          </h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you see — water levels, affected areas, people stranded, road conditions, etc."
            rows={4}
            className="input-field resize-none w-full text-sm leading-relaxed"
          />
          <p className="text-[10px] text-slate-500 mt-2">{description.length} / 500 characters</p>
        </motion.div>

        {/* Severity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card-static p-6"
        >
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">3</span>
            Severity Level
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl font-bold" style={{ color: currentSeverity.color }}>
              {severity}
            </span>
            <div>
              <p className="text-base font-semibold" style={{ color: currentSeverity.color }}>
                {currentSeverity.label}
              </p>
              <p className="text-xs text-slate-500">out of 5</p>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={severity}
            onChange={(e) => setSeverity(parseInt(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            {Object.entries(SEVERITY_LABELS).map(([k, v]) => (
              <span key={k} style={{ color: parseInt(k) === severity ? v.color : undefined }}>{v.label}</span>
            ))}
          </div>
        </motion.div>

        {/* Location */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card-static p-6"
        >
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-bold">4</span>
            Location
          </h2>
          <div className="flex items-center gap-3 mb-4">
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={locationLoading}
              className="btn-secondary text-sm py-2 flex items-center gap-2"
            >
              <MapPin size={15} />
              {locationLoading ? 'Detecting...' : 'Use My Location'}
            </button>
            {useCurrentLocation && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                ✓ Location captured
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="input-field text-sm w-full"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 mb-1 block">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="input-field text-sm w-full"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
            <MapPin size={10} />
            Chennai Metropolitan Area ({lat.toFixed(4)}, {lng.toFixed(4)})
          </p>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4"
        >
          <button
            type="submit"
            disabled={isLoading || !selectedType || !description.trim()}
            className="btn-primary flex-1 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Send size={16} />
                Submit Report
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary py-3 px-6 text-sm"
          >
            Cancel
          </button>
        </motion.div>

        {!isAuthenticated && (
          <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-1">
            <AlertTriangle size={12} />
            You must be logged in to submit a report
          </p>
        )}
      </form>
    </div>
  );
}
