import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Navigation, AlertTriangle, MapPin, Clock, Users, Shield,
  ChevronRight, ArrowRight, Zap, Route, Info, CheckCircle,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { mockEvacuationRoutes } from '../data/mockData';
import { formatNumber } from '../utils/helpers';
import { Link } from 'react-router-dom';

const RISK_GRADIENT: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#06b6d4',
  low: '#10b981',
};

export default function EvacuationPage() {
  const { predictions, shelters, fetchPredictions, fetchShelters } = useAppStore();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions();
    fetchShelters();
  }, []);

  const criticalPredictions = predictions
    .filter((p) => p.riskScore >= 60)
    .sort((a, b) => b.riskScore - a.riskScore);

  const selectedPred = criticalPredictions.find((p) => p.zoneId === selectedZone) || criticalPredictions[0];

  // Get matching evacuation route for selected zone
  const matchingRoute = mockEvacuationRoutes.find(
    (r) => selectedPred && r.name.toLowerCase().includes(selectedPred.zoneName.split(' ')[0].toLowerCase())
  ) || mockEvacuationRoutes[0];

  // Get best shelter (least full)
  const bestShelter = shelters
    .filter((s) => s.currentOccupancy < s.capacity)
    .sort((a, b) => (a.currentOccupancy / a.capacity) - (b.currentOccupancy / b.capacity))[0];

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Navigation size={24} className="text-cyan-400" />
            Evacuation Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            AI-optimized evacuation routes · A* pathfinding · Real-time risk avoidance
          </p>
        </div>
        <Link to="/app/map" className="btn-primary text-xs py-2">
          <MapPin size={14} /> Live Map View
        </Link>
      </div>

      {/* Alert Banner */}
      {criticalPredictions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
        >
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-400">
              ⚠️ {criticalPredictions.length} zones require immediate evacuation attention
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Estimated {formatNumber(criticalPredictions.reduce((a, p) => a + (p.affectedPopulation || 0), 0))} people at risk
            </p>
          </div>
          <span className="text-xs text-red-400 font-semibold flex items-center gap-1 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-red-500" /> ACTIVE
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zone Selector */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
            At-Risk Zones
          </h2>
          {criticalPredictions.map((pred, i) => (
            <motion.div
              key={pred.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setSelectedZone(pred.zoneId)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                (selectedZone === pred.zoneId || (!selectedZone && i === 0))
                  ? 'border-cyan-500/40 bg-cyan-500/5'
                  : 'border-white/5 bg-white/[0.02] hover:border-white/15'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white truncate">{pred.zoneName}</h3>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                  style={{
                    backgroundColor: `${RISK_GRADIENT[pred.riskLevel]}20`,
                    color: RISK_GRADIENT[pred.riskLevel],
                  }}
                >
                  {pred.riskLevel}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Zap size={11} style={{ color: RISK_GRADIENT[pred.riskLevel] }} />
                  Score: {pred.riskScore}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={11} />
                  {formatNumber(pred.affectedPopulation || 0)}
                </span>
              </div>
              {/* Risk bar */}
              <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pred.riskScore}%`,
                    backgroundColor: RISK_GRADIENT[pred.riskLevel],
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Evacuation Route Details */}
        <div className="lg:col-span-2 space-y-5">
          {/* Recommended Route */}
          {matchingRoute && (
            <div className="glass-card-static p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Route size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Recommended Evacuation Route</h2>
                  <p className="text-xs text-slate-500">{matchingRoute.name}</p>
                </div>
                {matchingRoute.isRecommended && (
                  <span className="ml-auto text-xs text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-full">
                    <CheckCircle size={11} /> AI Recommended
                  </span>
                )}
              </div>

              {/* Route visualization */}
              <div className="relative py-4 mb-4">
                <div className="flex items-center">
                  {/* Start */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                      <AlertTriangle size={14} className="text-red-400" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 text-center max-w-[80px]">
                      {selectedPred?.zoneName?.split(' ')[0] || 'Origin'}
                    </p>
                  </div>

                  {/* Route line with waypoints */}
                  <div className="flex-1 mx-2 relative">
                    <div className="h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full" />
                    {matchingRoute.waypoints.slice(0, 3).map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-500 border-2 border-bg-primary"
                        style={{ left: `${(i + 1) * 25}%` }}
                      />
                    ))}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap">
                      <ArrowRight size={10} className="text-slate-500" />
                      <span className="text-[10px] text-slate-500">{matchingRoute.distance} km · ~{matchingRoute.estimatedTime} min</span>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                      <Shield size={14} className="text-emerald-400" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 text-center max-w-[80px]">Safe Zone</p>
                  </div>
                </div>
              </div>

              {/* Route Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { icon: Clock, color: '#06b6d4', label: 'Est. Time', value: `~${matchingRoute.estimatedTime} min` },
                  { icon: MapPin, color: '#3b82f6', label: 'Distance', value: `${matchingRoute.distance} km` },
                  { icon: Shield, color: '#10b981', label: 'Route Risk', value: `${matchingRoute.riskAlongRoute}%` },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl bg-white/[0.03] text-center">
                    <s.icon size={16} style={{ color: s.color }} className="mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">{s.value}</p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Avoided Zones */}
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <p className="text-xs text-amber-400 font-semibold mb-2">
                  ⚠️ Areas Avoided Along This Route:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matchingRoute.avoidedZones?.map((zone) => (
                    <span key={zone} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      🚫 {zone}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Nearest Available Shelter */}
          {bestShelter && (
            <div className="glass-card-static p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Shield size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Best Available Shelter</h2>
                    <p className="text-xs text-slate-500">Lowest current occupancy</p>
                  </div>
                </div>
                <Link to="/app/shelters" className="text-xs text-cyan-400 flex items-center gap-1">
                  All Shelters <ChevronRight size={13} />
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white mb-1">{bestShelter.name}</h3>
                  <p className="text-xs text-slate-500 mb-2">{bestShelter.address}</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {(bestShelter.amenities || []).slice(0, 4).map((a: string) => (
                      <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{a}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-400">
                    {bestShelter.capacity - bestShelter.currentOccupancy}
                  </div>
                  <p className="text-xs text-slate-500">spaces left</p>
                  <div className="mt-2 w-20 h-1.5 rounded-full bg-white/5 overflow-hidden ml-auto">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.round((bestShelter.currentOccupancy / bestShelter.capacity) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {Math.round((bestShelter.currentOccupancy / bestShelter.capacity) * 100)}% occupied
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* General Instructions */}
          <div className="glass-card-static p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info size={18} className="text-blue-400" />
              <h2 className="text-base font-bold text-white">Evacuation Safety Guidelines</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { icon: '🚶', title: 'Move Early', desc: 'Do not wait for water to rise. Leave as soon as an evacuation order is issued.' },
                { icon: '🚫', title: 'Avoid Floodwater', desc: 'Never walk or drive through flooded roads. 15cm of water can knock you down.' },
                { icon: '📱', title: 'Stay Connected', desc: 'Charge your devices and keep emergency contacts saved offline.' },
                { icon: '🧳', title: 'Emergency Kit', desc: 'Take documents, medicine (7-day supply), water, food, flashlight, and cash.' },
                { icon: '👥', title: 'Help Neighbors', desc: 'Check on elderly, disabled, and children nearby before leaving.' },
                { icon: '📻', title: 'Monitor Updates', desc: 'Follow official GeoGuard AI alerts and local emergency broadcasts.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-xl shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
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
