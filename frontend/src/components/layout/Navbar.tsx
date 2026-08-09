import { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Bell,
  Shield,
  Menu,
  Search,
  Globe,
  ChevronDown,
  X,
  User,
  LogOut,
  Settings,
  Bot,
  Compass,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getAlertSeverityColor, formatRelativeTime } from '../../utils/helpers';
import { useTranslation } from '../../utils/translations';
import { api } from '../../utils/api';

export default function Navbar() {
  const { logout: firebaseLogout } = useAuth();
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const {
    toggleSidebar,
    alerts,
    unreadAlertCount,
    user,
    logout,
    setLanguage,
    updateProfile,
    selectedLocation,
    setSelectedLocation,
    detectUserLocation,
  } = useAppStore();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimeoutRef = useRef<any>(null);

  // Refs for click outside detection
  const languageRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setShowAlerts(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = useCallback((val: string) => {
    setSearchQuery(val);
    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setIsSearching(true);
    setShowSuggestions(true);

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/weather/search?query=${encodeURIComponent(val)}`);
        setSuggestions(res.data || []);
        setShowSuggestions(true);
      } catch (e) {
        console.error("Geocoding search failed:", e);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  }, []);

  const handleSelectSuggestion = (suggestion: any) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setSelectedLocation({
      name: suggestion.name,
      lat: suggestion.lat,
      lng: suggestion.lng,
    });
    setSearchQuery(suggestion.name.split(',')[0]);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsSearching(false);
  };

  // Profile settings modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLang, setProfileLang] = useState<'en' | 'ta' | 'hi'>('en');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const activeAlerts = [...alerts]
    .filter((a) => a.isActive)
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  const currentUser = user || {
    name: 'Citizen User',
    role: 'citizen',
    email: 'citizen@geoguard.ai',
    phone: '',
    languagePref: 'en',
  };

  const openProfileModal = () => {
    setProfileName(currentUser.name);
    setProfilePhone(currentUser.phone || '');
    setProfileLang((currentUser.languagePref as any) || 'en');
    setShowProfileModal(true);
    setShowProfile(false); // Close dropdown
  };

  const handleLogout = async () => {
    setShowProfile(false);
    try {
      await firebaseLogout();
    } catch (err) {
      console.error("Firebase logout error:", err);
    }
    logout();
    localStorage.removeItem('geoguard_access_token');
    localStorage.removeItem('geoguard_refresh_token');
    navigate('/login', { replace: true });
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
                GeoGuard
              </h1>
              <p className="text-[10px] text-slate-500 leading-tight">{t('disaster_intelligence')}</p>
            </div>
          </Link>
        </div>

        {/* Center - Search & Geolocation */}
        <div ref={searchRef} className="hidden lg:flex flex-1 max-w-lg mx-6 items-center gap-2 relative">
          <button
            type="button"
            onClick={async () => {
              setSearchQuery('');
              setSuggestions([]);
              setShowSuggestions(false);
              toast.loading('Locating GPS position & loading reports...', { id: 'gps-locate' });
              await detectUserLocation();
              toast.success('Returned to current location reports!', { id: 'gps-locate' });
            }}
            className="p-2 rounded-lg bg-surface hover:bg-accent-primary/20 text-accent-primary border border-white/10 transition-colors flex items-center gap-1.5 shrink-0 text-xs font-mono cursor-pointer"
            title="Return to My Current Location (GPS)"
          >
            <Compass size={15} className="animate-pulse" />
            <span className="hidden xl:inline text-[11px]">GPS AUTO</span>
          </button>

          <div className="relative flex-1">
            {isSearching ? (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  if (suggestions.length > 0) {
                    handleSelectSuggestion(suggestions[0]);
                  } else if (searchQuery.trim().length >= 2) {
                    try {
                      const res = await api.get(`/weather/search?query=${encodeURIComponent(searchQuery)}`);
                      if (res.data && res.data.length > 0) {
                        handleSelectSuggestion(res.data[0]);
                      } else {
                        setSelectedLocation({
                          name: `${searchQuery.trim()}, India`,
                          lat: 11.2715,
                          lng: 77.6066
                        });
                        setShowSuggestions(false);
                      }
                    } catch (err) {
                      setSelectedLocation({
                        name: `${searchQuery.trim()}, India`,
                        lat: 11.2715,
                        lng: 77.6066
                      });
                      setShowSuggestions(false);
                    }
                  }
                }
              }}
              placeholder={selectedLocation ? `📍 ${selectedLocation.name.split(',')[0]} (or search location...)` : t('search_placeholder')}
              className="input-field pl-10 pr-10 py-2 text-sm bg-white/5 w-full font-sans"
              id="global-search"
              autoComplete="off"
            />
            {selectedLocation && (
              <button
                onClick={() => {
                  setSelectedLocation(null);
                  setSearchQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                title="Clear selected location"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || isSearching) && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowSuggestions(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto"
                >
                  {isSearching && suggestions.length === 0 && (
                    <div className="px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      Searching locations...
                    </div>
                  )}
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full px-4 py-2.5 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0 flex flex-col gap-0.5"
                    >
                      <span className="font-semibold text-slate-200">
                        {s.name.split(',')[0]}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">
                        {s.name}
                      </span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Active Alert Ticker */}
          {activeAlerts.length > 0 && (
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 mr-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-medium">
                {activeAlerts.length} {t('active_alerts')}
              </span>
            </div>
          )}

          {/* Language Selector Dropdown */}
          <div ref={languageRef} className="relative">
            <button
              onClick={() => {
                setShowLanguageDropdown(!showLanguageDropdown);
                setShowAlerts(false);
                setShowProfile(false);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-slate-400"
            >
              <Globe size={16} />
              <span className="hidden md:inline uppercase">{lang}</span>
              <ChevronDown size={14} />
            </button>

            <AnimatePresence>
              {showLanguageDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-40 glass-card-static p-1 border border-white/5"
                >
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left text-sm ${lang === 'en' ? 'text-cyan-400 font-medium' : 'text-slate-300'}`}
                  >
                    <span>English</span>
                    {lang === 'en' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('ta');
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left text-sm ${lang === 'ta' ? 'text-cyan-400 font-medium' : 'text-slate-300'}`}
                  >
                    <span>தமிழ் (Tamil)</span>
                    {lang === 'ta' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('hi');
                      setShowLanguageDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left text-sm ${lang === 'hi' ? 'text-cyan-400 font-medium' : 'text-slate-300'}`}
                  >
                    <span>हिन्दी (Hindi)</span>
                    {lang === 'hi' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Assistant Quick Launch */}
          <Link
            to="/app/assistant"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-blue-500/10 transition-colors text-sm text-slate-400 hover:text-blue-400 border border-transparent hover:border-blue-500/20"
            title={t('ai_assistant')}
          >
            <Bot size={16} />
            <span className="hidden lg:inline text-xs font-medium">{t('ai_assistant')}</span>
          </Link>

          <div ref={alertsRef} className="relative">
            <button
              onClick={() => {
                setShowAlerts(!showAlerts);
                setShowProfile(false);
                setShowLanguageDropdown(false);
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
                  className="absolute right-0 mt-2 w-96 glass-card-static p-0 overflow-hidden border border-white/5"
                >
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{t('active_alerts')}</h3>
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
                            <p className="text-sm font-medium text-white truncate">{alert.type}</p>
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
                    {activeAlerts.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500">
                        {t('no_active_alerts')}
                      </div>
                    )}
                  </div>
                  <Link
                    to="/app/alerts"
                    onClick={() => setShowAlerts(false)}
                    className="block px-4 py-2.5 text-center text-xs text-cyan-400 hover:bg-white/5 transition-colors font-medium border-t border-white/5"
                  >
                    {t('active_alerts')} →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowAlerts(false);
                setShowLanguageDropdown(false);
              }}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
              id="user-profile"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-purple-500/20">
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
                  className="absolute right-0 mt-2 w-56 glass-card-static p-1 border border-white/5"
                >
                  <button
                    onClick={openProfileModal}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <User size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-300">{t('profile')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowProfile(false);
                      navigate('/app/settings');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <Settings size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-300">{t('settings')}</span>
                  </button>
                  <div className="border-t border-white/5 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut size={16} className="text-red-400" />
                    <span className="text-sm text-red-400">{t('logout')}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Profile & Settings Modal Overlay */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card-static p-6 shadow-2xl border border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings size={18} className="text-cyan-400" />
                  {t('profile')} & {t('settings')}
                </h3>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                {/* User Card */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-purple-500/20">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{currentUser.name}</h4>
                    <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                {/* Form fields */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="input-field py-2 text-sm bg-white/5"
                    placeholder="Enter name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="input-field py-2 text-sm bg-white/5"
                    placeholder="+91-XXXXX XXXXX"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">{t('language')}</label>
                  <select
                    value={profileLang}
                    onChange={(e) => setProfileLang(e.target.value as any)}
                    className="input-field py-2 text-sm bg-white/5 text-white select-custom cursor-pointer"
                  >
                    <option value="en" className="bg-bg-secondary text-white">English</option>
                    <option value="ta" className="bg-bg-secondary text-white">தமிழ் (Tamil)</option>
                    <option value="hi" className="bg-bg-secondary text-white">हिन्दी (Hindi)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  disabled={isUpdatingProfile}
                  onClick={async () => {
                    setIsUpdatingProfile(true);
                    try {
                      await updateProfile({
                        name: profileName,
                        phone: profilePhone,
                        languagePref: profileLang,
                      });
                      setShowProfileModal(false);
                    } catch (err) {
                      console.error("Failed to update profile", err);
                    } finally {
                      setIsUpdatingProfile(false);
                    }
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg hover:shadow-blue-500/20 text-white transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isUpdatingProfile ? t('verifying') : t('submit')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </nav>
  );
}
