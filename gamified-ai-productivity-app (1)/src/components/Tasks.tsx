import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, Sword, Brain, Target, Zap, Calendar } from 'lucide-react';
import { useApp } from '../App';
import { Task, TaskCategory } from '../types';

const CATEGORIES: { id: TaskCategory; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'combat', label: 'Combat', icon: <Sword className="w-3 h-3" />, color: 'text-red-400' },
  { id: 'intel', label: 'Intel', icon: <Brain className="w-3 h-3" />, color: 'text-blue-400' },
  { id: 'training', label: 'Training', icon: <Target className="w-3 h-3" />, color: 'text-purple-400' },
  { id: 'quest', label: 'Quest', icon: <Zap className="w-3 h-3" />, color: 'text-yellow-400' },
  { id: 'daily', label: 'Daily', icon: <Calendar className="w-3 h-3" />, color: 'text-green-400' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-blue-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
};

export default function TasksPanel() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'daily' as TaskCategory,
    xpReward: 25,
    priority: 'medium' as Task['priority'],
    dueDate: new Date().toISOString().split('T')[0]
  });

  const filteredTasks = state.tasks
    .filter(t => {
      if (filter === 'active') return !t.completed;
      if (filter === 'completed') return t.completed;
      return true;
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const prio = { critical: 4, high: 3, medium: 2, low: 1 };
      return prio[b.priority] - prio[a.priority];
    });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    dispatch({ type: 'ADD_TASK', payload: form });
    setForm({ title: '', description: '', category: 'daily', xpReward: 25, priority: 'medium', dueDate: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  };

  const todayTasks = state.tasks.filter(t => t.dueDate === new Date().toISOString().split('T')[0]);
  const completedToday = todayTasks.filter(t => t.completed).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-purple-400/60 text-xs font-[Rajdhani] tracking-widest">[QUEST LOG]</p>
          <p className="text-white text-sm font-[Rajdhani]">
            {completedToday}/{todayTasks.length} today • {state.tasks.filter(t => !t.completed).length} remaining
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-xs font-[Orbitron] tracking-wider shadow-lg shadow-purple-900/30"
        >
          {showForm ? <Trash2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showForm ? 'CANCEL' : 'NEW QUEST'}
        </motion.button>
      </div>

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
                <label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">Quest Name</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50"
                  placeholder="Enter quest name..."
                  autoFocus
                />
              </div>
              <div>
                <label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">Due Date</label>
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
                placeholder="Quest details..."
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
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
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
              ACCEPT QUEST
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-[Rajdhani] tracking-wider transition-all ${
              filter === f
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-gray-500 hover:text-purple-400 border border-transparent'
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-600 text-xs font-[Rajdhani]">No quests found.</p>
            </motion.div>
          ) : (
            filteredTasks.map((task, i) => (
              <TaskItem key={task.id} task={task} index={i} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TaskItem({ task, index }: { task: Task; index: number }) {
  const { dispatch } = useApp();
  const cat = CATEGORIES.find(c => c.id === task.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`group rounded-xl border p-4 transition-all ${
        task.completed
          ? 'bg-[#0d1117]/40 border-purple-500/5 opacity-60'
          : 'bg-[#0d1117]/80 border-purple-500/10 hover:border-purple-500/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => dispatch({ type: 'TOGGLE_TASK', payload: task.id })}
          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            task.completed
              ? 'bg-green-500 border-green-500'
              : 'border-gray-600 hover:border-purple-400'
          }`}
        >
          {task.completed && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <Check className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-[Inter] ${task.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
              {task.title}
            </span>
            <span className={`text-[10px] ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority.toUpperCase()}
            </span>
          </div>
          {task.description && (
            <p className="text-gray-500 text-xs font-[Inter] mt-0.5 line-clamp-1">{task.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {cat && (
              <span className={`flex items-center gap-1 ${cat.color} text-[10px] font-[Rajdhani]`}>
                {cat.icon} {cat.label}
              </span>
            )}
            <span className="text-purple-400/60 text-[10px] font-[Rajdhani]">+{task.xpReward} XP</span>
            <span className="text-gray-600 text-[10px] font-[Rajdhani]">{task.dueDate}</span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => dispatch({ type: 'DELETE_TASK', payload: task.id })}
          className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
