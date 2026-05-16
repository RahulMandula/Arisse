import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, Volume2, VolumeX, Music, Upload, Play, X } from 'lucide-react';
import { useApp } from '../App';
import { Alarm } from '../types';
import * as db from '../database';
import { soundSystem } from '../sounds';

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AlarmsPanel() {
  const { state, dispatch } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    time: '08:00',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as string[],
    soundId: '' as string
  });
  const [customSoundFile, setCustomSoundFile] = useState<string | null>(null);
  const [customSoundName, setCustomSoundName] = useState('');
  const [savedSounds, setSavedSounds] = useState<any[]>([]);
  const [showSoundManager, setShowSoundManager] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved sounds
  useState(() => {
    db.getAlarmSounds().then(setSavedSounds).catch(() => {});
  });

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day]
    }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const alarm: Alarm = {
      id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
      title: form.title.trim(),
      time: form.time,
      days: form.days,
      enabled: true,
      notified: false
    };
    if (customSoundFile) {
      // @ts-ignore
      alarm.soundData = customSoundFile;
      // @ts-ignore
      alarm.soundName = customSoundName;
    } else if (form.soundId) {
      const sound = savedSounds.find(s => s.id === form.soundId);
      if (sound) {
        // @ts-ignore
        alarm.soundData = sound.dataUrl;
        // @ts-ignore
        alarm.soundName = sound.name;
      }
    }
    dispatch({ type: 'ADD_ALARM', payload: alarm });
    setForm({ title: '', time: '08:00', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], soundId: '' });
    setCustomSoundFile(null);
    setCustomSoundName('');
    setShowForm(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const id = Math.random().toString(36).substring(2, 15);
      setCustomSoundFile(dataUrl);
      setCustomSoundName(file.name);
      await db.saveAlarmSound(id, file.name, dataUrl).catch(() => {});
      db.getAlarmSounds().then(setSavedSounds).catch(() => {});
    };
    reader.readAsDataURL(file);
  };

  const deleteSound = async (id: string) => {
    await db.deleteAlarmSound(id).catch(() => {});
    db.getAlarmSounds().then(setSavedSounds).catch(() => {});
    setCustomSoundFile(null);
    setCustomSoundName('');
    soundSystem.playClick();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-purple-400/60 text-xs font-[Rajdhani] tracking-widest">[ALARM SYSTEM]</p>
          <p className="text-white text-sm font-[Rajdhani]">{state.alarms.filter(a => a.enabled).length} active alarms</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowSoundManager(!showSoundManager)} className="flex items-center gap-2 bg-[#0d1117] border border-purple-500/20 text-purple-300 px-4 py-2 rounded-lg text-xs font-[Orbitron] tracking-wider">
            <Music className="w-3 h-3" /> SOUNDS
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-xs font-[Orbitron] tracking-wider">
            {showForm ? <Trash2 className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {showForm ? 'CANCEL' : 'NEW ALARM'}
          </motion.button>
        </div>
      </div>

      {/* Sound Manager */}
      <AnimatePresence>
        {showSoundManager && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-[#0d1117]/80 border border-purple-500/20 rounded-xl p-5 space-y-3 overflow-hidden">
            <h3 className="text-white font-bold font-[Orbitron] text-sm tracking-wider flex items-center gap-2"><Music className="w-4 h-4" /> ALARM SOUNDS</h3>
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 bg-[#0a0a1a] border border-purple-500/20 text-purple-300 py-3 rounded-lg text-xs font-[Orbitron] hover:border-purple-500/50 transition">
              <Upload className="w-4 h-4" /> UPLOAD CUSTOM SOUND
            </button>
            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
            {savedSounds.length === 0 && <p className="text-gray-600 text-xs font-[Rajdhani] text-center py-2">No custom sounds uploaded yet</p>}
            {savedSounds.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0a1a]/50 border border-purple-500/10">
                <button onClick={() => { soundSystem.resume(); soundSystem.playAlarmSound(s.dataUrl); }} className="p-2 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"><Play className="w-4 h-4" /></button>
                <div className="flex-1"><p className="text-white text-sm font-[Inter] truncate">{s.name}</p><p className="text-gray-500 text-[10px] font-[Rajdhani]">{new Date(s.createdAt).toLocaleDateString()}</p></div>
                <button onClick={() => deleteSound(s.id)} className="p-2 text-gray-500 hover:text-red-400 transition"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Alarm Form */}
      <AnimatePresence>
        {showForm && (
          <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} onSubmit={handleAdd} className="bg-[#0d1117]/80 border border-purple-500/20 rounded-xl p-5 space-y-4 overflow-hidden">
            <div><label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">Alarm Name</label><input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50" placeholder="Morning training..." autoFocus /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">Time</label><input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50" /></div>
              <div><label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">Sound</label><select value={form.soundId} onChange={e => setForm(f => ({ ...f, soundId: e.target.value }))} className="w-full mt-1 bg-[#0a0a1a] border border-purple-500/20 rounded-lg px-3 py-2 text-white text-sm font-[Inter] focus:outline-none focus:border-purple-500/50"><option value="">Default Alarm</option>{savedSounds.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            </div>
            {customSoundFile && <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20"><Music className="w-4 h-4 text-green-400" /><span className="text-green-300 text-xs font-[Rajdhani]">Using: {customSoundName}</span></div>}
            <div><label className="text-purple-400/60 text-[10px] font-[Rajdhani] tracking-wider uppercase">Days</label><div className="flex gap-2 mt-2 flex-wrap">{DAY_OPTIONS.map(day => { const isActive = form.days.includes(day); return (<button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3 py-1.5 rounded-lg text-xs font-[Rajdhani] tracking-wider transition-all ${isActive ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-[#0a0a1a] text-gray-600 border border-gray-800'}`}>{day.slice(0, 3)}</button>); })}</div></div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 rounded-lg text-xs font-[Orbitron] tracking-wider">SET ALARM</motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Alarm List */}
      <div className="space-y-2">
        {state.alarms.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 bg-[#0d1117]/50 rounded-xl border border-purple-500/10">
            <Clock className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-600 text-xs font-[Rajdhani]">No alarms set. Stay disciplined, Hunter.</p>
          </motion.div>
        ) : (
          state.alarms.map((alarm, i) => <AlarmItem key={alarm.id} alarm={alarm} index={i} />)
        )}
      </div>
    </div>
  );
}

function AlarmItem({ alarm, index }: { alarm: Alarm; index: number }) {
  const { dispatch } = useApp();
  // @ts-ignore
  const hasCustomSound = alarm.soundData || alarm.soundName;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${alarm.enabled ? 'bg-[#0d1117]/80 border-purple-500/20' : 'bg-[#0d1117]/40 border-gray-800 opacity-50'}`}>
      <button onClick={() => { dispatch({ type: 'TOGGLE_ALARM', payload: alarm.id }); soundSystem.playClick(); }} className={`p-2 rounded-lg transition-all ${alarm.enabled ? 'text-purple-400' : 'text-gray-600'}`}>
        {alarm.enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-[Inter] ${alarm.enabled ? 'text-white' : 'text-gray-500'}`}>{alarm.title}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-purple-400 text-xs font-[Rajdhani]">{alarm.time}</span>
          <span className="text-gray-600 text-[10px] font-[Rajdhani]">{alarm.days.map(d => d.slice(0, 2)).join(', ')}</span>
          {hasCustomSound && <span className="text-green-400 text-[10px] font-[Rajdhani] flex items-center gap-1"><Music className="w-3 h-3" /> Custom Sound</span>}
        </div>
      </div>
      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { dispatch({ type: 'DELETE_ALARM', payload: alarm.id }); soundSystem.playClick(); }} className="text-gray-600 hover:text-red-400 transition">
        <Trash2 className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
