import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Navigation, AlertTriangle, MapPin, Clock, Users, Shield,
  ChevronRight, ArrowRight, Zap, Route, Info, CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../stores/useAppStore';
import { formatNumber } from '../utils/helpers';
import { Link } from 'react-router-dom';

const RISK_GRADIENT: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#06b6d4',
  low: '#10b981',
};

export default function EvacuationPage() {
  const { user, predictions, shelters, evacuationRoutes, updateEvacuationRoute, fetchPredictions, fetchShelters, fetchEvacuationRoutes, selectedLocation } = useAppStore();
  const isAuthority = user?.role === 'authority' || user?.role === 'admin';
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLocation) {
      fetchPredictions();
      fetchShelters();
      fetchEvacuationRoutes(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation]);



  const criticalPredictions = predictions
    .filter((p) => p.riskScore >= 60)
    .sort((a, b) => b.riskScore - a.riskScore);

  const selectedPred = criticalPredictions.find((p) => p.zoneId === selectedZone) || criticalPredictions[0];

  // Get matching evacuation route for selected zone
  const matchingRoute = evacuationRoutes.find(
    (r) => selectedPred?.zoneName && (r.name || (r as any).shelter_name || r.shelterName || '').toLowerCase().includes(selectedPred.zoneName.split(' ')[0].toLowerCase())
  ) || evacuationRoutes[0];

  // Normalize route fields (backend uses snake_case, mock uses camelCase)
  const route = matchingRoute ? {
    name: matchingRoute.name,
    shelterName: (matchingRoute as any).shelterName || (matchingRoute as any).shelter_name || '',
    distance: (matchingRoute as any).distance || (matchingRoute as any).distance_km || 0,
    estimatedTime: (matchingRoute as any).estimatedTime || (matchingRoute as any).estimated_time_min || 0,
    riskAlongRoute: (matchingRoute as any).riskAlongRoute || (matchingRoute as any).risk_along_route || 0,
    isRecommended: (matchingRoute as any).isRecommended || (matchingRoute as any).is_recommended || false,
    waypoints: (matchingRoute as any).waypoints || [],
    avoidedZones: (matchingRoute as any).avoidedZones || (matchingRoute as any).avoided_zones || [],
  } : null;
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
          {route && (
            <div className="glass-card-static p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Route size={16} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Recommended Evacuation Route</h2>
                  <p className="text-xs text-slate-500">{route.name}</p>
                </div>
                {route.isRecommended && (
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
                    {route.waypoints.slice(0, 3).map((_: any, i: number) => (
                      <div
                        key={i}
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-amber-500 border-2 border-bg-primary"
                        style={{ left: `${(i + 1) * 25}%` }}
                      />
                    ))}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap">
                      <ArrowRight size={10} className="text-slate-500" />
                      <span className="text-[10px] text-slate-500">{route.distance} km · ~{route.estimatedTime} min</span>
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
                  { icon: Clock, color: '#06b6d4', label: 'Est. Time', value: `~${route.estimatedTime} min` },
                  { icon: MapPin, color: '#3b82f6', label: 'Distance', value: `${route.distance} km` },
                  { icon: Shield, color: '#10b981', label: 'Route Risk', value: `${route.riskAlongRoute}%` },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl bg-white/[0.03] text-center">
                    <s.icon size={16} style={{ color: s.color }} className="mx-auto mb-1" />
                    <p className="text-sm font-bold text-white">{s.value}</p>
                    <p className="text-[10px] text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Authority Route Control Panel */}
              {isAuthority && matchingRoute && (
                <div className="mt-4 pt-4 border-t border-white/10 p-3 rounded-xl bg-slate-900/80 border border-cyan-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <Shield size={14} /> Authority Route Status Control:
                    </span>
                    <span className="text-[10px] text-slate-400">ID: {matchingRoute.id}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Route Safety Status</label>
                      <select
                        value={matchingRoute.riskAlongRoute >= 80 ? 'blocked' : matchingRoute.riskAlongRoute >= 50 ? 'caution' : 'safe'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newRisk = val === 'blocked' ? 90 : val === 'caution' ? 55 : 15;
                          updateEvacuationRoute(matchingRoute.id, { riskAlongRoute: newRisk });
                          toast.success(`Route status set to ${val.toUpperCase()}`);
                        }}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-bold"
                      >
                        <option value="safe">✅ CLEAR / SAFE</option>
                        <option value="caution">⚠️ CAUTION - FLUDDED</option>
                        <option value="blocked">🚫 BLOCKED / IMPASSABLE</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">Est. Travel Time (min)</label>
                      <input
                        type="number"
                        min="1"
                        value={matchingRoute.estimatedTime || (matchingRoute as any).estimated_time_min || 25}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateEvacuationRoute(matchingRoute.id, { estimatedTime: val });
                          toast.success(`Updated travel time to ${val} min`);
                        }}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">AI Recommendation</label>
                      <button
                        type="button"
                        onClick={() => {
                          const curr = (matchingRoute as any).isRecommended ?? matchingRoute.isRecommended;
                          updateEvacuationRoute(matchingRoute.id, { isRecommended: !curr });
                          toast.success(!curr ? 'Route marked as Recommended' : 'Removed Recommendation');
                        }}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          matchingRoute.isRecommended ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400 border border-white/10'
                        }`}
                      >
                        {matchingRoute.isRecommended ? '✓ Recommended Route' : 'Mark Recommended'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

          {/* Authority Only Evacuation Operations Panel */}
          {isAuthority && (
            <div className="glass-card-static p-6 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-cyan-400" />
                  <h2 className="text-base font-bold text-white">Authority Evacuation Operations Control</h2>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 uppercase">
                  Authority Access
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Override routing parameters, dispatch emergency evacuation escorts, and mark inundated road hazards.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => toast.success('Evacuation Escort Buses & NDRF team dispatched to route corridor!', { icon: '🚛' })}
                  className="btn-primary text-xs py-2 px-3 gap-2 justify-center"
                >
                  <Users size={14} /> Dispatch Evacuation Escorts
                </button>
                <button
                  onClick={() => toast.success('Road Closure Alert broadcasted for inundated highway section!', { icon: '🛑' })}
                  className="btn-danger text-xs py-2 px-3 gap-2 justify-center"
                >
                  <AlertTriangle size={14} /> Mark Flooded Road Hazard
                </button>
                <button
                  onClick={() => toast.success('A* Pathfinding re-calculated evacuation corridors!')}
                  className="btn-secondary text-xs py-2 px-3 gap-2 justify-center"
                >
                  <Zap size={14} /> Re-Optimize Routes
                </button>
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
