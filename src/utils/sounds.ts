let audioCtx: AudioContext | null = null;
let globalVolume = 0.5; // Default volume is 50%
import tileBreakAudioUrl from "./baldosa_cae.mp3";

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
    const audio = new Audio(tileBreakAudioUrl);
    audio.volume = globalVolume;
    void audio.play();
  } catch (e) {
    console.warn("Audio error:", e);
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

      osc.type = "square"; // Onda cuadrada retro agradable
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

// Sonido sutil y elegante de notificación de chat estilo burbuja pop
export function playChatSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Subida rápida de frecuencia (pop acuático de 520Hz a 980Hz)
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.08);

    gain.gain.setValueAtTime(0.25 * globalVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001 * globalVolume, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {
    console.warn(e);
  }
}
