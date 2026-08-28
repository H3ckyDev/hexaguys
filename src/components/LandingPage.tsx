import { useState } from "react";
import { playStepSound } from "../utils/sounds";
import { PlayIcon, CloseIcon, FlameIcon, DiamondIcon, TrophyIcon } from "./Icons";
import { LeaderboardModal } from "./LeaderboardModal";

interface LandingPageProps {
  onHostGame: () => void;
  onJoinGame: (roomCode: string) => void;
  afkKickNotice?: string | null;
  onDismissNotice?: () => void;
}

export function LandingPage({ onHostGame, onJoinGame, afkKickNotice, onDismissNotice }: LandingPageProps) {
  const [roomInput, setRoomInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = roomInput.trim();
    if (!raw) {
      setErrorMessage("Ingresa un código de sala o enlace.");
      return;
    }

    playStepSound();

    let code = raw;
    if (raw.includes("?r=")) {
      const match = raw.match(/[?&]r=([^&]+)/);
      if (match && match[1]) code = match[1];
    } else if (raw.includes("?room=")) {
      const match = raw.match(/[?&]room=([^&]+)/);
      if (match && match[1]) code = match[1];
    }

    onJoinGame(code);
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#090d1a] text-slate-100 flex flex-col justify-between items-center p-5 sm:p-8 md:p-10 relative overflow-y-auto font-sans select-none antialiased">
      {/* Barra de Navegación Superior */}
      <header className="w-full max-w-5xl flex justify-between items-center relative z-10 pb-4 border-b border-[#1b2548]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 border border-blue-400/50 flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <span className="text-base tracking-tight font-black">HG</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-white uppercase font-mono">HEXAGUYS</span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-950/80 text-cyan-400 border border-cyan-500/30 font-bold">ARENA 3D</span>
            </div>
            <span className="text-sm text-slate-400 font-medium">
              Plataforma de Supervivencia Multijugador
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playStepSound();
              setShowLeaderboard(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#131a33] hover:bg-[#1a2345] border border-amber-500/60 hover:border-amber-400 text-amber-300 hover:text-amber-200 text-sm font-mono font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)] cursor-pointer active:scale-95"
          >
            <TrophyIcon className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline-block">RANKING</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#11172f] border border-[#243056]">
            <DiamondIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-mono text-cyan-300 font-bold">TEMPORADA 1</span>
          </div>
          <a
            href="https://github.com/H3ckyDev/hexaguys"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-[#131a33] hover:bg-[#1a2345] border border-[#263461] hover:border-blue-500 text-sm font-bold text-slate-300 hover:text-white transition-all shadow-sm"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* Contenedor Hero Principal */}
      <main className="w-full max-w-4xl my-auto py-6 relative z-10 flex flex-col gap-6">
        {/* Banner de Aviso AFK */}
        {afkKickNotice && (
          <div className="w-full p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-sm font-medium flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="text-left leading-relaxed">{afkKickNotice}</span>
            </div>
            {onDismissNotice && (
              <button
                onClick={onDismissNotice}
                className="w-7 h-7 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-100 flex items-center justify-center text-sm cursor-pointer shrink-0"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Hero Card Principal (Inspirado en el Banner Central de la Imagen) */}
        <div className="w-full rounded-3xl bg-gradient-to-r from-[#0d2a3a] via-[#102042] to-[#12182e] border border-[#243f6d] p-6 sm:p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative overflow-hidden">
          <div className="flex flex-col gap-3.5 text-left max-w-xl z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider w-fit">
              <FlameIcon className="w-4 h-4 text-cyan-400" />
              <span>Plataforma Hexagonal Dinámica</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white uppercase leading-none">
              SOBREVIVE PISO A PISO
            </h2>

            <p className="text-base text-slate-300 leading-relaxed max-w-md font-normal">
              Cada baldosa que pisas colapsa al vacío. Desplaza a tus rivales, calcula tus saltos y sé el último superviviente.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  playStepSound();
                  onHostGame();
                }}
                className="px-7 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-black uppercase tracking-wider shadow-[0_0_25px_rgba(37,99,235,0.6)] border border-blue-300/40 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <PlayIcon className="w-4.5 h-4.5 text-white" />
                <span>Crear Sala Nueva</span>
              </button>
            </div>
          </div>

          {/* Tarjeta Lateral de Acceso por Código */}
          <div className="w-full md:w-80 p-5 rounded-2xl bg-[#0f162e]/90 border border-[#243058] flex flex-col gap-4 shadow-xl z-10 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#1f2a50]">
              <span className="text-xs font-mono uppercase font-black text-slate-300">Unirse a Partida</span>
              <span className="text-xs font-mono text-cyan-400 font-bold">EN VIVO</span>
            </div>

            <form onSubmit={handleJoinSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => {
                  setRoomInput(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="Código de sala o enlace..."
                className="w-full px-4 py-3.5 rounded-xl bg-[#0a0f22] border border-[#243058] focus:border-blue-500 focus:outline-none text-white text-sm font-medium placeholder:text-slate-500 transition-colors"
              />
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#172247] hover:bg-blue-600 border border-[#2a3a6b] hover:border-blue-400 text-sm font-black text-white uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                <span>Entrar a la Sala</span>
              </button>
              {errorMessage && (
                <span className="text-sm text-rose-400 font-medium">{errorMessage}</span>
              )}
            </form>
          </div>
        </div>

        {/* Barra de Controles y Atajos de Teclado */}
        <div className="w-full bg-[#0f152b] border border-[#1f2a52] rounded-2xl px-6 py-4 flex flex-wrap justify-around items-center gap-4 text-sm text-slate-300 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-slate-400">Movimiento</span>
            <div className="flex gap-1">
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-[#1f2a52] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-slate-400">Salto</span>
            <kbd>Espacio</kbd>
          </div>

          <div className="h-4 w-[1px] bg-[#1f2a52] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-slate-400">Sprint</span>
            <kbd>Shift</kbd>
          </div>
        </div>
      </main>

      {/* Pie de Página */}
      <footer className="w-full max-w-5xl text-center text-sm text-slate-500 py-3 border-t border-[#1b2548] font-mono">
        HexaGuys © {new Date().getFullYear()} • Plataforma 3D Multijugador en Tiempo Real
      </footer>

      {/* Modal de Clasificación */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
}

export default LandingPage;
