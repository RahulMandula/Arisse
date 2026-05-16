import { motion } from 'framer-motion';
import { Sword, Brain, Target, Zap, TrendingUp, Flame, Award, ChevronRight } from 'lucide-react';
import { useApp } from '../App';
import { getRankColor } from '../utils';

export default function Dashboard() {
  const { state } = useApp();
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = state.tasks.filter(t => t.dueDate === today);
  const completedToday = todayTasks.filter(t => t.completed);
  const totalCompleted = state.tasks.filter(t => t.completed).length;
  const progress = todayTasks.length > 0 ? Math.round((completedToday.length / todayTasks.length) * 100) : 0;
  const rankColor = getRankColor(state.level.rank);
  const totalXp = state.level.currentXP + state.level.maxXp * (state.level.level - 1);

  const statIcons = {
    strength: <Sword className="w-5 h-5" />,
    intelligence: <Brain className="w-5 h-5" />,
    discipline: <Target className="w-5 h-5" />,
    focus: <Zap className="w-5 h-5" />
  };

  const statColors = {
    strength: 'from-red-500 to-red-700',
    intelligence: 'from-blue-500 to-blue-700',
    discipline: 'from-purple-500 to-purple-700',
    focus: 'from-yellow-500 to-yellow-700'
  };

  const statBgColors = {
    strength: 'bg-red-500/10 border-red-500/20',
    intelligence: 'bg-blue-500/10 border-blue-500/20',
    discipline: 'bg-purple-500/10 border-purple-500/20',
    focus: 'bg-yellow-500/10 border-yellow-500/20'
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 border border-purple-500/20 p-6"
      >
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(124,58,237,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(59,130,246,0.3) 0%, transparent 50%)'
          }}
        />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-purple-400/60 text-xs font-[Rajdhani] tracking-widest mb-1">[SYSTEM] WELCOME BACK</p>
            <h2 className="text-2xl font-bold font-[Orbitron] text-white">
              Welcome, {state.user?.username}
            </h2>
            <p className="text-purple-300/70 text-sm font-[Rajdhani] mt-1">
              {state.level.title} • {state.streak.currentStreak} day streak
            </p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-center"
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black font-[Orbitron] border-2"
              style={{ borderColor: rankColor, color: rankColor, background: `${rankColor}15` }}
            >
              {state.level.rank}
            </div>
            <p className="text-purple-400/50 text-[10px] font-[Rajdhani] mt-1 tracking-widest">HUNTER RANK</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Level', value: state.level.level.toString(), icon: <Award className="w-5 h-5" />, color: 'purple' },
          { label: 'Total XP', value: totalXp.toLocaleString(), icon: <Zap className="w-5 h-5" />, color: 'blue' },
          { label: 'Streak', value: `${state.streak.currentStreak}d`, icon: <Flame className="w-5 h-5" />, color: 'orange' },
          { label: 'Quests Done', value: totalCompleted.toString(), icon: <TrendingUp className="w-5 h-5" />, color: 'green' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-4 hover:border-purple-500/30 transition-all"
          >
            <div className={`text-${item.color}-400/60 mb-2`}>{item.icon}</div>
            <p className="text-2xl font-bold font-[Orbitron] text-white">{item.value}</p>
            <p className="text-gray-500 text-xs font-[Rajdhani] tracking-wider">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Today's Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider">TODAY'S QUESTS</h3>
          <span className="text-purple-400 text-xs font-[Rajdhani]">{progress}% COMPLETE</span>
        </div>

        <div className="mb-4">
          <div className="h-3 bg-[#0a0a1a] rounded-full overflow-hidden border border-purple-500/10">
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background: 'linear-gradient(90deg, #7c3aed, #3b82f6)'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </motion.div>
          </div>
        </div>

        {todayTasks.length === 0 ? (
          <p className="text-gray-600 text-xs font-[Rajdhani] text-center py-4">
            No quests assigned for today. Create quests in the Quest Log!
          </p>
        ) : (
          <div className="space-y-2">
            {todayTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#0a0a1a]/50">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  task.completed ? 'bg-green-500 border-green-500' : 'border-gray-600'
                }`}>
                  {task.completed && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  )}
                </div>
                <span className={`text-sm font-[Inter] flex-1 ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {task.title}
                </span>
                <span className="text-purple-400/60 text-xs font-[Rajdhani]">+{task.xpReward} XP</span>
              </div>
            ))}
            {todayTasks.length > 5 && (
              <p className="text-gray-600 text-xs font-[Rajdhani] text-center">
                +{todayTasks.length - 5} more quests
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5"
      >
        <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-4">PLAYER STATS</h3>
        <div className="grid grid-cols-2 gap-3">
          {(['strength', 'intelligence', 'discipline', 'focus'] as const).map((stat, i) => {
            const maxStat = Math.max(state.stats.strength, state.stats.intelligence, state.stats.discipline, state.stats.focus);
            const pct = (state.stats[stat] / maxStat) * 100;
            return (
              <div key={stat} className={`rounded-xl p-4 border ${statBgColors[stat]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-400">{statIcons[stat]}</span>
                  <span className="text-white text-xs font-[Rajdhani] tracking-wider uppercase">
                    {stat}
                  </span>
                </div>
                <p className="text-2xl font-bold font-[Orbitron] text-white mb-2">
                  {state.stats[stat]}
                </p>
                <div className="h-1.5 bg-[#0a0a1a] rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${statColors[stat]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {state.stats.totalPointsSpent > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-3 flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
          >
            <span className="text-purple-300 text-xs font-[Rajdhani] tracking-wider">
              ⚡ {state.stats.totalPointsSpent} STAT POINTS AVAILABLE
            </span>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
