import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Bot, User, Zap, AlertTriangle,
  MapPin, Building, Navigation, Droplets, RefreshCw, Copy,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

const QUICK_QUESTIONS = [
  { text: 'What are the current flood risk areas?', icon: AlertTriangle },
  { text: 'Show nearest shelters with availability', icon: Building },
  { text: 'What evacuation routes are recommended?', icon: Navigation },
  { text: 'What is the current rainfall forecast?', icon: Droplets },
  { text: 'How do I report an incident?', icon: MessageSquare },
  { text: 'Which zones have critical risk scores?', icon: MapPin },
];

function getAIResponse(query: string, predictions: any[], shelters: any[], alerts: any[]): string {
  const q = query.toLowerCase();

  if (q.includes('flood') && (q.includes('risk') || q.includes('zone') || q.includes('area'))) {
    const criticalZones = predictions.filter(p => p.riskLevel === 'critical' || p.riskScore >= 80);
    const highZones = predictions.filter(p => p.riskLevel === 'high' && p.riskScore < 80);
    return `**Current Flood Risk Analysis:**\n\n🔴 **Critical Risk Zones (${criticalZones.length}):**\n${criticalZones.map(z => `• ${z.zoneName} — Risk Score: ${z.riskScore}/100, Predicted depth: ${z.predictedDepth}m`).join('\n') || 'None currently'}\n\n🟠 **High Risk Zones (${highZones.length}):**\n${highZones.map(z => `• ${z.zoneName} — Risk Score: ${z.riskScore}/100`).join('\n') || 'None currently'}\n\n⚠️ **Recommendation:** Residents in critical zones should evacuate immediately. Keep emergency kit ready and monitor alerts.`;
  }

  if (q.includes('shelter')) {
    const available = shelters.filter(s => (s.currentOccupancy / s.capacity) < 0.9);
    const topShelters = available.slice(0, 3);
    return `**Available Shelter Centers:**\n\n${topShelters.map(s => {
      const pct = Math.round((s.currentOccupancy / s.capacity) * 100);
      const avail = s.capacity - s.currentOccupancy;
      return `🏠 **${s.name}**\n   📍 ${s.address || 'Location on map'}\n   👥 ${avail} spaces available (${pct}% full)\n   ✅ Amenities: ${(s.amenities || []).slice(0, 3).join(', ')}`;
    }).join('\n\n')}\n\n📞 Contact local authorities for transport assistance. View all shelters in the Shelters section.`;
  }

  if (q.includes('evacuation') || q.includes('route') || q.includes('escape')) {
    return `**Recommended Evacuation Routes:**\n\n🟢 **Route 1 — Adyar to Anna University** (Recommended)\n   📍 Distance: 2.8 km | ⏱️ Est. 15 mins\n   ✅ Avoids: Adyar Bridge underpass, LB Road low-lying stretch\n   🏠 Destination: Anna University Convention Centre (187/500 occupied)\n\n🟢 **Route 2 — Velachery to YMCA Nandanam**\n   📍 Distance: 6.5 km | ⏱️ Est. 35 mins\n   ✅ Avoids: Velachery Main Road, Pallikaranai overflow area\n   🏠 Destination: YMCA Nandanam Sports Complex (310/800 occupied)\n\n⚠️ **Important:** Do not attempt flooded roads. Follow official route markers.`;
  }

  if (q.includes('rainfall') || q.includes('weather') || q.includes('forecast')) {
    return `**Current Weather & Rainfall Forecast:**\n\n🌡️ Temperature: 29°C | 💧 Humidity: 85%\n🌧️ Current Rainfall: 45.2mm | 💨 Wind: 32 km/h NE\n\n**Next 24 Hours:**\n• Tonight (6PM–12AM): 72–85 mm/hr — Very Heavy\n• Late Night (12AM–6AM): 45–65 mm/hr — Heavy\n• Tomorrow Morning: Rainfall easing to 30–40 mm/hr\n\n⚠️ **IMD Warning:** Very Heavy Rainfall Warning active for Chennai. Accumulated rainfall may reach 150–200mm in 24 hours.`;
  }

  if (q.includes('report') || q.includes('incident') || q.includes('submit')) {
    return `**How to Submit an Incident Report:**\n\n1. 📍 Go to **Submit Report** in the sidebar\n2. 🏷️ Select the incident type (Flood, Road Blocked, Power Outage, etc.)\n3. 📝 Describe the situation in detail\n4. ⚠️ Set severity level (1-5)\n5. 📍 Use GPS or enter location manually\n6. 📤 Tap **Submit Report**\n\nReports are reviewed by authorities within minutes. Verified reports appear on the live map for all users.\n\n✅ Your report directly helps coordinate rescue and relief operations!`;
  }

  if (q.includes('critical') || q.includes('score') || q.includes('highest risk')) {
    const sorted = [...predictions].sort((a, b) => b.riskScore - a.riskScore).slice(0, 4);
    return `**Zones Ranked by Risk Score:**\n\n${sorted.map((p, i) => {
      const emoji = i === 0 ? '🔴' : i === 1 ? '🔴' : i === 2 ? '🟠' : '🟡';
      return `${emoji} **${p.zoneName}**\n   Risk: ${p.riskScore}/100 | Level: ${p.riskLevel.toUpperCase()}\n   Population at Risk: ${p.affectedPopulation?.toLocaleString() || 'N/A'}\n   Predicted Depth: ${p.predictedDepth}m for ${p.predictedDuration}h`;
    }).join('\n\n')}\n\n📊 Run **Generate Predictions** in Authority View for an updated analysis.`;
  }

  if (q.includes('alert') || q.includes('warning')) {
    const activeAlerts = alerts.filter(a => a.isActive);
    return `**Active Emergency Alerts (${activeAlerts.length}):**\n\n${activeAlerts.map(a => {
      const emoji = a.severity === 'extreme' || a.severity === 'critical' ? '🔴' : a.severity === 'severe' ? '🟠' : '🟡';
      return `${emoji} **${a.severity?.toUpperCase()}** — ${a.type}\n   ${a.title || a.message?.slice(0, 80)}`;
    }).join('\n\n')}\n\nStay tuned to official channels. Visit the **Alerts** section for full details.`;
  }

  if (q.includes('help') || q.includes('emergency') || q.includes('sos')) {
    return `**Emergency Contacts & Helplines:**\n\n🚨 **National Disaster Management:** 1078\n🚒 **Fire & Rescue:** 101\n🚑 **Ambulance:** 108\n👮 **Police:** 100\n📞 **NDRF Helpline:** 011-24363260\n🏥 **Tamil Nadu State Emergency:** 1070\n\n**Immediate Safety Steps:**\n1. Move to higher ground immediately\n2. Avoid walking/driving through floodwater\n3. Keep emergency kit ready (documents, medicine, water)\n4. Follow official evacuation orders\n5. Charge devices and stay connected`;
  }

  return `I'm GeoGuard AI, your disaster intelligence assistant. I can help you with:\n\n• 🗺️ **Flood risk zones** and predictions\n• 🏠 **Shelter locations** and availability\n• 🧭 **Evacuation routes** and guidance\n• 🌧️ **Weather forecasts** and warnings\n• 📋 **How to submit** incident reports\n• 🚨 **Emergency contacts** and procedures\n• 📊 **Risk scores** and impact analysis\n\nAsk me anything about the current disaster situation in Chennai!`;
}

export default function AIAssistantPage() {
  const { predictions, shelters, alerts } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "👋 Hello! I'm **GeoGuard AI**, your disaster intelligence assistant.\n\nI have real-time access to flood predictions, shelter availability, evacuation routes, and weather data for Chennai Metropolitan Area.\n\nHow can I help you stay safe today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response delay
    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      const aiContent = getAIResponse(text, predictions, shelters, alerts);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const clearChat = () => {
    setMessages([{
      id: '0',
      role: 'assistant',
      content: "Chat cleared. How can I help you?",
      timestamp: new Date(),
    }]);
  };

  // Render markdown-like formatting
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-bold text-white mb-1">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.includes('**')) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="mb-0.5">
            {parts.map((part, j) =>
              part.startsWith('**') ? (
                <strong key={j} className="text-white font-semibold">{part.replace(/\*\*/g, '')}</strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        );
      }
      if (line === '') return <div key={i} className="h-2" />;
      return <p key={i} className="mb-0.5 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">GeoGuard AI Assistant</h1>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-400">Live disaster intelligence • Chennai Metro</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <Zap size={10} className="inline mr-1 text-cyan-400" />
            Powered by GeoGuard AI Engine
          </span>
          <button onClick={clearChat} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Clear chat">
            <RefreshCw size={15} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1 ${
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  : 'bg-gradient-to-br from-purple-500 to-pink-500'
              }`}>
                {msg.role === 'assistant' ? (
                  <Bot size={16} className="text-white" />
                ) : (
                  <User size={16} className="text-white" />
                )}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-white/[0.04] border border-white/8 text-slate-300 rounded-tl-sm'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-tr-sm'
                }`}>
                  {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] text-slate-600">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => navigator.clipboard?.writeText(msg.content)}
                      className="text-slate-600 hover:text-slate-400 transition-colors"
                      title="Copy"
                    >
                      <Copy size={10} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white/[0.04] border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-slate-500"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 flex-nowrap">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q.text}
            onClick={() => sendMessage(q.text)}
            disabled={isTyping}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-slate-300 bg-white/[0.04] border border-white/8 hover:border-blue-500/40 hover:text-blue-300 transition-all whitespace-nowrap disabled:opacity-50"
          >
            <q.icon size={12} />
            {q.text}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about floods, shelters, evacuation routes, weather..."
            className="input-field pr-12 text-sm"
            disabled={isTyping}
          />
          {inputText && (
            <button
              type="submit"
              disabled={isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              <Send size={14} className="text-white" />
            </button>
          )}
        </div>
        {!inputText && (
          <button
            type="button"
            onClick={() => sendMessage('What is the current situation in Chennai?')}
            disabled={isTyping}
            className="btn-primary text-xs py-2.5 shrink-0"
          >
            <Zap size={14} /> Quick Brief
          </button>
        )}
      </form>
    </div>
  );
}
