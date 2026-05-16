import { motion } from 'framer-motion';
import { Sword, Brain, Target, Zap, Minus, Plus, Award, TrendingUp } from 'lucide-react';
import { useApp } from '../App';

const STAT_CONFIG = {
  strength: { label: 'Strength', icon: <Sword className="w-5 h-5" />, desc: 'Physical power & endurance', gradient: 'from-red-500 to-orange-500', bg: 'bg-red-500/10 border-red-500/20' },
  intelligence: { label: 'Intelligence', icon: <Brain className="w-5 h-5" />, desc: 'Knowledge & analytical ability', gradient: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  discipline: { label: 'Discipline', icon: <Target className="w-5 h-5" />, desc: 'Self-control & consistency', gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-500/10 border-purple-500/20' },
  focus: { label: 'Focus', icon: <Zap className="w-5 h-5" />, desc: 'Concentration & attention', gradient: 'from-yellow-500 to-amber-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
};

type StatKey = keyof typeof STAT_CONFIG;

export default function StatsPanel() {
  const { state, dispatch } = useApp();
  const availablePoints = state.stats.totalPointsSpent;
  const maxStat = Math.max(state.stats.strength, state.stats.intelligence, state.stats.discipline, state.stats.focus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-purple-400/60 text-xs font-[Rajdhani] tracking-widest">[STATUS WINDOW]</p>
            <h3 className="text-white font-bold font-[Orbitron] text-lg tracking-wider">PLAYER STATS</h3>
          </div>
          <motion.div
            animate={availablePoints > 0 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: availablePoints > 0 ? Infinity : 0 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 font-bold font-[Orbitron] text-sm">{availablePoints}</span>
            <span className="text-purple-400/60 text-xs font-[Rajdhani]">POINTS</span>
          </motion.div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(STAT_CONFIG) as StatKey[]).map((key, i) => {
          const config = STAT_CONFIG[key];
          const value = state.stats[key as keyof typeof state.stats] as number;
          const pct = Math.min((value / 100) * 100, 100);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`rounded-xl border p-5 ${config.bg}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${config.gradient} text-white`}>
                    {config.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-bold font-[Orbitron] text-sm tracking-wider">{config.label}</h4>
                    <p className="text-gray-500 text-[10px] font-[Rajdhani]">{config.desc}</p>
                  </div>
                </div>
                <span className="text-3xl font-black font-[Orbitron] text-white">{value}</span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-[#0a0a1a] rounded-full overflow-hidden mb-4">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${config.gradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => dispatch({ type: 'RESTORE_POINTS', payload: { stat: key as any, amount: 1 } })}
                  disabled={value <= 1}
                  className={`p-2 rounded-lg border transition-all ${
                    value <= 1
                      ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                      : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                <div className="flex-1" />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => dispatch({ type: 'SPEND_POINTS', payload: { stat: key as any, amount: 1 } })}
                  disabled={availablePoints <= 0}
                  className={`p-2 rounded-lg border transition-all ${
                    availablePoints <= 0
                      ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                      : `border-transparent bg-gradient-to-r ${config.gradient} text-white hover:opacity-80`
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5"
      >
        <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-4 flex items-center gap-2">
          <Award className="w-4 h-4 text-purple-400" />
          STAT DISTRIBUTION
        </h3>
        <div className="flex items-end gap-2 h-32">
          {(Object.keys(STAT_CONFIG) as StatKey[]).map((key, i) => {
            const config = STAT_CONFIG[key];
            const value = state.stats[key as keyof typeof state.stats] as number;
            const height = (value / maxStat) * 100;
            return (
              <motion.div
                key={key}
                className="flex-1 flex flex-col items-center gap-1"
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
              >
                <span className="text-white text-xs font-bold font-[Orbitron]">{value}</span>
                <div
                  className={`w-full rounded-t-lg bg-gradient-to-t ${config.gradient} min-h-[20px]`}
                />
                <span className="text-gray-500 text-[9px] font-[Rajdhani] uppercase tracking-wider text-center">
                  {config.label.slice(0, 4)}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-4"
      >
        <p className="text-blue-400 text-xs font-[Rajdhani] tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          [SYSTEM TIPS] Earn stat points by leveling up. Complete quests for XP. Balance your stats for optimal performance.
        </p>
      </motion.div>
    </div>
  );
}
