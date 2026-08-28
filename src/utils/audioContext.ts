let audioCtx: AudioContext | null = null;
let globalVolume = 0.5;
let masterSfxGain: GainNode | null = null;
let masterBgmGain: GainNode | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    masterSfxGain = audioCtx.createGain();
    masterSfxGain.gain.value = globalVolume;
    masterSfxGain.connect(audioCtx.destination);
    masterBgmGain = audioCtx.createGain();
    masterBgmGain.gain.value = globalVolume * 0.35;
    masterBgmGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function getMasterSfxGain(): GainNode {
  getAudioContext(); // ensure initialized
  return masterSfxGain!;
}

export function getMasterBgmGain(): GainNode {
  getAudioContext(); // ensure initialized
  return masterBgmGain!;
}

export function setGlobalVolume(v: number): void {
  globalVolume = Math.max(0, Math.min(1, v));
  if (masterSfxGain) {
    masterSfxGain.gain.setTargetAtTime(globalVolume, audioCtx!.currentTime, 0.1);
  }
  if (masterBgmGain) {
    masterBgmGain.gain.setTargetAtTime(globalVolume * 0.35, audioCtx!.currentTime, 0.1);
  }
}

export function getGlobalVolume(): number {
  return globalVolume;
}
