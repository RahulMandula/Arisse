// IndexedDB wrapper for permanent data persistence
const DB_NAME = 'ShadowSystemDB';
const DB_VERSION = 3;

let dbInstance: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('gameStates')) {
        db.createObjectStore('gameStates', { keyPath: 'userId' });
      }
      if (!db.objectStoreNames.contains('notifications')) {
        const store = db.createObjectStore('notifications', { keyPath: 'id', autoIncrement: true });
        store.createIndex('userId', 'userId', { unique: false });
      }
      if (!db.objectStoreNames.contains('alarmSounds')) {
        db.createObjectStore('alarmSounds', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('playerRegistry')) {
        db.createObjectStore('playerRegistry', { keyPath: 'name' });
      }
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
}

// User operations
export async function saveUser(user: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readwrite');
    tx.objectStore('users').put(user);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getUser(id: string): Promise<any | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readonly');
    const request = tx.objectStore('users').get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllUsers(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readonly');
    const request = tx.objectStore('users').getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Game state operations
export async function saveGameState(userId: string, state: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('gameStates', 'readwrite');
    tx.objectStore('gameStates').put({ userId, ...state, lastSaved: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getGameState(userId: string): Promise<any | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('gameStates', 'readonly');
    const request = tx.objectStore('gameStates').get(userId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Notification operations
export async function saveNotification(notification: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notifications', 'readwrite');
    tx.objectStore('notifications').put(notification);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getNotifications(userId: string): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notifications', 'readonly');
    const index = tx.objectStore('notifications').index('userId');
    const request = index.getAll(userId);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function markNotificationRead(id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notifications', 'readwrite');
    const request = tx.objectStore('notifications').get(id);
    request.onsuccess = () => {
      if (request.result) {
        request.result.read = true;
        tx.objectStore('notifications').put(request.result);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

// Alarm sounds
export async function saveAlarmSound(id: string, name: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('alarmSounds', 'readwrite');
    tx.objectStore('alarmSounds').put({ id, name, dataUrl, createdAt: new Date().toISOString() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAlarmSounds(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('alarmSounds', 'readonly');
    const request = tx.objectStore('alarmSounds').getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAlarmSound(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('alarmSounds', 'readwrite');
    tx.objectStore('alarmSounds').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Player registry (global leaderboard)
export async function registerPlayer(name: string, level: number, rank: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playerRegistry', 'readwrite');
    const request = tx.objectStore('playerRegistry').get(name.toLowerCase());
    request.onsuccess = () => {
      const entry = request.result || { name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() };
      entry.name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      entry.level = Math.max(entry.level || 0, level);
      entry.rank = rank;
      entry.lastSeen = new Date().toISOString();
      tx.objectStore('playerRegistry').put(entry);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getAllPlayers(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('playerRegistry', 'readonly');
    const request = tx.objectStore('playerRegistry').getAll();
    request.onsuccess = () => {
      const players = request.result || [];
      resolve(players.sort((a, b) => (b.level || 0) - (a.level || 0)));
    };
    request.onerror = () => reject(request.error);
  });
}

// Fallback to localStorage for compatibility
export function saveToLS(key: string, value: any) {
  try { localStorage.setItem(`shadow_${key}`, JSON.stringify(value)); } catch {}
}

export function loadFromLS(key: string, fallback: any): any {
  try {
    const data = localStorage.getItem(`shadow_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

// Also use solo_ prefix for compatibility with existing code
export function loadSolo(key: string, fallback: any): any {
  try {
    const data = localStorage.getItem(`solo_${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

// Check for existing user
export async function findUserByUsername(username: string): Promise<any | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('users', 'readonly');
    const request = tx.objectStore('users').getAll();
    request.onsuccess = () => {
      const users = request.result || [];
      const found = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase());
      resolve(found || null);
    };
    request.onerror = () => reject(request.error);
  });
}
