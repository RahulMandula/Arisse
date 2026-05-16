// Web Audio API based sound system
// No external files needed - all sounds synthesized in browser

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private isPlayingBGM = false;
  private bgmInterval: number | null = null;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.08;
    this.bgmGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.3;
    this.sfxGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Sound Effects ---

  playClick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playTaskComplete() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Ascending chime
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.3);
    });
  }

  playLevelUp() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Epic level up sound
    const notes = [261.63, 329.63, 392, 523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = i < 4 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    // Add a sub bass boom
    const sub = this.ctx!.createOscillator();
    const subGain = this.ctx!.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(80, now);
    sub.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    sub.connect(subGain);
    subGain.connect(this.sfxGain!);
    sub.start(now);
    sub.stop(now + 0.5);
  }

  playRankUp() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    // Dramatic rank up
    const osc1 = this.ctx!.createOscillator();
    const osc2 = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.linearRampToValueAtTime(800, now + 1.0);
    osc2.frequency.setValueAtTime(150, now);
    osc2.frequency.linearRampToValueAtTime(600, now + 1.0);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain!);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.5);
    osc2.stop(now + 1.5);
  }

  playAlarm() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.value = i % 2 === 0 ? 880 : 660;
      const t = now + i * 0.2;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.setValueAtTime(0, t + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.15);
    }
  }

  playAlarmSound(dataUrl: string) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    fetch(dataUrl)
      .then(r => r.arrayBuffer())
      .then(buf => this.ctx!.decodeAudioData(buf))
      .then(audioBuffer => {
        const source = this.ctx!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.sfxGain!);
        source.start();
      })
      .catch(() => this.playAlarm()); // fallback
  }

  playError() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'square';
    osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playHover() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- Motivational BGM ---
  // Ambient, dark, cinematic pad

  private playNote(freq: number, duration: number, time: number, detune: number = 0) {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.06, time + 0.5);
    gain.gain.setValueAtTime(0.06, time + duration - 0.5);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + duration);
    this.bgmOscillators.push(osc);
  }

  private playPad(freq: number, duration: number, time: number) {
    if (!this.ctx || !this.bgmGain) return;
    // Layered pad for richness
    [freq, freq * 1.002, freq * 2].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = i === 2 ? 'triangle' : 'sine';
      osc.frequency.value = f;
      osc.detune.value = (Math.random() - 0.5) * 10;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(i === 2 ? 0.02 : 0.04, time + 1);
      gain.gain.setValueAtTime(i === 2 ? 0.02 : 0.04, time + duration - 1);
      gain.gain.linearRampToValueAtTime(0, time + duration);
      osc.connect(gain);
      gain.connect(this.bgmGain!);
      osc.start(time);
      osc.stop(time + duration);
    });
  }

  playBGM() {
    this.init();
    if (!this.ctx || !this.bgmGain) return;
    if (this.isPlayingBGM) return;
    this.isPlayingBGM = true;

    // Dark ambient scale notes (D minor pentatonic in bass register)
    const scale = [
      55,   // A1
      73.42, // D2
      82.41, // E2
      98,    // G2
      110,   // A2
      146.83,// D3
    ];

    const melodyNotes = [
      220,  // A3
      293.66, // D4
      329.63, // E4
      392,   // G4
      440,   // A4
    ];

    const playLoop = () => {
      if (!this.isPlayingBGM || !this.ctx) return;
      const now = this.ctx.currentTime;
      const loopDuration = 8;

      // Pad layer
      this.playPad(scale[Math.floor(Math.random() * scale.length)], loopDuration, now);

      // Sub bass
      this.playPad(55, loopDuration, now);

      // Melody notes - sparse, atmospheric
      const melodyCount = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < melodyCount; i++) {
        const note = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];
        const time = now + Math.random() * loopDuration * 0.8;
        this.playNote(note, 3 + Math.random() * 2, time);
      }

      // Occasional high shimmer
      if (Math.random() > 0.6) {
        const highNote = 880 + Math.floor(Math.random() * 440);
        this.playNote(highNote, 2, now + Math.random() * loopDuration * 0.5, Math.random() * 20 - 10);
      }

      this.bgmInterval = window.setTimeout(playLoop, loopDuration * 1000);
    };

    playLoop();
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmInterval) {
      clearTimeout(this.bgmInterval);
      this.bgmInterval = null;
    }
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(0, this.ctx!.currentTime);
    }
    this.bgmOscillators.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    this.bgmOscillators = [];
  }

  setVolume(v: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = v;
    }
  }
}

export const soundSystem = new SoundSystem();
