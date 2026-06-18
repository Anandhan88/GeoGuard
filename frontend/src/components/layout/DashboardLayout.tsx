import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAppStore } from '../../stores/useAppStore';
import { useRealtimeAlerts } from '../../hooks/useRealtimeAlerts';

export default function DashboardLayout() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  
  // Connect to real-time WebSocket alerts
  useRealtimeAlerts();

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'ml-64' : 'ml-20'
          } p-6`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
