import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building, Search, MapPin, Users, Phone, CheckCircle,
  Filter, Wifi, Heart, Zap, Droplets, Coffee, Info,
} from 'lucide-react';
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
  const { shelters, fetchShelters, updateShelterOccupancy, isLoading } = useAppStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [selectedShelter, setSelectedShelter] = useState<any>(null);

  useEffect(() => {
    fetchShelters();
  }, []);

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
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building size={24} className="text-emerald-400" />
            Shelter Network
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {shelters.length} relief centers active across Chennai Metropolitan Area
          </p>
        </div>
        <Link to="/app/map" className="btn-secondary text-xs py-2">
          <MapPin size={14} /> View on Map
        </Link>
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
      <div className="glass-card-static p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">Network-wide Occupancy</span>
          <span className={`text-sm font-bold ${overallPct >= 80 ? 'text-red-400' : overallPct >= 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {overallPct}%
          </span>
        </div>
        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            style={{ backgroundColor: overallPct >= 80 ? '#ef4444' : overallPct >= 60 ? '#f59e0b' : '#10b981' }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1.5">
          {totalOccupancy.toLocaleString()} of {totalCapacity.toLocaleString()} total capacity used
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shelters..."
            className="input-field pl-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field text-sm py-2 w-auto"
          >
            <option value="all">All Types</option>
            {shelterTypes.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="input-field text-sm py-2 w-auto"
          >
            <option value="all">All Shelters</option>
            <option value="available">Available</option>
            <option value="full">Near Capacity</option>
          </select>
        </div>
        <span className="text-xs text-slate-500">{filteredShelters.length} shelters</span>
      </div>

      {/* Shelter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredShelters.map((shelter, i) => {
          const pct = Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
          const occupancyColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#10b981';
          const available = shelter.capacity - shelter.currentOccupancy;
          const isSelected = selectedShelter?.id === shelter.id;

          return (
            <motion.div
              key={shelter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setSelectedShelter(isSelected ? null : shelter)}
              className={`glass-card-static p-5 cursor-pointer transition-all duration-300 ${
                isSelected ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/10' : 'hover:border-white/15'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${occupancyColor}15` }}
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

              {/* Occupancy */}
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

              {/* Actions */}
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

      {filteredShelters.length === 0 && (
        <div className="text-center py-16">
          <Building size={48} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-400">No shelters match your search</p>
        </div>
      )}
    </div>
  );
}
