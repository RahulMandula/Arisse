import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Calendar, Edit2, Check, X, Crown, Zap, Flame, Award, Shield, Sword, Brain, Target, Database } from 'lucide-react';
import { useApp } from '../App';
import { getRankColor } from '../utils';
import * as db from '../database';
import { soundSystem } from '../sounds';

export default function ProfilePage() {
  const { state, dispatch } = useApp();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(state.user?.username || '');
  const [editEmail, setEditEmail] = useState(state.user?.email || '');
  const [saved, setSaved] = useState(false);
  const [playerCount, setPlayerCount] = useState(0);
  const [storageUsed, setStorageUsed] = useState('0 KB');

  useEffect(() => {
    db.getAllPlayers().then(players => setPlayerCount(players.length)).catch(() => {});
    // Estimate storage
    let total = 0;
    Object.keys(localStorage).forEach(k => { total += localStorage[k].length * 2; });
    setStorageUsed(total > 1024 ? `${(total / 1024).toFixed(1)} KB` : `${total} B`);
  }, [state.user]);

  useEffect(() => {
    setEditName(state.user?.username || '');
    setEditEmail(state.user?.email || '');
  }, [state.user]);

  const totalXp = state.level.currentXP + state.level.maxXp * (state.level.level - 1);
  const rankColor = getRankColor(state.level.rank);
  const totalCompleted = state.tasks.filter(t => t.completed).length;
  const totalTasks = state.tasks.length;

  const handleSave = async () => {
    if (editName.trim().length < 2) return;
    soundSystem.playClick();

    const playerInfos = db.loadSolo('playerInfos', {});
    const oldKey = state.user?.username.toLowerCase();
    const newKey = editName.trim().toLowerCase();

    if (oldKey && playerInfos[oldKey]) delete playerInfos[oldKey];
    playerInfos[newKey] = { name: editName.trim(), level: state.level.level, rank: state.level.rank };
    localStorage.setItem('solo_playerInfos', JSON.stringify(playerInfos));

    // Update game state in localStorage
    const gameStateRaw = localStorage.getItem('solo_gameState');
    if (gameStateRaw) {
      const gameState = JSON.parse(gameStateRaw);
      gameState.user.username = editName.trim();
      gameState.user.email = editEmail.trim();
      localStorage.setItem('solo_gameState', JSON.stringify(gameState));
      await db.saveUser(gameState.user).catch(() => {});
      await db.saveGameState(gameState.user.id, gameState).catch(() => {});
    }

    setEditing(false);
    setSaved(true);
    soundSystem.playTaskComplete();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    soundSystem.playClick();
    dispatch({ type: 'LOGOUT' });
  };

  const joinDate = state.user?.createdAt ? new Date(state.user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown';
  const lastLogin = state.user?.lastLogin ? new Date(state.user.lastLogin).toLocaleString() : 'Unknown';

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-900/90 border border-green-500/50 text-green-300 px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-sm">
            <Check className="w-4 h-4" /><span className="text-xs font-[Rajdhani] tracking-wider">PROFILE UPDATED SUCCESSFULLY</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-purple-500/20 p-6" style={{ background: `linear-gradient(135deg, ${rankColor}10, ${rankColor}05, #0d1117)` }}>
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10" style={{ background: `radial-gradient(circle, ${rankColor}, transparent 70%)` }} />
        <div className="relative z-10 flex items-center gap-5 flex-wrap">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-4xl font-black font-[Orbitron] border-2" style={{ borderColor: rankColor, color: rankColor, background: `${rankColor}10` }}>
              {state.user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold font-[Orbitron] text-white" style={{ background: rankColor }}>{state.level.rank}</div>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-2">
                <div><label className="text-purple-400/60 text-[10px] font-[Rajdhani] uppercase tracking-wider">Hunter Name</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/30 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50" autoFocus /></div>
                <div><label className="text-purple-400/60 text-[10px] font-[Rajdhani] uppercase tracking-wider">Email</label><input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/30 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50" /></div>
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSave} className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-[Orbitron]"><Check className="w-3 h-3" /> SAVE</button>
                  <button onClick={() => { setEditing(false); setEditName(state.user?.username || ''); setEditEmail(state.user?.email || ''); soundSystem.playClick(); }} className="flex items-center gap-1 bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-[Orbitron]"><X className="w-3 h-3" /> CANCEL</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold font-[Orbitron] text-white">{state.user?.username}</h2>
                  <button onClick={() => { setEditing(true); soundSystem.playClick(); }} className="text-purple-400/60 hover:text-purple-400 transition"><Edit2 className="w-4 h-4" /></button>
                </div>
                <p className="text-purple-300/70 text-sm font-[Rajdhani]">{state.level.title}</p>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-gray-400 text-xs font-[Rajdhani]"><Mail className="w-3 h-3" /> {state.user?.email}</span>
                  <span className="flex items-center gap-1 text-gray-400 text-xs font-[Rajdhani]"><Calendar className="w-3 h-3" /> Joined {joinDate}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Level', value: state.level.level, icon: <Crown className="w-5 h-5" />, color: 'text-purple-400' },
          { label: 'Total XP', value: totalXp.toLocaleString(), icon: <Zap className="w-5 h-5" />, color: 'text-blue-400' },
          { label: 'Streak', value: `${state.streak.currentStreak}d`, icon: <Flame className="w-5 h-5" />, color: 'text-orange-400' },
          { label: 'Quests Done', value: `${totalCompleted}/${totalTasks}`, icon: <Award className="w-5 h-5" />, color: 'text-green-400' },
        ].map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-4">
            <div className={`${item.color} mb-2`}>{item.icon}</div>
            <p className="text-2xl font-bold font-[Orbitron] text-white">{item.value}</p>
            <p className="text-gray-500 text-xs font-[Rajdhani] tracking-wider">{item.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5">
        <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-purple-400" /> HUNTER ATTRIBUTES</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'strength' as const, label: 'Strength', icon: <Sword className="w-4 h-4" />, gradient: 'from-red-500 to-orange-500' },
            { key: 'intelligence' as const, label: 'Intelligence', icon: <Brain className="w-4 h-4" />, gradient: 'from-blue-500 to-cyan-500' },
            { key: 'discipline' as const, label: 'Discipline', icon: <Target className="w-4 h-4" />, gradient: 'from-purple-500 to-pink-500' },
            { key: 'focus' as const, label: 'Focus', icon: <Zap className="w-4 h-4" />, gradient: 'from-yellow-500 to-amber-500' },
          ].map(stat => {
            const value = state.stats[stat.key];
            const maxStat = Math.max(state.stats.strength, state.stats.intelligence, state.stats.discipline, state.stats.focus);
            const pct = (value / maxStat) * 100;
            return (
              <div key={stat.key} className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a1a]/50">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} text-white`}>{stat.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-center"><span className="text-white text-xs font-[Rajdhani] uppercase tracking-wider">{stat.label}</span><span className="text-white font-bold font-[Orbitron] text-sm">{value}</span></div>
                  <div className="h-1 bg-[#0a0a1a] rounded-full mt-1 overflow-hidden"><motion.div className={`h-full rounded-full bg-gradient-to-r ${stat.gradient}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* System Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5">
        <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-blue-400" /> SYSTEM INFO</h3>
        <div className="space-y-2">
          {[
            { label: 'Last Login', value: lastLogin },
            { label: 'Database', value: 'IndexedDB + LocalStorage' },
            { label: 'Storage Used', value: storageUsed },
            { label: 'Total Hunters', value: `${playerCount} registered` },
            { label: 'System Version', value: 'v3.0' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-2 rounded-lg bg-[#0a0a1a]/50">
              <span className="text-gray-400 text-xs font-[Rajdhani]">{item.label}</span>
              <span className="text-white text-xs font-[Inter]">{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-950/30 border border-red-500/20 text-red-400 py-3 rounded-xl text-xs font-[Orbitron] tracking-wider hover:bg-red-950/50 transition"><Shield className="w-4 h-4" /> LOGOUT</button>
      </motion.div>
    </div>
  );
}
