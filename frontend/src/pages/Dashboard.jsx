import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Mail, ShieldCheck, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-cyan-900/30 to-slate-900 border border-cyan-500/20 rounded-3xl p-8 backdrop-blur-xl">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Welcome back, <span className="text-cyan-400">{user?.displayName || 'User'}</span>!
        </h1>
        <p className="text-sm text-slate-400 mt-2">
          Your Firebase Google Authentication session is active. You have full access to GeoGuard AI real-time risk intelligence.
        </p>
      </div>

      {/* Profile Details Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-800">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-1 shadow-lg shadow-cyan-500/20 shrink-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Profile'}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-white text-2xl font-bold">
                {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-bold text-white">{user?.displayName || 'Authenticated User'}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1">
                <ShieldCheck size={12} />
                Firebase Verified
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">{user?.email || 'No email associated'}</p>
          </div>

          <button
            onClick={handleLogout}
            className="py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-semibold text-xs transition-all flex items-center gap-2 shrink-0"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* User Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <User className="text-cyan-400 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-xs font-medium text-slate-500">Display Name</p>
              <p className="text-sm font-semibold text-white mt-0.5">{user?.displayName || 'N/A'}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3">
            <Mail className="text-cyan-400 mt-0.5 shrink-0" size={18} />
            <div>
              <p className="text-xs font-medium text-slate-500">Registered Email</p>
              <p className="text-sm font-semibold text-white mt-0.5">{user?.email || 'N/A'}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 md:col-span-2">
            <Key className="text-cyan-400 mt-0.5 shrink-0" size={18} />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-500">Firebase User ID (UID)</p>
              <p className="text-xs font-mono text-cyan-300 mt-1 truncate bg-slate-900 p-2 rounded-lg border border-slate-800">
                {user?.uid || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
