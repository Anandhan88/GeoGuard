import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, PhoneCall, ShieldAlert, BookOpen, ChevronDown,
  Search, MessageSquare, ExternalLink, CheckCircle2, AlertTriangle,
  LifeBuoy, Radio, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HelpPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const emergencyHelplines = [
    { name: 'National Emergency Number', number: '112', icon: PhoneCall, bg: 'from-red-600 to-rose-700' },
    { name: 'NDRF Disaster Helpline', number: '1078', icon: ShieldAlert, bg: 'from-orange-600 to-amber-700' },
    { name: 'State Flood Control Room', number: '1070', icon: Radio, bg: 'from-blue-600 to-cyan-700' },
    { name: 'Ambulance & Medical Emergency', number: '108', icon: LifeBuoy, bg: 'from-emerald-600 to-teal-700' },
    { name: 'Fire & Rescue Service', number: '101', icon: AlertTriangle, bg: 'from-red-500 to-amber-600' },
    { name: 'Police Emergency Line', number: '100', icon: Users, bg: 'from-purple-600 to-indigo-700' },
  ];

  const faqs = [
    {
      category: 'AI Flood Risk Score',
      question: 'How does the GeoGuard AI Flood Risk Engine calculate risk scores?',
      answer:
        'GeoGuard AI utilizes a multi-factor weighted formula powered by real-time Open-Meteo API forecasts: 40% Rainfall Intensity (mm/hr) + 25% Precipitation Probability (%) + 15% Relative Humidity (%) + 10% Cloud Cover (%) + 10% Wind Speed (km/h). Scores range from 0 to 100% and are classified as Low, Moderate, High, or Severe Risk.',
    },
    {
      category: 'Incident Reporting',
      question: 'How do I submit a flood incident report to authorities?',
      answer:
        'Navigate to "File Incident Report" in the sidebar menu. Enter your location (or use automatic GPS detection), select the flood severity level (Waterlogging, Knee Deep, Severe Inundation), upload ground photos, and submit. Your report immediately alerts emergency authorities and displays on the public Disaster Map.',
    },
    {
      category: 'Evacuation Routes',
      question: 'How does the smart Evacuation Route planner select safe paths?',
      answer:
        'The evacuation routing algorithm combines OpenStreetMap road geometry with live flood inundation zones. It dynamically calculates safe, non-flooded routes avoiding high-risk waterlogged areas and directs citizens to the nearest active relief shelter.',
    },
    {
      category: 'Satellite Analysis',
      question: 'What is Copernicus Sentinel-1 Satellite Analysis?',
      answer:
        'Sentinel-1 utilizes Synthetic Aperture Radar (SAR) sensors that can penetrate cloud cover and operate day or night. GeoGuard processes these radar backscatter signals to map ground water extent and flood contours across entire metropolitan regions.',
    },
    {
      category: 'Weather Forecasts',
      question: 'Where does the weather data come from?',
      answer:
        'All current weather, hourly forecasts, and 7-day trend predictions are fetched in real-time from the Open-Meteo Forecast API with high geographical resolution and automatic Redis caching for sub-second responses.',
    },
    {
      category: 'Offline Support',
      question: 'What happens if internet or cellular data is disconnected?',
      answer:
        'GeoGuard AI supports offline caching. Your emergency contacts, saved evacuation routes, pre-loaded maps, and critical safety guides remain accessible on your device even without active internet.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-12">
      {/* Header Banner */}
      <div className="glass-card-static p-6 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <HelpCircle size={28} className="text-cyan-400" />
              Help & Emergency Assistance Center
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Quick emergency hotlines, disaster preparedness guidelines, and AI system documentation.
            </p>
          </div>
          <button
            onClick={() => navigate('/app/assistant')}
            className="btn-primary text-xs py-2.5 px-4 gap-2 shrink-0"
          >
            <MessageSquare size={15} />
            <span>Ask GeoGuard AI Assistant</span>
          </button>
        </div>
      </div>

      {/* ─── 1. EMERGENCY HOTLINE NUMBERS ─── */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <PhoneCall size={20} className="text-red-400 animate-pulse" />
          Emergency Direct Helplines
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {emergencyHelplines.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="glass-card-static p-4 border border-white/10 flex items-center justify-between hover:border-white/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.bg} flex items-center justify-center text-white shadow-lg`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{item.name}</h3>
                    <p className="text-lg font-extrabold text-cyan-400 tracking-wider mt-0.5">{item.number}</p>
                  </div>
                </div>

                <a
                  href={`tel:${item.number}`}
                  className="px-3 py-1.5 rounded-lg bg-white/5 group-hover:bg-cyan-500 group-hover:text-white text-slate-300 text-xs font-bold transition-all border border-white/5 flex items-center gap-1"
                >
                  <span>Call</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 2. EMERGENCY PREPAREDNESS CHECKLIST ─── */}
      <div className="glass-card-static p-6 border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert size={20} className="text-amber-400" />
          Flood Safety & Action Protocols
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <CheckCircle2 size={16} />
              <span>BEFORE FLOOD (Preparation)</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Keep drinking water, non-perishable food for 3 days.</li>
              <li>Charge mobile phones, power banks, and flashlights.</li>
              <li>Store important documents in waterproof bags.</li>
              <li>Know your nearest evacuation route and shelter location.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <AlertTriangle size={16} />
              <span>DURING FLOOD (Immediate Safety)</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Move to higher floors or elevated structures immediately.</li>
              <li>Turn off main electricity switch and gas supply.</li>
              <li>Never walk or drive through moving floodwaters.</li>
              <li>Listen to emergency broadcast alerts on GeoGuard.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <BookOpen size={16} />
              <span>AFTER FLOOD (Recovery)</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Boil tap water before drinking to avoid contamination.</li>
              <li>Do not touch fallen electrical lines or wet outlets.</li>
              <li>File an incident report on GeoGuard to request relief.</li>
              <li>Return home only when local authorities issue safe clearance.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ─── 3. FREQUENTLY ASKED QUESTIONS (FAQ) ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen size={20} className="text-cyan-400" />
            System Knowledge Base & FAQ
          </h2>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-2.5">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass-card-static border border-white/10 rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                        {faq.category}
                      </span>
                      <span className="text-xs font-bold text-white">{faq.question}</span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="px-4 pb-4 pt-1 text-xs text-slate-300 leading-relaxed border-t border-white/5 bg-slate-950/40">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          ) : (
            <div className="glass-card-static p-8 text-center text-slate-400 text-xs">
              No matching help topics found. Try searching for "flood score", "shelters", or "reports".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
