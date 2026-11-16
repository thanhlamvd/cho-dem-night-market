// Every sound is synthesised with WebAudio — no audio files. The context is
// created only after a user gesture (unlock), so the title screen stays
// silent and headless screenshot runs never touch audio at all.

export function createAudio() {
  let ctx = null;
  let master = null;
  let sizzle = null;
  let sizzleGain = null;
  let muted = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      return false;
    }
    return true;
  }

  function tone(freq, dur, type, gain, slideTo, when = 0) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, freq, gain, when = 0) {
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
  }

  return {
    get muted() {
      return muted;
    },
    unlock() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (!sizzle) {
        const len = ctx.sampleRate * 1;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
        sizzle = ctx.createBufferSource();
        sizzle.buffer = buf;
        sizzle.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 3000;
        sizzleGain = ctx.createGain();
        sizzleGain.gain.value = 0;
        sizzle.connect(filter);
        filter.connect(sizzleGain);
        sizzleGain.connect(master);
        sizzle.start();
      }
    },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    setSizzle(on) {
      if (!ctx || !sizzleGain) return;
      sizzleGain.gain.setTargetAtTime(on && !muted ? 0.05 : 0, ctx.currentTime, 0.1);
    },
    click() {
      tone(620, 0.06, 'square', 0.08);
    },
    pop() {
      tone(280, 0.09, 'sine', 0.16, 520);
    },
    ding() {
      tone(880, 0.22, 'sine', 0.16);
      tone(1318, 0.3, 'sine', 0.1, null, 0.05);
    },
    chaChing() {
      tone(1180, 0.1, 'sine', 0.16);
      tone(1568, 0.22, 'sine', 0.16, null, 0.08);
      noiseBurst(0.12, 6000, 0.1, 0.08);
    },
    bell() {
      tone(660, 0.4, 'triangle', 0.14);
      tone(990, 0.35, 'triangle', 0.07, null, 0.02);
    },
    buzz() {
      tone(190, 0.4, 'sawtooth', 0.12, 85);
    },
    jingle() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, null, i * 0.11));
    },
    fail() {
      const notes = [392, 330, 262];
      notes.forEach((f, i) => tone(f, 0.3, 'triangle', 0.13, null, i * 0.16));
    },
  };
}
