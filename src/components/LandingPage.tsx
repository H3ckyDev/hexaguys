import { useState } from "react";
import { playStepSound } from "../utils/sounds";
import { PlayIcon, CloseIcon, FlameIcon, TrophyIcon, DiceIcon, SparklesIcon } from "./Icons";
import { LeaderboardModal } from "./LeaderboardModal";
import { CyberAvatar } from "./CyberAvatar";
import { generateRandomAvatar, serializeAvatar, deserializeAvatar } from "../utils/avatarGenerator";
import type { AvatarConfig } from "../types/game";

interface LandingPageProps {
  onHostGame: () => void;
  onJoinGame: (roomCode: string) => void;
  afkKickNotice?: string | null;
  onDismissNotice?: () => void;
}

const PRESET_ARCHETYPES: { name: string; tag: string; config: AvatarConfig; color: string }[] = [
  {
    name: "CYBER NINJA",
    tag: "NINJA // 01",
    color: "#00f0ff",
    config: { head: 1, eyes: 2, mouth: 0, accessory: 4, color: "#00f0ff" },
  },
  {
    name: "NEON GLITCH",
    tag: "GLITCH // 02",
    color: "#ec4899",
    config: { head: 4, eyes: 5, mouth: 3, accessory: 1, color: "#ec4899" },
  },
  {
    name: "GOLDEN KING",
    tag: "PRIME // 03",
    color: "#ffd000",
    config: { head: 3, eyes: 1, mouth: 2, accessory: 5, color: "#ffd000" },
  },
  {
    name: "MECHA TITAN",
    tag: "MECHA // 04",
    color: "#10b981",
    config: { head: 2, eyes: 4, mouth: 1, accessory: 2, color: "#10b981" },
  },
  {
    name: "PLASMA BEAST",
    tag: "PLASMA // 05",
    color: "#8b5cf6",
    config: { head: 5, eyes: 7, mouth: 5, accessory: 3, color: "#8b5cf6" },
  },
];

export function LandingPage({ onHostGame, onJoinGame, afkKickNotice, onDismissNotice }: LandingPageProps) {
  const [roomInput, setRoomInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<AvatarConfig>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("hexaguys_avatar_config") : null;
    return deserializeAvatar(saved);
  });
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("hexaguys_avatar_config") : null;
    return deserializeAvatar(saved).color || "#00f0ff";
  });
  const [isRolling, setIsRolling] = useState(false);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = roomInput.trim();
    if (!raw) {
      setErrorMessage("Ingresa un código de 4 letras o enlace.");
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

  const handleQuickDiceRoll = () => {
    playStepSound();
    setIsRolling(true);
    const newAvatar = generateRandomAvatar(selectedColor);
    setPreviewAvatar(newAvatar);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hexaguys_avatar_config", serializeAvatar(newAvatar));
      } catch (e) {
        console.warn(e);
      }
    }
    setTimeout(() => setIsRolling(false), 450);
  };

  const handleSelectArchetype = (preset: typeof PRESET_ARCHETYPES[0]) => {
    playStepSound();
    setPreviewAvatar(preset.config);
    setSelectedColor(preset.color);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hexaguys_avatar_config", serializeAvatar(preset.config));
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <div className="w-full h-full min-h-screen tactical-grid-bg text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 relative overflow-y-auto select-none antialiased">
      {/* 1. Header Táctico de Competición */}
      <header className="w-full max-w-6xl flex justify-between items-center relative z-20 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#0d1222] border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <span className="text-sm font-black font-mono tracking-tighter text-cyan-400">
              HG
            </span>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase font-mono">
                HEXAGUYS
              </span>
              <span className="tech-tag flex items-center gap-1">
                <span className="led-indicator led-indicator-pulse" />
                <span>ONLINE // LATAM-01</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
              PLATAFORMA DE SUPERVIVENCIA HEXAGONAL 3D
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              playStepSound();
              setShowLeaderboard(true);
            }}
            className="btn-esports-gold px-3.5 py-2 text-xs flex items-center gap-2 cursor-pointer"
            title="Abrir Salón de la Fama"
          >
            <TrophyIcon className="w-3.5 h-3.5 text-black" />
            <span>SALÓN DE LA FAMA</span>
          </button>

          <a
            href="https://github.com/H3ckyDev/hexaguys"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-esports-ghost px-3.5 py-2 text-xs font-mono cursor-pointer hidden sm:inline-block"
          >
            GITHUB // v2.0
          </a>
        </div>
      </header>

      {/* 2. Main Hero Cockpit Layout */}
      <main className="w-full max-w-6xl my-auto py-6 sm:py-8 relative z-10 flex flex-col gap-6">
        {/* Banner de Aviso AFK */}
        {afkKickNotice && (
          <div className="w-full p-3.5 bg-[#140b0b] border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span className="text-left font-bold">{afkKickNotice}</span>
            </div>
            {onDismissNotice && (
              <button
                onClick={onDismissNotice}
                className="w-6 h-6 bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs cursor-pointer shrink-0"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Grid de Alto Rendimiento: Sala & Cyber-Forge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Panel Izquierdo: Operaciones & Despliegue (7 Columnas) */}
          <div className="lg:col-span-7 stealth-panel p-6 sm:p-8 flex flex-col justify-between gap-6 text-left">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="tech-tag flex items-center gap-1.5">
                  <FlameIcon className="w-3 h-3 text-cyan-400" />
                  <span>ARENA COMPETITIVA</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  TEMPORADA 01 // CLASIFICATORIA
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight leading-none text-white">
                SOBREVIVE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  AL COLAPSO TOTAL
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono max-w-lg">
                Pisos hexagonales reactivos que caen al menor impacto. Controla la inercia, domina el salto de precisión y elimina a tus rivales para reclamar la arena.
              </p>
            </div>

            {/* Operaciones de Inicio de Partida */}
            <div className="flex flex-col gap-4 pt-2 border-t border-white/10">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => {
                    playStepSound();
                    onHostGame();
                  }}
                  className="btn-esports-primary px-7 py-3.5 text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer flex-1 sm:flex-initial"
                >
                  <PlayIcon className="w-4 h-4 fill-current" />
                  <span>CREAR SALA NUEVA</span>
                </button>
              </div>

              {/* Formulario de Unión por Código */}
              <div className="pt-2">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1.5">
                  O UNIRSE A UNA SALA EXISTENTE:
                </span>
                <form onSubmit={handleJoinSubmit} className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    value={roomInput}
                    onChange={(e) => {
                      setRoomInput(e.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="CÓDIGO DE 4 LETRAS..."
                    maxLength={20}
                    className="flex-1 px-3.5 py-2.5 bg-[#060912] border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono placeholder:text-slate-600 uppercase"
                  />
                  <button
                    type="submit"
                    className="btn-esports-ghost px-5 py-2.5 text-xs font-mono uppercase cursor-pointer"
                  >
                    UNIRSE
                  </button>
                </form>
                {errorMessage && (
                  <span className="text-[11px] text-rose-400 font-mono font-bold mt-1.5 block">
                    {errorMessage}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Panel Derecho: Cyber-Forge / Taller de Avatar Táctico (5 Columnas) */}
          <div className="lg:col-span-5 stealth-panel p-5 sm:p-6 flex flex-col justify-between gap-4 text-left">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                  CYBER-FORGE // PERSONAJE
                </span>
              </div>
              <button
                onClick={handleQuickDiceRoll}
                className={`btn-esports-ghost px-2.5 py-1 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 cursor-pointer ${
                  isRolling ? "animate-dice-shake" : ""
                }`}
                title="Aleatorizar aspecto completo"
              >
                <DiceIcon className="w-3 h-3 text-cyan-400" />
                <span>RANDOM</span>
              </button>
            </div>

            {/* Celda de Contención Cyber-Forge */}
            <div className="cyber-containment py-4 px-2 flex flex-col items-center justify-center relative">
              <div className="absolute top-2 left-2.5 text-[9px] font-mono text-cyan-400/60">
                [GRID://SEC.88]
              </div>
              <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center my-2">
                <CyberAvatar config={previewAvatar} color={selectedColor} size={96} />
              </div>
              <div className="text-[10px] font-mono text-slate-400 tracking-wider uppercase mt-1">
                STATUS: LISTO PARA COMBATE
              </div>
            </div>

            {/* Arquetipos Tácticos Listos (1-Click) */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                EQUIPAMIENTOS RÁPIDOS (PRESETS):
              </span>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_ARCHETYPES.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handleSelectArchetype(preset)}
                    className="p-1.5 bg-[#060912] hover:bg-[#0f1526] border border-white/10 hover:border-cyan-400 flex flex-col items-center gap-1 cursor-pointer transition-all active:scale-95"
                    title={preset.name}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className="text-[8px] font-mono font-bold text-slate-300 truncate max-w-full">
                      {preset.name.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Barra de Controles Tácticos de Teclado */}
        <div className="stealth-panel px-5 py-3 w-full flex flex-wrap justify-between items-center gap-4 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-cyan-400">MOVIMIENTO:</span>
            <div className="flex gap-1">
              <kbd>W</kbd>
              <kbd>A</kbd>
              <kbd>S</kbd>
              <kbd>D</kbd>
            </div>
          </div>

          <div className="h-3 w-[1px] bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-cyan-400">SALTO:</span>
            <kbd>Espacio</kbd>
          </div>

          <div className="h-3 w-[1px] bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-cyan-400">SPRINT:</span>
            <kbd>Shift</kbd>
          </div>

          <div className="h-3 w-[1px] bg-white/10 hidden md:block" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-cyan-400">CHAT:</span>
            <kbd>Enter</kbd>
          </div>
        </div>
      </main>

      {/* 4. Footer Táctico */}
      <footer className="w-full max-w-6xl flex justify-between items-center text-[10px] text-slate-500 py-3 border-t border-white/10 font-mono">
        <span>HEXAGUYS // COMPETITIVE ESPORTS ENGINE</span>
        <span>FPS LOCK: 60 • NETCODE: P2P REALTIME</span>
      </footer>

      {/* Modal de Clasificación / Salón de la Fama */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
      />
    </div>
  );
}

export default LandingPage;


