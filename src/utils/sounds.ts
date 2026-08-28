import tileBreakAudioUrl from "./baldosa_cae.mp3";
import { getAudioContext, getMasterSfxGain, getGlobalVolume, setGlobalVolume } from "./audioContext";

export { setGlobalVolume, getGlobalVolume };

// Decode and cache break sound
let breakSoundBuffer: AudioBuffer | null = null;
let isDecodingBreakSound = false;

async function loadBreakSound() {
  if (breakSoundBuffer || isDecodingBreakSound) return;
  isDecodingBreakSound = true;
  try {
    const ctx = getAudioContext();
    const response = await fetch(tileBreakAudioUrl);
    const arrayBuffer = await response.arrayBuffer();
    breakSoundBuffer = await ctx.decodeAudioData(arrayBuffer);
  } catch (e) {
    console.error("Failed to load break sound:", e);
  } finally {
    isDecodingBreakSound = false;
  }
}
// Start loading eagerly
void loadBreakSound();

export function playJumpSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle"; // Triangle is softer, perfect for jumping
    osc.frequency.setValueAtTime(150, now);
    // Sweep frequency up: 150Hz -> 650Hz in 0.16s
    osc.frequency.exponentialRampToValueAtTime(650, now + 0.16);

    // Note: since masterSfxGain already controls master volume, we just use relative gain here
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(getMasterSfxGain());

    osc.start(now);
    osc.stop(now + 0.16);
  } catch (e) {
    console.warn("Audio error (playJumpSound):", e);
  }
}

export function playStepSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.setValueAtTime(450, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(getMasterSfxGain());

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    console.warn("Audio error (playStepSound):", e);
  }
}

export function playBreakSound(): void {
  try {
    const ctx = getAudioContext();
    if (!breakSoundBuffer) {
      // Fallback or attempt to load if not loaded
      loadBreakSound();
      return;
    }
    const source = ctx.createBufferSource();
    source.buffer = breakSoundBuffer;
    source.connect(getMasterSfxGain());
    source.start(0);
  } catch (e) {
    console.warn("Audio error (playBreakSound):", e);
  }
}

export function playFallSound(): void {
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

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(getMasterSfxGain());

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {
    console.warn("Audio error (playFallSound):", e);
  }
}

export function playWinSound(): void {
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

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.linearRampToValueAtTime(0.01, noteTime + 0.2);

      osc.connect(gain);
      gain.connect(getMasterSfxGain());

      osc.start(noteTime);
      osc.stop(noteTime + 0.2);
    });
  } catch (e) {
    console.warn("Audio error (playWinSound):", e);
  }
}

// Sonido sutil y elegante de notificación de chat estilo burbuja pop
export function playChatSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Subida rápida de frecuencia (pop acuático de 520Hz a 980Hz)
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.08);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(getMasterSfxGain());

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {
    console.warn("Audio error (playChatSound):", e);
  }
}

export function playScoreNotificationSound(): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [880, 1174.66];

    notes.forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = now + index * 0.09;

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, noteTime);
      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(getMasterSfxGain());
      osc.start(noteTime);
      osc.stop(noteTime + 0.45);
    });
  } catch (e) {
    console.warn("Audio error (playScoreNotificationSound):", e);
  }
}
