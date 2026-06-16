import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Users, Building, TrendingUp, BarChart3, 
  Truck, Activity, Shield, ChevronRight, MapPin, 
  Droplets, ArrowUpRight, Target, DollarSign,
  School, Heart, Wheat, Clock,
} from 'lucide-react';
import {
  mockDashboardStats, mockPredictions, mockImpactAssessments,
  mockResourceAllocations, mockReports,
} from '../data/mockData';
import {
  getRiskColor, getRiskBadgeClass, formatNumber, formatCurrency,
  formatRelativeTime,
} from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const RISK_COLORS = ['#ef4444', '#ef4444', '#f59e0b', '#06b6d4', '#10b981', '#10b981'];

const resourceChartData = mockResourceAllocations.map((r) => ({
  name: r.zoneName.split(' ')[0],
  ambulances: r.ambulances,
  boats: r.rescueBoats,
  trucks: r.reliefTrucks,
  medical: r.medicalTeams,
}));

const impactRadarData = mockImpactAssessments[0]
  ? [
      { subject: 'Population', value: mockImpactAssessments[0].humanRiskIndex },
      { subject: 'Buildings', value: Math.min(100, (mockImpactAssessments[0].buildingsAtRisk / 50) | 0) },
      { subject: 'Schools', value: Math.min(100, mockImpactAssessments[0].schoolsAffected * 8) },
      { subject: 'Hospitals', value: Math.min(100, mockImpactAssessments[0].hospitalsAffected * 30) },
      { subject: 'Agriculture', value: Math.min(100, (mockImpactAssessments[0].agriculturalAreaHa / 1.5) | 0) },
      { subject: 'Economic', value: Math.min(100, (mockImpactAssessments[0].economicLossEstimate / 60) | 0) },
    ]
  : [];

const reportTypeCounts = mockReports.reduce(
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
const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

export default function AuthorityDashboard() {
  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield size={24} className="text-cyan-400" />
            Authority Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Comprehensive disaster intelligence — Decision support for emergency management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-primary text-xs py-2">
            <Target size={14} /> Generate Predictions
          </button>
          <button className="btn-danger text-xs py-2">
            <AlertTriangle size={14} /> Issue Alert
          </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Risk Score (Avg)', value: '67', color: '#f59e0b', icon: Activity },
          { label: 'Zones at Risk', value: '12', color: '#ef4444', icon: AlertTriangle },
          { label: 'Pop. Affected', value: '284.5K', color: '#3b82f6', icon: Users },
          { label: 'Resources Deployed', value: '89', color: '#10b981', icon: Truck },
          { label: 'Est. Loss', value: '₹135 Cr', color: '#8b5cf6', icon: DollarSign },
          { label: 'Reports Today', value: '47', color: '#06b6d4', icon: MapPin },
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
          <h3 className="text-base font-semibold text-white mb-1">Impact Assessment</h3>
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
          <h3 className="text-base font-semibold text-white mb-1">Resource Allocation</h3>
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
          <h3 className="text-base font-semibold text-white mb-1">Report Distribution</h3>
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
            <h3 className="text-base font-semibold text-white">Zone Impact Analysis</h3>
            <p className="text-xs text-slate-500 mt-0.5">Comprehensive impact assessment across affected zones</p>
          </div>
          <button className="btn-secondary text-xs py-1.5">
            Export Report <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Zone', 'Risk', 'Population', 'Buildings', 'Schools', 'Hospitals', 'Agri (Ha)', 'Est. Loss', 'Impact Score'].map((h) => (
                  <th key={h} className="text-left py-3 px-3 text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockImpactAssessments.map((impact, i) => {
                const pred = mockPredictions.find((p) => p.zoneId === impact.zoneId);
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
            <h3 className="text-base font-semibold text-white">Resource Deployment Plan</h3>
            <p className="text-xs text-slate-500 mt-0.5">AI-recommended resource allocation per zone</p>
          </div>
          <button className="btn-primary text-xs py-1.5">
            <Target size={12} /> Optimize Allocation
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockResourceAllocations.map((alloc, i) => (
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
                <span className="text-xs text-slate-500">Total Personnel</span>
                <span className="text-sm font-bold text-cyan-400">{alloc.totalPersonnel}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
