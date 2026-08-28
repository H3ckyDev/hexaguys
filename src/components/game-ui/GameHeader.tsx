import { memo } from "react";
import { getRoomCode } from "playroomkit";
import { sileo } from "sileo";
import { playStepSound } from "../../utils/sounds";
import {
  CopyIcon,
  UsersIcon,
  SettingsIcon,
  TrophyIcon,
  CoinIcon,
} from "../Icons";

interface GameHeaderProps {
  roomCode?: string;
  score: number;
  aliveCount: number;
  totalCount: number;
  onToggleSettings: () => void;
  onToggleParticipants: () => void;
  onOpenLeaderboard: () => void;
  showPing?: boolean;
  isPlaying: boolean;
}

export const GameHeader = memo(function GameHeader({
  roomCode,
  score,
  aliveCount,
  totalCount,
  onToggleSettings,
  onToggleParticipants,
  onOpenLeaderboard,
  isPlaying,
}: GameHeaderProps) {
  const handleCopyLink = async () => {
    const code = roomCode || getRoomCode() || new URLSearchParams(window.location.search).get("r");
    const inviteUrl = code
      ? `${window.location.origin}${window.location.pathname}?r=${code}`
      : window.location.href;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      playStepSound();
      sileo.success({
        title: "Enlace copiado",
        description: `Código de sala: ${code || "activo"}. Compártelo para invitar.`,
      });
    } catch {
      sileo.error({
        title: "Error al copiar",
        description: "Copia la URL manualmente desde la barra de direcciones.",
      });
    }
  };

  return (
    <header className="flex justify-between items-center pointer-events-auto gap-3 w-full max-w-6xl mx-auto z-50">
      {/* Lado Izquierdo: Código de Sala y Puntuación Tabular */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {/* Código de Sala con Botón de Copiar */}
        <button
          onClick={handleCopyLink}
          className="btn-esports-ghost px-3.5 py-2 text-xs font-mono flex items-center gap-2 cursor-pointer"
          title="Copiar código de invitación"
        >
          <CopyIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-white font-black">{roomCode || getRoomCode() || "SALA"}</span>
          <span className="text-[10px] text-cyan-300 uppercase tracking-wider hidden sm:inline-block">COPIAR</span>
        </button>

        {/* Cápsula Dorada: Puntuación Tabular del Jugador */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0d18] border border-amber-500/40 rounded-[0.25rem]">
          <CoinIcon className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-mono text-amber-300 font-black tabular-nums">{score}</span>
          <span className="text-[10px] text-amber-400/80 font-mono font-bold">PTS</span>
        </div>

        {/* Durante la Partida: Indicador Central de Supervivientes */}
        {isPlaying && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#070a14] border border-cyan-500/50 rounded-[0.25rem]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-xs font-mono text-cyan-300 font-black tabular-nums">
              {aliveCount} / {totalCount}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold hidden sm:inline-block">VIVOS</span>
          </div>
        )}
      </div>

      {/* Lado Derecho: Ranking, Participantes y Ajustes */}
      <div className="flex items-center gap-2 relative">
        {/* Botón de Tabla de Clasificación / Ranking */}
        <button
          onClick={onOpenLeaderboard}
          className="btn-esports-gold px-3.5 py-2 flex items-center gap-2 text-xs cursor-pointer"
          title="Ver Tabla de Clasificación"
        >
          <TrophyIcon className="w-3.5 h-3.5 text-black" />
          <span className="hidden sm:inline-block font-black">RANKING</span>
        </button>

        {/* Botón de Lista de Jugadores */}
        <button
          onClick={onToggleParticipants}
          className="btn-esports-ghost w-9 h-9 flex items-center justify-center cursor-pointer relative"
          title="Participantes"
        >
          <UsersIcon className="w-4 h-4 text-cyan-400" />
          <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-sm bg-cyan-500 text-black font-mono text-[9px] font-black tabular-nums">
            {totalCount}
          </span>
        </button>

        {/* Botón de Ajustes */}
        <button
          onClick={onToggleSettings}
          className="btn-esports-ghost w-9 h-9 flex items-center justify-center cursor-pointer"
          title="Ajustes del sistema"
        >
          <SettingsIcon className="w-4 h-4 text-slate-300" />
        </button>
      </div>
    </header>
  );
});
