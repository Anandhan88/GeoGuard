import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getAlertSeverityColor, formatRelativeTime } from '../../utils/helpers';
import { useTranslation } from '../../utils/translations';

export default function Navbar() {
  const { t, lang } = useTranslation();
  const { toggleSidebar, alerts, unreadAlertCount, user, logout, setLanguage, updateProfile } = useAppStore();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
    name: 'Anandhan S',
    role: 'authority',
    email: 'anandhan@geoguard.ai',
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
              <p className="text-[10px] text-slate-500 leading-tight">{t('disaster_intelligence')}</p>
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
              placeholder={t('search_placeholder')}
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
                {activeAlerts.length} {t('active_alerts')}
              </span>
            </div>
          )}

          {/* Language Selector Dropdown */}
          <div className="relative">
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

          <div className="relative">
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
          <div className="relative">
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
                    onClick={openProfileModal}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <Settings size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-300">{t('settings')}</span>
                  </button>
                  <div className="border-t border-white/5 my-1" />
                  <button
                    onClick={logout}
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
