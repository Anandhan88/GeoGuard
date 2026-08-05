import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff, User, KeyRound, CheckCircle, X, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { useAppStore } from '../stores/useAppStore';

export default function Login() {
  const { user: firebaseUser, loading } = useAuth();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const storeUser = useAppStore((s) => s.user);
  const storeSignIn = useAppStore((s) => s.signIn);
  const storeSignUp = useAppStore((s) => s.signUp);
  const forgotPassword = useAppStore((s) => s.forgotPassword);
  const resetPassword = useAppStore((s) => s.resetPassword);

  const navigate = useNavigate();

  // Active Login Portal: 'citizen' | 'authority'
  const [activePortal, setActivePortal] = useState('citizen');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');

  // Auto pre-fill demo credentials on portal change
  useEffect(() => {
    if (activePortal === 'authority') {
      setEmail('authority@demo.com');
      setPassword('demo123');
    } else {
      setEmail('citizen@demo.com');
      setPassword('demo123');
    }
  }, [activePortal]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!loading && (firebaseUser || (isAuthenticated && storeUser))) {
      const targetRole = storeUser?.role || (activePortal === 'authority' ? 'authority' : 'citizen');
      navigate(targetRole === 'authority' ? '/app/authority' : '/app/citizen', { replace: true });
    }
  }, [firebaseUser, isAuthenticated, storeUser, loading, navigate, activePortal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      if (isLogin) {
        await storeSignIn(email, password);
      } else {
        if (!email || !password || !name) {
          setErrorMsg('All fields are required');
          setIsSubmitting(false);
          return;
        }
        await storeSignUp(email, password, name, activePortal);
      }
      navigate(activePortal === 'authority' ? '/app/authority' : '/app/citizen');
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    try {
      const res = await forgotPassword(forgotEmail);
      if (res.reset_token) {
        setResetToken(res.reset_token);
        setForgotSuccessMsg(res.message);
        setForgotStep(2);
      } else {
        setForgotSuccessMsg(res.message);
      }
    } catch (err) {
      setForgotErrorMsg(err.message || 'Failed to request password reset token');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    try {
      await resetPassword(forgotEmail, resetToken, newPassword);
      setForgotSuccessMsg('Password reset successfully! You can now log in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setEmail(forgotEmail);
        setPassword(newPassword);
      }, 1500);
    } catch (err) {
      setForgotErrorMsg(err.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-blue-400 flex items-center justify-center shadow-xl shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300">
              <Shield size={26} className="text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                GeoGuard<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400"> AI</span>
              </h1>
              <p className="text-xs font-medium text-slate-400">Disaster Intelligence Platform</p>
            </div>
          </Link>
        </div>

        {/* Dual Dashboard Portal Switcher */}
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-black/50">
          
          <div className="mb-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Select Login Portal
            </p>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/60">
              <button
                type="button"
                onClick={() => setActivePortal('citizen')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1 ${
                  activePortal === 'citizen'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <UserCheck size={16} />
                  <span>Citizen Portal</span>
                </div>
                <span className="text-[10px] font-normal opacity-80">Public Alerts & Evacuation</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePortal('authority')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1 ${
                  activePortal === 'authority'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <ShieldAlert size={16} />
                  <span>Authority Portal</span>
                </div>
                <span className="text-[10px] font-normal opacity-80">Emergency Management</span>
              </button>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {activePortal === 'authority' ? 'Emergency Authority Sign In' : 'Citizen Sign In'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {activePortal === 'authority'
                ? 'Access response coordination, alert management & shelter controls'
                : 'Access real-time risk predictions, SOS alerts & evacuation routes'}
            </p>
          </div>

          {/* Google Sign-In Option */}
          <div className="mb-6">
            <GoogleLoginButton
              role={activePortal}
              onSuccess={() => navigate(activePortal === 'authority' ? '/app/authority' : '/app/citizen')}
            />

            <div className="flex items-center gap-3 my-5">
              <div className="h-[1px] bg-slate-800 flex-1" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
                or sign in with email
              </span>
              <div className="h-[1px] bg-slate-800 flex-1" />
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-300 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-slate-300">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotStep(1);
                      setShowForgotModal(true);
                    }}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg active:scale-[0.99] disabled:opacity-50 ${
                activePortal === 'authority'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-cyan-500/20'
              }`}
            >
              <span>
                {isSubmitting
                  ? 'Authenticating...'
                  : isLogin
                  ? `Sign In to ${activePortal === 'authority' ? 'Authority' : 'Citizen'} Dashboard`
                  : 'Create Account'}
              </span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Toggle Register / Sign In */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <p className="text-xs text-slate-400">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1.5 text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Forgot Password Modal */}
        <AnimatePresence>
          {showForgotModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
              >
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-white"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Reset Password</h3>
                    <p className="text-xs text-slate-400">Step {forgotStep} of 2</p>
                  </div>
                </div>

                {forgotStep === 1 ? (
                  <form onSubmit={handleForgotRequest} className="space-y-4">
                    <p className="text-xs text-slate-300">
                      Enter your account email to receive a password reset token.
                    </p>
                    <div>
                      <label className="text-xs font-medium text-slate-300 mb-1.5 block">Email</label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {forgotErrorMsg && (
                      <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{forgotErrorMsg}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-xs"
                    >
                      Generate Reset Token
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetSubmit} className="space-y-4">
                    {forgotSuccessMsg && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                        <CheckCircle size={14} />
                        <span>{forgotSuccessMsg}</span>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-slate-300 mb-1.5 block">Reset Token</label>
                      <input
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Enter token from email/backend"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-300 mb-1.5 block">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    {forgotErrorMsg && (
                      <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">{forgotErrorMsg}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-xs"
                    >
                      Confirm New Password
                    </button>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[11px] text-slate-600 mt-6">
          Protected by Firebase Auth & GeoGuard AI Security.
        </p>
      </motion.div>
    </div>
  );
}
