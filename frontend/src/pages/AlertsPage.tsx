import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Bell, Clock, MapPin, ChevronRight,
  Search, X, Radio, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAppStore } from '../stores/useAppStore';
import { getAlertSeverityColor, formatDate, formatTime } from '../utils/helpers';

export default function AlertsPage() {
  const navigate = useNavigate();
  const {
    alerts,
    fetchAlerts,
    user,
    predictions,
    fetchPredictions,
    createAlert,
    selectedLocation,
  } = useAppStore();

  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
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
  }, [selectedLocation?.lat, selectedLocation?.lng]);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    try {
      await createAlert({
        alert_type: finalType,
        severity,
        message,
        target_zone: targetZone || `${selectedLocation?.name?.split(',')[0] || 'Perundurai'} Region`
      });
      toast.success('Alert broadcasted successfully across emergency system!', { icon: '🚨' });
      setShowCreateModal(false);
      setMessage('');
      setCustomType('');
      setTargetZone('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to issue alert');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlertIds((prev) => [...prev, alertId]);
    toast.success('Alert dismissed from your feed.');
  };

  const currentCity = selectedLocation?.name?.split(',')[0] || 'Perundurai';
  const zones = predictions.map((p) => ({ id: p.zoneId, name: p.zoneName }));
  const uniqueZones = Array.from(new Map(zones.map((z) => [z.id, z])).values());
  const role = user?.role || 'citizen';

  const activeAlertsList = alerts.filter((a) => !dismissedAlertIds.includes(a.id));

  const filteredAlerts = activeAlertsList
    .filter((a) => filter === 'all' || a.severity === filter)
    .filter(
      (a) =>
        searchQuery === '' ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.targetZone.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  const severityIcon = (sev: string) => {
    switch (sev) {
      case 'extreme':
      case 'critical':
        return '🔴';
      case 'severe':
        return '🟠';
      case 'moderate':
        return '🟡';
      case 'advisory':
        return '🔵';
      default:
        return '⚪';
    }
  };

  return (
    <div className="space-y-6 max-w-5xl pb-12">
      {/* Header Banner */}
      <div className="glass-card-static p-6 border border-amber-500/20 shadow-2xl relative overflow-hidden bg-slate-950/80 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <ShieldAlert size={26} className="text-amber-400 animate-pulse" />
              <span className="bg-gradient-to-r from-white via-amber-100 to-orange-400 bg-clip-text text-transparent">
                Active Emergency Alerts & Broadcasts
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live disaster warnings, weather advisories & emergency orders active for <span className="text-amber-400 font-semibold">{currentCity}</span>.
            </p>
          </div>

          {(role === 'authority' || role === 'admin') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-danger text-xs py-2.5 px-4 font-bold gap-2 shrink-0 bg-gradient-to-r from-red-600 to-rose-600 border-none shadow-lg shadow-red-600/30"
            >
              <AlertTriangle size={15} /> Broadcast New Alert
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card-static p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search alerts in ${currentCity}...`}
            className="input-field pl-9 text-xs py-2 bg-slate-900/90 w-full"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'extreme', 'severe', 'moderate', 'advisory'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filter === s
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-white/5'
              }`}
            >
              {s === 'all' ? (
                'All Alerts'
              ) : (
                <span className="flex items-center gap-1">
                  {severityIcon(s)} <span className="capitalize">{s}</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Cards Feed */}
      <div className="space-y-4">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, i) => {
            const color = getAlertSeverityColor(alert.severity);
            const targetName = alert.targetZone.replace('Chennai', currentCity);

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card-static overflow-hidden border border-white/10 bg-slate-950/80 shadow-xl hover:border-amber-500/30 transition-all"
              >
                {/* Top Severity Accent Line */}
                <div className="h-1" style={{ backgroundColor: color }} />

                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-4">
                    {/* Severity Badge Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
                      style={{ backgroundColor: `${color}18`, border: `1px solid ${color}35` }}
                    >
                      <AlertTriangle size={22} style={{ color }} />
                    </div>

                    {/* Content Body */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${color}20`,
                            color,
                            border: `1px solid ${color}40`,
                          }}
                        >
                          {alert.severity}
                        </span>

                        <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                          {alert.type}
                        </span>

                        {alert.isActive && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            LIVE ACTIVE
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white leading-snug">{alert.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{alert.message}</p>

                      <div className="flex items-center gap-4 pt-2 flex-wrap text-[11px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin size={12} className="text-amber-400" />
                          <span>{targetName}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-cyan-400" />
                          <span>Issued: {formatDate(alert.issuedAt)} ({formatTime(alert.issuedAt)})</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                          <Bell size={12} className="text-slate-500" />
                          <span>Expires: {formatDate(alert.expiresAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-col gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/app/map?lat=${selectedLocation?.lat || 11.2715}&lng=${selectedLocation?.lng || 77.6066}&alert=true`)}
                        className="btn-secondary text-xs py-2 px-3 gap-1.5 font-bold text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                      >
                        <span>View Zone</span>
                        <ChevronRight size={13} />
                      </button>

                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/5 border border-transparent transition-colors font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="p-10 text-center rounded-2xl glass-card-static border border-white/10 space-y-3 bg-slate-950/80">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-bold text-white">No Active Emergency Alerts</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              There are currently no active severe or critical disaster warnings for <span className="text-emerald-400 font-semibold">{currentCity}</span> matching your filter.
            </p>
          </div>
        )}
      </div>

      {/* Alert Creation Modal for Authorities */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg glass-card-static overflow-hidden shadow-2xl border border-red-500/30 bg-slate-950"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="text-red-500 animate-pulse" size={20} />
                  Broadcast Official Emergency Alert
                </h2>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateAlert} className="p-6 space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-1 block">
                    Alert Type
                  </label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value)}
                    className="input-field text-xs bg-slate-900 w-full"
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
                    <label className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-1 block">
                      Specify Custom Type
                    </label>
                    <input
                      type="text"
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value)}
                      placeholder="e.g. Extreme Flash Floods"
                      className="input-field text-xs w-full"
                    />
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-1 block">
                      Severity Level
                    </label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="input-field text-xs bg-slate-900 w-full"
                    >
                      <option value="advisory">🔵 Advisory</option>
                      <option value="moderate">🟡 Moderate</option>
                      <option value="severe">🟠 Severe</option>
                      <option value="critical">🔴 Critical</option>
                      <option value="extreme">🔴 Extreme</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-1 block">
                      Target Zone
                    </label>
                    <select
                      value={targetZone}
                      onChange={(e) => setTargetZone(e.target.value)}
                      className="input-field text-xs bg-slate-900 w-full"
                    >
                      <option value="">All of {currentCity}</option>
                      {uniqueZones.map((z) => (
                        <option key={z.id} value={z.name}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold uppercase tracking-wider mb-1 block">
                    Official Safety Instructions & Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter official disaster warning instructions for residents..."
                    rows={4}
                    className="input-field text-xs resize-none w-full"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary text-xs flex-1 justify-center py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-danger text-xs flex-1 justify-center py-2.5 flex items-center gap-2 font-bold bg-gradient-to-r from-red-600 to-rose-600 border-none shadow-lg shadow-red-600/30 disabled:opacity-50"
                  >
                    <Radio size={14} className={isSubmitting ? 'animate-pulse' : 'animate-ping'} />
                    <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast Alert'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
