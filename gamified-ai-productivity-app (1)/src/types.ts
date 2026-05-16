export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // hashed in real app, stored plain for demo
  createdAt: string;
  lastLogin: string;
}

export interface PlayerStats {
  strength: number;
  intelligence: number;
  discipline: number;
  focus: number;
  totalPointsSpent: number;
}

export interface LevelInfo {
  level: number;
  currentXP: number;
  maxXp: number;
  rank: HunterRank;
  title: string;
}

export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  xpReward: number;
  statReward?: Partial<PlayerStats>;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export type TaskCategory = 'combat' | 'intel' | 'training' | 'quest' | 'daily';

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  dailyLog: DailyLogEntry[];
}

export interface DailyLogEntry {
  date: string;
  tasksCompleted: number;
  xpEarned: number;
  status: 'complete' | 'partial' | 'missed';
}

export interface Alarm {
  id: string;
  title: string;
  time: string;
  days: string[];
  enabled: boolean;
  notified: boolean;
  soundData?: string;
  soundName?: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'mentor';
  content: string;
  timestamp: string;
}

export interface GameState {
  user: User | null;
  stats: PlayerStats;
  level: LevelInfo;
  tasks: Task[];
  streak: StreakInfo;
  alarms: Alarm[];
  aiMessages: AIMessage[];
}

export interface Notification {
  id: string;
  message: string;
  type: 'xp' | 'level' | 'rank' | 'streak' | 'task' | 'system';
  timestamp: string;
  read: boolean;
}
