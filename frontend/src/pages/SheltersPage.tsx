import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building, Search, MapPin, Users, Phone, CheckCircle,
  Wifi, Heart, Zap, Droplets, Coffee, Info,
  Plus, Save, X, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../stores/useAppStore';
import { Link } from 'react-router-dom';

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'Water': <Droplets size={12} />,
  'Food': <Coffee size={12} />,
  'Medical Aid': <Heart size={12} />,
  'Charging Points': <Zap size={12} />,
  'Toilets': <Wifi size={12} />,
  'Blankets': <CheckCircle size={12} />,
  'First Aid': <Heart size={12} />,
};

export default function SheltersPage() {
  const { user, shelters, fetchShelters, updateShelterOccupancy, createShelter, isLoading, selectedLocation } = useAppStore();
  const isAuthority = user?.role === 'authority' || user?.role === 'admin';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [selectedShelter, setSelectedShelter] = useState<any>(null);

  // Authority Modal State for Add Shelter
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShelter, setNewShelter] = useState({
    name: '',
    type: 'school',
    capacity: 500,
    address: '',
    contact: '+91 44 2235 8888',
    staffInCharge: 'Officer R. Kumar (NDRF)',
    latitude: selectedLocation?.lat || 13.0827,
    longitude: selectedLocation?.lng || 80.2707,
    amenities: ['Water', 'Food', 'Medical Aid', 'Charging Points', 'Toilets'],
  });

  useEffect(() => {
    if (selectedLocation) {
      fetchShelters();
    }
  }, [selectedLocation]);

  const handleCreateShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createShelter({
        name: newShelter.name,
        type: newShelter.type,
        capacity: Number(newShelter.capacity),
        latitude: Number(newShelter.latitude),
        longitude: Number(newShelter.longitude),
        address: newShelter.address,
        amenities: newShelter.amenities,
      });
      toast.success('Emergency Relief Shelter created and added to GIS map!');
      setShowAddModal(false);
      setNewShelter({
        name: '',
        type: 'school',
        capacity: 500,
        address: '',
        contact: '+91 44 2235 8888',
        staffInCharge: 'Officer R. Kumar (NDRF)',
        latitude: selectedLocation?.lat || 13.0827,
        longitude: selectedLocation?.lng || 80.2707,
        amenities: ['Water', 'Food', 'Medical Aid', 'Charging Points', 'Toilets'],
      });
    } catch (err) {
      toast.error('Failed to create shelter.');
    }
  };

  const filteredShelters = shelters.filter((s) => {
    const matchSearch =
      search === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.address?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || s.type === typeFilter;
    const pct = Math.round((s.currentOccupancy / s.capacity) * 100);
    const matchAvail =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && pct < 90) ||
      (availabilityFilter === 'full' && pct >= 90);
    return matchSearch && matchType && matchAvail;
  });

  const totalCapacity = shelters.reduce((a, s) => a + s.capacity, 0);
  const totalOccupancy = shelters.reduce((a, s) => a + s.currentOccupancy, 0);
  const overallPct = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  const shelterTypes = [...new Set(shelters.map((s) => s.type))];

  return (
    <div className="space-y-6 max-w-[1400px] pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card-static p-6 border border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building size={26} className="text-emerald-400" />
            Shelter Network & Relief Center Operations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {shelters.length} active emergency relief centers across region
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Authority Only Add Shelter Button */}
          {isAuthority && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary text-xs py-2 px-3 gap-2"
            >
              <Plus size={15} />
              <span>Add Relief Shelter</span>
            </button>
          )}

          <Link to="/app/map" className="btn-secondary text-xs py-2 px-3 gap-2">
            <MapPin size={14} />
            <span>View GIS Map</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Shelters', value: shelters.length, color: '#10b981', icon: Building },
          { label: 'Total Capacity', value: totalCapacity.toLocaleString(), color: '#3b82f6', icon: Users },
          { label: 'Current Occupancy', value: totalOccupancy.toLocaleString(), color: '#f59e0b', icon: CheckCircle },
          { label: 'Available Spaces', value: (totalCapacity - totalOccupancy).toLocaleString(), color: '#06b6d4', icon: Info },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="p-4 rounded-xl bg-white/[0.03] border border-white/5"
          >
            <s.icon size={18} style={{ color: s.color }} className="mb-2" />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Overall Occupancy Bar */}
      <div className="glass-card-static p-5 border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">Network-wide Occupancy</span>
          <span className={`text-sm font-bold ${overallPct >= 80 ? 'text-red-400' : overallPct >= 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {overallPct}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${overallPct >= 80 ? 'bg-red-500' : overallPct >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={14} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search shelters by name, area, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">All Shelter Types</option>
            {shelterTypes.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t?.replace('_', ' ')}
              </option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="all">All Capacities</option>
            <option value="available">Spaces Available (&lt;90%)</option>
            <option value="full">Nearly Full (&ge;90%)</option>
          </select>
        </div>
      </div>

      {/* Shelters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShelters.map((shelter, i) => {
          const pct = Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
          const available = shelter.capacity - shelter.currentOccupancy;
          const isSelected = selectedShelter?.id === shelter.id;
          const occupancyColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';

          return (
            <motion.div
              key={shelter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedShelter(isSelected ? null : shelter)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${occupancyColor}20` }}
                    >
                      <Building size={16} style={{ color: occupancyColor }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{shelter.name}</h3>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {shelter.type?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
                  style={{ backgroundColor: `${occupancyColor}20`, color: occupancyColor }}
                >
                  {pct >= 90 ? 'Nearly Full' : pct >= 70 ? 'Filling Up' : 'Available'}
                </span>
              </div>

              {/* Address */}
              {shelter.address && (
                <p className="text-xs text-slate-500 flex items-start gap-1 mb-3">
                  <MapPin size={10} className="mt-0.5 shrink-0" />
                  {shelter.address}
                </p>
              )}

              {/* Occupancy Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400">{shelter.currentOccupancy} / {shelter.capacity} occupancy</span>
                  <span style={{ color: occupancyColor }} className="font-bold">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: i * 0.05 }}
                    style={{ backgroundColor: occupancyColor }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{available} spaces available</p>
              </div>

              {/* Amenities */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(shelter.amenities || []).slice(0, 5).map((amenity: string) => (
                  <span
                    key={amenity}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400"
                  >
                    {AMENITY_ICONS[amenity] ?? <CheckCircle size={10} />}
                    {amenity}
                  </span>
                ))}
              </div>

              {/* Authority Only Management Controls */}
              {isAuthority && (
                <div className="mt-3 pt-3 border-t border-white/5 bg-slate-950/40 p-2 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <UserCheck size={11} className="text-cyan-400" />
                      Staff In-Charge:
                    </span>
                    <span className="font-bold text-white">NDRF Relief Officer</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[10px] text-slate-400">Authority Occupancy Control:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateShelterOccupancy(shelter.id, Math.max(0, shelter.currentOccupancy - 10));
                          toast.success('Occupancy updated');
                        }}
                        className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-white rounded font-bold text-xs"
                        title="Reduce occupancy by 10"
                      >
                        -10
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateShelterOccupancy(shelter.id, Math.min(shelter.capacity, shelter.currentOccupancy + 10));
                          toast.success('Occupancy updated');
                        }}
                        className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded font-bold text-xs border border-emerald-500/30"
                        title="Increase occupancy by 10"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Citizen Actions */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="border-t border-white/5 pt-3 mt-1 space-y-2"
                >
                  {shelter.contact && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Phone size={12} />
                      <span>{shelter.contact}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link to="/app/map" className="btn-primary text-xs py-1.5 flex-1 justify-center">
                      <MapPin size={12} /> Navigate
                    </Link>
                    {pct < 100 && (
                      <button
                        className="btn-secondary text-xs py-1.5 flex-1 justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateShelterOccupancy(shelter.id, shelter.currentOccupancy + 1);
                          toast.success('Checked into shelter!');
                        }}
                        disabled={isLoading}
                      >
                        <Users size={12} /> Check In
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Add Shelter Modal (Authority Only) */}
      <AnimatePresence>
        {showAddModal && isAuthority && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative glass-card-static p-6 border border-white/10 rounded-2xl max-w-lg w-full z-10 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building size={18} className="text-emerald-400" />
                  Add New Relief Shelter (Authority Access)
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateShelter} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Shelter Name</label>
                  <input
                    type="text"
                    required
                    value={newShelter.name}
                    onChange={(e) => setNewShelter({ ...newShelter, name: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. Government Higher Secondary School Relief Camp"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Shelter Type</label>
                    <select
                      value={newShelter.type}
                      onChange={(e) => setNewShelter({ ...newShelter, type: e.target.value })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="school">School / College</option>
                      <option value="community_hall">Community Hall</option>
                      <option value="stadium">Indoor Stadium</option>
                      <option value="hospital">Medical Center</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Total Capacity</label>
                    <input
                      type="number"
                      required
                      min={50}
                      value={newShelter.capacity}
                      onChange={(e) => setNewShelter({ ...newShelter, capacity: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={newShelter.address}
                    onChange={(e) => setNewShelter({ ...newShelter, address: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white"
                    placeholder="Area, Street Name, District"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newShelter.latitude}
                      onChange={(e) => setNewShelter({ ...newShelter, latitude: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={newShelter.longitude}
                      onChange={(e) => setNewShelter({ ...newShelter, longitude: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn-secondary py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary py-2 px-4 gap-2">
                    <Save size={14} /> Save Shelter
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
