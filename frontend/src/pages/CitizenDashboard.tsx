import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Users,
  Building,
  MapPin,
  FileText,
  Droplets,
  Wind,
  Thermometer,
  ChevronRight,
  ArrowUpRight,
  Activity,
  Shield,
  Clock,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { mockWeatherData } from '../data/mockData';
import { useTranslation } from '../utils/translations';
import {
  getRiskColor,
  getRiskBadgeClass,
  formatNumber,
  formatRelativeTime,
} from '../utils/helpers';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Animated counter hook
function useAnimatedCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// Risk Gauge Component
function RiskGauge({ score, size = 120, label = 'Risk Score' }: { score: number; size?: number; label?: string }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f59e0b' : score >= 40 ? '#06b6d4' : '#10b981';

  return (
    <div className="risk-gauge relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="risk-gauge-track" cx={size / 2} cy={size / 2} r={radius} />
        <circle
          className="risk-gauge-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ filter: `drop-shadow(0 0 6px ${color}50)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-[10px] text-slate-500 uppercase">{label}</span>
      </div>
    </div>
  );
}

// Rainfall chart data
const rainfallData = [
  { time: '6AM', actual: 12, predicted: 15 },
  { time: '9AM', actual: 28, predicted: 25 },
  { time: '12PM', actual: 45, predicted: 42 },
  { time: '3PM', actual: 52, predicted: 58 },
  { time: '6PM', actual: null, predicted: 72 },
  { time: '9PM', actual: null, predicted: 85 },
  { time: '12AM', actual: null, predicted: 65 },
  { time: '3AM', actual: null, predicted: 45 },
];

export default function CitizenDashboard() {
  const { t, lang } = useTranslation();
  const {
    predictions,
    alerts,
    shelters,
    reports,
    stats,
    fetchPredictions,
    fetchAlerts,
    fetchShelters,
    fetchReports,
    fetchStats
  } = useAppStore();

  useEffect(() => {
    fetchPredictions();
    fetchAlerts();
    fetchShelters();
    fetchReports();
    fetchStats();
  }, []);

  const weather = mockWeatherData;
  const topPredictions = predictions.slice(0, 4);
  const recentAlerts = alerts.slice(0, 3);
  const nearbyShelters = shelters.slice(0, 3);
  const recentReports = reports.slice(0, 4);
  const animatedAlerts = useAnimatedCounter(stats.activeAlerts);
  const animatedPopulation = useAnimatedCounter(stats.populationAffected);
  const animatedShelters = useAnimatedCounter(stats.sheltersActive);
  const animatedReports = useAnimatedCounter(stats.citizenReports);

  const statCards = [
    { label: t('active_alerts'), value: animatedAlerts, icon: AlertTriangle, color: '#ef4444', gradient: 'from-red-500/10 to-transparent' },
    { label: t('population_at_risk'), value: formatNumber(animatedPopulation), icon: Users, color: '#f59e0b', gradient: 'from-amber-500/10 to-transparent' },
    { label: t('shelters_active'), value: animatedShelters, icon: Building, color: '#10b981', gradient: 'from-emerald-500/10 to-transparent' },
    { label: t('reports_filed'), value: formatNumber(animatedReports), icon: FileText, color: '#3b82f6', gradient: 'from-blue-500/10 to-transparent' },
  ];

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('overview')}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('citizen_portal_sub')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">{t('live_data')}</span>
          </div>
          <span className="text-xs text-slate-500">
            <Clock size={12} className="inline mr-1" />
            {t('system_online')}
          </span>
        </div>
      </div>

      {/* Alert Banner */}
      {recentAlerts[0] && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-400">{recentAlerts[0].title}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{recentAlerts[0].message}</p>
          </div>
          <Link to="/app/alerts" className="btn-secondary text-xs py-1.5 px-3 shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10">
            {t('view_details')}
          </Link>
        </motion.div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card"
            style={{ '--tw-gradient-from': `${stat.color}15` } as React.CSSProperties}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} rounded-[16px] pointer-events-none`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{stat.label}</span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Risk Predictions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rainfall Chart */}
          <div className="glass-card-static p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">{t('rainfall_forecast')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('actual_vs_predicted')}</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1 rounded bg-blue-500" />
                  <span className="text-slate-400">{t('actual')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-1 rounded bg-cyan-500 opacity-50" />
                  <span className="text-slate-400">{t('predicted')}</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={rainfallData}>
                <defs>
                  <linearGradient id="gradientActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradientPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(16px)',
                  }}
                />
                <Area type="monotone" dataKey="predicted" stroke="#06b6d4" strokeWidth={2} strokeDasharray="5 5" fill="url(#gradientPredicted)" />
                <Area type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} fill="url(#gradientActual)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Risk Zones */}
          <div className="glass-card-static p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">{t('zones_at_risk')}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t('command_center_sub')}</p>
              </div>
              <Link to="/app/map" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                {t('view_on_map')} <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {topPredictions.map((pred, i) => (
                <motion.div
                  key={pred.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 cursor-pointer transition-colors group"
                >
                  <RiskGauge score={pred.riskScore} size={64} label={t('risk_score')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white truncate">{pred.zoneName}</h4>
                      <span className={`badge ${getRiskBadgeClass(pred.riskLevel)}`}>
                        {pred.riskLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Droplets size={12} /> {pred.predictedDepth}m {t('depth')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {formatNumber(pred.affectedPopulation)} {t('people')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {pred.predictedDuration}{t('hours')}
                      </span>
                    </div>
                    {/* Factor mini-bars */}
                    <div className="flex gap-1 mt-2">
                      {pred.factors.slice(0, 4).map((f) => (
                        <div key={f.name} className="flex-1" title={`${f.name}: ${f.contribution}%`}>
                          <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${f.contribution * 3}%`,
                                backgroundColor: getRiskColor(pred.riskLevel),
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <ArrowUpRight size={16} className="text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Weather Widget */}
          <div className="glass-card-static p-6">
            <h3 className="text-base font-semibold text-white mb-4">{t('current_weather')}</h3>
            <div className="text-center mb-4">
              <span className="text-5xl">{weather.icon}</span>
              <div className="mt-2">
                <span className="text-4xl font-bold text-white">{weather.temperature}°</span>
                <span className="text-sm text-slate-400 ml-2">{weather.condition}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03]">
                <Droplets size={14} className="text-blue-400" />
                <div>
                  <p className="text-xs text-slate-500">{t('rainfall')}</p>
                  <p className="text-sm font-semibold text-white">{weather.rainfall} mm</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03]">
                <Wind size={14} className="text-cyan-400" />
                <div>
                  <p className="text-xs text-slate-500">{t('wind')}</p>
                  <p className="text-sm font-semibold text-white">{weather.windSpeed} km/h</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03]">
                <Thermometer size={14} className="text-amber-400" />
                <div>
                  <p className="text-xs text-slate-500">{t('humidity')}</p>
                  <p className="text-sm font-semibold text-white">{weather.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03]">
                <Activity size={14} className="text-purple-400" />
                <div>
                  <p className="text-xs text-slate-500">{t('pressure')}</p>
                  <p className="text-sm font-semibold text-white">{weather.pressure} hPa</p>
                </div>
              </div>
            </div>
            {/* 5-day forecast */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-xs text-slate-500 mb-2">{t('forecast_5day')}</p>
              <div className="flex justify-between">
                {weather.forecast.map((day: any) => (
                  <div key={day.date} className="text-center">
                    <p className="text-[10px] text-slate-500">{new Date(day.date).toLocaleDateString(lang, { weekday: 'short' })}</p>
                    <p className="text-lg my-1">{day.icon}</p>
                    <p className="text-xs text-slate-400">{day.rainfall}mm</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Nearby Shelters */}
          <div className="glass-card-static p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">{t('nearby_shelters')}</h3>
              <Link to="/app/shelters" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                {t('view_all')} <ChevronRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {nearbyShelters.map((shelter) => {
                const occupancyPct = Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
                const occupancyColor = occupancyPct >= 90 ? '#ef4444' : occupancyPct >= 70 ? '#f59e0b' : '#10b981';
                return (
                  <div key={shelter.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-white truncate">{shelter.name}</h4>
                      <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                        {shelter.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">{shelter.address}</p>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400">
                          {shelter.currentOccupancy}/{shelter.capacity} {t('occupancy').toLowerCase()}
                        </span>
                        <span style={{ color: occupancyColor }} className="font-semibold">{occupancyPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${occupancyPct}%`, backgroundColor: occupancyColor }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {shelter.amenities.slice(0, 3).map((amenity) => (
                        <span key={amenity} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="glass-card-static p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">{t('recent_reports')}</h3>
              <div className="flex items-center gap-2">
                <span className="badge badge-info">{reports.length} {t('total')}</span>
                <Link to="/app/citizen/report" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  + {t('submit')} <ChevronRight size={12} />
                </Link>
              </div>
            </div>
            <div className="space-y-2.5">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    report.verified ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                  }`}>
                    <MapPin size={14} className={report.verified ? 'text-emerald-400' : 'text-amber-400'} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{report.description.slice(0, 60)}...</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500">{report.userName}</span>
                      <span className="text-[10px] text-slate-600">•</span>
                      <span className="text-[10px] text-slate-500">{formatRelativeTime(report.createdAt)}</span>
                      {report.verified && (
                        <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                          <Shield size={8} /> {t('verified')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
