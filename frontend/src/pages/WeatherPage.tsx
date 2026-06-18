import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Droplets, Wind, Thermometer, Activity, Eye,
  AlertTriangle, Cloud, Zap, MapPin, RefreshCw,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { api } from '../utils/api';
import { mockWeatherData } from '../data/mockData';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeatherPage() {
  const [weather, setWeather] = useState<any>(mockWeatherData);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const res = await api.get('/weather/current');
      setWeather(res.data);
      setLastUpdated(new Date());
    } catch (e) {
      setWeather(mockWeatherData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  // Build hourly chart data from mockData rainfallForecast or weather data
  const hourlyData = weather.hourlyForecast || [
    { time: '6AM', rainfall: 12, predicted: false },
    { time: '9AM', rainfall: 28, predicted: false },
    { time: '12PM', rainfall: 45, predicted: false },
    { time: '3PM', rainfall: 52, predicted: false },
    { time: '6PM', rainfall: 72, predicted: true },
    { time: '9PM', rainfall: 85, predicted: true },
    { time: '12AM', rainfall: 65, predicted: true },
    { time: '3AM', rainfall: 45, predicted: true },
  ];

  const forecast = weather.forecast || mockWeatherData.forecast;

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Cloud size={24} className="text-blue-400" />
            Weather Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
            <MapPin size={12} />
            Chennai Metropolitan Area ·{' '}
            {loading ? 'Updating...' : `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        </div>
        <button
          onClick={fetchWeather}
          disabled={loading}
          className="btn-secondary text-xs py-2 gap-2"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* IMD Warning Banner */}
      {weather.imdWarning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20"
        >
          <AlertTriangle size={18} className="text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">{weather.imdWarning}</p>
        </motion.div>
      )}

      {/* Current conditions + 5-day side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Conditions */}
        <div className="lg:col-span-1 glass-card-static p-6">
          <div className="text-center mb-6">
            <span className="text-6xl">{weather.icon || '🌧️'}</span>
            <div className="mt-3">
              <p className="text-5xl font-black text-white">{weather.temperature}°<span className="text-2xl font-normal text-slate-400">C</span></p>
              <p className="text-slate-400 mt-1 font-medium">{weather.condition}</p>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Feels like {weather.feelsLike || Math.round(weather.temperature + 7)}°C
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Droplets, label: 'Rainfall', value: `${weather.rainfall} mm`, color: '#3b82f6' },
              { icon: Wind, label: 'Wind', value: `${weather.windSpeed} km/h ${weather.windDirection || ''}`, color: '#06b6d4' },
              { icon: Thermometer, label: 'Humidity', value: `${weather.humidity}%`, color: '#f59e0b' },
              { icon: Activity, label: 'Pressure', value: `${weather.pressure} hPa`, color: '#8b5cf6' },
              { icon: Eye, label: 'Visibility', value: `${weather.visibility || 5} km`, color: '#10b981' },
              { icon: Zap, label: 'UV Index', value: `${weather.uvIndex || 2}`, color: '#ec4899' },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                <m.icon size={14} style={{ color: m.color }} />
                <div>
                  <p className="text-[10px] text-slate-500">{m.label}</p>
                  <p className="text-xs font-semibold text-white">{m.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="lg:col-span-2 glass-card-static p-6">
          <h2 className="text-base font-semibold text-white mb-4">5-Day Forecast</h2>
          <div className="grid grid-cols-5 gap-3">
            {forecast.slice(0, 5).map((day: any, i: number) => {
              const date = new Date(day.date);
              const dayName = i === 0 ? 'Today' : DAYS[date.getDay()];
              const rainIntensity = day.rainfall > 70 ? '#ef4444' : day.rainfall > 40 ? '#f59e0b' : '#10b981';
              return (
                <motion.div
                  key={day.date}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                    i === 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-400">{dayName}</p>
                  <p className="text-3xl my-3">{day.icon}</p>
                  <p className="text-sm font-bold text-white">{day.tempHigh}°</p>
                  <p className="text-xs text-slate-500">{day.tempLow}°</p>
                  <div className="mt-2 flex items-center gap-1">
                    <Droplets size={10} style={{ color: rainIntensity }} />
                    <span className="text-[10px]" style={{ color: rainIntensity }}>{day.rainfall}mm</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Hourly Rainfall Chart */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              Hourly Rainfall Forecast
              <span className="text-[10px] text-slate-500">(actual vs predicted)</span>
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourlyData} margin={{ left: -10 }}>
                <defs>
                  <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.3} />
                  </linearGradient>
                  <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.2} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.05)" />
                <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(148,163,184,0.1)',
                    borderRadius: '12px',
                  }}
                  formatter={(value: any) => [`${value} mm/hr`, 'Rainfall']}
                />
                <Bar dataKey="rainfall" radius={[3, 3, 0, 0]}>
                  {hourlyData.map((entry: any, index: number) => (
                    <Cell
                      key={index}
                      fill={entry.predicted ? 'url(#predGrad)' : 'url(#rainGrad)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                <span className="text-[10px] text-slate-400">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-cyan-500 opacity-60" />
                <span className="text-[10px] text-slate-400">Predicted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Risk Impact Summary */}
      <div className="glass-card-static p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber-400" />
          Weather-Driven Risk Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Flash Flood Risk',
              value: 'Very High',
              pct: 88,
              color: '#ef4444',
              desc: 'Rainfall exceeds 65mm/hr. Rivers near danger level.',
            },
            {
              title: 'Road Inundation',
              value: 'High',
              pct: 72,
              color: '#f59e0b',
              desc: 'Low-lying areas and underpasses at risk of waterlogging.',
            },
            {
              title: 'Power Outage Risk',
              value: 'Moderate',
              pct: 51,
              color: '#06b6d4',
              desc: 'High winds may affect overhead power infrastructure.',
            },
          ].map((risk) => (
            <div key={risk.title} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">{risk.title}</p>
                <span className="text-xs font-bold" style={{ color: risk.color }}>{risk.value}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden mb-2">
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${risk.pct}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{ backgroundColor: risk.color }}
                />
              </div>
              <p className="text-xs text-slate-400">{risk.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
