import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Truck,
  MapPin,
  Phone,
  ArrowUpRight,
  Search,
  CheckCircle2,
  Clock,
  Navigation,
  Shield,
  Plus,
  X,
  Send,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../stores/useAppStore';
import { formatRelativeTime } from '../utils/helpers';

export default function ResourcesPage() {
  const {
    user,
    resources,
    reports,
    selectedLocation,
    updateResource,
    addResource,
    requestAssetEmergencyAssistance,
    respondToEmergencyRequest,
  } = useAppStore();

  const isAuthority = user?.role === 'authority' || user?.role === 'admin';

  // Tabs for Citizen vs Authority
  const [citizenTab, setCitizenTab] = useState<'request' | 'status' | 'inventory'>('request');
  const [authorityTab, setAuthorityTab] = useState<'requests' | 'inventory'>('requests');

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [requestingAssetId, setRequestingAssetId] = useState<string | null>(null);

  // Add Resource Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState({
    name: '',
    category: 'vehicles' as 'vehicles' | 'supplies' | 'medical' | 'power' | 'personnel',
    quantity: 10,
    location: selectedLocation?.name || 'Central Command Hub',
  });

  // Filter citizen emergency assistance requests from reports
  const citizenEmergencyRequests = reports.filter(
    (r) => r.type === 'emergency_assistance' || Boolean(r.assetRequested)
  );

  // Quick asset request presets for citizens
  const quickAssetOptions = [
    {
      id: 'opt-boat',
      name: 'NDRF Rescue Motorboats (40HP)',
      category: 'vehicles',
      emoji: '🚤',
      tag: 'Rescue Boat',
      gradient: 'from-cyan-950/60 via-slate-900 to-slate-900 border-cyan-500/30 text-cyan-400',
      btnGradient: 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500',
    },
    {
      id: 'opt-ambulance',
      name: 'Advanced Mobile Ambulances',
      category: 'medical',
      emoji: '🚑',
      tag: 'Mobile Medical',
      gradient: 'from-rose-950/60 via-slate-900 to-slate-900 border-rose-500/30 text-rose-400',
      btnGradient: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500',
    },
    {
      id: 'opt-truck',
      name: 'Emergency Relief Supply Trucks',
      category: 'vehicles',
      emoji: '🚚',
      tag: 'Relief Logistics',
      gradient: 'from-amber-950/60 via-slate-900 to-slate-900 border-amber-500/30 text-amber-400',
      btnGradient: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
    },
    {
      id: 'opt-ndrf',
      name: 'NDRF First Responder Teams',
      category: 'personnel',
      emoji: '🛟',
      tag: 'NDRF Personnel',
      gradient: 'from-purple-950/60 via-slate-900 to-slate-900 border-purple-500/30 text-purple-400',
      btnGradient: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500',
    },
    {
      id: 'opt-generator',
      name: 'High-Capacity Generators (250kVA)',
      category: 'power',
      emoji: '⚡',
      tag: 'Power Supply',
      gradient: 'from-yellow-950/60 via-slate-900 to-slate-900 border-yellow-500/30 text-yellow-400',
      btnGradient: 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500',
    },
    {
      id: 'opt-water',
      name: 'Mobile Water Purification Units',
      category: 'supplies',
      emoji: '💧',
      tag: 'Clean Water',
      gradient: 'from-teal-950/60 via-slate-900 to-slate-900 border-teal-500/30 text-teal-400',
      btnGradient: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500',
    },
  ];

  const handleCitizenRequestAsset = async (assetName: string, category: string, assetId: string) => {
    setRequestingAssetId(assetId);

    const lat = selectedLocation?.lat || 11.2715;
    const lng = selectedLocation?.lng || 77.6066;
    const addressName = selectedLocation?.name || 'Perundurai, Tamil Nadu, India';

    try {
      await requestAssetEmergencyAssistance({
        assetName,
        category,
        lat,
        lng,
        address: addressName,
      });

      toast.success(
        `Emergency Request Submitted for '${assetName}'! Disaster Command notified at ${addressName.split(',')[0]}.`,
        { duration: 5000, icon: '🚨' }
      );

      // Automatically switch view to active response tracker tab
      setCitizenTab('status');
    } catch (err) {
      toast.error('Failed to submit asset request.');
    } finally {
      setRequestingAssetId(null);
    }
  };

  const handleAddResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.name) {
      toast.error('Please enter asset name');
      return;
    }
    addResource({
      id: `res-${Date.now()}`,
      name: newResource.name,
      category: newResource.category,
      quantity: Number(newResource.quantity),
      available: Number(newResource.quantity),
      status: 'available',
      location: newResource.location,
    });
    toast.success(`Resource '${newResource.name}' added to inventory!`);
    setShowAddModal(false);
    setNewResource({
      name: '',
      category: 'vehicles',
      quantity: 10,
      location: selectedLocation?.name || 'Central Command Hub',
    });
  };

  const filteredResources = resources.filter((res) => {
    const matchesCategory = activeCategory === 'all' || res.category === activeCategory;
    const matchesSearch =
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // ═════════════════════════════════════════════════════════════════════
  // 1. AUTHORITY VIEW (COMMAND & INVENTORY CONTROL)
  // ═════════════════════════════════════════════════════════════════════
  if (isAuthority) {
    return (
      <div className="space-y-6 max-w-[1600px] pb-12">
        {/* Authority Header Banner */}
        <div className="glass-card-static p-6 border border-emerald-500/30 shadow-2xl relative overflow-hidden bg-slate-950/80 backdrop-blur-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Shield size={26} className="text-emerald-400 animate-pulse" />
                <span className="bg-gradient-to-r from-white via-emerald-100 to-teal-400 bg-clip-text text-transparent">
                  Emergency Fleet & Resource Command Center
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Command Operations in <span className="text-emerald-400 font-semibold">{selectedLocation?.name?.split(',')[0] || 'Your Region'}</span> • Dispatch assets to citizens, manage stock levels, and control deployment status.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary text-xs py-2.5 px-4 gap-2 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none shadow-lg shadow-emerald-600/20"
              >
                <Plus size={15} /> Add New Resource Asset
              </button>
            </div>
          </div>

          {/* Sub Nav Tabs for Authority */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => setAuthorityTab('requests')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border relative ${
                authorityTab === 'requests'
                  ? 'bg-red-500/20 border-red-500 text-red-300 shadow-lg shadow-red-500/10'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <AlertTriangle size={14} className={citizenEmergencyRequests.length > 0 ? 'text-red-400 animate-pulse' : ''} />
              <span>Citizen Emergency Requests Action Hub</span>
              {citizenEmergencyRequests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-slate-950 font-mono font-bold">
                  {citizenEmergencyRequests.length} PENDING
                </span>
              )}
            </button>

            <button
              onClick={() => setAuthorityTab('inventory')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                authorityTab === 'inventory'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/60 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Truck size={14} />
              <span>Inventory Stock & Status Controls</span>
            </button>
          </div>
        </div>

        {/* ─── AUTHORITY TAB 1: CITIZEN EMERGENCY REQUESTS ACTION HUB ─── */}
        {authorityTab === 'requests' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-static p-6 border border-red-500/30 bg-slate-950/90 shadow-2xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield size={20} className="text-red-400 animate-pulse" />
                  Citizen Emergency Asset Requests (Live Command Feed)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review live citizen requests with GPS coordinates, dispatch fleet units, or acknowledge requests.
                </p>
              </div>

              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                {citizenEmergencyRequests.length} TOTAL REQUESTS
              </span>
            </div>

            {citizenEmergencyRequests.length > 0 ? (
              <div className="space-y-3">
                {citizenEmergencyRequests.map((req) => {
                  const isDispatched = req.dispatchStatus === 'dispatched' || req.verified;
                  const rawName = req.assetRequested || 'Emergency Asset';
                  const cleanName = rawName.replace(/^\[.*?\]\s*/, '').replace(/\(.*?\)/, '').trim();

                  return (
                    <div
                      key={req.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isDispatched
                          ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                          : 'bg-slate-900/90 border-red-500/40 shadow-lg shadow-red-950/20'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xl">
                              {cleanName.toLowerCase().includes('boat') ? '🚤' :
                               cleanName.toLowerCase().includes('ambulance') ? '🚑' :
                               cleanName.toLowerCase().includes('truck') ? '🚚' :
                               cleanName.toLowerCase().includes('generator') ? '⚡' : '🛟'}
                            </span>
                            <h3 className="text-sm font-bold text-white">{cleanName}</h3>

                            {isDispatched ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 size={11} /> DISPATCHED BY COMMAND
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 animate-pulse">
                                <Clock size={11} /> ACTION REQUIRED
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-300 font-mono">
                            Citizen: <span className="font-bold text-cyan-300">{req.userName}</span> • {req.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1 text-slate-300">
                              <MapPin size={12} className="text-red-400" /> {(req.address || 'Perundurai, Tamil Nadu').replace(/Chennai/g, 'Perundurai, Tamil Nadu')}
                            </span>
                            <span>•</span>
                            <span>{formatRelativeTime(req.createdAt)}</span>
                            {req.location?.lat && req.location?.lng && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 font-bold">
                                  GPS: ({req.location.lat.toFixed(4)}, {req.location.lng.toFixed(4)})
                                </span>
                              </>
                            )}
                          </div>

                          {req.authorityResponse && (
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                              <span className="font-bold text-emerald-400 block">Logged Dispatch Note:</span>
                              {req.authorityResponse}
                            </div>
                          )}
                        </div>

                        {/* Authority Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            onClick={async () => {
                              const dispatchMsg = `Authority Dispatched 1 Unit of '${cleanName}' to your location (${req.address})! Responders En Route (ETA: ~8 mins).`;
                              await respondToEmergencyRequest(req.id, dispatchMsg);
                              toast.success(`Dispatched '${cleanName}' to citizen location! Responders En Route!`, { icon: '🚤' });
                            }}
                            className="btn-primary text-xs py-2 px-3 gap-1.5 font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-none shadow-md shadow-emerald-600/30"
                          >
                            <Send size={13} /> Dispatch Asset Now
                          </button>

                          {req.location?.lat && req.location?.lng && (
                            <Link
                              to={`/app/map?lat=${req.location.lat}&lng=${req.location.lng}&emergency=true&asset=${encodeURIComponent(cleanName)}`}
                              className="btn-secondary text-xs py-2 px-3 gap-1.5 font-semibold text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                            >
                              <Navigation size={13} /> Locate on Map
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-xl text-slate-400">
                  ✅
                </div>
                <p className="text-xs font-semibold text-slate-300">No emergency asset requests pending review.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── AUTHORITY TAB 2: INVENTORY STOCK & STATUS CONTROLS ─── */}
        {authorityTab === 'inventory' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filter Bar */}
            <div className="glass-card-static p-4 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search asset or depot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field text-xs pl-8 py-1.5 w-60 bg-slate-900/90"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs">
                {[
                  { id: 'all', label: 'All Assets' },
                  { id: 'vehicles', label: 'Vehicles' },
                  { id: 'medical', label: 'Medical' },
                  { id: 'supplies', label: 'Supplies' },
                  { id: 'power', label: 'Power' },
                  { id: 'personnel', label: 'Personnel' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-[11px] ${
                      activeCategory === cat.id
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Authority Resource Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((res) => {
                const pctAvailable = Math.round((res.available / res.quantity) * 100);
                return (
                  <div
                    key={res.id}
                    className="p-5 rounded-2xl border border-white/10 bg-slate-900/90 hover:border-emerald-500/30 transition-all space-y-4 shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {res.category}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1.5">{res.name}</h4>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="text-slate-500" /> {res.location}
                        </p>
                      </div>

                      {/* Status Dropdown Selector for Authorities */}
                      <select
                        value={res.status}
                        onChange={(e) => {
                          updateResource(res.id, { status: e.target.value as any });
                          toast.success(`Updated '${res.name}' status to ${e.target.value.toUpperCase()}`);
                        }}
                        className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
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

                    {/* Stock Controls */}
                    <div className="space-y-2 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400">Available Stock:</span>
                        <span className="font-bold text-white">
                          {res.available} / {res.quantity} ({pctAvailable}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pctAvailable}%`,
                            backgroundColor: pctAvailable > 50 ? '#10b981' : pctAvailable > 20 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>

                      {/* Plus / Minus Stock Controls */}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[11px] text-slate-400 font-semibold">Stock Controls:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (res.available > 0) {
                                updateResource(res.id, { available: res.available - 1 });
                                toast.success(`Decreased stock for ${res.name}`);
                              }
                            }}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-sm flex items-center justify-center border border-white/10"
                            title="Decrease available stock"
                          >
                            -
                          </button>
                          <span className="px-2 font-mono text-xs font-bold text-cyan-400">{res.available}</span>
                          <button
                            onClick={() => {
                              if (res.available < res.quantity) {
                                updateResource(res.id, { available: res.available + 1 });
                                toast.success(`Increased stock for ${res.name}`);
                              }
                            }}
                            className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-center border border-emerald-500/30"
                            title="Increase available stock"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Add Resource Asset Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="w-full max-w-lg p-6 rounded-2xl glass-card-static border border-emerald-500/30 bg-slate-950 space-y-5"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Plus size={18} className="text-emerald-400" />
                    Add New Resource Equipment Asset
                  </h3>
                  <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddResourceSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Asset Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Inflatable Rescue Motorboat (40HP)"
                      value={newResource.name}
                      onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                      className="input-field text-xs w-full"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                      <select
                        value={newResource.category}
                        onChange={(e) => setNewResource({ ...newResource, category: e.target.value as any })}
                        className="input-field text-xs w-full bg-slate-900"
                      >
                        <option value="vehicles">Vehicles & Boats</option>
                        <option value="medical">Medical Ambulances</option>
                        <option value="supplies">Relief Supplies</option>
                        <option value="power">Power Generators</option>
                        <option value="personnel">NDRF Personnel</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Total Stock Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={newResource.quantity}
                        onChange={(e) => setNewResource({ ...newResource, quantity: Number(e.target.value) })}
                        className="input-field text-xs w-full font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Depot / Command Hub Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Perundurai Central Command Depot"
                      value={newResource.location}
                      onChange={(e) => setNewResource({ ...newResource, location: e.target.value })}
                      className="input-field text-xs w-full"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary text-xs py-2 px-5 font-bold">
                      Save Resource Asset
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // 2. CITIZEN VIEW (ASSET REQUESTING & AUTHORITY RESPONSE TRACKING)
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 max-w-[1600px] pb-12">
      {/* Citizen Header Banner */}
      <div className="glass-card-static p-6 border border-white/10 shadow-2xl relative overflow-hidden bg-slate-950/80 backdrop-blur-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-2xl">🚤</span>
              <span className="bg-gradient-to-r from-white via-cyan-100 to-blue-400 bg-clip-text text-transparent">
                Emergency Resource & Relief Assistance Hub
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live status in <span className="text-cyan-400 font-semibold">{selectedLocation?.name?.split(',')[0] || 'Your Region'}</span> • Request emergency boats, ambulances, trucks & track live authority dispatch responses.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              LIVE DISPATCH ONLINE
            </span>
          </div>
        </div>

        {/* Sub Nav Tabs for Citizen */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => setCitizenTab('request')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              citizenTab === 'request'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-900/60 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>🚤 Quick Asset Request Hub</span>
          </button>

          <button
            onClick={() => setCitizenTab('status')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border relative ${
              citizenTab === 'status'
                ? 'bg-red-500/20 border-red-500 text-red-300 shadow-lg shadow-red-500/10'
                : 'bg-slate-900/60 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Shield size={14} className={citizenEmergencyRequests.length > 0 ? 'text-red-400 animate-pulse' : ''} />
            <span>Authority Response Tracker</span>
            {citizenEmergencyRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-slate-950 font-mono font-bold">
                {citizenEmergencyRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCitizenTab('inventory')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              citizenTab === 'inventory'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-lg shadow-emerald-500/10'
                : 'bg-slate-900/60 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Truck size={14} />
            <span>Fleet Stock Readiness</span>
          </button>
        </div>
      </div>

      {/* ─── CITIZEN TAB 1: QUICK ASSET REQUEST HUB ─── */}
      {citizenTab === 'request' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Phone size={18} className="text-cyan-400" />
                Select Emergency Asset to Request
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Clicking request transmits your emergency assistance request to the Disaster Command Center.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickAssetOptions.map((opt) => {
              const isRequesting = requestingAssetId === opt.id;
              return (
                <div
                  key={opt.id}
                  className={`p-4 rounded-2xl border bg-slate-900/90 backdrop-blur-xl transition-all space-y-3 shadow-xl ${opt.gradient} hover:border-cyan-500/40`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-2xl shrink-0 shadow-md">
                      <span>{opt.emoji}</span>
                    </div>
                    <span className="text-[9px] font-mono uppercase tracking-wider font-bold bg-white/10 px-2 py-0.5 rounded border border-white/15">
                      {opt.tag}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug">{opt.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin size={11} className="text-slate-500 shrink-0" />
                      Location: {selectedLocation?.name?.split(',')[0] || 'Perundurai'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleCitizenRequestAsset(opt.name, opt.category, opt.id)}
                    disabled={isRequesting}
                    className={`w-full text-xs py-2.5 px-4 rounded-xl font-bold text-white shadow-lg border-none flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${opt.btnGradient}`}
                  >
                    <Phone size={13} className={isRequesting ? 'animate-spin' : ''} />
                    <span>{isRequesting ? 'Submitting Request...' : `Request ${opt.tag}`}</span>
                    <ArrowUpRight size={13} className="opacity-80" />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ─── CITIZEN TAB 2: AUTHORITY RESPONSE TRACKER ─── */}
      {citizenTab === 'status' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-static p-6 border border-red-500/30 bg-slate-950/90 shadow-2xl space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield size={20} className="text-red-400 animate-pulse" />
                Your Active Requests & Official Authority Responses
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tracking of responders and equipment dispatched by Emergency Command.
              </p>
            </div>

            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
              {citizenEmergencyRequests.length} ACTIVE
            </span>
          </div>

          {citizenEmergencyRequests.length > 0 ? (
            <div className="space-y-3">
              {citizenEmergencyRequests.map((req) => {
                const isDispatched = req.dispatchStatus === 'dispatched' || req.verified;
                const rawName = req.assetRequested || 'Emergency Asset';
                const cleanName = rawName.replace(/^\[.*?\]\s*/, '').replace(/\(.*?\)/, '').trim();

                return (
                  <div
                    key={req.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isDispatched
                        ? 'bg-slate-900/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                        : 'bg-slate-900/90 border-amber-500/40 shadow-lg shadow-amber-950/20'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xl">
                            {cleanName.toLowerCase().includes('boat') ? '🚤' :
                             cleanName.toLowerCase().includes('ambulance') ? '🚑' :
                             cleanName.toLowerCase().includes('truck') ? '🚚' :
                             cleanName.toLowerCase().includes('generator') ? '⚡' : '🛟'}
                          </span>
                          <h3 className="text-sm font-bold text-white">{cleanName}</h3>

                          {isDispatched ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 size={11} /> DISPATCHED BY AUTHORITY
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 animate-pulse">
                              <Clock size={11} /> PENDING AUTHORITY REVIEW
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin size={12} className="text-cyan-400" /> {(req.address || selectedLocation?.name || 'Perundurai, Tamil Nadu').replace(/Chennai/g, 'Perundurai, Tamil Nadu')}
                          </span>
                          <span>•</span>
                          <span>{formatRelativeTime(req.createdAt)}</span>
                        </div>

                        {req.authorityResponse ? (
                          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
                            <div className="font-bold flex items-center gap-1 text-emerald-400">
                              <Shield size={13} /> Official Authority Dispatch Note:
                            </div>
                            <p className="text-slate-200">{req.authorityResponse}</p>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                            🚨 Request transmitted to Disaster Operations Command Center. Responders evaluating request.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-xl text-slate-400">
                🚨
              </div>
              <p className="text-xs font-semibold text-slate-300">No active emergency requests pending.</p>
              <button
                onClick={() => setCitizenTab('request')}
                className="btn-primary text-xs py-1.5 px-3 mt-2 inline-flex items-center gap-1.5"
              >
                <span>Request Asset Now &rarr;</span>
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* ─── CITIZEN TAB 3: FLEET STOCK READINESS ─── */}
      {citizenTab === 'inventory' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card-static p-6 border border-white/10 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Truck size={18} className="text-emerald-400" />
                Live Fleet & Supply Depot Inventory
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Current stock levels across disaster management command hubs in your region.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search asset or depot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field text-xs pl-8 py-1.5 w-48 bg-slate-900/90"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 text-xs">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'vehicles', label: 'Vehicles' },
                  { id: 'medical', label: 'Medical' },
                  { id: 'supplies', label: 'Supplies' },
                  { id: 'power', label: 'Power' },
                  { id: 'personnel', label: 'Personnel' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors text-[11px] ${
                      activeCategory === cat.id
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map((res) => {
              const pctAvailable = Math.round((res.available / res.quantity) * 100);
              const isRequesting = requestingAssetId === res.id;

              const n = res.name.toLowerCase();
              let emoji = '📦';
              let badgeGradient = 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400';
              let tag = 'Relief Pack';

              if (n.includes('boat') || n.includes('motorboat')) {
                emoji = '🚤';
                badgeGradient = 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-400';
                tag = 'Rescue Boat';
              } else if (n.includes('ambulance') || res.category === 'medical') {
                emoji = '🚑';
                badgeGradient = 'from-rose-500/20 to-red-500/20 border-rose-500/30 text-rose-400';
                tag = 'Mobile Ambulance';
              } else if (n.includes('truck') || res.category === 'vehicles') {
                emoji = '🚚';
                badgeGradient = 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400';
                tag = 'Supply Truck';
              } else if (n.includes('team') || n.includes('responder') || res.category === 'personnel') {
                emoji = '🛟';
                badgeGradient = 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-400';
                tag = 'Rescue Team';
              } else if (n.includes('water') || n.includes('purification')) {
                emoji = '💧';
                badgeGradient = 'from-teal-500/20 to-cyan-500/20 border-teal-500/30 text-teal-400';
                tag = 'Water Purification';
              } else if (n.includes('generator') || res.category === 'power') {
                emoji = '⚡';
                badgeGradient = 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30 text-yellow-400';
                tag = 'Power Genset';
              }

              return (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl border border-white/10 bg-slate-900/90 transition-all space-y-3.5 shadow-xl hover:border-cyan-500/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${badgeGradient} border flex items-center justify-center text-xl shrink-0 shadow-lg`}>
                        <span>{emoji}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {tag}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                            res.status === 'available' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            res.status === 'deployed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}>
                            {res.status.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white mt-1 truncate">{res.name}</h4>
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin size={10} className="text-slate-500 shrink-0" /> {res.location}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-extrabold text-white font-mono flex items-baseline justify-end gap-1">
                        <span className="text-cyan-400 text-lg">{res.available}</span>
                        <span className="text-xs text-slate-500">/ {res.quantity}</span>
                      </div>
                      <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider block">
                        Ready
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Stock Availability:</span>
                      <span className="font-bold text-slate-200">{pctAvailable}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{
                          width: `${pctAvailable}%`,
                          backgroundColor: pctAvailable > 50 ? '#10b981' : pctAvailable > 20 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleCitizenRequestAsset(res.name, res.category, res.id)}
                    disabled={isRequesting}
                    className="w-full btn-primary text-xs py-2 justify-center gap-1.5 font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white border-none shadow-md"
                  >
                    <Phone size={12} className={isRequesting ? 'animate-spin' : ''} />
                    <span>{isRequesting ? 'Submitting Request...' : 'Request Asset'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
