import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  Shield,
  Building,
  Navigation,
  BarChart3,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronLeft,
  Activity,
  Truck,
  Satellite,
  Cloud,
  Radio,
  FileText,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/app/citizen', section: 'main' },
  { label: 'Disaster Map', icon: Map, path: '/app/map', section: 'main' },
  { label: 'Alerts', icon: AlertTriangle, path: '/app/alerts', section: 'main', badge: 7 },
  { label: 'Submit Report', icon: FileText, path: '/app/citizen/report', section: 'main' },
  { label: 'Authority View', icon: Shield, path: '/app/authority', section: 'main' },
  { label: 'Predictions', icon: Activity, path: '/app/citizen', section: 'intelligence' },
  { label: 'Satellite', icon: Satellite, path: '/app/satellite', section: 'intelligence' },
  { label: 'Weather', icon: Cloud, path: '/app/weather', section: 'intelligence' },
  { label: 'Impact Analysis', icon: BarChart3, path: '/app/authority', section: 'intelligence' },
  { label: 'Evacuation', icon: Navigation, path: '/app/evacuation', section: 'response' },
  { label: 'Shelters', icon: Building, path: '/app/shelters', section: 'response' },
  { label: 'Resources', icon: Truck, path: '/app/authority', section: 'response' },
  { label: 'AI Assistant', icon: MessageSquare, path: '/app/assistant', section: 'tools' },
  { label: 'Settings', icon: Settings, path: '/app/citizen', section: 'system' },
  { label: 'Help', icon: HelpCircle, path: '/app/citizen', section: 'system' },
];

const sections = [
  { key: 'main', label: 'MAIN' },
  { key: 'intelligence', label: 'INTELLIGENCE' },
  { key: 'response', label: 'RESPONSE' },
  { key: 'tools', label: 'TOOLS' },
  { key: 'system', label: 'SYSTEM' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 80 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-16 bottom-0 z-40 bg-bg-secondary/50 backdrop-blur-xl border-r border-white/5 flex flex-col overflow-hidden"
    >
      {/* Collapse Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-bg-tertiary border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors z-50"
      >
        <ChevronLeft
          size={14}
          className={`text-slate-400 transition-transform duration-300 ${
            !sidebarOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {sections.map((section) => {
          const items = navItems.filter((item) => item.section === section.key);
          if (items.length === 0) return null;

          return (
            <div key={section.key} className="mb-4">
              {sidebarOpen && (
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">
                  {section.label}
                </p>
              )}
              {items.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 relative ${
                      isActive
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-blue-400"
                        transition={{ duration: 0.3 }}
                      />
                    )}
                    <Icon
                      size={20}
                      className={`shrink-0 ${
                        isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    {sidebarOpen && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                    {sidebarOpen && item.badge && (
                      <span className="ml-auto bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Status Indicator */}
      {sidebarOpen && (
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500">System Online</span>
          </div>
          <div className="flex items-center gap-2 px-2 mt-1.5">
            <Radio size={12} className="text-cyan-400 animate-pulse" />
            <span className="text-xs text-slate-500">Live Data Active</span>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
