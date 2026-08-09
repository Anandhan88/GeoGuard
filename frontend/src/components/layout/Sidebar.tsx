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
import { useTranslation } from '../../utils/translations';

const navItems = [
  { label: 'Overview', translationKey: 'overview', icon: LayoutDashboard, path: '/app/citizen', section: 'main' },
  { label: 'Disaster Map', translationKey: 'disaster_map', icon: Map, path: '/app/map', section: 'main' },
  { label: 'Alerts', translationKey: 'active_alerts', icon: AlertTriangle, path: '/app/alerts', section: 'main', badge: 4 },
  { label: 'Submit Report', translationKey: 'submit_incident_report', icon: FileText, path: '/app/citizen/report', section: 'main', roles: ['citizen', 'volunteer', 'admin'] },
  { label: 'Authority View', translationKey: 'authority_view', icon: Shield, path: '/app/authority?tab=overview', section: 'main', roles: ['authority', 'admin'] },
  { label: 'Predictions', translationKey: 'top_predictions', icon: Activity, path: '/app/prediction/zone-001', section: 'intelligence' },
  { label: 'Satellite', translationKey: 'satellite_imagery', icon: Satellite, path: '/app/satellite', section: 'intelligence' },
  { label: 'Weather Forecasts', translationKey: 'weather_analysis', icon: Cloud, path: '/app/weather', section: 'intelligence' },
  { label: 'Impact Analysis', translationKey: 'impact_assessment', icon: BarChart3, path: '/app/authority?tab=impact', section: 'intelligence', roles: ['authority', 'admin'] },
  { label: 'Evacuation', translationKey: 'evacuation_routes', icon: Navigation, path: '/app/evacuation', section: 'response' },
  { label: 'Shelters', translationKey: 'shelters_active', icon: Building, path: '/app/shelters', section: 'response' },
  { label: 'Resources', translationKey: 'resources', icon: Truck, path: '/app/resources', section: 'response' },
  { label: 'AI Assistant', translationKey: 'ai_assistant', icon: MessageSquare, path: '/app/assistant', section: 'tools' },
  { label: 'Settings', translationKey: 'settings', icon: Settings, path: '/app/settings', section: 'system' },
  { label: 'Help', translationKey: 'help', icon: HelpCircle, path: '/app/help', section: 'system' },
];

const sections = [
  { key: 'main', label: 'MAIN' },
  { key: 'intelligence', label: 'INTELLIGENCE' },
  { key: 'response', label: 'RESPONSE' },
  { key: 'tools', label: 'TOOLS' },
  { key: 'system', label: 'SYSTEM' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, user, predictions } = useAppStore();
  const location = useLocation();
  const { t } = useTranslation();
  const role = user?.role || 'citizen';
  const topPredId = predictions[0]?.id || 'zone-001';

  const currentFullUrl = location.pathname + (location.search || (location.pathname === '/app/authority' ? '?tab=overview' : ''));

  return (
    <motion.aside
      animate={{ width: sidebarOpen ? 256 : 80 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-16 bottom-0 z-40 bg-slate-950/80 backdrop-blur-xl border-r border-white/5 flex flex-col justify-between py-4"
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

      {/* Navigation Sections */}
      <nav className="px-3 overflow-y-auto overflow-x-hidden flex-1 scrollbar-none">
        {sections.map((section) => {
          const items = navItems.filter(
            (i) => i.section === section.key && (!i.roles || i.roles.includes(role))
          );
          if (items.length === 0) return null;

          return (
            <div key={section.key} className="mb-4">
              {sidebarOpen && (
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-3 mb-2">
                  {section.label}
                </p>
              )}
              {items.map((item) => {
                const resolvedPath = item.label === 'Predictions'
                  ? `/app/prediction/${topPredId}`
                  : item.label === 'Overview'
                  ? (role === 'authority' || role === 'admin' ? '/app/authority?tab=overview' : '/app/citizen')
                  : item.path;
                const isActive = location.pathname.startsWith('/app/prediction')
                  ? item.label === 'Predictions'
                  : currentFullUrl === resolvedPath || (resolvedPath === '/app/authority?tab=overview' && currentFullUrl === '/app/authority');
                const Icon = item.icon;
                const displayLabel = t(item.translationKey as any) || item.label;

                return (
                  <NavLink
                    key={item.label}
                    to={resolvedPath}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 relative ${
                      isActive
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                    title={!sidebarOpen ? displayLabel : undefined}
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
                      <span className="text-sm font-medium truncate">{displayLabel}</span>
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
            <span className="text-xs text-slate-500">{t('system_online')}</span>
          </div>
          <div className="flex items-center gap-2 px-2 mt-1.5">
            <Radio size={12} className="text-cyan-400 animate-pulse" />
            <span className="text-xs text-slate-500">{t('live_data')}</span>
          </div>
        </div>
      )}
    </motion.aside>
  );
}
