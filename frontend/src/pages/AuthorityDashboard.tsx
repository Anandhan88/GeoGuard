import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import {
  AlertTriangle, Users, Truck, Activity, Shield, MapPin,
  ArrowUpRight, Target, DollarSign, CheckCircle2, AlertCircle,
  FileText, Navigation, RefreshCw, Send, Check, Eye, BarChart3,
  Building, Heart
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../stores/useAppStore';
import { useTranslation } from '../utils/translations';
import {
  getRiskBadgeClass, formatNumber, formatCurrency, formatRelativeTime
} from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export default function AuthorityDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const user = useAppStore((s) => s.user);
  const {
    predictions,
    reports,
    stats,
    resources,
    updateResource,
    addResource,
    fetchPredictions,
    fetchReports,
    fetchStats,
    verifyReport,
    triggerPredictions,
    respondToEmergencyRequest,
    isLoading
  } = useAppStore();

  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [newResource, setNewResource] = useState({
    name: '',
    category: 'vehicles' as 'vehicles' | 'supplies' | 'medical' | 'power' | 'personnel',
    quantity: 10,
    available: 10,
    status: 'available' as 'available' | 'deployed' | 'maintenance',
    location: 'Central Relief Command',
  });

  const [selectedReportImage, setSelectedReportImage] = useState<string | null>(null);

  const selectedLocation = useAppStore((s) => s.selectedLocation);

  const isEmergencyMode = searchParams.get('emergency') === 'true' || Boolean(searchParams.get('reqId'));
  const emLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
  const emLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
  const emAsset = searchParams.get('asset') || 'Emergency Asset';
  const emAddress = searchParams.get('address') || 'Citizen GPS Location';

  useEffect(() => {
    if (selectedLocation) {
      fetchPredictions();
      fetchReports();
      fetchStats();
    }
  }, [selectedLocation]);

  if (!user || (user.role !== 'authority' && user.role !== 'admin' && !isEmergencyMode)) {
    return <Navigate to="/app/citizen" replace />;
  }

  const unverifiedReportsCount = reports.filter((r) => !r.verified).length;

  const resourceChartData = predictions.map((p) => {
    const boats = p.riskScore >= 80 ? 12 : p.riskScore >= 60 ? 8 : 2;
    const ambulances = p.riskScore >= 80 ? 8 : p.riskScore >= 60 ? 5 : 1;
    const trucks = p.riskScore >= 80 ? 6 : p.riskScore >= 60 ? 4 : 2;
    const medical = p.riskScore >= 80 ? 4 : p.riskScore >= 60 ? 2 : 1;
    return {
      name: p.zoneName ? p.zoneName.split(' ')[0] : 'Zone',
      ambulances,
      boats,
      trucks,
      medical,
    };
  });

  const primaryPrediction = predictions[0];
  const impactRadarData = primaryPrediction
    ? [
        { subject: 'Population', value: Math.min(100, Math.round(primaryPrediction.affectedPopulation / 500)) },
        { subject: 'Buildings', value: Math.min(100, Math.round(primaryPrediction.affectedPopulation / 12 / 20)) },
        { subject: 'Schools', value: Math.min(100, Math.round(primaryPrediction.affectedPopulation / 12 / 250 * 20)) },
        { subject: 'Hospitals', value: Math.min(100, Math.round(primaryPrediction.affectedPopulation / 12 / 1200 * 50)) },
        { subject: 'Agriculture', value: Math.min(100, Math.round(primaryPrediction.predictedDepth * 30)) },
        { subject: 'Economic', value: Math.min(100, Math.round(primaryPrediction.affectedPopulation / 12 * 1.25 / 15)) },
      ]
    : [];

  const reportTypeCounts = reports.reduce(
    (acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const reportPieData = Object.entries(reportTypeCounts).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }));

  const impactAssessments = predictions.map((p) => {
    const popAffected = p.affectedPopulation;
    const buildings = Math.round(popAffected / 12);
    const schools = Math.max(0, Math.floor(buildings / 250));
    const hospitals = Math.max(0, Math.floor(buildings / 1200));
    const agri = Math.round(p.predictedDepth * 45);
    const loss = Math.round(buildings * 1.25);
    return {
      zoneId: p.zoneId,
      zoneName: p.zoneName,
      populationAffected: popAffected,
      buildingsAtRisk: buildings,
      schoolsAffected: schools,
      hospitalsAffected: hospitals,
      agriculturalAreaHa: agri,
      impactScore: p.riskScore,
      economicLossEstimate: loss,
    };
  });

  const handleGeneratePredictions = async () => {
    try {
      await triggerPredictions();
      toast.success('ML Prediction Engine re-calculated flood risk zones!');
    } catch (err) {
      toast.error('Failed to run predictions.');
    }
  };

  const handleVerifyReportAction = async (reportId: string) => {
    try {
      await verifyReport(reportId);
      toast.success('Citizen report verified successfully!');
    } catch (err) {
      toast.error('Failed to verify report.');
    }
  };

  const handleDeployRescueAction = (report: any) => {
    toast.success(`Rescue Team dispatched to ${report.userName}'s location (${report.address || 'Report Coords'})!`, {
      duration: 5000,
      icon: '🚤',
    });
  };

  const tabs = [
    { id: 'overview', label: 'Command Overview', icon: Shield },
    { id: 'impact', label: 'Impact Analysis', icon: BarChart3 },
    { id: 'resources', label: 'Resource Deployment', icon: Truck },
    { id: 'reports', label: 'Citizen Incident Action Center', icon: FileText, badge: unverifiedReportsCount },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card-static p-6 border border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={26} className="text-cyan-400" />
            {activeTab === 'impact' ? 'Zone Impact & Structural Loss Assessment' :
             activeTab === 'resources' ? 'Emergency Fleet & Resource Deployment Center' :
             activeTab === 'reports' ? 'Citizen Incident Reports & Action Center' :
             t('command_center')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {activeTab === 'impact' ? 'Multi-dimensional structural damage, population impact & estimated financial loss analysis' :
             activeTab === 'resources' ? 'Rescue boats, ambulances, relief trucks, and medical team allocation control' :
             activeTab === 'reports' ? 'Citizen-reported disaster incidents from MongoDB Atlas with authority verification & dispatch' :
             'Real-time Disaster Operations Command Center Panel'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGeneratePredictions}
            className="btn-primary text-xs py-2 px-3 gap-2"
            disabled={isLoading}
          >
            <Target size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? t('verifying') : t('run_predictions')}</span>
          </button>
          <button
            onClick={() => navigate('/app/alerts?create=true')}
            className="btn-danger text-xs py-2 px-3 gap-2"
          >
            <AlertTriangle size={14} />
            <span>{t('issue_alert')}</span>
          </button>
        </div>
      </div>

      {/* ─── LIVE CITIZEN EMERGENCY ASSET REQUEST ALERT BANNER ─── */}
      {isEmergencyMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-red-950/80 via-rose-900/60 to-slate-900 border-2 border-red-500/50 shadow-2xl shadow-red-950/50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 px-4 py-1 bg-red-600 text-white font-mono text-[10px] font-bold rounded-bl-xl tracking-wider uppercase flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            LIVE CITIZEN GPS LOCATION TRANSMITTED
          </div>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0 text-2xl shadow-lg animate-bounce">
                🚨
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-white">CITIZEN ASSET EMERGENCY ASSISTANCE REQUEST</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/30 text-red-300 border border-red-500/40">
                    PRIORITY LEVEL 5 (CRITICAL)
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-1">
                  Requested Asset: <span className="font-bold text-cyan-300 underline">{emAsset}</span>
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-200 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 font-mono">
                    <MapPin size={14} className="text-red-400 shrink-0" />
                    <span>Location: {emAddress}</span>
                  </div>
                  {emLat && emLng && (
                    <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-mono font-bold">
                      <span>GPS: {emLat.toFixed(4)}, {emLng.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={async () => {
                  const reqId = searchParams.get('reqId') || 'active';
                  const dispatchMsg = `Authority Dispatched 1 Unit of '${emAsset}' to your location (${emAddress})! Responders En Route (ETA: ~8 mins).`;
                  await respondToEmergencyRequest(reqId, dispatchMsg);
                  toast.success(`Asset '${emAsset}' dispatched to citizen location (${emLat?.toFixed(3)}, ${emLng?.toFixed(3)})! Rescue Team & NDRF Unit En Route!`, { duration: 6000, icon: '🚤' });
                }}
                className="btn-primary text-xs py-2.5 px-4 gap-2 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none shadow-lg shadow-emerald-600/30"
              >
                <Send size={14} /> Dispatch {emAsset} Now
              </button>

              {emLat && emLng && (
                <button
                  onClick={() => navigate(`/app/map?lat=${emLat}&lng=${emLng}&emergency=true&asset=${encodeURIComponent(emAsset)}`)}
                  className="btn-secondary text-xs py-2.5 px-3 gap-1.5 font-bold border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10"
                >
                  <Navigation size={14} /> View Citizen on Map
                </button>
              )}

              <button
                onClick={async () => {
                  const reqId = searchParams.get('reqId') || 'active';
                  const ackMsg = `Emergency Authority acknowledged your request for '${emAsset}' and assigned NDRF Responder Team!`;
                  await respondToEmergencyRequest(reqId, ackMsg);
                  toast.success(`Citizen notified: Emergency Authority acknowledged request and assigned responder team!`);
                }}
                className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10 flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} className="text-emerald-400" /> Acknowledge
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {tabs.map((tItem) => {
          const Icon = tItem.icon;
          const isActive = activeTab === tItem.id;
          return (
            <button
              key={tItem.id}
              onClick={() => setSearchParams({ tab: tItem.id })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                isActive
                  ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
              <span>{tItem.label}</span>
              {Boolean(tItem.badge) && tItem.badge! > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {tItem.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: t('risk_score'), value: `${stats.avgRiskScore}%`, color: '#f59e0b', icon: Activity },
          { label: t('zones_at_risk'), value: stats.zonesAtRisk.toString(), color: '#ef4444', icon: AlertTriangle },
          { label: t('affected_population'), value: formatNumber(stats.populationAffected), color: '#3b82f6', icon: Users },
          { label: t('resources'), value: stats.resourcesDeployed.toString(), color: '#10b981', icon: Truck },
          { label: t('impact_assessment'), value: `₹${(stats.populationAffected / 12 * 1.25 / 100).toFixed(1)} Cr`, color: '#8b5cf6', icon: DollarSign },
          { label: t('citizen_reports'), value: reports.length.toString(), color: '#06b6d4', icon: FileText, badge: unverifiedReportsCount > 0 ? `${unverifiedReportsCount} Pending` : null },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={16} style={{ color: stat.color }} />
              {stat.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {stat.badge}
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── 1. OVERVIEW TAB ONLY ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Impact Assessment Radar */}
            <div className="glass-card-static p-6 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-white">{t('impact_assessment')}</h3>
                <button onClick={() => setSearchParams({ tab: 'impact' })} className="text-[11px] text-cyan-400 hover:underline">
                  View Full Impact &rarr;
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">Multi-dimensional structural damage & vulnerability</p>
              <ResponsiveContainer width="100%" height={230}>
                <RadarChart data={impactRadarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar
                    name="Impact"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Resource Allocation Chart */}
            <div className="glass-card-static p-6 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-white">{t('resources')}</h3>
                <button onClick={() => setSearchParams({ tab: 'resources' })} className="text-[11px] text-cyan-400 hover:underline">
                  View Resource Fleet &rarr;
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">Deployed emergency resources per zone</p>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={resourceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.05)" />
                  <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.95)',
                      border: '1px solid rgba(148,163,184,0.1)',
                      borderRadius: '12px',
                    }}
                  />
                  <Bar dataKey="ambulances" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="boats" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="trucks" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="medical" fill="#10b981" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Report Types Pie */}
            <div className="glass-card-static p-6 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-white">{t('citizen_reports')}</h3>
                <button onClick={() => setSearchParams({ tab: 'reports' })} className="text-[11px] text-cyan-400 hover:underline">
                  Action Center &rarr;
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">Citizen reports categorized by type</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={reportPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {reportPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,23,42,0.95)',
                      border: '1px solid rgba(148,163,184,0.1)',
                      borderRadius: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1 text-[10px]">
                {reportPieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                    <span className="text-slate-400 capitalize">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. DEDICATED IMPACT ANALYSIS TAB ONLY ─── */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Affected Population', value: formatNumber(stats.populationAffected), color: '#3b82f6', icon: Users },
              { label: 'Total Buildings At Risk', value: formatNumber(Math.round(stats.populationAffected / 12)), color: '#ef4444', icon: Building },
              { label: 'Schools & Hospitals At Risk', value: Math.round(stats.populationAffected / 12 / 250) + Math.round(stats.populationAffected / 12 / 1200), color: '#f59e0b', icon: Heart },
              { label: 'Est. Economic Loss', value: `₹${(stats.populationAffected / 12 * 1.25 / 100).toFixed(1)} Cr`, color: '#8b5cf6', icon: DollarSign },
            ].map((card, idx) => (
              <div key={idx} className="glass-card-static p-4 border border-white/10">
                <card.icon size={20} style={{ color: card.color }} className="mb-2" />
                <p className="text-2xl font-bold text-white">{card.value}</p>
                <p className="text-xs text-slate-400 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="glass-card-static p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Zone Structural Vulnerability & Financial Impact Table</h3>
                <p className="text-xs text-slate-500 mt-0.5">Calculated based on flood depth, population density, and infrastructure assets</p>
              </div>
              <button
                onClick={() => toast.success('Exporting Zone Impact Analysis as CSV...')}
                className="btn-secondary text-xs py-1.5 px-3 gap-1.5"
              >
                <span>Export CSV Report</span>
                <ArrowUpRight size={13} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-xs">
                    <th className="py-3 px-3">Zone Name</th>
                    <th className="py-3 px-3">Risk Level</th>
                    <th className="py-3 px-3">Affected Pop.</th>
                    <th className="py-3 px-3">Buildings</th>
                    <th className="py-3 px-3">Schools</th>
                    <th className="py-3 px-3">Hospitals</th>
                    <th className="py-3 px-3">Agri (Ha)</th>
                    <th className="py-3 px-3">Est. Loss</th>
                    <th className="py-3 px-3">Vulnerability Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {impactAssessments.map((impact) => {
                    const pred = predictions.find((p) => p.zoneId === impact.zoneId);
                    return (
                      <tr key={impact.zoneId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3 font-medium text-white">{impact.zoneName}</td>
                        <td className="py-3 px-3">
                          <span className={`badge ${getRiskBadgeClass(pred?.riskLevel || 'medium')}`}>
                            {pred?.riskScore || 0}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{formatNumber(impact.populationAffected)}</td>
                        <td className="py-3 px-3 text-slate-300">{formatNumber(impact.buildingsAtRisk)}</td>
                        <td className="py-3 px-3 text-slate-300">{impact.schoolsAffected}</td>
                        <td className="py-3 px-3 text-slate-300">{impact.hospitalsAffected}</td>
                        <td className="py-3 px-3 text-slate-300">{impact.agriculturalAreaHa}</td>
                        <td className="py-3 px-3 text-amber-400 font-medium">{formatCurrency(impact.economicLossEstimate)}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 rounded-full bg-white/5 overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${impact.impactScore}%`,
                                  backgroundColor: impact.impactScore >= 80 ? '#ef4444' : impact.impactScore >= 60 ? '#f59e0b' : '#06b6d4',
                                }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 font-mono">{impact.impactScore}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. DEDICATED RESOURCE DEPLOYMENT & AVAILABILITY CONTROL TAB ─── */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Header & Add Resource Bar */}
          <div className="glass-card-static p-6 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck size={20} className="text-emerald-400" />
                Emergency Fleet & Resource Availability Control
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Authorities can edit available stock, dispatch equipment, and manage deployment status across all command centers.
              </p>
            </div>
            <button
              onClick={() => setShowAddResourceModal(true)}
              className="btn-primary text-xs py-2.5 px-4 gap-2 shrink-0 font-bold"
            >
              + Add New Resource Asset
            </button>
          </div>

          {/* Interactive Resource Inventory Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res) => {
              const pctAvailable = Math.round((res.available / res.quantity) * 100);
              return (
                <div
                  key={res.id}
                  className="p-5 rounded-xl border border-white/10 bg-slate-900/80 hover:border-emerald-500/30 transition-all space-y-4 shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        {res.category}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">{res.name}</h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-slate-500" /> {res.location}
                      </p>
                    </div>
                    {/* Status Dropdown selector for Authorities */}
                    <select
                      value={res.status}
                      onChange={(e) => {
                        updateResource(res.id, { status: e.target.value as any });
                        toast.success(`Resource status updated to ${e.target.value.toUpperCase()}`);
                      }}
                      className={`text-xs font-bold px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${
                        res.status === 'available' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        res.status === 'deployed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      <option value="available" className="bg-slate-900 text-emerald-400">AVAILABLE</option>
                      <option value="deployed" className="bg-slate-900 text-blue-400">DEPLOYED</option>
                      <option value="maintenance" className="bg-slate-900 text-amber-400">MAINTENANCE</option>
                    </select>
                  </div>

                  {/* Stock Availability Bar & Controls */}
                  <div className="space-y-1.5 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Available Stock:</span>
                      <span className="font-bold text-white">
                        {res.available} / {res.quantity} ({pctAvailable}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pctAvailable}%`,
                          backgroundColor: pctAvailable > 50 ? '#10b981' : pctAvailable > 20 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>

                    {/* Authority Quantity Edit Controls */}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-400 font-semibold">Stock Controls:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (res.available > 0) {
                              updateResource(res.id, { available: res.available - 1 });
                              toast.success(`Decreased available stock for ${res.name}`);
                            }
                          }}
                          className="w-7 h-7 rounded bg-white/5 hover:bg-white/10 text-white font-bold text-sm flex items-center justify-center border border-white/10"
                          title="Decrease available count by 1"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono text-xs font-bold text-cyan-400">{res.available}</span>
                        <button
                          onClick={() => {
                            if (res.available < res.quantity) {
                              updateResource(res.id, { available: res.available + 1 });
                              toast.success(`Increased available stock for ${res.name}`);
                            }
                          }}
                          className="w-7 h-7 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center border border-emerald-500/30"
                          title="Increase available count by 1"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Quick Action Button */}
                  <button
                    onClick={() => {
                      if (res.available > 0) {
                        updateResource(res.id, { available: res.available - 1, status: 'deployed' });
                        toast.success(`Dispatched 1 unit of ${res.name} to flood rescue zone!`);
                      } else {
                        toast.error(`No available stock for ${res.name}`);
                      }
                    }}
                    disabled={res.available === 0}
                    className="w-full btn-primary text-xs py-2 justify-center gap-2 font-bold disabled:opacity-40"
                  >
                    <Send size={13} />
                    <span>Dispatch Asset to Rescue Zone</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add Resource Modal */}
          <AnimatePresence>
            {showAddResourceModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddResourceModal(false)}
                  className="absolute inset-0 bg-black/70 backdrop-blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-lg glass-card-static p-6 shadow-2xl border border-white/10 z-10"
                >
                  <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Truck size={18} className="text-emerald-400" />
                      Add New Emergency Asset to Fleet
                    </h3>
                    <button
                      onClick={() => setShowAddResourceModal(false)}
                      className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newResource.name) {
                        toast.error('Please enter resource name');
                        return;
                      }
                      addResource({
                        id: `res-${Date.now()}`,
                        name: newResource.name,
                        category: newResource.category,
                        quantity: Number(newResource.quantity),
                        available: Number(newResource.available),
                        status: newResource.status,
                        location: newResource.location,
                      });
                      toast.success(`Resource ${newResource.name} added to Authority Fleet!`);
                      setShowAddResourceModal(false);
                      setNewResource({
                        name: '',
                        category: 'vehicles',
                        quantity: 10,
                        available: 10,
                        status: 'available',
                        location: 'Central Relief Command',
                      });
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Asset Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Inflatable Rubber Rescue Boats (40HP)"
                        value={newResource.name}
                        onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                        className="input-field py-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Category</label>
                        <select
                          value={newResource.category}
                          onChange={(e) => setNewResource({ ...newResource, category: e.target.value as any })}
                          className="input-field py-2 text-white bg-slate-900"
                        >
                          <option value="vehicles">Vehicles & Boats</option>
                          <option value="supplies">Relief Supplies</option>
                          <option value="medical">Medical Equipment</option>
                          <option value="power">Power & Generators</option>
                          <option value="personnel">Personnel & Officers</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Command Depot Location</label>
                        <input
                          type="text"
                          value={newResource.location}
                          onChange={(e) => setNewResource({ ...newResource, location: e.target.value })}
                          className="input-field py-2"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Total Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={newResource.quantity}
                          onChange={(e) => setNewResource({ ...newResource, quantity: Number(e.target.value) })}
                          className="input-field py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Available Quantity</label>
                        <input
                          type="number"
                          min="0"
                          max={newResource.quantity}
                          value={newResource.available}
                          onChange={(e) => setNewResource({ ...newResource, available: Number(e.target.value) })}
                          className="input-field py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Initial Status</label>
                        <select
                          value={newResource.status}
                          onChange={(e) => setNewResource({ ...newResource, status: e.target.value as any })}
                          className="input-field py-2 text-white bg-slate-900"
                        >
                          <option value="available">Available</option>
                          <option value="deployed">Deployed</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => setShowAddResourceModal(false)}
                        className="btn-secondary text-xs py-2 px-4"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary text-xs py-2 px-4 font-bold">
                        Save Asset
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── 4. DEDICATED CITIZEN ACTION CENTER TAB ONLY ─── */}
      {activeTab === 'reports' && (
        <div className="glass-card-static p-6 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={20} className="text-cyan-400" />
                Citizen Incident Reports & Emergency Action Center
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time incident reports filed by citizens from MongoDB Atlas. Authorities can verify, deploy rescue teams, and take action.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchReports()}
                className="btn-secondary text-xs py-2 px-3 gap-2"
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                <span>Refresh Reports</span>
              </button>
            </div>
          </div>

          {/* Reports Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Citizen Reporter</th>
                  <th className="py-3 px-3">Incident Type</th>
                  <th className="py-3 px-3">Description & Ground Notes</th>
                  <th className="py-3 px-3">Location Coords</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Verification</th>
                  <th className="py-3 px-3 text-right">Authority Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.length > 0 ? (
                  reports.map((report) => {
                    const isVerified = report.verified;
                    return (
                      <tr key={report.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Reporter */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{report.userName || 'Anonymous'}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {formatRelativeTime(report.createdAt)}
                          </div>
                        </td>

                        {/* Incident Type */}
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 capitalize">
                            {report.type?.replace('_', ' ') || 'Incident'}
                          </span>
                        </td>

                        {/* Description & Photo */}
                        <td className="py-3 px-3 max-w-xs">
                          <p className="text-slate-300 line-clamp-2">{report.description}</p>
                          {report.imageUrl && (
                            <button
                              onClick={() => setSelectedReportImage(report.imageUrl || null)}
                              className="mt-1 flex items-center gap-1 text-[10px] text-cyan-400 hover:underline"
                            >
                              <Eye size={10} /> View Ground Photo
                            </button>
                          )}
                        </td>

                        {/* Location */}
                        <td className="py-3 px-3 font-mono text-slate-400">
                          <div className="flex items-center gap-1 text-slate-300">
                            <MapPin size={11} className="text-cyan-400 shrink-0" />
                            <span>{report.address || 'Chennai'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {report.location?.lat?.toFixed(3)}, {report.location?.lng?.toFixed(3)}
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            report.severity >= 4 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            report.severity >= 3 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            Level {report.severity}
                          </span>
                        </td>

                        {/* Verification */}
                        <td className="py-3 px-3">
                          {isVerified ? (
                            <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                              <CheckCircle2 size={12} /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-amber-400 font-bold text-[10px]">
                              <AlertCircle size={12} /> Unverified
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isVerified && (
                              <button
                                onClick={() => handleVerifyReportAction(report.id)}
                                className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1"
                                title="Verify Citizen Report"
                              >
                                <Check size={11} /> Verify
                              </button>
                            )}

                            <button
                              onClick={() => handleDeployRescueAction(report)}
                              className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 font-bold text-[10px] flex items-center gap-1"
                              title="Deploy Rescue Team"
                            >
                              <Send size={11} /> Deploy Rescue
                            </button>

                            <button
                              onClick={() => navigate('/app/map')}
                              className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[10px] flex items-center gap-1"
                              title="View on Map"
                            >
                              <Navigation size={11} /> Map
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No citizen reports filed yet. Reports filed by citizens on the Submit Report page will automatically appear here for authority action.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedReportImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReportImage(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-slate-900 border border-white/10 rounded-2xl p-3 max-w-lg w-full z-10 overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="text-xs font-bold text-white">Ground Incident Photo Preview</span>
                <button
                  onClick={() => setSelectedReportImage(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕ Close
                </button>
              </div>
              <img
                src={selectedReportImage}
                alt="Incident Photo"
                className="w-full h-auto rounded-xl object-cover max-h-[400px]"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
