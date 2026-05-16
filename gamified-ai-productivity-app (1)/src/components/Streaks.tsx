import { motion } from 'framer-motion';
import { Flame, Trophy, Calendar, TrendingUp, Award } from 'lucide-react';
import { useApp } from '../App';

export default function StreaksPanel() {
  const { state } = useApp();
  const streak = state.streak;
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = state.tasks.filter(t => t.dueDate === today);
  const completedToday = todayTasks.filter(t => t.completed).length;
  const totalXP = state.tasks.filter(t => t.completed).reduce((sum, t) => sum + t.xpReward, 0);

  const cellColors = ['bg-[#0a0a1a]', 'bg-purple-900/30', 'bg-purple-900/60', 'bg-purple-500/80'];

  // Generate last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="space-y-6">
      {/* Streak Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-950/50 via-red-950/30 to-orange-950/50 border border-orange-500/20 p-6"
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.4) 0%, transparent 70%)'
          }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-orange-400/60 text-xs font-[Rajdhani] tracking-widest">[STREAK MONITOR]</p>
            <div className="flex items-center gap-3 mt-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Flame className="w-10 h-10 text-orange-400" />
              </motion.div>
              <div>
                <h2 className="text-4xl font-black font-[Orbitron] text-white">{streak.currentStreak}</h2>
                <p className="text-orange-400/70 text-xs font-[Rajdhani] tracking-wider">DAY STREAK</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold font-[Orbitron] text-xl">{streak.longestStreak}</span>
            </div>
            <p className="text-orange-400/40 text-[10px] font-[Rajdhani] tracking-widest">BEST STREAK</p>
          </div>
        </div>
      </motion.div>

      {/* Today's Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5"
      >
        <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          TODAY'S PROGRESS
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-[#0a0a1a]/50">
            <p className="text-2xl font-bold font-[Orbitron] text-white">{completedToday}</p>
            <p className="text-gray-500 text-[10px] font-[Rajdhani]">COMPLETED</p>
          </div>
          <div className="p-3 rounded-lg bg-[#0a0a1a]/50">
            <p className="text-2xl font-bold font-[Orbitron] text-white">{todayTasks.length}</p>
            <p className="text-gray-500 text-[10px] font-[Rajdhani]">TOTAL</p>
          </div>
          <div className="p-3 rounded-lg bg-[#0a0a1a]/50">
            <p className="text-2xl font-bold font-[Orbitron] text-purple-400">
              {todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0}%
            </p>
            <p className="text-gray-500 text-[10px] font-[Rajdhani]">RATE</p>
          </div>
        </div>
      </motion.div>

      {/* Calendar Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5"
      >
        <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          ACTIVITY MAP (30 DAYS)
        </h3>
        <div className="flex gap-1 flex-wrap">
          {last30Days.map((date, i) => {
            const entry = streak.dailyLog.find(d => d.date === date);
            const isToday = date === today;
            const intensity = entry ? (entry.status === 'complete' ? 3 : entry.tasksCompleted > 0 ? 2 : 1) : 0;

            return (
              <motion.div
                key={date}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.02 }}
                className={`w-6 h-6 rounded ${cellColors[intensity]} ${
                  isToday ? 'ring-2 ring-purple-400' : ''
                } relative group`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1a2e] text-white text-[10px] font-[Rajdhani] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                  {date} {entry ? `${entry.tasksCompleted} tasks` : 'No activity'}
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-gray-600 text-[10px] font-[Rajdhani]">Less</span>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-3 h-3 rounded ${cellColors[i]}`} />
          ))}
          <span className="text-gray-600 text-[10px] font-[Rajdhani]">More</span>
        </div>
      </motion.div>

      {/* Milestones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5"
      >
        <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-400" />
          MILESTONES
        </h3>
        <div className="space-y-3">
          {[
            { days: 1, label: 'First Step', desc: 'Complete your first day', color: 'gray' },
            { days: 7, label: 'Week Warrior', desc: '7-day streak', color: 'blue' },
            { days: 14, label: 'Bi-Week Boss', desc: '14-day streak', color: 'purple' },
            { days: 30, label: 'Monthly Monarch', desc: '30-day streak', color: 'orange' },
            { days: 100, label: 'Century Slayer', desc: '100-day streak', color: 'yellow' },
          ].map((milestone, i) => {
            const achieved = streak.longestStreak >= milestone.days;
            const colorMap: Record<string, string> = {
              gray: achieved ? 'border-gray-500/50 bg-gray-500/10' : 'border-gray-800 bg-gray-900/20',
              blue: achieved ? 'border-blue-500/50 bg-blue-500/10' : 'border-gray-800 bg-gray-900/20',
              purple: achieved ? 'border-purple-500/50 bg-purple-500/10' : 'border-gray-800 bg-gray-900/20',
              orange: achieved ? 'border-orange-500/50 bg-orange-500/10' : 'border-gray-800 bg-gray-900/20',
              yellow: achieved ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-gray-800 bg-gray-900/20',
            };

            return (
              <motion.div
                key={milestone.days}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg border ${colorMap[milestone.color]}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  achieved ? 'text-white' : 'text-gray-700'
                }`}>
                  {achieved ? <Flame className="w-4 h-4" /> : <span className="text-xs font-[Orbitron]">{milestone.days}</span>}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-[Rajdhani] ${achieved ? 'text-white' : 'text-gray-600'}`}>
                    {milestone.label}
                  </p>
                  <p className="text-gray-600 text-[10px] font-[Rajdhani]">{milestone.desc}</p>
                </div>
                {achieved && <span className="text-green-400 text-xs font-[Rajdhani]">✓ CLEARED</span>}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5"
      >
        <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-4">ALL-TIME STATS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-[#0a0a1a]/50">
            <p className="text-xl font-bold font-[Orbitron] text-white">{state.tasks.filter(t => t.completed).length}</p>
            <p className="text-gray-500 text-[10px] font-[Rajdhani]">QUESTS DONE</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#0a0a1a]/50">
            <p className="text-xl font-bold font-[Orbitron] text-purple-400">{totalXP.toLocaleString()}</p>
            <p className="text-gray-500 text-[10px] font-[Rajdhani]">TOTAL XP</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#0a0a1a]/50">
            <p className="text-xl font-bold font-[Orbitron] text-white">{streak.longestStreak}d</p>
            <p className="text-gray-500 text-[10px] font-[Rajdhani]">BEST STREAK</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[#0a0a1a]/50">
            <p className="text-xl font-bold font-[Orbitron] text-white">{streak.dailyLog.length}</p>
            <p className="text-gray-500 text-[10px] font-[Rajdhani]">ACTIVE DAYS</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
