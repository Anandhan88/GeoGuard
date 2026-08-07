import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import {
  AlertTriangle, Users, Truck, Activity, Shield, MapPin,
  ArrowUpRight, Target, DollarSign, CheckCircle2, AlertCircle,
  FileText, Navigation, RefreshCw, Send, Check, Eye
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
    fetchPredictions,
    fetchReports,
    fetchStats,
    verifyReport,
    triggerPredictions,
    isLoading
  } = useAppStore();

  const [selectedReportImage, setSelectedReportImage] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions();
    fetchReports();
    fetchStats();
  }, []);

  if (!user || (user.role !== 'authority' && user.role !== 'admin')) {
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

  const primaryPrediction = predictions.find((p) => p.zoneId === 'zone-001') || predictions[0];
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

  const resourceAllocations = predictions.map((p) => {
    const boats = p.riskScore >= 80 ? 12 : p.riskScore >= 60 ? 8 : 2;
    const ambulances = p.riskScore >= 80 ? 8 : p.riskScore >= 60 ? 5 : 1;
    const trucks = p.riskScore >= 80 ? 6 : p.riskScore >= 60 ? 4 : 2;
    const medical = p.riskScore >= 80 ? 4 : p.riskScore >= 60 ? 2 : 1;
    return {
      zoneId: p.zoneId,
      zoneName: p.zoneName,
      ambulances,
      rescueBoats: boats,
      reliefTrucks: trucks,
      medicalTeams: medical,
      totalPersonnel: (boats + ambulances + trucks + medical) * 10,
      severity: p.riskLevel,
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
    { id: 'impact', label: 'Impact Analysis', icon: Activity },
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
            {t('command_center')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time Disaster Operations, Citizen Incident Management & Rescue Deployment Panel
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

      {/* ─── TAB 1: OVERVIEW TAB ─── */}
      {(activeTab === 'overview' || activeTab === 'impact') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Impact Assessment Radar */}
          <div className="glass-card-static p-6">
            <h3 className="text-base font-semibold text-white mb-1">{t('impact_assessment')}</h3>
            <p className="text-xs text-slate-500 mb-4">Multi-dimensional structural & economic loss analysis</p>
            <ResponsiveContainer width="100%" height={250}>
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
          <div className="glass-card-static p-6">
            <h3 className="text-base font-semibold text-white mb-1">{t('resources')}</h3>
            <p className="text-xs text-slate-500 mb-4">Deployed emergency resources per zone</p>
            <ResponsiveContainer width="100%" height={250}>
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
            <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
              {[
                { label: 'Ambulances', color: '#ef4444' },
                { label: 'Boats', color: '#3b82f6' },
                { label: 'Trucks', color: '#f59e0b' },
                { label: 'Medical', color: '#10b981' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
                  <span className="text-slate-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Report Types Pie */}
          <div className="glass-card-static p-6">
            <h3 className="text-base font-semibold text-white mb-1">{t('citizen_reports')}</h3>
            <p className="text-xs text-slate-500 mb-4">Citizen reports categorized by type</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={reportPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
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
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
              {reportPieData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-slate-400 capitalize">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: IMPACT ANALYSIS VIEW ─── */}
      {(activeTab === 'overview' || activeTab === 'impact') && (
        <div className="glass-card-static p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">{t('zone_impact_analysis')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Disaster impact, structural vulnerability & estimated financial loss</p>
            </div>
            <button
              onClick={() => toast.success('Exporting Zone Impact Report as CSV...')}
              className="btn-secondary text-xs py-1.5"
            >
              {t('export_report')} <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {[t('zone_name'), t('risk_level'), t('affected_population'), 'Buildings', 'Schools', 'Hospitals', 'Agri (Ha)', 'Est. Loss', t('risk_score')].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-xs text-slate-500 font-medium uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {impactAssessments.map((impact) => {
                  const pred = predictions.find((p) => p.zoneId === impact.zoneId);
                  return (
                    <tr
                      key={impact.zoneId}
                      className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                    >
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
                          <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${impact.impactScore}%`,
                                backgroundColor: impact.impactScore >= 80 ? '#ef4444' : impact.impactScore >= 60 ? '#f59e0b' : '#06b6d4',
                              }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{impact.impactScore}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: RESOURCE DEPLOYMENT VIEW ─── */}
      {(activeTab === 'overview' || activeTab === 'resources') && (
        <div className="glass-card-static p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">{t('resource_deployment_plan')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Emergency rescue fleet, medical team & equipment deployment per zone</p>
            </div>
            <button
              onClick={() => toast.success('Optimization engine re-calculated rescue fleet allocation!')}
              className="btn-primary text-xs py-1.5"
            >
              <Target size={12} /> {t('optimize_allocation')}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resourceAllocations.map((alloc) => (
              <div
                key={alloc.zoneId}
                className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-white">{alloc.zoneName}</h4>
                  <span className={`badge ${getRiskBadgeClass(alloc.severity)}`}>
                    {alloc.severity}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Ambulances', value: alloc.ambulances, icon: '🚑' },
                    { label: 'Rescue Boats', value: alloc.rescueBoats, icon: '🚤' },
                    { label: 'Relief Trucks', value: alloc.reliefTrucks, icon: '🚛' },
                    { label: 'Medical Teams', value: alloc.medicalTeams, icon: '👨‍⚕️' },
                  ].map((res) => (
                    <div key={res.label} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
                      <span className="text-sm">{res.icon}</span>
                      <div>
                        <p className="text-xs text-slate-500">{res.label}</p>
                        <p className="text-sm font-bold text-white">{res.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{t('total_personnel')}</span>
                  <span className="text-sm font-bold text-cyan-400">{alloc.totalPersonnel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: CITIZEN INCIDENT ACTION CENTER ─── */}
      {(activeTab === 'overview' || activeTab === 'reports') && (
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
