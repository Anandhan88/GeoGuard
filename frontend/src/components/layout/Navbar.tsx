import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Shield,
  Menu,
  Search,
  Globe,
  ChevronDown,
  AlertTriangle,
  X,
  User,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getAlertSeverityColor, formatRelativeTime } from '../../utils/helpers';

export default function Navbar() {
  const { toggleSidebar, alerts, unreadAlertCount, user, isAuthenticated, logout } = useAppStore();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  const activeAlerts = alerts.filter((a) => a.isActive);

  const currentUser = user || {
    name: 'Anandhan S',
    role: 'authority',
    email: 'anandhan@geoguard.ai',
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-bg-secondary/80 backdrop-blur-xl border-b border-white/5">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            id="sidebar-toggle"
          >
            <Menu size={20} className="text-slate-400" />
          </button>

          <Link to="/app" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <Shield size={20} className="text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-base font-bold text-white leading-tight">
                GeoGuard<span className="text-cyan-400"> AI</span>
              </h1>
              <p className="text-[10px] text-slate-500 leading-tight">Disaster Intelligence Platform</p>
            </div>
          </Link>
        </div>

        {/* Center - Search */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search zones, alerts, reports..."
              className="input-field pl-10 pr-4 py-2 text-sm bg-white/5"
              id="global-search"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Active Alert Ticker */}
          {activeAlerts.length > 0 && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 mr-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-medium">
                {activeAlerts.length} Active Alert{activeAlerts.length > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Language Selector */}
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-slate-400">
            <Globe size={16} />
            <span className="hidden md:inline">EN</span>
            <ChevronDown size={14} />
          </button>

          {/* Alerts Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAlerts(!showAlerts);
                setShowProfile(false);
              }}
              className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
              id="alerts-bell"
            >
              <Bell size={20} className="text-slate-400" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            {/* Alert Dropdown */}
            <AnimatePresence>
              {showAlerts && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-96 glass-card-static p-0 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Active Alerts</h3>
                    <button
                      onClick={() => setShowAlerts(false)}
                      className="p-1 rounded hover:bg-white/5"
                    >
                      <X size={14} className="text-slate-400" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {activeAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="px-4 py-3 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="mt-0.5 w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: getAlertSeverityColor(alert.severity) }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{alert.title}</p>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{alert.message}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${getAlertSeverityColor(alert.severity)}20`,
                                  color: getAlertSeverityColor(alert.severity),
                                }}
                              >
                                {alert.severity}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {formatRelativeTime(alert.issuedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/app/alerts"
                    onClick={() => setShowAlerts(false)}
                    className="block px-4 py-2.5 text-center text-xs text-cyan-400 hover:bg-white/5 transition-colors font-medium"
                  >
                    View All Alerts →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowAlerts(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              id="user-profile"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-white leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{currentUser.role}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden md:block" />
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 glass-card-static p-1"
                >
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left">
                    <User size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-300">Profile</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left">
                    <Settings size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-300">Settings</span>
                  </button>
                  <div className="border-t border-white/5 my-1" />
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut size={16} className="text-red-400" />
                    <span className="text-sm text-red-400">Logout</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
}
