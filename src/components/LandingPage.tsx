import { useState } from "react";
import { playStepSound } from "../utils/sounds";

interface LandingPageProps {
  onHostGame: () => void;
  onJoinGame: (roomCode: string) => void;
}

export function LandingPage({ onHostGame, onJoinGame }: LandingPageProps) {
  const [roomInput, setRoomInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = roomInput.trim();
    if (!raw) {
      setErrorMessage("Por favor ingresa un código de sala o enlace.");
      return;
    }

    playStepSound();

    // Check if user pasted a full URL (e.g. https://domain.com/?r=abcd)
    let code = raw;
    if (raw.includes("?r=")) {
      const match = raw.match(/[?&]r=([^&]+)/);
      if (match && match[1]) {
        code = match[1];
      }
    } else if (raw.includes("?room=")) {
      const match = raw.match(/[?&]room=([^&]+)/);
      if (match && match[1]) {
        code = match[1];
      }
    }

    onJoinGame(code);
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#07080b] text-white flex flex-col justify-between items-center p-6 md:p-10 relative overflow-y-auto font-sans select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-sky-600/20 via-indigo-600/20 to-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Brand */}
      <header className="w-full max-w-4xl flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-500 to-pink-500 flex items-center justify-center font-black text-white shadow-xl text-base ring-1 ring-white/30">
            HG
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5 leading-none">
              HexaGuys <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-sky-300 font-semibold tracking-wider uppercase">Pro</span>
            </h1>
            <span className="text-xs text-white/50 font-medium tracking-tight">
              Multijugador 3D en Tiempo Real
            </span>
          </div>
        </div>

        <a
          href="https://github.com/H3ckyDev/hexaguys"
          target="_blank"
          rel="noopener noreferrer"
          className="ios-btn-secondary px-3.5 py-2 rounded-2xl text-xs font-semibold text-white/80 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>⭐</span>
          <span>GitHub</span>
        </a>
      </header>

      {/* Main Hero Card */}
      <main className="w-full max-w-xl my-auto py-8 relative z-10 flex flex-col items-center gap-6 text-center">
        {/* Title Badge */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400 px-3.5 py-1 rounded-full bg-sky-400/10 border border-sky-400/20 shadow-sm">
            ✨ Plataforma Hexagonal de Supervivencia
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Sobrevive piso a piso.
          </h2>
          <p className="text-sm md:text-base text-white/60 max-w-md">
            Cada baldosa que pisas empieza a vibrar y colapsa al vacío. ¡Sé el último jugador en pie!
          </p>
        </div>

        {/* Action Panel */}
        <div className="ios-glass-panel p-6 md:p-8 rounded-[36px] w-full flex flex-col gap-5 text-left shadow-2xl">
          {/* 1. Host New Game Button */}
          <button
            onClick={() => {
              playStepSound();
              onHostGame();
            }}
            className="ios-btn-primary w-full py-4 text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider cursor-pointer shadow-xl flex items-center justify-center gap-2"
          >
            <span>🎮</span>
            <span>Crear Sala Nueva (Host)</span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">o únete a una</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          {/* 2. Join via Code / Link Form */}
          <form onSubmit={handleJoinSubmit} className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-white/70 tracking-tight">
              Código de Sala o Enlace:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => {
                  setRoomInput(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Ejemplo: abcd o enlace..."
                className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/15 focus:border-sky-400 focus:outline-none text-white text-xs font-semibold placeholder:text-white/30 shadow-inner"
              />
              <button
                type="submit"
                className="ios-btn-secondary px-5 py-3 rounded-2xl text-xs font-bold text-white uppercase tracking-wider cursor-pointer shrink-0"
              >
                Unirse
              </button>
            </div>
            {errorMessage && (
              <span className="text-xs text-rose-400 font-semibold">{errorMessage}</span>
            )}
          </form>
        </div>

        {/* Features / Quick Guide Capsule */}
        <div className="ios-glass-card p-4 rounded-2xl w-full flex flex-col md:flex-row justify-around items-center gap-3 text-xs text-white/70">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏃</span>
            <span><strong>WASD</strong> caminar • <strong>Shift</strong> correr</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🦘</span>
            <span><strong>Espacio</strong> saltar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📶</span>
            <span>Latencia <strong>0ms</strong></span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center text-xs text-white/40 py-2 relative z-10">
        HexaGuys © {new Date().getFullYear()} • Creado con React Three Fiber, Rapier Physics y PlayroomKit
      </footer>
    </div>
  );
}

export default LandingPage;
