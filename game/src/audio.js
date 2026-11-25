// audio.js — all sounds are synthesised with WebAudio, no audio files.
// Sizzle is filtered noise; dings and pops are short oscillators.

export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleGain = null;
    this.sizzleSrc = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    } catch (e) {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopSizzle();
    return this.muted;
  }

  blip(freq, dur, type, vol) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (dur || 0.12));
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start(t);
    o.stop(t + (dur || 0.12) + 0.02);
  }

  pop() { this.blip(520, 0.07, 'triangle', 0.14); }
  flip() { this.blip(340, 0.08, 'square', 0.07); this.blip(660, 0.06, 'triangle', 0.08); }
  ding() { this.blip(880, 0.18, 'sine', 0.14); this.blip(1318, 0.22, 'sine', 0.09); }
  bad() { this.blip(180, 0.25, 'sawtooth', 0.08); }
  coin() { this.blip(988, 0.1, 'sine', 0.12); this.blip(1319, 0.16, 'sine', 0.1); }

  startSizzle() {
    if (!this.ctx || this.muted || this.sizzleSrc) return;
    const len = this.ctx.sampleRate * 1;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 5200;
    filt.Q.value = 0.6;
    const g = this.ctx.createGain();
    g.gain.value = 0.045;
    src.connect(filt);
    filt.connect(g);
    g.connect(this.ctx.destination);
    src.start();
    this.sizzleSrc = src;
    this.sizzleGain = g;
  }

  stopSizzle() {
    if (this.sizzleSrc) {
      try { this.sizzleSrc.stop(); } catch (e) { /* already stopped */ }
      this.sizzleSrc = null;
      this.sizzleGain = null;
    }
  }

  setSizzleLevel(level) {
    if (this.sizzleGain && !this.muted) {
      this.sizzleGain.gain.value = 0.02 + 0.05 * Math.min(1, level);
    }
  }
}
