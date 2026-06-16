import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Brain,
  Map,
  AlertTriangle,
  Navigation,
  Users,
  BarChart3,
  Satellite,
  MessageSquare,
  Radio,
  ChevronRight,
  Zap,
  Globe,
  Eye,
  Activity,
  Layers,
  ArrowRight,
  Building,
  Truck,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Risk Prediction',
    description: 'XGBoost & LSTM models predict disaster probability with hyperlocal precision before events occur.',
    color: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Map,
    title: 'Interactive Risk Maps',
    description: 'Real-time heatmaps, flood zones, shelter locations, and evacuation routes on interactive maps.',
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: AlertTriangle,
    title: 'Early Warning System',
    description: 'Automated multi-channel alerts with severity levels, reaching citizens minutes before impact.',
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Satellite,
    title: 'Satellite Analysis',
    description: 'U-Net & SegFormer analyze satellite imagery for flood detection, fire tracking, and damage assessment.',
    color: '#8b5cf6',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: Navigation,
    title: 'Smart Evacuation',
    description: 'A* pathfinding generates safe evacuation routes avoiding flood zones with real-time traffic awareness.',
    color: '#06b6d4',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Eye,
    title: 'Explainable AI',
    description: 'Every prediction includes transparent reasoning — what factors contributed and confidence levels.',
    color: '#ec4899',
    gradient: 'from-pink-500 to-rose-500',
  },
];

const stats = [
  { value: '99.2%', label: 'Prediction Accuracy', icon: Activity },
  { value: '< 3min', label: 'Alert Delivery', icon: Zap },
  { value: '12+', label: 'Disaster Types', icon: Layers },
  { value: '3', label: 'Languages', icon: Globe },
];

const floatingParticles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 20 + 10,
  delay: Math.random() * 5,
}));

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary overflow-hidden">
      {/* Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 50
            ? 'bg-bg-primary/80 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">
                GeoGuard<span className="text-cyan-400"> AI</span>
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#modules" className="text-sm text-slate-400 hover:text-white transition-colors">Modules</a>
            <a href="#stats" className="text-sm text-slate-400 hover:text-white transition-colors">Stats</a>
            <Link to="/login" className="btn-secondary text-sm py-2 px-4">Sign In</Link>
            <Link to="/app" className="btn-primary text-sm py-2 px-5">
              Launch Platform <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 grid-pattern">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Orbs */}
          <div
            className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] animate-float"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] animate-float"
            style={{ animationDelay: '3s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[128px]"
          />

          {/* Floating Particles */}
          {floatingParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-cyan-500/20"
              style={{
                width: particle.size,
                height: particle.size,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Animated Ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-[500px] h-[500px] rounded-full border border-cyan-500/5 animate-rotate-slow" />
            <div
              className="absolute inset-8 rounded-full border border-blue-500/5 animate-rotate-slow"
              style={{ animationDirection: 'reverse', animationDuration: '30s' }}
            />
            <div
              className="absolute inset-16 rounded-full border border-purple-500/5 animate-rotate-slow"
              style={{ animationDuration: '25s' }}
            />
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Live Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-blue-300 font-medium">
              AI-Powered Disaster Intelligence — Live
            </span>
            <Radio size={14} className="text-blue-400 animate-pulse" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-black text-white leading-tight mb-6"
          >
            Predict. Protect.{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent animate-gradient">
              Save Lives.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Hyperlocal disaster early warning platform powered by AI, satellite imagery, 
            and citizen intelligence. Predict disasters before they strike, plan evacuations, 
            and allocate resources — all in real-time.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/app"
              className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
              id="cta-launch"
            >
              Launch Platform
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/app/map"
              className="btn-secondary text-base px-8 py-3.5"
              id="cta-map"
            >
              <Map size={20} />
              View Live Map
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-8 mt-16"
            id="stats"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon size={18} className="text-cyan-400" />
                  <span className="text-2xl md:text-3xl font-bold text-white">{stat.value}</span>
                </div>
                <span className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-slate-400 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-sm text-cyan-400 font-semibold uppercase tracking-wider">Core Capabilities</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-3 mb-4">
              Intelligence at Every Stage
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              From prediction to response — a unified platform covering the entire disaster lifecycle.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="glass-card p-6 group cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  style={{ boxShadow: `0 8px 24px ${feature.color}30` }}
                >
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-24 px-6 bg-bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-sm text-purple-400 font-semibold uppercase tracking-wider">Platform Modules</span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-3 mb-4">
              12 Integrated Modules
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Each module works independently and together, creating a comprehensive disaster intelligence ecosystem.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: Brain, label: 'Risk Prediction', num: '01' },
              { icon: Activity, label: 'Flood Intelligence', num: '02' },
              { icon: Satellite, label: 'Satellite Analysis', num: '03' },
              { icon: Users, label: 'Citizen Reports', num: '04' },
              { icon: Eye, label: 'Damage Assessment', num: '05' },
              { icon: BarChart3, label: 'Impact Engine', num: '06' },
              { icon: Navigation, label: 'Evacuation AI', num: '07' },
              { icon: Building, label: 'Shelter Finder', num: '08' },
              { icon: Truck, label: 'Resource Planner', num: '09' },
              { icon: Zap, label: 'Explainable AI', num: '10' },
              { icon: MessageSquare, label: 'AI Assistant', num: '11' },
              { icon: Radio, label: 'Voice Emergency', num: '12' },
            ].map((mod, i) => (
              <motion.div
                key={mod.num}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="glass-card p-5 text-center group cursor-pointer"
              >
                <span className="text-[10px] font-mono text-slate-600 mb-2 block">{mod.num}</span>
                <mod.icon size={28} className="mx-auto text-slate-400 group-hover:text-cyan-400 transition-colors mb-3" />
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">
                  {mod.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-blue-500/5 rounded-full blur-[128px]" />
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-[128px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Protect Your Community?
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Join disaster management authorities, NGOs, and emergency responders using GeoGuard AI 
            to make informed decisions and save lives.
          </p>
          <Link
            to="/app"
            className="btn-primary text-lg px-10 py-4 shadow-xl shadow-blue-500/25"
          >
            Get Started Now
            <ArrowRight size={22} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-sm text-slate-400">
              GeoGuard AI — Disaster Intelligence Platform
            </span>
          </div>
          <p className="text-sm text-slate-600">
            © 2026 GeoGuard AI. Built with 🤖 AI for 🌍 humanity.
          </p>
        </div>
      </footer>
    </div>
  );
}


