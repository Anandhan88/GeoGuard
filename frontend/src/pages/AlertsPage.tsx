import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Bell, Clock, MapPin, ChevronRight,
  Search, X, Radio
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../stores/useAppStore';
import { getAlertSeverityColor, formatDate, formatTime } from '../utils/helpers';


export default function AlertsPage() {
  const { alerts, fetchAlerts, user, predictions, fetchPredictions, createAlert, isLoading } = useAppStore();
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [alertType, setAlertType] = useState('Flood Warning');
  const [customType, setCustomType] = useState('');
  const [severity, setSeverity] = useState('severe');
  const [targetZone, setTargetZone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAlerts();
    fetchPredictions();
  }, []);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Alert message is required');
      return;
    }
    const finalType = alertType === 'Custom' ? customType : alertType;
    if (alertType === 'Custom' && !customType.trim()) {
      toast.error('Please specify alert type');
      return;
    }

    try {
      await createAlert({
        alert_type: finalType,
        severity,
        message,
        target_zone: targetZone || undefined
      });
      toast.success('Alert broadcasted successfully!');
      setShowCreateModal(false);
      setMessage('');
      setCustomType('');
      setTargetZone('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue alert');
    }
  };

  const zones = predictions.map(p => ({ id: p.zoneId, name: p.zoneName }));
  const uniqueZones = Array.from(new Map(zones.map(z => [z.id, z])).values());
  const role = user?.role || 'citizen';

  const filteredAlerts = alerts
    .filter((a) => filter === 'all' || a.severity === filter)
    .filter((a) => 
      searchQuery === '' || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  const severityIcon = (severity: string) => {
    switch (severity) {
      case 'extreme': return '🔴';
      case 'critical': return '🔴';
      case 'severe': return '🟠';
      case 'moderate': return '🟡';
      case 'advisory': return '🔵';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bell size={24} className="text-amber-400" />
            Active Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {filteredAlerts.length} active alerts across Chennai Metropolitan Area
          </p>
        </div>
        {role === 'authority' && (
          <button onClick={() => setShowCreateModal(true)} className="btn-danger text-xs py-2">
            <AlertTriangle size={14} /> Issue New Alert
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
            className="input-field pl-10 text-sm"
          />
        </div>
        {['all', 'extreme', 'severe', 'moderate', 'advisory'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === s
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-slate-400 hover:text-white border border-transparent hover:border-white/10'
            }`}
          >
            {s === 'all' ? 'All' : (
              <>
                {severityIcon(s)}{' '}
                <span className="capitalize">{s}</span>
              </>
            )}
          </button>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {filteredAlerts.map((alert, i) => {
          const color = getAlertSeverityColor(alert.severity);
          return (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card-static overflow-hidden"
            >
              {/* Severity Accent */}
              <div className="h-1" style={{ backgroundColor: color }} />
              
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${color}15` }}
                  >
                    <AlertTriangle size={22} style={{ color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${color}20`,
                          color,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs text-slate-500">{alert.type}</span>
                      {alert.isActive && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-white mb-2">{alert.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{alert.message}</p>

                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={12} />
                        {alert.targetZone}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock size={12} />
                        Issued: {formatDate(alert.issuedAt)} at {formatTime(alert.issuedAt)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Bell size={12} />
                        Expires: {formatDate(alert.expiresAt)}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button className="btn-secondary text-xs py-1.5 px-3">
                      View Zone <ChevronRight size={12} />
                    </button>
                    <button className="text-xs text-slate-500 hover:text-slate-300 px-3 py-1.5">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Alert Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg glass-card-static overflow-hidden shadow-2xl border border-white/10"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-red-500 animate-pulse" size={20} />
                Issue Official Alert
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateAlert} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block font-semibold">
                  Alert Type
                </label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="Flood Warning">Flood Warning</option>
                  <option value="Heavy Rainfall">Heavy Rainfall</option>
                  <option value="Evacuation Order">Evacuation Order</option>
                  <option value="Storm Surge">Storm Surge</option>
                  <option value="Infrastructure Advisory">Infrastructure Advisory</option>
                  <option value="Custom">Custom Alert Type...</option>
                </select>
              </div>

              {alertType === 'Custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block font-semibold">
                    Specify Custom Type
                  </label>
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="e.g. Extreme Winds"
                    className="input-field text-sm"
                  />
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block font-semibold">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="advisory">🔵 Advisory</option>
                    <option value="moderate">🟡 Moderate</option>
                    <option value="severe">🟠 Severe</option>
                    <option value="critical">🔴 Critical</option>
                    <option value="extreme">🔴 Extreme</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block font-semibold">
                    Target Zone
                  </label>
                  <select
                    value={targetZone}
                    onChange={(e) => setTargetZone(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">All of Chennai</option>
                    {uniqueZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider mb-1.5 block font-semibold">
                  Official Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter the official safety instructions and information..."
                  rows={4}
                  className="input-field text-sm resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1 justify-center py-2.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-danger flex-1 justify-center py-2.5 flex items-center gap-2"
                >
                  <Radio size={16} className={isLoading ? 'animate-pulse' : 'animate-ping'} />
                  {isLoading ? 'Broadcasting...' : 'Broadcast Alert'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
