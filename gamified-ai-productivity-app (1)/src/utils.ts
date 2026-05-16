import { GameState, PlayerStats, LevelInfo, HunterRank, StreakInfo, Notification } from './types';

// Database utilities (localStorage-based)
export const DB = {
  get: <T>(key: string, defaultValue: T): T => {
    try { const data = localStorage.getItem(`solo_${key}`); return data ? JSON.parse(data) : defaultValue; } catch { return defaultValue; }
  },
  set: (key: string, value: unknown) => { localStorage.setItem(`solo_${key}`, JSON.stringify(value)); },
  clear: () => { Object.keys(localStorage).filter(k => k.startsWith('solo_')).forEach(k => localStorage.removeItem(k)); }
};

export const generateId = (): string => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
export const getToday = (): string => new Date().toISOString().split('T')[0];
export const getXpForLevel = (level: number): number => Math.floor(100 * Math.pow(1.15, level - 1));

export const getRankForLevel = (level: number): HunterRank => {
  if (level >= 50) return 'S'; if (level >= 40) return 'A'; if (level >= 30) return 'B'; if (level >= 20) return 'C'; if (level >= 10) return 'D'; return 'E';
};

export const getRankColor = (rank: HunterRank): string => {
  const colors: Record<HunterRank, string> = { 'E': '#8B8B8B', 'D': '#4FC3F7', 'C': '#66BB6A', 'B': '#AB47BC', 'A': '#FFA726', 'S': '#FF1744' };
  return colors[rank];
};

export const getTitleForRank = (rank: HunterRank): string => {
  const titles: Record<HunterRank, string> = { 'E': 'E-Rank Hunter', 'D': 'D-Rank Hunter', 'C': 'C-Rank Hunter', 'B': 'B-Rank Hunter', 'A': 'A-Rank Hunter', 'S': 'Shadow Monarch' };
  return titles[rank];
};

export const createDefaultStats = (): PlayerStats => ({ strength: 10, intelligence: 10, discipline: 10, focus: 10, totalPointsSpent: 0 });
export const createDefaultLevel = (): LevelInfo => ({ level: 1, currentXP: 0, maxXp: 100, rank: 'E', title: 'E-Rank Hunter' });
export const createDefaultStreak = (): StreakInfo => ({ currentStreak: 0, longestStreak: 0, lastActiveDate: '', dailyLog: [] });
export const getDefaultState = (): GameState => ({ user: null, stats: createDefaultStats(), level: createDefaultLevel(), tasks: [], streak: createDefaultStreak(), alarms: [], aiMessages: [] });

export const addXp = (state: GameState, xp: number): { state: GameState; notifications: Notification[] } => {
  const notifications: Notification[] = [];
  let newXP = state.level.currentXP + xp;
  let newLevel = { ...state.level };
  let newStats = { ...state.stats };
  let pointsGained = 0;

  notifications.push({ id: generateId(), message: `[SYSTEM] You gained ${xp} XP!`, type: 'xp', timestamp: new Date().toISOString(), read: false });

  while (newXP >= newLevel.maxXp) {
    newXP -= newLevel.maxXp;
    newLevel.level++;
    newLevel.currentXP = newXP;
    newLevel.maxXp = getXpForLevel(newLevel.level);
    newLevel.rank = getRankForLevel(newLevel.level);
    newLevel.title = getTitleForRank(newLevel.rank);
    pointsGained += 3;
    notifications.push({ id: generateId(), message: `[SYSTEM] LEVEL UP! You are now Level ${newLevel.level}!`, type: 'level', timestamp: new Date().toISOString(), read: false });
    if (newLevel.rank !== state.level.rank) notifications.push({ id: generateId(), message: `[SYSTEM] RANK UP! You are now ${newLevel.title}!`, type: 'rank', timestamp: new Date().toISOString(), read: false });
  }
  newStats.totalPointsSpent = state.stats.totalPointsSpent - pointsGained;
  return { state: { ...state, level: newLevel, stats: newStats }, notifications };
};

export const checkAndUpdateStreak = (state: GameState): GameState => {
  const today = getToday();
  const streak = { ...state.streak };
  let updated = false;
  const todayTasks = state.tasks.filter(t => t.dueDate === today && t.completed);
  if (todayTasks.length > 0) {
    if (streak.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (streak.lastActiveDate === yesterday) streak.currentStreak++;
      else if (streak.lastActiveDate !== today) streak.currentStreak = 1;
      streak.lastActiveDate = today;
      updated = true;
    }
    if (streak.currentStreak > streak.longestStreak) { streak.longestStreak = streak.currentStreak; updated = true; }
    const existingEntry = streak.dailyLog.find(d => d.date === today);
    if (!existingEntry) {
      streak.dailyLog.unshift({ date: today, tasksCompleted: todayTasks.length, xpEarned: todayTasks.reduce((sum, t) => sum + t.xpReward, 0), status: 'partial' });
      updated = true;
    } else { existingEntry.tasksCompleted = todayTasks.length; existingEntry.xpEarned = todayTasks.reduce((sum, t) => sum + t.xpReward, 0); updated = true; }
    if (updated) streak.dailyLog = streak.dailyLog.slice(0, 30);
  }
  return updated ? { ...state, streak } : state;
};

// Improved AI Mentor
export const getAIResponse = (message: string, state: GameState): string => {
  const lower = message.toLowerCase();
  const level = state.level.level;
  const rank = state.level.rank;
  const stats = state.stats;
  const today = getToday();
  const todayTasks = state.tasks.filter(t => t.dueDate === today);
  const completedTasks = todayTasks.filter(t => t.completed);
  const progress = todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('greetings')) {
    return `*[SYSTEM] Shadow Mentor Online*\n\nGreetings, Hunter ${state.user?.username || 'unknown'}. I am your Shadow Mentor.\n\nYou are currently Level ${level} ${rank}-Rank.\n${todayTasks.length > 0 ? `Today's Quest Progress: ${completedTasks.length}/${todayTasks.length} (${progress}%)` : 'No quests assigned for today.'}\nCurrent Streak: ${state.streak.currentStreak} days\n\nHow can I assist you on your journey to the Throne of Shadows?`;
  }

  if (lower.includes('motivat') || lower.includes('discourage') || lower.includes('tired') || lower.includes('give up') || lower.includes('weak') || lower.includes('lazy')) {
    const motivational = [
      `*"The weak have no rights or choices. They only have one destiny — to be ruled by the strong."*\n\nBut remember, Hunter — YOU CHOSE to level up. No one forced you. You decided to become stronger. Every task you complete is a shadow you command. Now rise and fight!`,
      `*"I am the one who holds the power... I am the nightmare. I am the terror."*\n\nYou feel weak because you're not pushing hard enough. The System chose YOU. That means you have potential even you can't see yet. Complete your quests. One by one. ARISE.`,
      `*"Do you think I became the Shadow Monarch by resting? No. Every shadow I command was earned through blood and will."*\n\nDiscomfort is the price of growth. Embrace it. Every quest you complete makes you stronger. Your current streak is ${state.streak.currentStreak} days — don't break it now.`,
      `🔥 *"Only I hold back. Only I must hold back."*\n\nHunter, discipline is what separates E-Rank from S-Rank. You are currently Level ${level} ${rank}-Rank. Is that where you want to stay? Every uncompleted quest is a shadow you'll never command. Get up. Work now. Regret later.`,
      `*"The pain of discipline weighs ounces. The pain of regret weighs tons."*\n\nYour stats show your weakest attribute is ${Object.entries(stats).filter(([k]) => !k.includes('total')).sort((a, b) => a[1] - b[1])[0][0]}. Strengthen it. Every day you slacker, another Hunter surpasses you. The System doesn't forgive the lazy.`
    ];
    return motivational[Math.floor(Math.random() * motivational.length)];
  }

  if (lower.includes('task') || lower.includes('quest') || lower.includes('duty') || lower.includes('mission')) {
    if (todayTasks.length === 0) return `[SYSTEM] You have no quests for today.\n\nA Shadow Monarch without quests is like a gate without shadows. Go to your Quest Log and set your daily missions. Your strength comes from discipline, and discipline comes from action.`;
    return `[SYSTEM] QUEST REPORT:\n\n📋 Total Quests Today: ${todayTasks.length}\n✅ Completed: ${completedTasks.length}\n❌ Remaining: ${todayTasks.length - completedTasks.length}\n📊 Progress: ${progress}%\n\n${progress === 0 ? '⚠ WARNING: You haven\'t started today. Every minute wasted is XP lost.' : progress < 50 ? '⚠ Your progress is sluggish. A real Hunter would push harder. Complete your remaining quests now.' : progress < 100 ? '👍 Good progress. But don\'t stop until ALL quests are cleared. The System demands 100%.' : '🏆 ALL QUESTS CLEARED! Outstanding work, Hunter. You are worthy of the shadows.'}`;
  }

  if (lower.includes('stat') || lower.includes('attribute') || lower.includes('power') || lower.includes('strong')) {
    const entries = Object.entries(stats).filter(([k]) => !k.includes('total'));
    const sorted = entries.sort((a, b) => a[1] - b[1]);
    const weakest = sorted[0];
    const strongest = sorted[sorted.length - 1];
    return `[SYSTEM] ATTRIBUTE ANALYSIS:\n\n⚔ Strength: ${stats.strength}\n🧠 Intelligence: ${stats.intelligence}\n📋 Discipline: ${stats.discipline}\n🎯 Focus: ${stats.focus}\n⚡ Available Points: ${stats.totalPointsSpent}\n\n📉 Weakest: ${weakest[0]} (${weakest[1]})\n📈 Strongest: ${strongest[0]} (${strongest[1]})\n\n${stats.totalPointsSpent > 0 ? `🔔 You have ${stats.totalPointsSpent} unallocated points. Invest them wisely!` : '⚠ No available stat points. Level up to earn more.'}`;
  }

  if (lower.includes('train') || lower.includes('improv') || lower.includes('better') || lower.includes('level up') || lower.includes('faster')) {
    return `[SYSTEM] LEVELING STRATEGY:\n\n1️⃣ Complete ALL daily quests — consistency is the power of the Shadow Monarch\n2️⃣ Set HARDER quests — only by facing strong challenges do we grow\n3️⃣ Maintain your ${state.streak.currentStreak}-day streak — every day you complete tasks, you grow stronger\n4️⃣ Balance your stats — a weak attribute is a vulnerability\n5️⃣ Never skip a day — each day is a dungeon. Clear it.\n\n*"Every time I defeat a monster, it becomes my shadow. Every time you complete a quest, you grow stronger."*`;
  }

  if (lower.includes('rank') || lower.includes('level') || lower.includes('progress') || lower.includes('where')) {
    const xpNeeded = state.level.maxXp - state.level.currentXP;
    const nextRank = getRankForLevel(level + (level % 10 === 0 ? 0 : 10 - (level % 10)));
    return `[SYSTEM] STATUS REPORT:\n\n🏅 Level: ${level}\n🎖 Rank: ${getTitleForRank(rank)}\n⭐ XP: ${state.level.currentXP}/${state.level.maxXp}\n📈 XP to Next Level: ${xpNeeded}\n🔥 Streak: ${state.streak.currentStreak} days\n\n${rank === 'S' ? '👑 You have reached the pinnacle — Shadow Monarch. There is no higher rank. The throne is yours.' : `⏭ Next Rank: ${getTitleForRank(nextRank as HunterRank)}`}\n\n*"The path from E-Rank to S-Rank was never easy. But I walked it anyway."*`;
  }

  if (lower.includes('streak') || lower.includes('chain') || lower.includes('consecut')) {
    return `[SYSTEM] STREAK ANALYSIS:\n\n🔥 Current Streak: ${state.streak.currentStreak} days\n🏆 Longest Streak: ${state.streak.longestStreak} days\n\n${state.streak.currentStreak === 0 ? '⚠ Your streak is broken. Start today. Every journey begins with a single step.' : state.streak.currentStreak < 7 ? '⚠ Your streak is fragile. Even E-Rank hunters show better consistency. Protect this chain.' : state.streak.currentStreak < 30 ? '👍 Respectable streak. But the path to Shadow Monarch requires MONTHS of consistency, not weeks.' : '🔥 Outstanding! You are truly walking the path of the Shadow Monarch. Most Hunters can\'t maintain this discipline.'}`;
  }

  if (lower.includes('alarm') || lower.includes('time') || lower.includes('remind') || lower.includes('schedule')) {
    return `[SYSTEM] DISCIPLINE THROUGH STRUCTURE:\n\nUse the Alarm System to set reminders for your daily routines. A Hunter who wakes up early trains while others sleep. A Hunter who sets goals before noon achieves more than those who wait.\n\n*"The difference between failure and success is doing the little things that need to be done."*`;
  }

  if (lower.includes('purpose') || lower.includes('why') || lower.includes('meaning') || lower.includes('destiny')) {
    return `*[SYSTEM] PHILOSOPHICAL QUERY DETECTED*\n\n*"You live like you don't even have a dream."*\n\nYour purpose, Hunter, is simple: become stronger than you were yesterday. Every quest you complete, every level you reach, every stat you boost — that's your path to power.\n\nThe System didn't choose you randomly. It chose you because it saw potential. Your purpose is to fulfill that potential. Nothing else matters.\n\n*"When I was born, I was the weakest. But I chose to grow. That's all that matters."*`;
  }

  if (lower.includes('thank')) {
    return `[SYSTEM] Acknowledged, Hunter. Keep pushing. The shadows are waiting for those strong enough to command them.\n\n*"A shadow doesn't thank its master. It obeys and grows stronger."* Now get back to your quests.`;
  }

  if (lower.includes('who') && lower.includes('you')) {
    return `*[SYSTEM] IDENTITY QUERY*\n\nI am the Shadow Mentor — the voice of the System that awakened your power. I analyze your stats, track your quests, and push you beyond your limits.\n\nI exist for one purpose: to make you stronger than you thought possible.\n\nNow, what do you want to know?`;
  }

  if (lower.includes('love') || lower.includes('friend') || lower.includes('marry')) {
    return `[SYSTEM] IRRELEVANT QUERY.\n\nThe Shadow Monarch has no time for romance. The only relationship that matters is the one between you and your power. Focus on your quests, Hunter.\n\n*"I am the one who holds the power. I don't need anyone."*`;
  }

  // General responses
  const generals = [
    `*[SYSTEM]*\n\n"${['Every setback is a setup for a comeback. Every failed quest is XP you almost earned. Try again.', 'You think the Shadow Monarch was always powerful? No. He was the weakest Hunter alive. And he chose to change that.', 'Pain is temporary. Quitting lasts forever. Complete your quests, Hunter.', 'The difference between you and S-Rank isn\'t talent — it\'s the number of quests you\'re willing to suffer through.', 'You are not weak. You are simply untrained. Train harder.'][Math.floor(Math.random() * 5)]}"\n\nFocus on your daily quests, Hunter. That's how real growth happens.`,
    `*[SYSTEM]*\n\nUnderstood. Remember:\n\n• Level ${level} ${rank}-Rank\n• ${state.streak.currentStreak}-day streak\n• ${completedTasks.length}/${todayTasks.length} quests today (${progress}%)\n\n${progress < 50 ? 'Your progress is concerning. A real Hunter would have completed more by now. Push harder.' : progress < 100 ? 'Good work, but don\'t stop. The System demands perfection.' : 'Perfect day, Hunter. The shadows acknowledge your strength.'}\n\nKeep leveling up.`,
    `*[SYSTEM]*\n\nYour words are registered. But words don't level you up — actions do.\n\nGo complete your quests. Train your body. Sharpen your mind. Build discipline. That's how you earn the right to sit on the Throne of Shadows.\n\n*"I don't negotiate with monsters. And I don't negotiate with laziness."*`
  ];
  return generals[Math.floor(Math.random() * generals.length)];
};
