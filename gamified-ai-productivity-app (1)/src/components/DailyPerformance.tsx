import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, TrendingUp, Clock, BarChart3, Target, Zap, Calendar } from 'lucide-react';
import { useApp } from '../App';
import { Task, TaskCategory } from '../types';

const LIFE_CATEGORIES: { id: TaskCategory; label: string; icon: string; color: string; bg: string }[] = [
  { id: 'daily', label: 'Daily Habit', icon: '🔄', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  { id: 'training', label: 'Training', icon: '💪', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  { id: 'intel', label: 'Study/Learn', icon: '📚', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'quest', label: 'Project', icon: '🎯', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { id: 'combat', label: 'Health/Fitness', icon: '🏃', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
];

export default function DailyPerformance() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'daily' as TaskCategory,
    xpReward: 15,
    priority: 'medium' as Task['priority'],
    dueDate: new Date().toISOString().split('T')[0]
  });

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = state.tasks.filter(t => t.dueDate === today);
  const completedToday = todayTasks.filter(t => t.completed);
  const progress = todayTasks.length > 0 ? Math.round((completedToday.length / todayTasks.length) * 100) : 0;
  const todayXP = completedToday.reduce((sum, t) => sum + t.xpReward, 0);

  // Last 7 days performance
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    dispatch({ type: 'ADD_TASK', payload: form });
    setForm({ title: '', description: '', category: 'daily', xpReward: 15, priority: 'medium', dueDate: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const categoryBreakdown = LIFE_CATEGORIES.map(cat => ({
    ...cat,
    total: todayTasks.filter(t => t.category === cat.id).length,
    completed: completedToday.filter(t => t.category === cat.id).length
  }));

  return (
    <div className="space-y-6">
      {/* Daily Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950/50 via-purple-950/30 to-blue-950/50 border border-blue-500/20 p-6"
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(59,130,246,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(124,58,237,0.4) 0%, transparent 50%)'
          }}
        />
        <div className="relative z-10">
          <p className="text-blue-400/60 text-xs font-[Rajdhani] tracking-widest">[DAILY PERFORMANCE]</p>
          <h3 className="text-white font-bold font-[Orbitron] text-xl tracking-wider mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tasks Done', value: `${completedToday.length}/${todayTasks.length}`, icon: <Check className="w-5 h-5" />, color: 'text-green-400' },
          { label: 'XP Earned', value: todayXP.toString(), icon: <Zap className="w-5 h-5" />, color: 'text-yellow-400' },
          { label: 'Completion', value: `${progress}%`, icon: <Target className="w-5 h-5" />, color: 'text-purple-400' },
          { label: 'Remaining', value: `${todayTasks.length - completedToday.length}`, icon: <Clock className="w-5 h-5" />, color: 'text-orange-400' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-4"
          >
            <div className={`${item.color} mb-2`}>{item.icon}</div>
            <p className="text-2xl font-bold font-[Orbitron] text-white">{item.value}</p>
            <p className="text-gray-500 text-xs font-[Rajdhani] tracking-wider">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5"
        >
          <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            OVERALL PROGRESS
          </h3>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="#1a1a2e" strokeWidth="10" fill="none" />
                <motion.circle
                  cx="60" cy="60" r="50"
                  stroke="url(#progressGradient)"
                  strokeWidth="10" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - progress / 100) }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black font-[Orbitron] text-white">{progress}%</span>
                <span className="text-gray-500 text-[10px] font-[Rajdhani]">COMPLETE</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 7-Day Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5"
        >
          <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            7-DAY TREND
          </h3>
          <div className="flex items-end gap-2 h-32">
            {last7Days.map((date, i) => {
              const dayTasks = state.tasks.filter(t => t.dueDate === date);
              const dayCompleted = dayTasks.filter(t => t.completed).length;
              const dayPct = dayTasks.length > 0 ? (dayCompleted / dayTasks.length) * 100 : 0;
              const isToday = date === today;

              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <span className={`text-[10px] font-[Rajdhani] ${isToday ? 'text-purple-400' : 'text-gray-500'}`}>
                    {dayCompleted}
                  </span>
                  <motion.div
                    className={`w-full rounded-t-lg ${isToday ? 'bg-gradient-to-t from-purple-600 to-blue-500' : 'bg-purple-900/40'}`}
                    initial={{ height: 8 }}
                    animate={{ height: `${Math.max(dayPct, 5)}%` }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                    style={{ minHeight: '4px' }}
                  />
                  <span className={`text-[9px] font-[Rajdhani] ${isToday ? 'text-purple-400' : 'text-gray-600'}`}>
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Add Task Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowForm(!showForm)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl text-xs font-[Orbitron] tracking-wider shadow-lg shadow-purple-900/30"
      >
        {showForm ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {showForm ? 'CANCEL' : 'ADD DAILY TASK'}
      </motion.button>

      {/* Add Task Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="bg-[#0d1117]/80 border border-purple-500/20 rounded-xl p-5 space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">Task Name</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50"
                  placeholder="e.g. Morning workout, Read 30 pages..."
                  autoFocus
                />
              </div>
              <div>
                <label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50 resize-none"
                rows={2}
                placeholder="What exactly will you do?"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value as TaskCategory }))}
                  className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50"
                >
                  {LIFE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">XP Reward</label>
                <input
                  type="number"
                  min={5}
                  max={500}
                  value={form.xpReward}
                  onChange={e => setForm(f => ({ ...f, xpReward: Number(e.target.value) }))}
                  className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div>
                <label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">Priority</label>
                <select
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value as Task['priority'] }))}
                  className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded-lg text-xs font-[Orbitron] tracking-wider"
            >
              ADD TO DAILY QUESTS
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5"
      >
        <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          CATEGORY BREAKDOWN
        </h3>
        <div className="space-y-3">
          {categoryBreakdown.filter(c => c.total > 0).map(cat => {
            const pct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
            return (
              <div key={cat.id} className={`p-3 rounded-lg border ${cat.bg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-[Rajdhani] flex items-center gap-1 ${cat.color}`}>
                    {cat.icon} {cat.label}
                  </span>
                  <span className="text-white text-xs font-[Rajdhani]">{cat.completed}/{cat.total}</span>
                </div>
                <div className="h-1.5 bg-[#0a0a1a] rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${cat.color.replace('text-', 'from-').replace('400', '500')} to-transparent`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            );
          })}
          {categoryBreakdown.every(c => c.total === 0) && (
            <p className="text-gray-600 text-xs font-[Rajdhani] text-center py-4">No tasks for today yet. Add some!</p>
          )}
        </div>
      </motion.div>

      {/* Today's Task List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#0d1117]/80 border border-purple-500/10 rounded-xl p-5"
      >
        <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          TODAY'S TASKS
        </h3>
        {todayTasks.length === 0 ? (
          <p className="text-gray-600 text-xs font-[Rajdhani] text-center py-8">
            No tasks for today. Click "Add Daily Task" above!
          </p>
        ) : (
          <div className="space-y-2">
            {todayTasks.map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function TaskRow({ task }: { task: Task }) {
  const { dispatch } = useApp();
  const cat = LIFE_CATEGORIES.find(c => c.id === task.category);

  return (
    <motion.div
      layout
      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
        task.completed ? 'bg-[#0a0a1a]/30 opacity-60' : 'bg-[#0a0a1a]/60 hover:bg-[#0a0a1a]/80'
      }`}
    >
      <button
        onClick={() => dispatch({ type: 'TOGGLE_TASK', payload: task.id })}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          task.completed ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-purple-400'
        }`}
      >
        {task.completed && <Check className="w-3 h-3 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`text-sm font-[Inter] ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
          {task.title}
        </span>
        {cat && (
          <span className={`text-[10px] ${cat.color} ml-2`}>{cat.icon} {cat.label}</span>
        )}
      </div>
      <span className="text-purple-400/60 text-xs font-[Rajdhani] flex-shrink-0">+{task.xpReward} XP</span>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}
        className="text-gray-600 hover:text-red-400 transition"
      >
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
