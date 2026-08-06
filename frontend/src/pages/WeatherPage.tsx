import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud, Droplets, Wind, Thermometer, Activity, Eye,
  MapPin, RefreshCw, Compass, ShieldAlert,
  Search, ArrowUp, ArrowDown, CloudRain
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  LineChart, Line, Cell
} from 'recharts';
import { api } from '../utils/api';
import { useAppStore } from '../stores/useAppStore';
import { LocateFixed } from 'lucide-react';

export default function WeatherPage() {
  const { selectedLocation, setSelectedLocation } = useAppStore();
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [locationName, setLocationName] = useState<string>(selectedLocation?.name || '');
  const [geoDetecting, setGeoDetecting] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchWeatherData = async (lat?: number, lon?: number) => {
    const targetLat = lat ?? selectedLocation?.lat ?? 13.0827;
    const targetLon = lon ?? selectedLocation?.lng ?? 80.2707;
    setLoading(true);

    try {
      const [currRes, foreRes] = await Promise.all([
        api.get(`/weather/current?lat=${targetLat}&lon=${targetLon}`),
        api.get(`/weather/forecast?lat=${targetLat}&lon=${targetLon}`),
      ]);
      setCurrentWeather(currRes.data);
      setForecast(foreRes.data);
    } catch (e) {
      console.error('Failed to fetch Open-Meteo weather data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Reverse geocode to get a location name from coordinates
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
        { headers: { 'User-Agent': 'GeoGuardAI/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const name = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state || data.display_name?.split(',')[0] || '';
        const state = addr.state || '';
        return name + (state && state !== name ? `, ${state}` : '');
      }
    } catch {
      // Ignore reverse geocode failures
    }
    return `Lat ${lat.toFixed(4)}, Lon ${lon.toFixed(4)}`;
  };

  // Auto-detect location using browser Geolocation API
  const detectLocation = async () => {
    if (!navigator.geolocation) {
      fetchWeatherData();
      return;
    }
    setGeoDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const name = await reverseGeocode(lat, lng);
        setLocationName(name);
        setSelectedLocation({ name, lat, lng });
        await fetchWeatherData(lat, lng);
        setGeoDetecting(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setGeoDetecting(false);
        fetchWeatherData();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // On initial mount: ALWAYS trigger real-time geolocation auto-detection!
  useEffect(() => {
    detectLocation();
  }, []);

  // When selectedLocation changes (e.g. from location search bar)
  useEffect(() => {
    if (selectedLocation?.lat && selectedLocation?.lng) {
      setLocationName(selectedLocation.name || '');
      fetchWeatherData(selectedLocation.lat, selectedLocation.lng);
    }
  }, [selectedLocation?.lat, selectedLocation?.lng]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await api.get(`/weather/search?query=${encodeURIComponent(query)}`);
      setSearchResults(res.data || []);
    } catch (err) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: any) => {
    setSelectedLocation({
      name: item.name,
      lat: item.lat,
      lng: item.lng || item.lon,
    });
    setSearchQuery('');
    setSearchResults([]);
    fetchWeatherData(item.lat, item.lng || item.lon);
  };

  // Extract current weather & flood risk
  const curr = currentWeather || {
    temperature: 29.0,
    humidity: 78,
    rain: 12.5,
    precipitation_probability: 45.0,
    wind_speed: 18.5,
    wind_direction: 160,
    surface_pressure: 1008,
    cloud_cover: 65,
    visibility: 8000,
    weather_code: 63,
    condition: 'Moderate Rain',
    icon: '🌧️',
    flood_risk: {
      score: 45.7,
      level: 'Moderate Risk',
      color: 'amber',
      description: 'Moderate water accumulation likely in low-lying areas.',
      breakdown: {
        rainfall_component: 10.0,
        probability_component: 11.25,
        humidity_component: 11.7,
        cloud_component: 6.5,
        wind_component: 2.3,
      },
    },
  };

  const floodRisk = curr.flood_risk || {
    score: 35.0,
    level: 'Moderate Risk',
    color: 'amber',
    description: 'Standard weather conditions.',
    breakdown: {
      rainfall_component: 5.0,
      probability_component: 10.0,
      humidity_component: 10.0,
      cloud_component: 5.0,
      wind_component: 5.0,
    },
  };

  const dailyList = forecast?.daily || [
    { date: '2026-08-06', condition: 'Heavy Rain', icon: '🌧️', temp_max: 31, temp_min: 25, rainfall: 45.0, precipitation_probability: 85, flood_risk_level: 'High Risk', flood_risk_score: 68.5 },
    { date: '2026-08-07', condition: 'Thunderstorm', icon: '⛈️', temp_max: 29, temp_min: 24, rainfall: 62.0, precipitation_probability: 90, flood_risk_level: 'Severe Risk', flood_risk_score: 82.0 },
    { date: '2026-08-08', condition: 'Moderate Rain', icon: '🌧️', temp_max: 30, temp_min: 25, rainfall: 25.0, precipitation_probability: 60, flood_risk_level: 'Moderate Risk', flood_risk_score: 44.0 },
    { date: '2026-08-09', condition: 'Light Rain', icon: '🌦️', temp_max: 32, temp_min: 26, rainfall: 12.0, precipitation_probability: 40, flood_risk_level: 'Low Risk', flood_risk_score: 24.0 },
    { date: '2026-08-10', condition: 'Partly Cloudy', icon: '⛅', temp_max: 33, temp_min: 26, rainfall: 2.0, precipitation_probability: 20, flood_risk_level: 'Low Risk', flood_risk_score: 18.0 },
    { date: '2026-08-11', condition: 'Clear Sky', icon: '☀️', temp_max: 34, temp_min: 27, rainfall: 0.0, precipitation_probability: 10, flood_risk_level: 'Low Risk', flood_risk_score: 12.0 },
    { date: '2026-08-12', condition: 'Partly Cloudy', icon: '⛅', temp_max: 33, temp_min: 26, rainfall: 4.0, precipitation_probability: 25, flood_risk_level: 'Low Risk', flood_risk_score: 19.0 },
  ];

  const hourlyList = forecast?.hourly || [
    { time: '00:00', temperature: 26, rainfall: 5.0, precipitation_probability: 40, wind_speed: 12, humidity: 82 },
    { time: '03:00', temperature: 25, rainfall: 12.0, precipitation_probability: 65, wind_speed: 15, humidity: 85 },
    { time: '06:00', temperature: 26, rainfall: 28.0, precipitation_probability: 80, wind_speed: 18, humidity: 88 },
    { time: '09:00', temperature: 28, rainfall: 35.0, precipitation_probability: 85, wind_speed: 22, humidity: 84 },
    { time: '12:00', temperature: 30, rainfall: 42.0, precipitation_probability: 90, wind_speed: 25, humidity: 80 },
    { time: '15:00', temperature: 29, rainfall: 20.0, precipitation_probability: 70, wind_speed: 20, humidity: 82 },
    { time: '18:00', temperature: 27, rainfall: 15.0, precipitation_probability: 55, wind_speed: 16, humidity: 86 },
    { time: '21:00', temperature: 26, rainfall: 8.0, precipitation_probability: 45, wind_speed: 14, humidity: 88 },
  ];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Severe Risk': return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', fill: '#ef4444' };
      case 'High Risk': return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', fill: '#f97316' };
      case 'Moderate Risk': return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', fill: '#f59e0b' };
      default: return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', fill: '#10b981' };
    }
  };

  const riskBadgeStyle = getRiskColor(floodRisk.level);

  return (
    <div className="space-y-6 max-w-[1300px] mx-auto pb-12">
      {/* Top Bar & Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card-static p-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cloud size={28} className="text-blue-400 animate-pulse" />
            Weather Forecast Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <MapPin size={14} className="text-cyan-400" />
            <span>{locationName || selectedLocation?.name || 'Detecting location...'}</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-500">
              ({curr.latitude?.toFixed(4)}, {curr.longitude?.toFixed(4)})
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-blue-400 font-medium">{curr.source}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Location Search Bar */}
          <div className="relative w-full md:w-72">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search location (e.g., Trichy, Madurai)..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 divide-y divide-white/5">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSearchResult(item)}
                    className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <MapPin size={12} className="text-cyan-400 shrink-0" />
                    <span className="text-xs text-slate-200 truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detect My Location button */}
          <button
            onClick={detectLocation}
            disabled={geoDetecting}
            title="Detect My Location"
            className="btn-secondary text-xs py-2 px-3 gap-2 shrink-0"
          >
            <LocateFixed size={13} className={geoDetecting ? 'animate-pulse text-cyan-400' : ''} />
            <span>{geoDetecting ? 'Detecting...' : 'My Location'}</span>
          </button>

          <button
            onClick={() => fetchWeatherData(selectedLocation?.lat, selectedLocation?.lng)}
            disabled={loading}
            className="btn-secondary text-xs py-2 px-3 gap-2 shrink-0"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Flood Risk Intelligence Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl border ${riskBadgeStyle.bg} ${riskBadgeStyle.border} relative overflow-hidden backdrop-blur-xl`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl ${riskBadgeStyle.bg} border ${riskBadgeStyle.border} flex items-center justify-center shrink-0`}>
              <ShieldAlert size={28} className={riskBadgeStyle.text} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white">Flood Risk Intelligence Engine</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${riskBadgeStyle.bg} ${riskBadgeStyle.text} border ${riskBadgeStyle.border}`}>
                  {floodRisk.level} ({floodRisk.score}%)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">{floodRisk.description}</p>
              <div className="mt-2 text-[11px] text-slate-400">
                Formula: <span className="text-slate-300 font-mono">40% Rain + 25% Prob + 15% Humidity + 10% Cloud + 10% Wind</span>
              </div>
            </div>
          </div>

          {/* Risk Score Dial / Meter */}
          <div className="w-full lg:w-72 bg-slate-950/60 p-4 rounded-xl border border-white/5 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Risk Score Meter</span>
              <span className={`font-bold ${riskBadgeStyle.text}`}>{floodRisk.score} / 100</span>
            </div>
            <div className="h-3 rounded-full bg-slate-900 border border-white/10 overflow-hidden relative">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, floodRisk.score)}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ backgroundColor: riskBadgeStyle.fill }}
              />
            </div>
          </div>
        </div>

        {/* Flood Risk Factor Components Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
          {[
            { label: 'Rainfall (40%)', val: floodRisk.breakdown?.rainfall_component || 0, max: 40, icon: Droplets, color: '#3b82f6' },
            { label: 'Probability (25%)', val: floodRisk.breakdown?.probability_component || 0, max: 25, icon: CloudRain, color: '#06b6d4' },
            { label: 'Humidity (15%)', val: floodRisk.breakdown?.humidity_component || 0, max: 15, icon: Thermometer, color: '#f59e0b' },
            { label: 'Cloud Cover (10%)', val: floodRisk.breakdown?.cloud_component || 0, max: 10, icon: Cloud, color: '#8b5cf6' },
            { label: 'Wind Speed (10%)', val: floodRisk.breakdown?.wind_component || 0, max: 10, icon: Wind, color: '#10b981' },
          ].map((comp) => (
            <div key={comp.label} className="p-3 rounded-xl bg-slate-950/40 border border-white/5">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-slate-400 flex items-center gap-1">
                  <comp.icon size={11} style={{ color: comp.color }} /> {comp.label}
                </span>
                <span className="font-mono text-white font-bold">{comp.val.toFixed(1)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-900 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (comp.val / comp.max) * 100)}%`,
                    backgroundColor: comp.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 7 Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Current Weather Card */}
        <div className="glass-card-static p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Current Weather</span>
            <span className="text-3xl">{curr.icon}</span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-white">
              {curr.temperature}°<span className="text-lg font-normal text-slate-400">C</span>
            </div>
            <p className="text-xs text-slate-300 font-semibold mt-0.5">{curr.condition}</p>
          </div>
          <p className="text-[11px] text-slate-500">WMO Code: {curr.weather_code}</p>
        </div>

        {/* 2. Temperature Card */}
        <div className="glass-card-static p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Temperature</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Thermometer size={16} />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white">{curr.temperature}°C</div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="text-emerald-400 flex items-center gap-0.5">
                <ArrowDown size={10} /> Min: {dailyList[0]?.temp_min || curr.temperature - 3}°C
              </span>
              <span className="text-red-400 flex items-center gap-0.5">
                <ArrowUp size={10} /> Max: {dailyList[0]?.temp_max || curr.temperature + 4}°C
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">Surface Temp: 2m above ground</p>
        </div>

        {/* 3. Rain & Precipitation Card */}
        <div className="glass-card-static p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Rain & Precipitation</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Droplets size={16} />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white">{curr.rain} <span className="text-xs font-normal text-slate-400">mm/hr</span></div>
            <p className="text-xs text-cyan-400 font-medium mt-1">
              Probability: {curr.precipitation_probability}%
            </p>
          </div>
          <p className="text-[11px] text-slate-500">Open-Meteo Real-Time Metric</p>
        </div>

        {/* 4. Wind Speed Card */}
        <div className="glass-card-static p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Wind Speed</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Wind size={16} />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white">{curr.wind_speed} <span className="text-xs font-normal text-slate-400">km/h</span></div>
            <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-1">
              <Compass size={12} className="text-slate-400" /> Direction: {curr.wind_direction}°
            </p>
          </div>
          <p className="text-[11px] text-slate-500">Wind Vector 10m Elevation</p>
        </div>

        {/* 5. Humidity Card */}
        <div className="glass-card-static p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Relative Humidity</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Activity size={16} />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white">{curr.humidity}%</div>
            <p className="text-xs text-slate-400 mt-1">Surface Pressure: {curr.surface_pressure} hPa</p>
          </div>
          <p className="text-[11px] text-slate-500">Vapor Saturation Index</p>
        </div>

        {/* 6. Cloud Cover Card */}
        <div className="glass-card-static p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Cloud Cover</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Cloud size={16} />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white">{curr.cloud_cover}%</div>
            <p className="text-xs text-purple-300 font-medium mt-1">
              {curr.cloud_cover > 80 ? 'Heavy Overcast' : curr.cloud_cover > 40 ? 'Partly Clouded' : 'Clear Sky'}
            </p>
          </div>
          <p className="text-[11px] text-slate-500">Satellite Infra-red Coverage</p>
        </div>

        {/* 7. Visibility Card */}
        <div className="glass-card-static p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Visibility</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Eye size={16} />
            </div>
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold text-white">
              {(curr.visibility / 1000).toFixed(1)} <span className="text-xs font-normal text-slate-400">km</span>
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-1">
              {curr.visibility >= 8000 ? 'Clear Visibility' : 'Reduced Visibility'}
            </p>
          </div>
          <p className="text-[11px] text-slate-500">Optical Atmospheric Range</p>
        </div>
      </div>

      {/* Interactive Forecast Components & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Hourly Forecast Chart (24 Hours) */}
        <div className="glass-card-static p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Hourly Forecast Chart (24 Hours)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Temperature curve and precipitation probability</p>
            </div>
            <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">24 Hours</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={hourlyList} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="tempArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px' }}
                formatter={(value: any, name: any) => [
                  name === 'temperature' ? `${value}°C` : `${value}%`,
                  name === 'temperature' ? 'Temperature' : 'Rain Probability'
                ]}
              />
              <Area type="monotone" dataKey="temperature" stroke="#3b82f6" strokeWidth={2} fill="url(#tempArea)" />
              <Line type="monotone" dataKey="precipitation_probability" stroke="#06b6d4" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: 7-Day Forecast Chart */}
        <div className="glass-card-static p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">7-Day Forecast Chart</h3>
              <p className="text-xs text-slate-400 mt-0.5">Maximum vs Minimum temperature profile</p>
            </div>
            <span className="text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">7 Days</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyList} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px' }}
              />
              <Bar dataKey="temp_max" fill="#3b82f6" name="Max Temp (°C)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="temp_min" fill="#06b6d4" name="Min Temp (°C)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Rainfall Forecast Graph */}
        <div className="glass-card-static p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Rainfall Forecast Graph</h3>
              <p className="text-xs text-slate-400 mt-0.5">Precipitation volume (mm) over 7 days</p>
            </div>
            <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">Precipitation</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyList} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px' }}
                formatter={(value: any) => [`${value} mm`, 'Rainfall']}
              />
              <Bar dataKey="rainfall" radius={[4, 4, 0, 0]}>
                {dailyList.map((entry: any, index: number) => (
                  <Cell
                    key={index}
                    fill={entry.rainfall > 50 ? '#ef4444' : entry.rainfall > 20 ? '#f59e0b' : '#3b82f6'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4: Temperature Trend Graph */}
        <div className="glass-card-static p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Temperature Trend Graph</h3>
              <p className="text-xs text-slate-400 mt-0.5">24-hour continuous temperature trend curve</p>
            </div>
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">Trend</span>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={hourlyList} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px' }}
                formatter={(value: any) => [`${value}°C`, 'Temperature']}
              />
              <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
