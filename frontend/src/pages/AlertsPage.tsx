import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Bell, Clock, MapPin, ChevronRight,
  Search,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { getAlertSeverityColor, formatDate, formatTime } from '../utils/helpers';

const severityOrder: Record<string, number> = { extreme: 0, critical: 1, severe: 2, moderate: 3, advisory: 4 };

export default function AlertsPage() {
  const { alerts, fetchAlerts } = useAppStore();
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredAlerts = alerts
    .filter((a) => filter === 'all' || a.severity === filter)
    .filter((a) => 
      searchQuery === '' || 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

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
        <button className="btn-danger text-xs py-2">
          <AlertTriangle size={14} /> Issue New Alert
        </button>
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
    </div>
  );
}
