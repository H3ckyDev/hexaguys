let audioCtx: AudioContext | null = null;
let globalVolume = 0.5; // Default volume is 50%

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setGlobalVolume(val: number) {
  globalVolume = Math.max(0, Math.min(1, val));
}

export function getGlobalVolume() {
  return globalVolume;
}

export function playJumpSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle"; // Triangle is softer, perfect for jumping
    osc.frequency.setValueAtTime(150, now);
    // Sweep frequency up: 150Hz -> 650Hz in 0.16s
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.16);

    gain.gain.setValueAtTime(0.35 * globalVolume, now);
    gain.gain.linearRampToValueAtTime(0.01 * globalVolume, now + 0.16);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

export function playStepSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.setValueAtTime(450, now + 0.03);

    gain.gain.setValueAtTime(0.08 * globalVolume, now);
    gain.gain.linearRampToValueAtTime(0.001 * globalVolume, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    console.warn(e);
  }
}

export function playBreakSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth"; // Sawtooth sounds more gritty/broken
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.3);

    gain.gain.setValueAtTime(0.2 * globalVolume, now);
    gain.gain.linearRampToValueAtTime(0.01 * globalVolume, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn(e);
  }
}

export function playFallSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.setValueAtTime(220, now + 0.08);
    osc.frequency.setValueAtTime(170, now + 0.16);
    osc.frequency.setValueAtTime(120, now + 0.24);

    gain.gain.setValueAtTime(0.3 * globalVolume, now);
    gain.gain.linearRampToValueAtTime(0.01 * globalVolume, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    console.warn(e);
  }
}

export function playWinSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Play a cheerful major triad arpeggio (C4 -> E4 -> G4 -> C5)
    const notes = [261.63, 329.63, 392.0, 523.25];
    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square"; // Nice retro square wave!
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18 * globalVolume, noteTime);
      gain.gain.linearRampToValueAtTime(0.01 * globalVolume, noteTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.2);
    });
  } catch (e) {
    console.warn(e);
  }
}
