import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Bot, User, Zap, AlertTriangle,
  MapPin, Building, Navigation, Droplets, RefreshCw, Copy,
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { api } from '../utils/api';

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

export default function AIAssistantPage() {
  const { currentLanguage } = useAppStore();
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

    try {
      const response = await api.get(`/chat?query=${encodeURIComponent(text.trim())}&lang=${currentLanguage}`);
      const aiContent = response.data.response;
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const aiMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting to the disaster intelligence service right now. Please try again or contact emergency numbers directly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setIsTyping(false);
    }
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
