import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  AlertTriangle, Users, Truck, Activity, Shield, MapPin, 
  ArrowUpRight, Target, DollarSign,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { useTranslation } from '../utils/translations';
import {
  getRiskBadgeClass, formatNumber, formatCurrency,
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
  const user = useAppStore((s) => s.user);
  const {
    predictions,
    reports,
    stats,
    fetchPredictions,
    fetchReports,
    fetchStats,
    triggerPredictions,
    isLoading
  } = useAppStore();

  useEffect(() => {
    fetchPredictions();
    fetchReports();
    fetchStats();
  }, []);

  if (user && user.role !== 'authority' && user.role !== 'admin') {
    return <Navigate to="/app/citizen" replace />;
  }

  // Dynamic calculations based on state
  const resourceChartData = predictions.map((p) => {
    const boats = p.riskScore >= 80 ? 12 : p.riskScore >= 60 ? 8 : 2;
    const ambulances = p.riskScore >= 80 ? 8 : p.riskScore >= 60 ? 5 : 1;
    const trucks = p.riskScore >= 80 ? 6 : p.riskScore >= 60 ? 4 : 2;
    const medical = p.riskScore >= 80 ? 4 : p.riskScore >= 60 ? 2 : 1;
    return {
      name: p.zoneName.split(' ')[0],
      ambulances,
      boats,
      trucks,
      medical,
    };
  });

  const primaryPrediction = predictions.find(p => p.zoneId === 'zone-001') || predictions[0];
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={24} className="text-cyan-400" />
            {t('command_center')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('command_center_sub')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleGeneratePredictions} 
            className="btn-primary text-xs py-2"
            disabled={isLoading}
          >
            <Target size={14} /> {isLoading ? t('verifying') : t('run_predictions')}
          </button>
          <button 
            onClick={() => navigate('/app/alerts?create=true')}
            className="btn-danger text-xs py-2"
          >
            <AlertTriangle size={14} /> {t('issue_alert')}
          </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: t('risk_score'), value: `${stats.avgRiskScore}%`, color: '#f59e0b', icon: Activity },
          { label: t('zones_at_risk'), value: stats.zonesAtRisk.toString(), color: '#ef4444', icon: AlertTriangle },
          { label: t('affected_population'), value: formatNumber(stats.populationAffected), color: '#3b82f6', icon: Users },
          { label: t('resources'), value: stats.resourcesDeployed.toString(), color: '#10b981', icon: Truck },
          { label: t('impact_assessment'), value: `₹${(stats.populationAffected / 12 * 1.25 / 100).toFixed(1)} Cr`, color: '#8b5cf6', icon: DollarSign },
          { label: t('citizen_reports'), value: stats.citizenReports.toString(), color: '#06b6d4', icon: MapPin },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
          >
            <stat.icon size={16} style={{ color: stat.color }} className="mb-2" />
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Impact Assessment Radar */}
        <div className="glass-card-static p-6">
          <h3 className="text-base font-semibold text-white mb-1">{t('impact_assessment')}</h3>
          <p className="text-xs text-slate-500 mb-4">Adyar River Basin — Multi-dimensional analysis</p>
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
          <p className="text-xs text-slate-500 mb-4">Deployed resources per zone</p>
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
          <p className="text-xs text-slate-500 mb-4">Citizen reports by category</p>
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

      {/* Impact Table */}
      <div className="glass-card-static p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">{t('zone_impact_analysis')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('impact_assessment')}</p>
          </div>
          <button className="btn-secondary text-xs py-1.5">
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
              {impactAssessments.map((impact, i) => {
                const pred = predictions.find((p) => p.zoneId === impact.zoneId);
                return (
                  <motion.tr
                    key={impact.zoneId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
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
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resource Allocation Table */}
      <div className="glass-card-static p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">{t('resource_deployment_plan')}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('command_center_sub')}</p>
          </div>
          <button className="btn-primary text-xs py-1.5">
            <Target size={12} /> {t('optimize_allocation')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resourceAllocations.map((alloc, i) => (
            <motion.div
              key={alloc.zoneId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
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
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
