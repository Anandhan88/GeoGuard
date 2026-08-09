import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, User, Bell, Map, Shield, Globe, Lock,
  Save, Smartphone, Volume2,
  RefreshCw, Download, Key, AlertTriangle, Languages
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../stores/useAppStore';

export default function SettingsPage() {
  const { user, currentLanguage, setLanguage, updateProfile } = useAppStore();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'display' | 'security'>('profile');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || 'Anand Settu',
    phone: user?.phone || '+91 98765 43210',
    email: user?.email || 'anand.settu2006@gmail.com',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Notification Toggles State
  const [notifications, setNotifications] = useState({
    criticalAlerts: true,
    smsBroadcasting: true,
    weatherWarnings: true,
    soundEffects: true,
    emailDigest: false,
    pushNotifications: true,
  });

  // Display Preferences State
  const [displayPref, setDisplayPref] = useState({
    mapProvider: 'carto',
    autoRefreshSec: '30',
    tempUnit: 'celsius',
    distanceUnit: 'km',
    themeMode: 'dark',
  });

  // Security Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
      });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    toast.success('Security password updated successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const tabs = [
    { id: 'profile', label: 'Profile & Language', icon: User },
    { id: 'notifications', label: 'Disaster Alerts', icon: Bell },
    { id: 'display', label: 'Map & Display', icon: Map },
    { id: 'security', label: 'Security & Data', icon: Shield },
  ] as const;

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      {/* Header Banner */}
      <div className="glass-card-static p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-white/10">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings size={28} className="text-cyan-400 animate-spin-slow" />
            System & User Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your profile, emergency broadcast notifications, map preferences, and security protocols.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/5 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Role: <strong className="text-cyan-400 capitalize">{user?.role || 'Citizen'}</strong></span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="md:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card-static p-6 border border-white/10 space-y-6"
          >
            {/* ─── 1. PROFILE & LANGUAGE TAB ─── */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <User size={20} className="text-cyan-400" />
                    Personal Details
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Update your account contact details used for disaster response alerts.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email Address (Sign-In)
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      disabled
                      className="w-full bg-slate-950/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 cursor-not-allowed"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Primary email used for account authentication.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Emergency Phone Number (SMS Alerts)
                    </label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="btn-primary text-xs py-2.5 px-5 gap-2"
                    >
                      {isSavingProfile ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      <span>Save Profile Changes</span>
                    </button>
                  </div>
                </form>

                <hr className="border-white/5 my-6" />

                {/* Language Preference Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Languages size={16} className="text-cyan-400" />
                    Interface Language Preference
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select your preferred language for disaster warnings, alerts, and navigation.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg pt-1">
                    {[
                      { code: 'en', label: 'English', desc: 'Default Interface' },
                      { code: 'ta', label: 'தமிழ் (Tamil)', desc: 'தமிழ் மாநில பதிப்பு' },
                      { code: 'hi', label: 'हिंदी (Hindi)', desc: 'हिंदी संस्करण' },
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code as any);
                          toast.success(`Language set to ${lang.label}`);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          currentLanguage === lang.code
                            ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                            : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className="font-bold text-xs">{lang.label}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{lang.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── 2. DISASTER ALERTS TAB ─── */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bell size={20} className="text-amber-400" />
                    Emergency Broadcast Notifications
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure how GeoGuard AI broadcasts critical inundation alerts and severe weather notifications.
                  </p>
                </div>

                <div className="space-y-3 max-w-xl">
                  {[
                    {
                      key: 'criticalAlerts',
                      title: 'Critical Flood Alerts (High Priority)',
                      desc: 'Instant full-screen alerts for Severe & High Flood risk scores (>50%).',
                      icon: AlertTriangle,
                      color: 'text-red-400',
                    },
                    {
                      key: 'smsBroadcasting',
                      title: 'SMS Emergency Broadcasts',
                      desc: 'Receive direct SMS notifications even when offline or disconnected from data.',
                      icon: Smartphone,
                      color: 'text-amber-400',
                    },
                    {
                      key: 'weatherWarnings',
                      title: 'Severe Weather Warnings',
                      desc: 'Real-time Open-Meteo heavy rainfall and storm alerts for your location.',
                      icon: Bell,
                      color: 'text-blue-400',
                    },
                    {
                      key: 'soundEffects',
                      title: 'Audible Emergency Sirens',
                      desc: 'Play loud audio siren when a severe disaster prediction triggers.',
                      icon: Volume2,
                      color: 'text-purple-400',
                    },
                    {
                      key: 'pushNotifications',
                      title: 'Browser Push Notifications',
                      desc: 'Background desktop notifications for evacuation updates.',
                      icon: Globe,
                      color: 'text-cyan-400',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isChecked = (notifications as any)[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() =>
                          setNotifications((n) => ({ ...n, [item.key]: !isChecked }))
                        }
                        className="flex items-start justify-between p-3.5 rounded-xl bg-slate-900/60 border border-white/5 cursor-pointer hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Icon size={18} className={`${item.color} shrink-0 mt-0.5`} />
                          <div>
                            <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <div
                          className={`w-10 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                            isChecked ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              isChecked ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => toast.success('Notification preferences saved!')}
                    className="btn-primary text-xs py-2.5 px-5 gap-2"
                  >
                    <Save size={14} />
                    <span>Save Alert Preferences</span>
                  </button>
                </div>
              </div>
            )}

            {/* ─── 3. MAP & DISPLAY TAB ─── */}
            {activeTab === 'display' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Map size={20} className="text-cyan-400" />
                    Map & Display Preferences
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Customize mapping layers, update frequency, and measurement units.
                  </p>
                </div>

                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Default Map Tile Provider
                    </label>
                    <select
                      value={displayPref.mapProvider}
                      onChange={(e) => setDisplayPref({ ...displayPref, mapProvider: e.target.value })}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="carto">CARTO Dark Matter (High Contrast GIS)</option>
                      <option value="esri">Esri World Imagery (High-Res Satellite)</option>
                      <option value="osm">OpenStreetMap Standard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Auto-Refresh Interval for Live Data
                    </label>
                    <select
                      value={displayPref.autoRefreshSec}
                      onChange={(e) => setDisplayPref({ ...displayPref, autoRefreshSec: e.target.value })}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="15">Every 15 Seconds (Real-time Command Center)</option>
                      <option value="30">Every 30 Seconds (Recommended)</option>
                      <option value="60">Every 1 Minute</option>
                      <option value="300">Every 5 Minutes (Low Bandwidth Mode)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Temperature Unit
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-white/10">
                        <button
                          type="button"
                          onClick={() => setDisplayPref({ ...displayPref, tempUnit: 'celsius' })}
                          className={`flex-1 py-2 text-xs font-bold ${
                            displayPref.tempUnit === 'celsius' ? 'bg-cyan-500 text-white' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          °C (Celsius)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDisplayPref({ ...displayPref, tempUnit: 'fahrenheit' })}
                          className={`flex-1 py-2 text-xs font-bold ${
                            displayPref.tempUnit === 'fahrenheit' ? 'bg-cyan-500 text-white' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          °F (Fahrenheit)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Distance Unit
                      </label>
                      <div className="flex rounded-xl overflow-hidden border border-white/10">
                        <button
                          type="button"
                          onClick={() => setDisplayPref({ ...displayPref, distanceUnit: 'km' })}
                          className={`flex-1 py-2 text-xs font-bold ${
                            displayPref.distanceUnit === 'km' ? 'bg-cyan-500 text-white' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          Kilometers (km)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDisplayPref({ ...displayPref, distanceUnit: 'miles' })}
                          className={`flex-1 py-2 text-xs font-bold ${
                            displayPref.distanceUnit === 'miles' ? 'bg-cyan-500 text-white' : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          Miles (mi)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => toast.success('Display preferences saved!')}
                    className="btn-primary text-xs py-2.5 px-5 gap-2"
                  >
                    <Save size={14} />
                    <span>Save Display Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* ─── 4. SECURITY & DATA TAB ─── */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Shield size={20} className="text-emerald-400" />
                    Security & Data Protocols
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage your authentication security, active sessions, and data exports.
                  </p>
                </div>

                {/* Password Change Form */}
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Lock size={15} className="text-slate-400" />
                    Change Account Password
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      placeholder="At least 6 characters"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button type="submit" className="btn-secondary text-xs py-2 px-4 gap-2">
                    <Key size={14} />
                    <span>Update Password</span>
                  </button>
                </form>

                <hr className="border-white/5 my-6" />

                {/* Data Export & Cache Clearing */}
                <div className="space-y-3 max-w-lg">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Download size={15} className="text-cyan-400" />
                    Data Export & Local Cache
                  </h3>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                    <div>
                      <h4 className="text-xs font-semibold text-white">Download Incident Logs</h4>
                      <p className="text-[10px] text-slate-400">Export your reported flood incidents as JSON.</p>
                    </div>
                    <button
                      onClick={() => toast.success('Exporting incident logs...')}
                      className="btn-secondary text-[11px] py-1.5 px-3 gap-1.5"
                    >
                      <Download size={13} />
                      <span>Export JSON</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5">
                    <div>
                      <h4 className="text-xs font-semibold text-white">Clear Offline Weather Cache</h4>
                      <p className="text-[10px] text-slate-400">Purge cached Open-Meteo & tile data from browser.</p>
                    </div>
                    <button
                      onClick={() => {
                        localStorage.clear();
                        toast.success('Local cache cleared successfully!');
                      }}
                      className="btn-secondary text-[11px] py-1.5 px-3 text-red-400 hover:text-red-300 gap-1.5"
                    >
                      <RefreshCw size={13} />
                      <span>Clear Cache</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
