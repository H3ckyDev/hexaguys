/**
 * Procedural Chill Lo-Fi / Synthwave Background Music Engine (BGM)
 * Generates soft, warm ambient chords and subtle rhythmic melodic textures
 * using the Web Audio API without requiring any external audio files.
 */

import { getGlobalVolume } from "./sounds";

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let isPlaying = false;
let currentMode: "LOBBY" | "PLAYING" | "COUNTDOWN" | "ROUND_OVER" = "LOBBY";
let timerId: number | null = null;
let currentStep = 0;

// Escala suave Lo-Fi Pentatonica / Neo-Soul en Eb / C menor (Calida y relajante)
// Ebmaj9 -> Cm9 -> Abmaj7 -> Bb11
const CHORD_PROGRESSION = [
  // Ebmaj9 (Eb3, G3, Bb3, D4, F4)
  [155.56, 196.0, 233.08, 293.66, 349.23],
  // Cm9 (C3, Eb3, G3, Bb3, D4)
  [130.81, 155.56, 196.0, 233.08, 293.66],
  // Abmaj7 (Ab2, C3, Eb3, G3, C4)
  [103.83, 130.81, 155.56, 196.0, 261.63],
  // Bb11 (Bb2, D3, F3, Ab3, C4)
  [116.54, 146.83, 174.61, 207.65, 261.63],
];

// Notas de melodia / campanillas (Pentatonica suave)
const MELODY_NOTES = [
  349.23, // F4
  392.00, // G4
  466.16, // Bb4
  523.25, // C5
  587.33, // D5
  698.46, // F5
  783.99, // G5
];

// Bajo calido
const BASS_NOTES = [77.78, 65.41, 51.91, 58.27];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function initAudioGraph() {
  const ctx = getAudioContext();
  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(getGlobalVolume() * 0.35, ctx.currentTime);

    filterNode = ctx.createBiquadFilter();
    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(1100, ctx.currentTime);
    filterNode.Q.setValueAtTime(1.2, ctx.currentTime);

    masterGain.connect(filterNode);
    filterNode.connect(ctx.destination);
  }
}

/**
 * Toca un acorde suave tipo Rhodes / Pad analogico
 */
function playWarmPad(freqs: number[], duration: number, isGamePlaying = false) {
  try {
    const ctx = getAudioContext();
    const mg = masterGain;
    if (!mg) return;
    const now = ctx.currentTime;

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Mezcla de ondas suaves tipo Rhodes (seno + triangulo)
      osc.type = i === 0 ? "sine" : i % 2 === 0 ? "triangle" : "sine";
      // Micro-desafinado para efecto Chorus natural calido
      const detune = (i - 2) * 4;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);

      // Envolvente suave: Attack lento y decay musical
      const attack = 0.8;
      const baseVol = (isGamePlaying ? 0.045 : 0.065) / freqs.length;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(baseVol, now + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(mg);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  } catch (e) {
    // Ignorar errores de audio contextual
  }
}

/**
 * Toca una nota de bajo calido y profundo
 */
function playSubBass(freq: number, duration: number, isGamePlaying = false) {
  try {
    const ctx = getAudioContext();
    const mg = masterGain;
    if (!mg) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    const vol = isGamePlaying ? 0.08 : 0.06;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(mg);

    osc.start(now);
    osc.stop(now + duration + 0.05);
  } catch (e) {
    // Ignorar
  }
}

/**
 * Toca una campanilla / gota melodica relajante (Marimba / Celesta chill)
 */
function playMelodyPing(freq: number) {
  try {
    const ctx = getAudioContext();
    const mg = masterGain;
    if (!mg) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);

    // Envolvente tipo percusion de cristal
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc.connect(gain);
    gain.connect(mg);

    osc.start(now);
    osc.stop(now + 0.95);
  } catch (e) {
    // Ignorar
  }
}

/**
 * Pulso ritmico suave de juego (Soft Beat durante PLAYING)
 */
function playSoftPulse() {
  try {
    const ctx = getAudioContext();
    const mg = masterGain;
    if (!mg) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(mg);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {
    // Ignorar
  }
}

/**
 * Ciclo principal del secuenciador de musica procedural
 */
function tick() {
  if (!isPlaying) return;

  const isGamePlaying = currentMode === "PLAYING" || currentMode === "COUNTDOWN";
  const chordIndex = Math.floor(currentStep / 4) % CHORD_PROGRESSION.length;
  const stepInChord = currentStep % 4;

  // Al inicio de cada compas (4 beats): tocar nuevo acorde y bajo
  if (stepInChord === 0) {
    playWarmPad(CHORD_PROGRESSION[chordIndex], 3.8, isGamePlaying);
    playSubBass(BASS_NOTES[chordIndex], 3.5, isGamePlaying);
  }

  // Melodias generativas suaves
  const shouldPlayMelody = stepInChord === 1 || stepInChord === 3 || (Math.random() < 0.4);
  if (shouldPlayMelody) {
    const randomNote = MELODY_NOTES[Math.floor(Math.random() * MELODY_NOTES.length)];
    // Tocar con ligero delay humano
    setTimeout(() => {
      if (isPlaying) playMelodyPing(randomNote);
    }, Math.random() * 80);
  }

  // Pulso ritmico solo durante la partida
  if (isGamePlaying && (stepInChord === 0 || stepInChord === 2)) {
    playSoftPulse();
  }

  currentStep++;

  // Tempo: 850ms por beat (~71 BPM Lo-Fi tempo)
  const interval = isGamePlaying ? 750 : 900;
  timerId = window.setTimeout(tick, interval);
}

/**
 * Inicia o reanuda la musica de fondo chill
 */
export function startBgm(mode: "LOBBY" | "PLAYING" | "COUNTDOWN" | "ROUND_OVER" = "LOBBY") {
  initAudioGraph();
  currentMode = mode;

  if (isPlaying) {
    updateFilterForMode(mode);
    return;
  }

  isPlaying = true;
  currentStep = 0;
  updateFilterForMode(mode);
  tick();
}

/**
 * Detiene la musica de fondo
 */
export function stopBgm() {
  isPlaying = false;
  if (timerId !== null) {
    clearTimeout(timerId);
    timerId = null;
  }
}

/**
 * Actualiza el modo de juego (Lobby vs Partida) con transicion de filtro
 */
export function setBgmState(mode: "LOBBY" | "PLAYING" | "COUNTDOWN" | "ROUND_OVER") {
  currentMode = mode;
  updateFilterForMode(mode);
}

/**
 * Ajusta el filtro de corte segun si estamos en Lobby (mas calido y relajado) o en partida
 */
function updateFilterForMode(mode: "LOBBY" | "PLAYING" | "COUNTDOWN" | "ROUND_OVER") {
  if (!filterNode || !audioCtx) return;
  const now = audioCtx.currentTime;
  if (mode === "PLAYING") {
    // Mas abierto y con mas presencia
    filterNode.frequency.setTargetAtTime(1600, now, 0.5);
  } else if (mode === "COUNTDOWN") {
    filterNode.frequency.setTargetAtTime(1300, now, 0.3);
  } else {
    // Lobby / Round Over: Mas suave y relajado (lo-fi warm)
    filterNode.frequency.setTargetAtTime(950, now, 0.8);
  }
}

/**
 * Actualiza el volumen maestro de la musica de fondo
 */
export function setBgmVolume(volume: number) {
  if (masterGain && audioCtx) {
    const vol = Math.max(0, Math.min(1, volume)) * 0.35;
    masterGain.gain.setTargetAtTime(vol, audioCtx.currentTime, 0.1);
  }
}

/**
 * Obtiene el estado actual de reproduccion
 */
export function isBgmPlaying(): boolean {
  return isPlaying;
}
