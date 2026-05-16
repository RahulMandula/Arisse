import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, ChevronRight, Zap, Shield, Crown, Flame, Sparkles, User, ArrowLeft } from 'lucide-react';
import { getDefaultState, generateId } from '../utils';
import { GameState, User as UserType, PlayerStats, LevelInfo, StreakInfo } from '../types';
import * as db from '../database';
import { soundSystem } from '../sounds';

interface LandingProps {
  onEnter: (state: GameState) => void;
}

export default function LandingPage({ onEnter }: LandingProps) {
  const [phase, setPhase] = useState<'intro' | 'loginOrRegister'>('intro');
  const [subPhase, setSubPhase] = useState<'register' | 'login'>('register');
  const [namePhase, setNamePhase] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedClass, setSelectedClass] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredPlayers, setRegisteredPlayers] = useState<string[]>([]);
  const [loginUsername, setLoginUsername] = useState('');

  const hunterClasses = [
    { name: 'Swordsman', desc: 'Physical warrior focused on combat', icon: <Sword className="w-6 h-6" />, bonus: 'strength' as const, color: 'from-red-600 to-red-800' },
    { name: 'Mage', desc: 'Knowledge seeker with analytical power', icon: <Zap className="w-6 h-6" />, bonus: 'intelligence' as const, color: 'from-blue-600 to-blue-800' },
    { name: 'Monk', desc: 'Disciplined master of self-control', icon: <Shield className="w-6 h-6" />, bonus: 'discipline' as const, color: 'from-purple-600 to-purple-800' },
    { name: 'Assassin', desc: 'Focused striker with deadly precision', icon: <Crown className="w-6 h-6" />, bonus: 'focus' as const, color: 'from-green-600 to-green-800' },
  ];

  // Load registered players
  useState(() => {
    db.getAllPlayers().then(players => {
      setRegisteredPlayers(players.map((p: any) => p.name));
    }).catch(() => {});
  });

  const handleRegister = async () => {
    if (!username.trim() || !email.trim()) {
      setError('[SYSTEM] All fields are required');
      soundSystem.playError();
      return;
    }
    if (username.length < 2) {
      setError('[SYSTEM] Hunter name must be at least 2 characters');
      soundSystem.playError();
      return;
    }

    // Check if user exists
    const existingUser = await db.findUserByUsername(username.trim());
    if (existingUser) {
      setError('[SYSTEM] This hunter already exists. Please login instead.');
      soundSystem.playError();
      return;
    }

    soundSystem.playClick();
    setNamePhase(true);
  };

  const handleLogin = async () => {
    if (!loginUsername.trim()) {
      setError('[SYSTEM] Enter your hunter name to login');
      soundSystem.playError();
      return;
    }

    setLoading(true);
    soundSystem.playClick();

    try {
      const existingUser = await db.findUserByUsername(loginUsername.trim());
      if (existingUser) {
        // Load their game state
        const savedState = await db.getGameState(existingUser.id);
        if (savedState) {
          // Reconstruct game state
          const state: GameState = {
            user: existingUser,
            stats: savedState.stats || getDefaultState().stats,
            level: savedState.level || getDefaultState().level,
            tasks: savedState.tasks || [],
            streak: savedState.streak || getDefaultState().streak,
            alarms: savedState.alarms || [],
            aiMessages: savedState.aiMessages || []
          };
          // Update last login
          state.user!.lastLogin = new Date().toISOString();
          await db.saveUser(state.user!);
          await db.saveGameState(state.user!.id, state);

          soundSystem.playLevelUp();
          onEnter(state);
          return;
        }
      }
      setError('[SYSTEM] No records found for this hunter. Register first.');
      soundSystem.playError();
    } catch (e) {
      setError('[SYSTEM] Connection error. Try again.');
      soundSystem.playError();
    }
    setLoading(false);
  };

  const handleStart = async () => {
    setLoading(true);
    soundSystem.playClick();

    try {
      const stats: PlayerStats = {
        strength: 10,
        intelligence: 10,
        discipline: 10,
        focus: 10,
        totalPointsSpent: 0
      };
      stats[hunterClasses[selectedClass].bonus] = (stats[hunterClasses[selectedClass].bonus] as number) + 5;

      const level: LevelInfo = {
        level: 1,
        currentXP: 0,
        maxXp: 100,
        rank: 'E',
        title: 'E-Rank Hunter'
      };

      const streak: StreakInfo = {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '',
        dailyLog: []
      };

      const user: UserType = {
        id: generateId(),
        username: username.trim(),
        email: email.trim(),
        password: 'hunter',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Save to IndexedDB
      await db.saveUser(user);
      await db.registerPlayer(username.trim(), 1, 'E');

      const state: GameState = {
        ...getDefaultState(),
        user,
        stats,
        level,
        streak,
        tasks: [],
        alarms: [],
        aiMessages: []
      };

      await db.saveGameState(user.id, state);
      setRegisteredPlayers(prev => [...prev, username.trim()]);

      // Show loading screen
      await new Promise(r => setTimeout(r, 2500));
      soundSystem.playLevelUp();
      onEnter(state);
    } catch (e) {
      setError('[SYSTEM] Registration failed. Try again.');
      soundSystem.playError();
      setLoading(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0d1b2a] to-[#1a0a2e]" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 mx-auto border-4 border-transparent border-t-purple-500 border-r-blue-500 rounded-full mb-8"
          />
          <h2 className="text-white font-bold font-[Orbitron] text-xl tracking-wider mb-2">
            SYSTEM INITIALIZATION
          </h2>
          <motion.p
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-purple-400/60 text-sm font-[Rajdhani] tracking-widest"
          >
            [JUNGLE HUNTER] {username || loginUsername}...
          </motion.p>
          <motion.p
            animate={{ opacity: [0, 1] }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="text-red-400 text-xs font-[Rajdhani] mt-4 tracking-widest"
          >
            ⚡ ARISE ⚡
          </motion.p>
        </motion.div>
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-gray-700 text-[10px] font-[Rajdhani] tracking-widest">MADE BY MANDULA RAHUL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#0d1b2a] to-[#1a0a2e]" />
        <motion.div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 8, repeat: Infinity }} />
        <motion.div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl" animate={{ scale: [1.5, 1, 1.5], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity }} />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(100,100,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,255,0.3) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <AnimatePresence mode="wait">
        {/* PHASE 1: Intro */}
        {phase === 'intro' && !namePhase && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative z-10 w-full max-w-lg text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.8 }} className="relative inline-block mb-8">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} className="absolute -inset-6 border border-purple-500/30 rounded-full" />
              <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} className="absolute -inset-12 border border-blue-500/20 rounded-full" />
              <div className="relative text-8xl font-black font-[Orbitron] bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">SL</div>
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }}><Sparkles className="absolute -top-4 -right-4 w-6 h-6 text-purple-400" /></motion.div>
            </motion.div>

            <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-4xl font-black font-[Orbitron] text-white tracking-wider mb-3">SHADOW SYSTEM</motion.h1>
            <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-purple-400/60 text-sm font-[Rajdhani] tracking-[0.3em] mb-8">AI PRODUCTIVITY PLATFORM</motion.p>

            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="grid grid-cols-3 gap-3 mb-8">
              {[{ icon: <Sword className="w-5 h-5" />, label: 'Quest System' }, { icon: <Flame className="w-5 h-5" />, label: 'Streak Tracking' }, { icon: <Crown className="w-5 h-5" />, label: 'Level Up' }].map((f, i) => (
                <motion.div key={f.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }} className="bg-[#0d1117]/60 border border-purple-500/10 rounded-xl p-3">
                  <div className="text-purple-400 mb-1 flex justify-center">{f.icon}</div>
                  <p className="text-gray-400 text-[10px] font-[Rajdhani] tracking-wider">{f.label}</p>
                </motion.div>
              ))}
            </motion.div>

            <div className="space-y-3">
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setPhase('loginOrRegister'); setSubPhase('register'); soundSystem.resume(); soundSystem.playClick(); }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-12 py-4 rounded-xl font-bold font-[Orbitron] tracking-wider text-sm shadow-2xl shadow-purple-900/50 flex items-center justify-center gap-2 mx-auto"
              >
                NEW HUNTER <ChevronRight className="w-4 h-4" />
              </motion.button>
              {registeredPlayers.length > 0 && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setPhase('loginOrRegister'); setSubPhase('login'); soundSystem.resume(); soundSystem.playClick(); }}
                  className="w-full bg-[#0d1117]/80 border border-purple-500/20 text-purple-300 px-12 py-3 rounded-xl font-bold font-[Orbitron] tracking-wider text-xs flex items-center justify-center gap-2 mx-auto"
                >
                  <User className="w-4 h-4" /> RETURNING HUNTER
                </motion.button>
              )}
            </div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-gray-700 text-xs font-[Rajdhani] mt-8 italic">
              "The only one who can beat me is me."
            </motion.p>
          </motion.div>
        )}

        {/* PHASE 2: Login or Register */}
        {phase === 'loginOrRegister' && !namePhase && (
          <motion.div key="auth" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="relative z-10 w-full max-w-md">
            <div className="bg-[#0d1117]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl shadow-purple-900/20">
              {/* Tabs */}
              <div className="flex gap-2 mb-6">
                <button onClick={() => { setSubPhase('register'); setError(''); }} className={`flex-1 py-2 rounded-lg text-xs font-[Orbitron] tracking-wider transition ${subPhase === 'register' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-500 border border-transparent'}`}>REGISTER</button>
                <button onClick={() => { setSubPhase('login'); setError(''); }} className={`flex-1 py-2 rounded-lg text-xs font-[Orbitron] tracking-wider transition ${subPhase === 'login' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-500 border border-transparent'}`}>LOGIN</button>
              </div>

              {subPhase === 'register' ? (
                <div className="space-y-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-blue-950/50 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-400 text-xs font-[Rajdhani] tracking-wider">⚡ [SYSTEM] New Hunter detected. Register to begin your journey.</p>
                  </motion.div>
                  <div>
                    <label className="text-purple-400 text-xs font-[Rajdhani] font-semibold tracking-wider uppercase">Hunter Name</label>
                    <div className="relative mt-1">
                      <Sword className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/50" />
                      <input type="text" value={username} onChange={e => { setUsername(e.target.value); setError(''); }} className="w-full bg-[#0a0a1a]/80 border border-purple-500/20 rounded-lg pl-10 pr-4 py-3 text-white font-[Inter] text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-gray-600" placeholder="Enter your hunter name..." autoFocus />
                    </div>
                  </div>
                  <div>
                    <label className="text-purple-400 text-xs font-[Rajdhani] font-semibold tracking-wider uppercase">Email</label>
                    <div className="relative mt-1">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/50" />
                      <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} className="w-full bg-[#0a0a1a]/80 border border-purple-500/20 rounded-lg pl-10 pr-4 py-3 text-white font-[Inter] text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-gray-600" placeholder="hunter@system.io" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-green-950/50 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-400 text-xs font-[Rajdhani] tracking-wider">🔓 [SYSTEM] Returning Hunter. Enter your name to restore your data.</p>
                  </motion.div>
                  <div>
                    <label className="text-purple-400 text-xs font-[Rajdhani] font-semibold tracking-wider uppercase">Hunter Name</label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500/50" />
                      <input type="text" value={loginUsername} onChange={e => { setLoginUsername(e.target.value); setError(''); }} className="w-full bg-[#0a0a1a]/80 border border-purple-500/20 rounded-lg pl-10 pr-4 py-3 text-white font-[Inter] text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all placeholder:text-gray-600" placeholder="Enter your hunter name..." autoFocus />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-red-950/50 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-xs font-[Rajdhani]">{error}</p>
                </motion.div>
              )}

              <div className="flex gap-3 mt-6">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setPhase('intro'); soundSystem.playClick(); }} className="flex-1 bg-[#0a0a1a] border border-purple-500/20 text-gray-400 py-3 rounded-lg text-xs font-[Orbitron] tracking-wider hover:border-purple-500/50 transition flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> BACK
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={subPhase === 'register' ? handleRegister : handleLogin} disabled={!username.trim() && !loginUsername.trim()} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg text-xs font-[Orbitron] tracking-wider disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-purple-900/50">
                  {subPhase === 'register' ? 'NEXT →' : 'ARISE'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* PHASE 3: Class Selection */}
        {namePhase && (
          <motion.div key="class" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="relative z-10 w-full max-w-lg">
            <div className="bg-[#0d1117]/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-2xl shadow-purple-900/20">
              <p className="text-purple-400/60 text-xs font-[Rajdhani] tracking-widest mb-1">[SYSTEM]</p>
              <h2 className="text-white font-bold font-[Orbitron] text-lg tracking-wider mb-1">CHOOSE YOUR CLASS</h2>
              <p className="text-gray-500 text-xs font-[Rajdhani] mb-6">Each class grants a +5 bonus to one stat</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {hunterClasses.map((cls, i) => (
                  <motion.button key={cls.name} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setSelectedClass(i); soundSystem.playClick(); }} className={`relative p-4 rounded-xl border text-left transition-all ${selectedClass === i ? 'border-purple-500/50 bg-purple-500/10' : 'border-purple-500/10 bg-[#0a0a1a]/50 hover:border-purple-500/30'}`}>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cls.color} flex items-center justify-center text-white mb-3`}>{cls.icon}</div>
                    <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider">{cls.name}</h3>
                    <p className="text-gray-500 text-[10px] font-[Rajdhani] mt-0.5">{cls.desc}</p>
                    <p className="text-purple-400/60 text-[10px] font-[Rajdhani] mt-1">+5 {cls.bonus}</p>
                    {selectedClass === i && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"><span className="text-white text-[10px]">✓</span></motion.div>}
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setNamePhase(false); soundSystem.playClick(); }} className="flex-1 bg-[#0a0a1a] border border-purple-500/20 text-gray-400 py-3 rounded-lg text-xs font-[Orbitron] tracking-wider hover:border-purple-500/50 transition">BACK</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleStart} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg text-xs font-[Orbitron] tracking-wider shadow-lg shadow-purple-900/50">BEGIN JOURNEY</motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-gray-700 text-[10px] font-[Rajdhani] tracking-widest">MADE BY MANDULA RAHUL</p>
      </div>
    </div>
  );
}
