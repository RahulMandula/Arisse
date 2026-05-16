import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sword, Clock, Bell,
  Crown, Flame, X, LayoutGrid,
  BookOpen, LogOut, Eye, EyeOff, Menu,
  User, Globe, BarChart3
} from 'lucide-react';
import { GameState, Task, PlayerStats, Notification as NotifType, Alarm } from './types';
import { DB, generateId, getToday, getRankColor, getDefaultState, addXp, checkAndUpdateStreak } from './utils';
import * as idb from './database';
import { soundSystem } from './sounds';
import AIMentor from './components/AIMentor';
import Dashboard from './components/Dashboard';
import TasksPanel from './components/Tasks';
import StatsPanel from './components/Stats';
import StreaksPanel from './components/Streaks';
import AlarmsPanel from './components/Alarms';
import LandingPage from './components/LandingPage';
import ProfilePage from './components/Profile';
import LeaderboardPage from './components/Leaderboard';
import DailyPerformance from './components/DailyPerformance';

const AppContext = createContext<{
  state: GameState;
  notifications: NotifType[];
  dispatch: (action: AppAction) => void;
} | null>(null);

type Page = 'dashboard' | 'tasks' | 'stats' | 'streaks' | 'alarms' | 'mentor' | 'profile' | 'leaderboard' | 'daily';
type AppAction =
  | { type: 'LOGIN'; payload: GameState }
  | { type: 'LOGOUT' }
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id' | 'completed' | 'createdAt' | 'completedAt'> }
  | { type: 'TOGGLE_TASK'; payload: string }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SPEND_POINTS'; payload: { stat: keyof PlayerStats; amount: number } }
  | { type: 'RESTORE_POINTS'; payload: { stat: keyof PlayerStats; amount: number } }
  | { type: 'ADD_ALARM'; payload: Alarm }
  | { type: 'TOGGLE_ALARM'; payload: string }
  | { type: 'DELETE_ALARM'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string };

function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Helper: save state to both IndexedDB and localStorage
async function persistState(state: GameState) {
  DB.set('gameState', state);
  if (state.user) {
    await idb.saveGameState(state.user.id, state).catch(() => {});
  }
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(() => DB.get('gameState', getDefaultState()));
  const [notifications, setNotifications] = useState<NotifType[]>(() => DB.get('notifications', []));

  // Auto-save to IndexedDB whenever state changes
  useEffect(() => {
    persistState(state);
  }, [state]);

  useEffect(() => {
    DB.set('notifications', notifications);
  }, [notifications]);

  useEffect(() => {
    if (state.user) setState(prev => checkAndUpdateStreak(prev));
  }, []);

  // Alarm checker
  useEffect(() => {
    const interval = setInterval(() => {
      if (!state.user) return;
      const now = new Date();
      const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const md = days[now.getDay()];
      const match = state.alarms.find(a => a.enabled && a.time === ct && a.days.includes(md));
      if (match) {
        setNotifications(prev => [...prev, { id: generateId(), message: `[ALARM] ${match.title}`, type: 'system', timestamp: now.toISOString(), read: false }]);
        soundSystem.playAlarm();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [state.user, state.alarms]);

  const dispatch = useCallback((action: AppAction) => {
    switch (action.type) {
      case 'LOGIN':
        setState(action.payload);
        soundSystem.playLevelUp();
        break;
      case 'LOGOUT':
        soundSystem.playClick();
        DB.clear();
        setState(getDefaultState());
        break;
      case 'ADD_TASK': {
        const newTask: Task = { ...action.payload, id: generateId(), completed: false, createdAt: new Date().toISOString(), dueDate: action.payload.dueDate || getToday() };
        setState(prev => ({ ...prev, tasks: [...prev.tasks, newTask] }));
        soundSystem.playClick();
        break;
      }
      case 'TOGGLE_TASK':
        setState(prev => {
          const tasks = prev.tasks.map(t => {
            if (t.id !== action.payload) return t;
            if (!t.completed) {
              const result = addXp(prev, t.xpReward);
              setNotifications(n => [...n, ...result.notifications]);
              if (result.notifications.some(n => n.type === 'level')) soundSystem.playLevelUp();
              else if (result.notifications.some(n => n.type === 'rank')) soundSystem.playRankUp();
              else soundSystem.playTaskComplete();
              return { ...t, completed: true, completedAt: new Date().toISOString() };
            }
            return { ...t, completed: false, completedAt: undefined };
          });
          return { ...prev, tasks };
        });
        break;
      case 'DELETE_TASK':
        setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== action.payload) }));
        soundSystem.playClick();
        break;
      case 'SPEND_POINTS':
        setState(prev => {
          const pts = prev.stats.totalPointsSpent;
          if (pts <= 0) return prev;
          const amt = Math.min(action.payload.amount, pts);
          return { ...prev, stats: { ...prev.stats, [action.payload.stat]: (prev.stats[action.payload.stat] as number) + amt, totalPointsSpent: pts - amt } };
        });
        soundSystem.playClick();
        break;
      case 'RESTORE_POINTS':
        setState(prev => {
          const val = prev.stats[action.payload.stat] as number;
          const amt = Math.min(action.payload.amount, val - 1);
          if (amt <= 0) return prev;
          return { ...prev, stats: { ...prev.stats, [action.payload.stat]: val - amt, totalPointsSpent: prev.stats.totalPointsSpent + amt } };
        });
        soundSystem.playClick();
        break;
      case 'ADD_ALARM':
        setState(prev => ({ ...prev, alarms: [...prev.alarms, action.payload] }));
        soundSystem.playClick();
        break;
      case 'TOGGLE_ALARM':
        setState(prev => ({ ...prev, alarms: prev.alarms.map(a => a.id === action.payload ? { ...a, enabled: !a.enabled } : a) }));
        soundSystem.playClick();
        break;
      case 'DELETE_ALARM':
        setState(prev => ({ ...prev, alarms: prev.alarms.filter(a => a.id !== action.payload) }));
        soundSystem.playClick();
        break;
      case 'MARK_NOTIFICATION_READ':
        setNotifications(prev => prev.map(n => n.id === action.payload ? { ...n, read: true } : n));
        break;
    }
  }, []);

  return <AppContext.Provider value={{ state, notifications, dispatch }}>{children}</AppContext.Provider>;
}

function LevelBadge({ level, rank, size = 'md' }: { level: number; rank: string; size?: 'sm' | 'md' | 'lg' }) {
  const color = getRankColor(rank as any);
  const sizeClasses = { sm: 'w-10 h-10 text-xs', md: 'w-14 h-14 text-sm', lg: 'w-20 h-20 text-xl' };
  return (
    <motion.div whileHover={{ scale: 1.1 }} className="relative inline-flex items-center justify-center">
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-black font-[Orbitron] border-2`} style={{ borderColor: color, color, background: `${color}15` }}>
        <span className="relative z-10">{rank}</span>
      </div>
      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0d1117] border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-white font-[Rajdhani]">{level}</div>
    </motion.div>
  );
}

function XPBar({ current, max, level }: { current: number; max: number; level: number }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-[Rajdhani] text-purple-400/70 tracking-wider">LEVEL {level}</span>
        <span className="text-[10px] font-[Rajdhani] text-purple-400/70">{current}/{max} XP</span>
      </div>
      <div className="h-2 bg-[#0a0a1a] rounded-full overflow-hidden border border-purple-500/10">
        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #3b82f6, #8b5cf6)' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}>
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        </motion.div>
      </div>
    </div>
  );
}

function NotificationToast({ notification, onClose }: { notification: NotifType; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const colors: Record<string, string> = {
    xp: 'border-blue-500/50 bg-blue-950/80 text-blue-300', level: 'border-yellow-500/50 bg-yellow-950/80 text-yellow-300',
    rank: 'border-red-500/50 bg-red-950/80 text-red-300', streak: 'border-orange-500/50 bg-orange-950/80 text-orange-300',
    task: 'border-green-500/50 bg-green-950/80 text-green-300', system: 'border-purple-500/50 bg-purple-950/80 text-purple-300'
  };
  return (
    <motion.div initial={{ opacity: 0, x: 100, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 100, scale: 0.8 }} className={`rounded-lg border p-3 backdrop-blur-xl shadow-lg ${colors[notification.type] || colors.system}`}>
      <p className="text-xs font-[Rajdhani] tracking-wide whitespace-nowrap">{notification.message}</p>
    </motion.div>
  );
}

function Sidebar({ currentPage, setPage, onLogout, mobileOpen, setMobileOpen }: {
  currentPage: Page; setPage: (p: Page) => void; onLogout: () => void; mobileOpen: boolean; setMobileOpen: (v: boolean) => void;
}) {
  const { state, notifications } = useApp();
  const unread = notifications.filter(n => !n.read).length;
  const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutGrid className="w-5 h-5" /> },
    { id: 'daily', label: 'Daily Life', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'tasks', label: 'Quest Log', icon: <Sword className="w-5 h-5" /> },
    { id: 'stats', label: 'Stats', icon: <Crown className="w-5 h-5" /> },
    { id: 'streaks', label: 'Streaks', icon: <Flame className="w-5 h-5" /> },
    { id: 'alarms', label: 'Alarms', icon: <Clock className="w-5 h-5" /> },
    { id: 'mentor', label: 'Shadow Mentor', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Globe className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <motion.aside className={`fixed lg:static top-0 left-0 h-[calc(100vh-32px)] z-50 w-64 bg-[#0d1117]/95 backdrop-blur-xl border-r border-purple-500/10 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-purple-500/10">
          <div className="flex items-center gap-3">
            <LevelBadge level={state.level.level} rank={state.level.rank} size="sm" />
            <div><h2 className="text-white font-bold font-[Orbitron] text-sm tracking-wider">SHADOW</h2><p className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-widest">SYSTEM v3.0</p></div>
          </div>
        </div>
        <div className="px-5 py-4 border-b border-purple-500/10">
          <p className="text-white text-sm font-[Inter] font-medium truncate">{state.user?.username}</p>
          <p className="text-purple-400/50 text-xs font-[Rajdhani]">{state.level.title}</p>
          <XPBar current={state.level.currentXP} max={state.level.maxXp} level={state.level.level} />
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setPage(item.id); setMobileOpen(false); soundSystem.playClick(); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-[Rajdhani] tracking-wider transition-all ${currentPage === item.id ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20' : 'text-gray-500 hover:text-purple-400 hover:bg-purple-500/5'}`}>
              {item.icon}<span>{item.label}</span>
              {item.id === 'dashboard' && unread > 0 && <span className="ml-auto bg-red-500/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-purple-500/10">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-[Rajdhani] tracking-wider text-red-400/60 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <LogOut className="w-5 h-5" /><span>Disconnect</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function Footer() {
  return (
    <footer className="bg-[#0d1117]/50 border-t border-purple-500/10 px-4 py-2 text-center flex-shrink-0">
      <p className="text-gray-700 text-[10px] font-[Rajdhani] tracking-[0.25em]">⚡ MADE BY MANDULA RAHUL ⚡</p>
    </footer>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);
  return (
    <AppProvider>
      <MainLayout page={page} setPage={setPage} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} />
    </AppProvider>
  );
}

function MainLayout({ page, setPage, mobileMenu, setMobileMenu }: {
  page: Page; setPage: (p: Page) => void; mobileMenu: boolean; setMobileMenu: (v: boolean) => void;
}) {
  const { state, notifications, dispatch } = useApp();
  const [showNotif, setShowNotif] = useState(false);
  const [showLanding, setShowLanding] = useState(!state.user);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const recentNotifs = notifications.filter(n => !n.read).slice(0, 5);

  const handleLogout = () => dispatch({ type: 'LOGOUT' });
  const handleLandingEnter = (newState: GameState) => { dispatch({ type: 'LOGIN', payload: newState }); setShowLanding(false); };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    soundSystem.resume();
    if (!authName.trim() || !authEmail.trim() || !authPass.trim()) { setAuthError('[SYSTEM] All fields required'); soundSystem.playError(); return; }
    if (authName.length < 2) { setAuthError('[SYSTEM] Name too short'); soundSystem.playError(); return; }

    if (authTab === 'login') {
      const existing = await idb.findUserByUsername(authName.trim());
      if (existing) {
        const saved = await idb.getGameState(existing.id);
        if (saved) {
          const gs: GameState = { user: existing, stats: saved.stats || getDefaultState().stats, level: saved.level || getDefaultState().level, tasks: saved.tasks || [], streak: saved.streak || getDefaultState().streak, alarms: saved.alarms || [], aiMessages: saved.aiMessages || [] };
          gs.user!.lastLogin = new Date().toISOString();
          dispatch({ type: 'LOGIN', payload: gs });
          setShowAuth(false);
          return;
        }
      }
      setAuthError('[SYSTEM] No records found. Register first.');
      soundSystem.playError();
    } else {
      const existing = await idb.findUserByUsername(authName.trim());
      if (existing) { setAuthError('[SYSTEM] Already registered. Login.'); soundSystem.playError(); return; }
      const newUser = { id: generateId(), username: authName.trim(), email: authEmail.trim(), password: authPass, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString() };
      await idb.saveUser(newUser);
      await idb.registerPlayer(authName.trim(), 1, 'E');
      const gs: GameState = { ...getDefaultState(), user: newUser };
      await idb.saveGameState(newUser.id, gs);
      dispatch({ type: 'LOGIN', payload: gs });
      setShowAuth(false);
    }
  };

  if (showLanding) return <LandingPage onEnter={handleLandingEnter} />;

  if (!state.user && !showAuth) {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="text-center mb-6">
            <div className="text-6xl font-black font-[Orbitron] bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">SL</div>
            <h1 className="text-2xl font-bold font-[Orbitron] text-white mt-4">SHADOW SYSTEM</h1>
          </motion.div>
          <div className="bg-[#0d1117]/80 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex gap-2 mb-4">
              <button onClick={() => { setAuthTab('register'); setAuthError(''); soundSystem.playClick(); }} className={`flex-1 py-2 rounded-lg text-xs font-[Orbitron] ${authTab === 'register' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-500 border border-transparent'}`}>REGISTER</button>
              <button onClick={() => { setAuthTab('login'); setAuthError(''); soundSystem.playClick(); }} className={`flex-1 py-2 rounded-lg text-xs font-[Orbitron] ${authTab === 'login' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-500 border border-transparent'}`}>LOGIN</button>
            </div>
            <form onSubmit={handleAuth} className="space-y-4">
              <div><label className="text-purple-400 text-xs font-[Rajdhani] uppercase">Hunter Name</label><input type="text" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2.5 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50" placeholder="Your name..." /></div>
              <div><label className="text-purple-400 text-xs font-[Rajdhani] uppercase">Email</label><input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2.5 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50" placeholder="email@system.io" /></div>
              <div><label className="text-purple-400 text-xs font-[Rajdhani] uppercase">Passphrase</label><div className="relative"><input type={showPass ? 'text' : 'password'} value={authPass} onChange={e => setAuthPass(e.target.value)} className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2.5 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50 pr-10" placeholder="••••••" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-7 text-purple-400/50">{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
              {authError && <div className="bg-red-950/50 border border-red-500/30 rounded-lg p-2"><p className="text-red-400 text-xs font-[Rajdhani]">{authError}</p></div>}
              <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg text-xs font-[Orbitron] tracking-wider">{authTab === 'login' ? 'ARISE (LOGIN)' : 'ARISE (REGISTER)'}</button>
            </form>
          </div>
          <button onClick={() => setShowAuth(true)} className="w-full mt-3 text-purple-400/60 text-xs font-[Rajdhani] hover:text-purple-400">← Back to Landing Page</button>
          <p className="text-center text-gray-700 text-[10px] font-[Rajdhani] mt-4">MADE BY MANDULA RAHUL</p>
        </div>
      </div>
    );
  }

  const pageTitles: Record<Page, string> = { dashboard: 'DASHBOARD', daily: 'DAILY LIFE', tasks: 'QUEST LOG', stats: 'STATS', streaks: 'STREAKS', alarms: 'ALARMS', mentor: 'SHADOW MENTOR', leaderboard: 'LEADERBOARD', profile: 'PROFILE' };

  return (
    <div className="min-h-screen bg-[#0a0a1a] text-white flex flex-col">
      <div className="flex flex-1 min-h-0">
        <Sidebar currentPage={page} setPage={setPage} onLogout={handleLogout} mobileOpen={mobileMenu} setMobileOpen={setMobileMenu} />
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <header className="sticky top-0 z-30 bg-[#0d1117]/80 backdrop-blur-xl border-b border-purple-500/10 px-4 lg:px-6 py-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileMenu(true)} className="lg:hidden text-purple-400/60 hover:text-purple-400"><Menu className="w-6 h-6" /></button>
              <h1 className="text-lg font-bold font-[Orbitron] tracking-wider text-white">{pageTitles[page]}</h1>
            </div>
            <div className="flex items-center gap-3">
              <LevelBadge level={state.level.level} rank={state.level.rank} size="sm" />
              <button onClick={() => setShowNotif(!showNotif)} className="relative text-purple-400/60 hover:text-purple-400 transition">
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />}
              </button>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                {page === 'dashboard' && <Dashboard />}
                {page === 'daily' && <DailyPerformance />}
                {page === 'tasks' && <TasksPanel />}
                {page === 'stats' && <StatsPanel />}
                {page === 'streaks' && <StreaksPanel />}
                {page === 'alarms' && <AlarmsPanel />}
                {page === 'mentor' && <AIMentor />}
                {page === 'leaderboard' && <LeaderboardPage />}
                {page === 'profile' && <ProfilePage />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
      <Footer />

      {/* Notification Popup */}
      <AnimatePresence>
        {showNotif && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-16 right-4 z-50 w-80 max-h-96 overflow-y-auto bg-[#0d1117]/95 backdrop-blur-xl border border-purple-500/20 rounded-xl shadow-2xl">
            <div className="p-4 border-b border-purple-500/10 flex items-center justify-between">
              <h3 className="text-white font-bold font-[Orbitron] text-sm">SYSTEM NOTIFICATIONS</h3>
              <button onClick={() => setShowNotif(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-2">
              {notifications.length === 0 ? <p className="text-gray-600 text-xs text-center py-4 font-[Rajdhani]">No notifications</p> : notifications.slice(0, 10).map(n => (
                <div key={n.id} className={`p-3 rounded-lg mb-1 ${n.read ? 'opacity-50' : 'bg-purple-500/5'}`}>
                  <p className="text-xs text-purple-300/80 font-[Rajdhani]">{n.message}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{new Date(n.timestamp).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-14 right-4 z-50 space-y-2 max-w-xs">
        <AnimatePresence>
          {recentNotifs.map(n => (<NotificationToast key={n.id} notification={n} onClose={() => dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id })} />))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { useApp };
