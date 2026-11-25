// Tiny WebAudio synth — no sound files, no network. Every effect is a short
// oscillator blip with an envelope; the grill sizzle is a burst of them.
export function createAudio() {
  const audio = {
    ctx: null,
    muted: false,
  };

  audio.ensure = function ensure() {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume().catch(() => {});
      return;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      audio.ctx = new Ctor();
    } catch {
      audio.ctx = null;
    }
  };

  audio.blip = function blip(freq, dur, type = 'square', vol = 0.08, slideTo = null) {
    if (audio.muted || !audio.ctx) return;
    try {
      const now = audio.ctx.currentTime;
      const osc = audio.ctx.createOscillator();
      const gain = audio.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, now + dur);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain);
      gain.connect(audio.ctx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch {
      // Audio is decoration; a failure must never break the game.
    }
  };

  audio.pickup = function pickup() {
    audio.blip(520, 0.07, 'square', 0.06);
    setTimeout(() => audio.blip(780, 0.07, 'square', 0.05), 50);
  };

  audio.chop = function chop() {
    audio.blip(180, 0.05, 'square', 0.09, 90);
  };

  audio.chopped = function chopped() {
    audio.blip(300, 0.06, 'triangle', 0.08);
    setTimeout(() => audio.blip(440, 0.08, 'triangle', 0.08), 60);
  };

  audio.grill = function grill() {
    for (let i = 0; i < 5; i += 1) {
      setTimeout(() => audio.blip(900 + Math.random() * 600, 0.04, 'sawtooth', 0.025), i * 45);
    }
  };

  audio.ready = function ready() {
    audio.blip(880, 0.1, 'sine', 0.07);
    setTimeout(() => audio.blip(1174, 0.12, 'sine', 0.07), 90);
  };

  audio.serve = function serve() {
    audio.blip(1046, 0.12, 'sine', 0.09);
    setTimeout(() => audio.blip(1318, 0.16, 'sine', 0.09), 100);
    setTimeout(() => audio.blip(1568, 0.2, 'sine', 0.07), 200);
  };

  audio.fail = function fail() {
    audio.blip(220, 0.18, 'sawtooth', 0.08, 110);
  };

  audio.trash = function trash() {
    audio.blip(140, 0.12, 'square', 0.07, 70);
  };

  audio.rush = function rush() {
    audio.blip(392, 0.1, 'square', 0.08);
    setTimeout(() => audio.blip(523, 0.1, 'square', 0.08), 110);
    setTimeout(() => audio.blip(659, 0.16, 'square', 0.08), 220);
  };

  audio.click = function click() {
    audio.blip(660, 0.05, 'square', 0.05);
  };

  return audio;
}
