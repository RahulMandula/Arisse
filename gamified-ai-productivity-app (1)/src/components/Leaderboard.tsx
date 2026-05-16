import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, Crown, Star, Zap } from 'lucide-react';
import { useApp } from '../App';
import * as db from '../database';

export default function LeaderboardPage() {
  const { state } = useApp();
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    db.getAllPlayers().then(setPlayers).catch(() => {});
  }, []);

  const rankColors: Record<string, string> = { 'E': '#8B8B8B', 'D': '#4FC3F7', 'C': '#66BB6A', 'B': '#AB47BC', 'A': '#FFA726', 'S': '#FF1744' };
  const rankTitles: Record<string, string> = { 'E': 'E-Rank Hunter', 'D': 'D-Rank Hunter', 'C': 'C-Rank Hunter', 'B': 'B-Rank Hunter', 'A': 'A-Rank Hunter', 'S': 'Shadow Monarch' };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-purple-400/60 text-xs font-[Rajdhani] tracking-widest">[GATE INFO]</p>
            <h3 className="text-white font-bold font-[Orbitron] text-lg tracking-wider flex items-center gap-2"><Users className="w-5 h-5 text-purple-400" /> HUNTER REGISTER</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center"><p className="text-2xl font-bold font-[Orbitron] text-white">{players.length}</p><p className="text-gray-500 text-[10px] font-[Rajdhani]">TOTAL HUNTERS</p></div>
            <div className="text-center"><p className="text-2xl font-bold font-[Orbitron] text-green-400">1</p><p className="text-gray-500 text-[10px] font-[Rajdhani]">ONLINE NOW</p></div>
          </div>
        </div>
      </motion.div>

      {players.length >= 3 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-6">
          <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-4 flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-400" /> TOP HUNTERS</h3>
          <div className="flex items-end justify-center gap-4">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-xl font-bold text-white mb-2">{players[1]?.name?.charAt(0).toUpperCase()}</div>
              <span className="text-gray-300 text-xs font-[Rajdhani] mb-1">{players[1]?.name}</span>
              <div className="w-20 h-16 bg-gradient-to-t from-gray-700 to-gray-600 rounded-t-lg flex items-start justify-center pt-2"><span className="text-gray-300 font-bold font-[Orbitron]">2</span></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-yellow-400 mb-1"><Crown className="w-5 h-5" /></div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white mb-2">{players[0]?.name?.charAt(0).toUpperCase()}</div>
              <span className="text-white text-xs font-[Rajdhani] mb-1 font-bold">{players[0]?.name}</span>
              <div className="w-20 h-20 bg-gradient-to-t from-yellow-700 to-yellow-500 rounded-t-lg flex items-start justify-center pt-2"><span className="text-white font-bold font-[Orbitron]">1</span></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center text-xl font-bold text-white mb-2">{players[2]?.name?.charAt(0).toUpperCase()}</div>
              <span className="text-gray-300 text-xs font-[Rajdhani] mb-1">{players[2]?.name}</span>
              <div className="w-20 h-12 bg-gradient-to-t from-orange-800 to-orange-700 rounded-t-lg flex items-start justify-center pt-2"><span className="text-orange-300 font-bold font-[Orbitron]">3</span></div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-purple-500/10"><h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider flex items-center gap-2"><Star className="w-4 h-4 text-purple-400" /> FULL RANKINGS</h3></div>
        <div className="divide-y divide-purple-500/5">
          {players.length === 0 ? (
            <div className="p-8 text-center"><p className="text-gray-600 text-xs font-[Rajdhani]">No hunters registered yet.</p></div>
          ) : (
            players.map((player: any, i: number) => {
              const isMe = state.user && player.name.toLowerCase() === state.user.username.toLowerCase();
              const rankColor = rankColors[player.rank] || '#8B8B8B';
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }} className={`flex items-center gap-4 p-4 ${isMe ? 'bg-purple-500/10 border-l-2' : 'hover:bg-purple-500/5'}`} style={isMe ? { borderLeftColor: rankColor } : {}}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                    {i === 0 ? <Trophy className="w-4 h-4 text-yellow-400" /> : i === 1 ? <span className="text-gray-300 font-bold font-[Orbitron] text-sm">2</span> : i === 2 ? <span className="text-orange-400 font-bold font-[Orbitron] text-sm">3</span> : <span className="text-gray-500 font-[Orbitron] text-sm">{i + 1}</span>}
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold font-[Orbitron] text-sm" style={{ borderColor: rankColor, color: rankColor, background: `${rankColor}15`, borderWidth: '2px', borderStyle: 'solid' }}>{player.name?.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-[Inter] truncate ${isMe ? 'text-white font-bold' : 'text-gray-300'}`}>{player.name}</span>
                      {isMe && <span className="bg-purple-500/20 text-purple-400 text-[9px] font-[Rajdhani] px-1.5 py-0.5 rounded">YOU</span>}
                    </div>
                    <p className="text-[10px] font-[Rajdhani]" style={{ color: rankColor }}>{rankTitles[player.rank] || 'E-Rank Hunter'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold font-[Orbitron] text-sm">Lv.{player.level}</p>
                    <div className="flex items-center gap-1 justify-end"><Zap className="w-3 h-3 text-purple-400/60" /><span className="text-purple-400/60 text-[10px] font-[Rajdhani]">{player.rank}-Rank</span></div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}
