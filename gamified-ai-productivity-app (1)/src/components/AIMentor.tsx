import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Bot, User, Volume2, VolumeX } from 'lucide-react';
import { useApp } from '../App';
import { getAIResponse } from '../utils';
import { soundSystem } from '../sounds';

const SUGGESTED_PROMPTS = [
  'Motivate me!',
  'Check my stats',
  'What are my quests?',
  'How do I level up faster?',
  'Tell me about my rank',
  'Check my streak',
  'What is my purpose?',
  'I feel weak today',
];

export default function AIMentor() {
  const { state } = useApp();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'mentor'; content: string; timestamp: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [bgmOn, setBgmOn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from IndexedDB
  useEffect(() => {
    if (state.user) {
      loadMessages();
    }
  }, [state.user]);

  const loadMessages = useCallback(async () => {
    try {
      const saved = localStorage.getItem(`solo_ai_${state.user?.id}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([{
          role: 'mentor' as const,
          content: `*[SYSTEM] Shadow Mentor Online*\n\nGreetings, Hunter ${state.user?.username || 'unknown'}. I am your Shadow Mentor — the voice of the System that chose you.\n\nI will guide you through your daily quests, analyze your stats, push you when you're lazy, and remind you why you started this journey.\n\nType anything, or tap a suggestion below.\n\n*"Do you think the Shadow Monarch was born with power? No. I took it."*`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch {
      setMessages([{
        role: 'mentor' as const,
        content: `[SYSTEM] *Shadow Mentor Online*\n\nGreetings, Hunter ${state.user?.username || 'unknown'}. I am here to guide you.\n\nAsk me anything about your progress, stats, quests, or for motivation.`,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [state.user]);

  // Save messages
  useEffect(() => {
    if (state.user && messages.length > 0) {
      localStorage.setItem(`solo_ai_${state.user.id}`, JSON.stringify(messages));
    }
  }, [messages, state.user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isTyping) return;

    soundSystem.playClick();
    const userMsg = { role: 'user' as const, content: input.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    const userContent = input.trim();
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(userContent, state);
      setMessages(prev => [...prev, { role: 'mentor', content: response, timestamp: new Date().toISOString() }]);
      setIsTyping(false);
      soundSystem.playClick();
    }, 600 + Math.random() * 1000);
  }, [input, isTyping, state]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleBGM = () => {
    soundSystem.resume();
    if (bgmOn) {
      soundSystem.stopBGM();
    } else {
      soundSystem.playBGM();
    }
    setBgmOn(!bgmOn);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-4 mb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0d1117]" />
            </div>
            <div>
              <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider">SHADOW MENTOR</h3>
              <p className="text-green-400 text-[10px] font-[Rajdhani] tracking-wider">● ONLINE — {state.level.title}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleBGM}
            className={`p-2 rounded-lg transition ${bgmOn ? 'bg-purple-500/20 text-purple-400' : 'bg-[#0a0a1a] text-gray-500'}`}
            title="Toggle Background Music"
          >
            {bgmOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </motion.button>
        </div>
      </motion.div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 min-h-0">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[#0d1117]/80 border border-purple-500/10 rounded-2xl rounded-tl-sm p-3">
              <div className="flex gap-1">
                <motion.div className="w-2 h-2 rounded-full bg-purple-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                <motion.div className="w-2 h-2 rounded-full bg-purple-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                <motion.div className="w-2 h-2 rounded-full bg-purple-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_PROMPTS.map(prompt => (
            <motion.button
              key={prompt}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setInput(prompt); soundSystem.playHover(); }}
              className="px-3 py-1.5 bg-[#0d1117]/60 border border-purple-500/10 rounded-full text-purple-400/70 text-[10px] font-[Rajdhani] hover:border-purple-500/30 hover:text-purple-300 transition-all"
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="mt-3 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Shadow Mentor..."
            className="flex-1 bg-[#0d1117] border border-purple-500/20 rounded-xl px-4 py-3 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50 placeholder:text-gray-600"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim()}
            className={`px-4 py-3 rounded-xl transition-all ${input.trim() ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' : 'bg-[#0d1117] text-gray-600 border border-purple-500/10'}`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: { role: 'user' | 'mentor'; content: string; timestamp: string } }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-gradient-to-br from-purple-600 to-blue-600'}`}>
        {isUser ? <User className="w-4 h-4 text-purple-400" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`rounded-2xl px-4 py-3 ${isUser ? 'bg-purple-500/15 border border-purple-500/20 rounded-tr-sm' : 'bg-[#0d1117]/80 border border-purple-500/10 rounded-tl-sm'}`}>
          <p className={`text-sm font-[Inter] whitespace-pre-wrap leading-relaxed ${isUser ? 'text-white' : 'text-purple-200/90'}`}>
            {msg.content}
          </p>
        </div>
        <span className="text-[10px] text-gray-600 font-[Rajdhani] mt-1 px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
