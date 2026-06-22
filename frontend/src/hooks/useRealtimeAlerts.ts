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
              const icon = severity === 'extreme' || severity === 'critical' ? '🚨' :
                           severity === 'severe' ? '⚠️' : 'ℹ️';
              
              let bgColor = 'rgba(15, 23, 42, 0.95)';
              let borderColor = 'rgba(148, 163, 184, 0.2)';
              let textColor = '#f1f5f9';
              
              if (severity === 'extreme' || severity === 'critical') {
                bgColor = 'rgba(239, 68, 68, 0.98)';
                borderColor = '#fca5a5';
                textColor = '#ffffff';
              } else if (severity === 'severe') {
                bgColor = 'rgba(245, 158, 11, 0.98)';
                borderColor = '#fde68a';
                textColor = '#ffffff';
              } else if (severity === 'moderate') {
                bgColor = 'rgba(234, 179, 8, 0.98)';
                borderColor = '#fef08a';
                textColor = '#ffffff';
              } else if (severity === 'advisory') {
                bgColor = 'rgba(59, 130, 246, 0.98)';
                borderColor = '#bfdbfe';
                textColor = '#ffffff';
              }

              toast(`${icon} OFFICIAL BROADCAST: ${data.alert?.title || 'New Alert'}\n${data.alert?.message}`, {
                duration: 8000,
                style: {
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  color: textColor,
                  fontWeight: '600',
                  fontSize: '13px',
                  whiteSpace: 'pre-line',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                },
              });
              fetchAlerts();
            } else if (data.type === 'prediction_update') {
              toast('📊 Prediction update: AI risk scores recalculated', {
                duration: 4000,
                style: {
                  background: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  color: '#f1f5f9',
                }
              });
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
