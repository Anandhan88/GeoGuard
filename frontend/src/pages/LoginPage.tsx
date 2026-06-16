import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff, User, Phone } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'citizen' | 'authority'>('citizen');
  const navigate = useNavigate();
  const login = useAppStore((s) => s.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      id: 'user-001',
      email: email || 'demo@geoguard.ai',
      name: name || 'Demo User',
      role: role,
      languagePref: 'en',
    });
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6 relative grid-pattern">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow">
              <Shield size={26} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white">
                GeoGuard<span className="text-cyan-400"> AI</span>
              </h1>
              <p className="text-xs text-slate-500">Disaster Intelligence Platform</p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-card-static p-8">
          {/* Tab Toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="input-field pl-10"
                    id="register-name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  id="login-email"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="text-sm text-slate-400 mb-1.5 block">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['citizen', 'authority'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        role === r
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                          : 'border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      {r === 'citizen' ? '👤 Citizen' : '🛡️ Authority'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center py-3 text-base"
              id="login-submit"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-xs text-slate-500 text-center mb-3">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  login({ id: 'demo-citizen', email: 'citizen@demo.com', name: 'Rajesh Kumar', role: 'citizen', languagePref: 'en' });
                  navigate('/app');
                }}
                className="btn-secondary text-xs py-2 justify-center"
              >
                👤 Citizen Demo
              </button>
              <button
                onClick={() => {
                  login({ id: 'demo-authority', email: 'authority@demo.com', name: 'Dr. Priya IAS', role: 'authority', languagePref: 'en' });
                  navigate('/app');
                }}
                className="btn-secondary text-xs py-2 justify-center"
              >
                🛡️ Authority Demo
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          By continuing, you agree to GeoGuard AI's Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
