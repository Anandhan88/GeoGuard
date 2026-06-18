/**
 * GeoGuard AI - Real-time WebSocket Connection Hook
 * Connects to the backend /ws/alerts endpoint for live alerts.
 */
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAppStore } from '../stores/useAppStore';

const WS_URL = 'ws://localhost:8000/ws/alerts';

export function useRealtimeAlerts() {
  const wsRef = useRef<WebSocket | null>(null);
  const { fetchAlerts } = useAppStore();

  useEffect(() => {
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connect() {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[GeoGuard] WebSocket connected — real-time alerts active');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'new_alert') {
              const severity = data.alert?.severity || 'moderate';
              const icon = severity === 'extreme' || severity === 'critical' ? '🔴' :
                           severity === 'severe' ? '🟠' : '🟡';
              toast(`${icon} ${data.alert?.title || 'New Alert'}: ${data.alert?.message?.slice(0, 60)}`, {
                duration: 6000,
                style: {
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#fca5a5',
                },
              });
              fetchAlerts();
            } else if (data.type === 'prediction_update') {
              toast('📊 Prediction update: AI risk scores recalculated', { duration: 4000 });
            }
          } catch (err) {
            // Silently ignore parse errors
          }
        };

        ws.onerror = () => {
          // Silently handle connection error (backend may not be running)
        };

        ws.onclose = () => {
          // Reconnect after 10 seconds
          reconnectTimeout = setTimeout(connect, 10000);
        };
      } catch (err) {
        // Silently handle if WebSocket not supported
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      wsRef.current?.close();
    };
  }, []);
}
