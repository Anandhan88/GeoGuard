import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Droplets, Users, Clock, Zap, TrendingUp,
  TrendingDown, Minus, AlertTriangle,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { getRiskColor, getRiskBadgeClass, formatNumber, formatDate } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

export default function PredictionDetail() {
  const { id } = useParams();
  const predictions = useAppStore((s) => s.predictions);
  const prediction = predictions.find((p) => p.id === id) || predictions[0];

  const factorChartData = prediction.factors.map((f) => ({
    name: f.name.length > 15 ? f.name.slice(0, 15) + '…' : f.name,
    contribution: f.contribution,
    fullName: f.name,
  }));

  const trendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp size={12} className="text-red-400" />;
      case 'decreasing': return <TrendingDown size={12} className="text-emerald-400" />;
      default: return <Minus size={12} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back Nav */}
      <Link to="/app" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{prediction.zoneName}</h1>
            <span className={`badge ${getRiskBadgeClass(prediction.riskLevel)}`}>
              {prediction.riskLevel}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Prediction generated {formatDate(prediction.generatedAt)} • ID: {prediction.id}
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Risk Score', value: `${prediction.riskScore}/100`, icon: AlertTriangle, color: getRiskColor(prediction.riskLevel) },
          { label: 'Flood Depth', value: `${prediction.predictedDepth}m`, icon: Droplets, color: '#3b82f6' },
          { label: 'Duration', value: `${prediction.predictedDuration}h`, icon: Clock, color: '#f59e0b' },
          { label: 'Population', value: formatNumber(prediction.affectedPopulation), icon: Users, color: '#8b5cf6' },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card"
          >
            <div className="absolute inset-0 rounded-[16px]" style={{ background: `linear-gradient(135deg, ${metric.color}10, transparent)` }} />
            <div className="relative">
              <metric.icon size={20} style={{ color: metric.color }} className="mb-2" />
              <p className="text-2xl font-bold text-white">{metric.value}</p>
              <p className="text-xs text-slate-500 mt-1">{metric.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* XAI Section */}
      <div className="glass-card-static p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <Zap size={18} className="text-cyan-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Explainable AI Analysis</h2>
            <p className="text-xs text-slate-500">Why did this prediction occur? Factor contribution breakdown.</p>
          </div>
        </div>

        {/* Summary Box */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 mb-6">
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="font-semibold text-white">Flood Risk = {prediction.riskScore}%</span> — This prediction is driven primarily by{' '}
            <span className="text-red-400 font-medium">{prediction.factors[0]?.name.toLowerCase()}</span> (contributing {prediction.factors[0]?.contribution}%) and{' '}
            <span className="text-amber-400 font-medium">{prediction.factors[1]?.name.toLowerCase()}</span> (contributing {prediction.factors[1]?.contribution}%).{' '}
            The model confidence is <span className="text-cyan-400 font-medium">{Math.round(prediction.confidence * 100)}%</span> based on {847} similar historical events.
          </p>
        </div>

        {/* Factor Contribution Chart */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Factor Contribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={factorChartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.05)" />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 35]} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)',
                  border: '1px solid rgba(148,163,184,0.1)',
                  borderRadius: '12px',
                }}
                formatter={(value: any) => [`${value}%`, 'Contribution']}
              />
              <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                {factorChartData.map((_, index) => (
                  <Cell key={index} fill={index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : index === 2 ? '#06b6d4' : '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Factors */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Detailed Factor Analysis</h3>
          <div className="space-y-3">
            {prediction.factors.map((factor, i) => (
              <motion.div
                key={factor.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{factor.name}</span>
                    {trendIcon(factor.trend)}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      factor.trend === 'increasing'
                        ? 'bg-red-500/10 text-red-400'
                        : factor.trend === 'decreasing'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {factor.trend}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-white">
                    {factor.value} {factor.unit}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">{factor.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(factor.value / (factor.threshold * 1.5)) * 100}%`,
                        backgroundColor: factor.value > factor.threshold ? '#ef4444' : '#10b981',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    Threshold: {factor.threshold} {factor.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-500">
                    Contribution: {factor.contribution}%
                  </span>
                  {factor.value > factor.threshold && (
                    <span className="text-[10px] text-red-400 font-medium">⚠ Exceeds threshold</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
