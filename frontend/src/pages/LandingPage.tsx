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
  Zap,
  Globe,
  Eye,
  Layers,
  ArrowRight,
  ArrowUpRight,
  Building,
  Truck,
  Menu,
  X,
  Waves,
  Mountain,
  CloudLightning,
  Droplets,
  Cpu,
  FileText,
} from 'lucide-react';

/* ─── DATA ─── */
const features = [
  { icon: Brain, title: 'AI Disaster Prediction', tag: 'PREDICTIVE AI', desc: 'XGBoost & LSTM neural networks analyze satellite, weather, and environmental telemetry to forecast catastrophe risks.' },
  { icon: AlertTriangle, title: 'Real-Time Early Alerts', tag: 'SUB-3 MINUTE', desc: 'Automated multi-channel alerts with precise severity classification reaching authorities and public before impact.' },
  { icon: Satellite, title: 'Satellite Imagery Vision', tag: 'U-NET & SEGFORMER', desc: 'Deep computer vision models process Sentinel & Landsat satellite imagery for flood extent and damage detection.' },
  { icon: Map, title: 'Live Risk Mapping', tag: 'HYPERLOCAL', desc: 'Dynamic hazard heatmaps displaying real-time inundation zones, shelter locations, and safe passage corridors.' },
  { icon: Navigation, title: 'AI Evacuation Routing', tag: 'A* PATHFINDING', desc: 'Generates optimal evacuation routes avoiding active hazard areas with real-time road accessibility awareness.' },
  { icon: Truck, title: 'Resource Optimization', tag: 'LOGISTICS AI', desc: 'Intelligent emergency supply & vehicle dispatch recommendation engine based on predicted impact severity.' },
];

const modules = [
  { icon: Brain, label: 'Risk Prediction', num: 'MOD-01', desc: 'Multi-hazard ML probability forecasting' },
  { icon: Waves, label: 'Flood Intelligence', num: 'MOD-02', desc: 'Hydrodynamic inundation depth modeling' },
  { icon: Satellite, label: 'Satellite Analysis', num: 'MOD-03', desc: 'Orbital imagery damage segmentation' },
  { icon: Users, label: 'Citizen Incident SOS', num: 'MOD-04', desc: 'Crowdsourced ground-truth verification' },
  { icon: Eye, label: 'Damage Assessment', num: 'MOD-05', desc: 'AI structural impact & loss estimation' },
  { icon: BarChart3, label: 'Impact Analytics', num: 'MOD-06', desc: 'Population & infrastructure exposure engine' },
  { icon: Navigation, label: 'Evacuation AI', num: 'MOD-07', desc: 'Dynamic routing avoiding flooded roads' },
  { icon: Building, label: 'Shelter Locator', num: 'MOD-08', desc: 'Real-time capacity & supply monitoring' },
  { icon: Truck, label: 'Resource Dispatch', num: 'MOD-09', desc: 'Emergency logistics prioritization' },
  { icon: Zap, label: 'Explainable AI', num: 'MOD-10', desc: 'Transparent model decision confidence' },
  { icon: MessageSquare, label: 'AI Assistant', num: 'MOD-[#11]', desc: 'Conversational emergency guidance' },
  { icon: Radio, label: 'Voice SOS Broadcast', num: 'MOD-12', desc: 'Automated multi-lingual alert voice alerts' },
];

const riskCards = [
  { label: 'Cyclone Risk', level: 'HIGH', color: '#FF5C5C', x: 'left-[52%] top-[8%]', icon: CloudLightning },
  { label: 'Flood Risk', level: 'MODERATE', color: '#F5B83D', x: 'right-[2%] top-[45%]', icon: Droplets },
  { label: 'Earthquake Risk', level: 'LOW', color: '#28D7A1', x: 'left-[48%] bottom-[12%]', icon: Mountain },
];

const whatWeDo = [
  {
    num: '01', title: 'PREDICT', img: '/images/predict-card.png',
    desc: 'Deep learning models process atmospheric and satellite data streams to forecast disaster timing and risk zones.',
    icon: Brain, color: '#19D3AE',
  },
  {
    num: '02', title: 'ALERT', img: '/images/alert-card.png',
    desc: 'Instant broadcast engine pushes emergency warnings to citizens and emergency authorities in under 3 minutes.',
    icon: AlertTriangle, color: '#FF5C5C',
  },
  {
    num: '03', title: 'RESPOND', img: '/images/respond-card.png',
    desc: 'Actionable mission intelligence optimizes rescue boat, ambulance, and supply allocation for rapid deployment.',
    icon: Users, color: '#20B8E8',
  },
  {
    num: '04', title: 'ANALYZE', img: '/images/analyze-card.png',
    desc: 'Post-event damage assessment and historical pattern analysis continuously strengthen future preparedness.',
    icon: BarChart3, color: '#F5B83D',
  },
];

const resources = [
  { icon: FileText, title: 'Disaster SOP Guides', category: 'PROTOCOLS', desc: 'Standard operating procedures for flood, cyclone, and seismic emergency management.' },
  { icon: AlertTriangle, title: 'Citizen Preparedness', category: 'SAFETY', desc: 'Evacuation checklists, emergency kit guidelines, and family survival protocols.' },
  { icon: BarChart3, title: 'Disaster Trend Reports', category: 'RESEARCH', desc: 'In-depth historical risk evaluations and climate vulnerability analytics.' },
  { icon: Cpu, title: 'Developer API Docs', category: 'INTEGRATION', desc: 'REST & WebSocket APIs for embedding GeoGuard intelligence into external systems.' },
];

/* ─── COMPONENT ─── */
export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary overflow-hidden font-sans">

      {/* ═══════ NAVBAR ═══════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50
          ? 'bg-bg-primary/90 backdrop-blur-xl border-b border-white/[0.08]'
          : 'bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group" aria-label="GeoGuard AI Home">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white font-display">
                GeoGuard
              </span>
            </div>
          </Link>

          {/* Desktop Links (No Live Map link as requested) */}
          <div className="hidden lg:flex items-center gap-8">
            <a href="#what-we-do" className="text-[13px] text-text-secondary hover:text-text-primary font-display font-semibold tracking-wide transition-colors">WHAT WE DO</a>
            <a href="#features" className="text-[13px] text-text-secondary hover:text-text-primary font-display font-semibold tracking-wide transition-colors">FEATURES</a>
            <a href="#modules" className="text-[13px] text-text-secondary hover:text-text-primary font-display font-semibold tracking-wide transition-colors">MODULES</a>
            <a href="#about" className="text-[13px] text-text-secondary hover:text-text-primary font-display font-semibold tracking-wide transition-colors">ABOUT</a>
            <a href="#resources" className="text-[13px] text-text-secondary hover:text-text-primary font-display font-semibold tracking-wide transition-colors">RESOURCES</a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="text-[13px] font-semibold text-text-secondary hover:text-text-primary font-display tracking-wider transition-colors px-4 py-2 rounded-md border border-white/[0.1] hover:border-white/[0.2]"
            >
              SIGN IN
            </Link>
            <Link
              to="/app"
              className="text-[13px] font-bold bg-accent-primary text-bg-primary px-5 py-2 rounded-md hover:bg-[#1de9bf] transition-all flex items-center gap-2 font-display tracking-wide"
            >
              LAUNCH PLATFORM
              <ArrowUpRight size={14} />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-text-secondary hover:text-text-primary"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            {mobileMenu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden bg-bg-secondary/95 backdrop-blur-xl border-b border-white/[0.08] px-6 py-4 space-y-3"
          >
            <a href="#what-we-do" onClick={() => setMobileMenu(false)} className="block text-sm text-text-secondary hover:text-text-primary py-1.5 font-display font-semibold">WHAT WE DO</a>
            <a href="#features" onClick={() => setMobileMenu(false)} className="block text-sm text-text-secondary hover:text-text-primary py-1.5 font-display font-semibold">FEATURES</a>
            <a href="#modules" onClick={() => setMobileMenu(false)} className="block text-sm text-text-secondary hover:text-text-primary py-1.5 font-display font-semibold">MODULES</a>
            <a href="#about" onClick={() => setMobileMenu(false)} className="block text-sm text-text-secondary hover:text-text-primary py-1.5 font-display font-semibold">ABOUT</a>
            <a href="#resources" onClick={() => setMobileMenu(false)} className="block text-sm text-text-secondary hover:text-text-primary py-1.5 font-display font-semibold">RESOURCES</a>
            <div className="pt-3 flex flex-col gap-2 border-t border-white/[0.08]">
              <Link to="/login" className="btn-secondary text-sm py-2.5 justify-center font-display" onClick={() => setMobileMenu(false)}>SIGN IN</Link>
              <Link to="/app" className="btn-primary text-sm py-2.5 justify-center font-display" onClick={() => setMobileMenu(false)}>LAUNCH PLATFORM <ArrowUpRight size={14} /></Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ═══════ HERO SECTION (SLIDE 1 - KEPT EXACTLY AS REQUESTED) ═══════ */}
      <section className="relative min-h-screen flex items-center px-6 pt-20 pb-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute inset-0 topo-pattern" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          {/* Left Content */}
          <div className="max-w-xl">
            {/* Status Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent-primary/10 border border-accent-primary/20 mb-8"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-pulse" />
              <span className="text-[11px] font-mono font-medium text-accent-primary tracking-wider uppercase">
                SYSTEM OPERATIONAL
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="heading-display text-[clamp(2.5rem,5vw,4rem)] mb-6 tracking-tight leading-none"
            >
              EARLY WARNINGS.{'\n'}
              BETTER DECISIONS.{'\n'}
              <span className="text-accent-primary">SAFER</span> TOMORROW.
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-text-secondary text-[15px] leading-relaxed mb-8 max-w-md"
            >
              GeoGuard AI uses advanced AI models, satellite data, and real-time analytics to predict disasters, alert communities, and support faster, smarter response.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-wrap gap-3"
            >
              <Link
                to="/app"
                className="btn-primary text-sm px-6 py-3 font-display tracking-wide font-bold"
                id="cta-launch"
              >
                Launch Platform
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/app/map"
                className="btn-secondary text-sm px-6 py-3 font-display tracking-wide font-semibold"
                id="cta-map"
              >
                <Map size={16} />
                View Live Map
              </Link>
            </motion.div>
          </div>

          {/* Right - Rotating Earth Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative flex items-center justify-center"
          >
            {/* Rotating Earth Sphere Container */}
            <div className="relative w-full max-w-[520px] aspect-square">
              {/* Rotating Original Earth Image */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="relative w-full h-full rounded-full overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_80px_rgba(25,211,174,0.15)]"
              >
                <img
                  src="/images/earth-hero.png"
                  alt="Satellite view of Earth showing disaster monitoring"
                  className="w-full h-full object-cover scale-105"
                  loading="eager"
                />
              </motion.div>

              {/* Atmospheric Glow Overlay */}
              <div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  boxShadow: 'inset 0 0 60px rgba(25,211,174,0.12), inset 20px -20px 60px rgba(0,0,0,0.85), 0 0 80px rgba(25,211,174,0.08)'
                }}
              />

              {/* Floating Risk Cards */}
              {riskCards.map((card) => (
                <div
                  key={card.label}
                  className={`absolute ${card.x} z-20`}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="flex items-center gap-2.5 bg-surface/85 backdrop-blur-md border border-white/[0.1] rounded-md px-3 py-2 shadow-lg"
                  >
                    <card.icon size={16} className="text-text-muted" />
                    <div>
                      <p className="text-[11px] font-semibold text-text-primary leading-tight font-display">{card.label}</p>
                      <p className="text-[10px] font-mono font-bold" style={{ color: card.color }}>{card.level}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: card.color }} />
                  </motion.div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ STATS BAR ═══════ */}
      <section className="relative border-y border-white/[0.08] bg-surface/40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: '12+', label: 'Disaster Types', sub: 'Monitored in real-time', icon: Layers },
              { value: '< 3 min', label: 'Alert Delivery', sub: 'Average alert delivery time', icon: Zap },
              { value: 'AI', label: 'Powered Models', sub: 'Deep learning & analytics', icon: Brain },
              { value: '3', label: 'Languages', sub: 'Accessible for all', icon: Globe },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg border border-white/[0.1] bg-surface flex items-center justify-center shrink-0">
                  <stat.icon size={18} className="text-accent-primary" />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-text-primary font-display tracking-tight">{stat.value}</span>
                  </div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-wider font-display">{stat.label}</p>
                  <p className="text-[10px] font-mono text-text-muted">{stat.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ WHAT WE DO ═══════ */}
      <section className="py-24 px-6 relative" id="what-we-do">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-14"
          >
            <span className="section-label">WHAT WE DO</span>
            <h2 className="heading-display text-3xl md:text-5xl mt-2 tracking-tight">
              INTELLIGENCE THAT SAVES LIVES
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whatWeDo.map((item, i) => (
              <motion.div
                key={item.num}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-lg overflow-hidden border border-white/[0.1] bg-surface/60 hover:border-accent-primary/40 transition-all shadow-lg flex flex-col justify-between"
              >
                {/* Image */}
                <div>
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-bg-primary/80 border border-white/[0.1] text-[10px] font-mono font-bold text-accent-primary">
                      {item.num}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon size={18} style={{ color: item.color }} />
                      <h3 className="text-lg font-bold text-text-primary font-display tracking-tight">{item.title}</h3>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-2 flex items-center gap-2 text-accent-primary text-xs font-mono font-bold group-hover:translate-x-1 transition-transform">
                  <span>DISASTER OPERATIONAL MATRIX</span>
                  <ArrowRight size={13} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ REDESIGNED FEATURES SECTION ═══════ */}
      <section id="features" className="py-24 px-6 bg-surface/30 border-y border-white/[0.08] relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4"
          >
            <div>
              <span className="section-label">CORE CAPABILITIES</span>
              <h2 className="heading-display text-3xl md:text-5xl mt-2 tracking-tight">
                MISSION-CRITICAL CAPABILITIES
              </h2>
            </div>
            <p className="text-text-secondary text-sm max-w-md font-sans">
              End-to-end disaster intelligence architecture built for emergency authorities, responders, and frontline communities.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="p-6 rounded-lg border border-white/[0.1] bg-surface/70 hover:border-accent-primary/50 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-md bg-accent-primary/10 border border-accent-primary/25 flex items-center justify-center group-hover:bg-accent-primary/20 transition-colors">
                    <f.icon size={20} className="text-accent-primary" />
                  </div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-accent-primary bg-accent-primary/10 px-2.5 py-1 rounded border border-accent-primary/20">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2 font-display tracking-tight group-hover:text-accent-primary transition-colors">
                  {f.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ REDESIGNED MODULES SECTION ═══════ */}
      <section id="modules" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="section-label">INTEGRATED MODULES</span>
            <h2 className="heading-display text-3xl md:text-5xl mt-2 tracking-tight">
              12 TACTICAL ECOSYSTEM MODULES
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-sm mt-3">
              Modular disaster management engines operating in real-time synchronization.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {modules.map((mod, i) => (
              <motion.div
                key={mod.num}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="group p-5 rounded-lg border border-white/[0.1] bg-surface/60 hover:border-accent-primary/40 hover:bg-surface transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold text-accent-primary">{mod.num}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent-primary/60 group-hover:bg-accent-primary animate-pulse" />
                  </div>
                  <mod.icon size={26} className="text-text-secondary group-hover:text-accent-primary transition-colors mb-3" />
                  <h4 className="text-base font-bold text-text-primary font-display tracking-tight mb-1">
                    {mod.label}
                  </h4>
                  <p className="text-xs text-text-muted leading-snug">
                    {mod.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-text-muted">
                  <span>STATUS</span>
                  <span className="text-accent-primary font-bold">ONLINE</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ REDESIGNED ABOUT SECTION ═══════ */}
      <section id="about" className="py-24 px-6 bg-surface/30 border-y border-white/[0.08] relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="section-label">ABOUT GEOGUARD AI</span>
              <h2 className="heading-display text-3xl md:text-5xl mt-2 mb-6 tracking-tight">
                AI-POWERED DISASTER INTELLIGENCE PLATFORM
              </h2>
              <p className="text-text-secondary text-sm leading-relaxed mb-5">
                GeoGuard AI is an enterprise-grade disaster intelligence platform engineered to provide early warning, situational awareness, and emergency response optimization.
              </p>
              <p className="text-text-muted text-xs leading-relaxed mb-8">
                Combining high-resolution satellite remote sensing, hydrodynamic flooding models, deep neural prediction pipelines, and real-time citizen report aggregation into a unified mission control interface.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'MISSION', desc: 'Democratize hyper-local disaster intelligence & early warnings' },
                  { label: 'ENGINEERING', desc: 'XGBoost, LSTM, U-Net, SegFormer & A* spatial routing' },
                  { label: 'LATENCY', desc: 'Sub-3 minute notification distribution engine' },
                  { label: 'ACCESSIBILITY', desc: 'Multi-lingual support across English, Tamil & Hindi' },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-md border border-white/[0.1] bg-surface/60">
                    <p className="text-xs font-mono font-bold text-accent-primary tracking-widest mb-1.5">{item.label}</p>
                    <p className="text-xs text-text-secondary leading-normal">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Tech Spec Matrix */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="rounded-lg border border-white/[0.1] bg-surface/80 p-7 shadow-xl space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-white/[0.08]">
                  <div className="w-11 h-11 rounded-md bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center">
                    <Shield size={22} className="text-accent-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary font-display tracking-tight">GEO GUARD AI</h3>
                    <p className="text-[10px] font-mono text-accent-primary uppercase tracking-widest">DISASTER INTELLIGENCE PLATFORM</p>
                  </div>
                </div>

                {[
                  { label: 'PREDICTION ENGINE', val: 'Multi-Hazard XGBoost & LSTM Neural Pipeline' },
                  { label: 'VISION ANALYTICS', val: 'Sentinel-1 & Sentinel-2 U-Net Segmentation' },
                  { label: 'RESPONSE MATRIX', val: 'Automated Dispatch & Evacuation Routing' },
                  { label: 'AUTHENTICATION', val: 'Firebase Enterprise & OAuth 2.0' },
                  { label: 'COMMUNICATION', val: 'Real-Time Alert WebSockets & Push API' },
                ].map((spec) => (
                  <div key={spec.label} className="py-2 border-b border-white/[0.05] last:border-0">
                    <p className="text-[10px] font-mono font-semibold text-text-muted tracking-widest">{spec.label}</p>
                    <p className="text-xs font-bold text-text-primary font-display tracking-wide mt-0.5">{spec.val}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════ REDESIGNED RESOURCES SECTION ═══════ */}
      <section id="resources" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="section-label">RESOURCES & KNOWLEDGE</span>
            <h2 className="heading-display text-3xl md:text-5xl mt-2 tracking-tight">
              TACTICAL DOCUMENTATION & APIS
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {resources.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-lg border border-white/[0.1] bg-surface/60 hover:border-accent-primary/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-md bg-accent-primary/10 border border-accent-primary/25 flex items-center justify-center">
                      <r.icon size={20} className="text-accent-primary" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-text-muted tracking-wider">{r.category}</span>
                  </div>
                  <h4 className="text-base font-bold text-text-primary font-display tracking-tight mb-2 group-hover:text-accent-primary transition-colors">
                    {r.title}
                  </h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {r.desc}
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono font-bold text-accent-primary">
                  <span>ACCESS DOCS</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA SECTION ═══════ */}
      <section className="py-24 px-6 relative border-t border-white/[0.08] bg-surface/30">
        <div className="absolute inset-0 topo-pattern opacity-40" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center relative z-10"
        >
          <h2 className="heading-display text-3xl md:text-5xl mb-4 tracking-tight">
            READY TO PROTECT YOUR COMMUNITY?
          </h2>
          <p className="text-sm text-text-secondary mb-8 max-w-lg mx-auto">
            Join disaster management authorities, emergency responders, and NGOs leveraging GeoGuard AI for hyper-local early warnings and rapid command response.
          </p>
          <Link
            to="/app"
            className="btn-primary text-sm px-8 py-3.5 shadow-glow-teal font-display font-bold tracking-wide"
          >
            LAUNCH PLATFORM NOW
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-white/[0.08] py-8 px-6 bg-bg-primary">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group hover:opacity-80 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white font-display">
              GeoGuard
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#what-we-do" className="text-xs font-mono text-text-muted hover:text-text-secondary transition-colors">WHAT WE DO</a>
            <a href="#features" className="text-xs font-mono text-text-muted hover:text-text-secondary transition-colors">FEATURES</a>
            <a href="#modules" className="text-xs font-mono text-text-muted hover:text-text-secondary transition-colors">MODULES</a>
            <a href="#about" className="text-xs font-mono text-text-muted hover:text-text-secondary transition-colors">ABOUT</a>
            <a href="#resources" className="text-xs font-mono text-text-muted hover:text-text-secondary transition-colors">RESOURCES</a>
          </div>
          <p className="text-xs font-mono text-text-muted">
            © 2026 GeoGuard. Built for humanity.
          </p>
        </div>
      </footer>
    </div>
  );
}
