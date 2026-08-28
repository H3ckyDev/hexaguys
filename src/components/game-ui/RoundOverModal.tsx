import { memo } from "react";
import { CrownIcon, PlayIcon, SettingsIcon } from "../Icons";
import { SCORE_PER_WIN } from "../../constants/game";

interface RoundOverModalProps {
  winnerName: string;
  winnerColor: string;
  isHost: boolean;
  onRematch: () => void;
  onOpenWorkshop: () => void;
  onExitGame: () => void;
}

export const RoundOverModal = memo(function RoundOverModal({
  winnerName,
  winnerColor,
  isHost,
  onRematch,
  onOpenWorkshop,
  onExitGame,
}: RoundOverModalProps) {
  return (
    <div className="stealth-panel max-w-sm w-full p-6 sm:p-7 flex flex-col items-center gap-4 text-center text-slate-100 animate-in zoom-in-95 duration-150">
      <div className="w-12 h-12 bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(255,208,0,0.4)]">
        <CrownIcon className="w-6 h-6" />
      </div>

      <div>
        <h3 className="text-lg font-black uppercase font-mono tracking-tight text-white">
          RONDA FINALIZADA
        </h3>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">SOBREVIVIENTE SUPREMO DE LA ARENA</p>
      </div>

      {/* Ganador */}
      <div className="bg-[#050811] border border-amber-500/40 p-4 rounded-[0.25rem] flex flex-col items-center gap-1 w-full">
        <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest">
          CAMPEÓN (+{SCORE_PER_WIN} PTS)
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/60"
            style={{ backgroundColor: winnerColor }}
          />
          <span className="text-base font-black font-mono text-white tracking-tight">{winnerName}</span>
        </div>
      </div>

      {/* Botón Siguiente Ronda para Host / Espera y Acceso al Taller */}
      <div className="w-full flex flex-col gap-2 pt-1">
        {isHost ? (
          <button
            onClick={onRematch}
            className="btn-esports-primary w-full py-3 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.35)]"
          >
            <PlayIcon className="w-4 h-4 fill-current" />
            <span>SIGUIENTE RONDA</span>
          </button>
        ) : (
          <div className="px-4 py-2.5 bg-[#070b18] border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>ESPERANDO AL ANFITRIÓN...</span>
          </div>
        )}

        {/* Botón para abrir el Taller de Personalización / Configuración de Sala */}
        <button
          onClick={onOpenWorkshop}
          className="btn-esports-ghost w-full py-2.5 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer"
        >
          <SettingsIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>CONFIGURAR SALA // TALLER</span>
        </button>

        <button
          onClick={onExitGame}
          className="w-full py-1 text-[11px] text-slate-400 hover:text-rose-400 font-mono transition-colors cursor-pointer"
        >
          Salir de la Sala
        </button>
      </div>
    </div>
  );
});
