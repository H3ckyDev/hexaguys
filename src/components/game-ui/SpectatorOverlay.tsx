import { memo } from "react";
import { LogOutIcon } from "../Icons";

interface SpectatorOverlayProps {
  aliveCount: number;
  onDisconnect: () => void;
}

export const SpectatorOverlay = memo(function SpectatorOverlay({
  aliveCount,
  onDisconnect,
}: SpectatorOverlayProps) {
  return (
    <div className="stealth-panel max-w-xs w-full p-5 flex flex-col items-center gap-3 text-center text-slate-100 animate-in zoom-in-95 duration-150">
      <div className="flex flex-col">
        <span className="text-xs font-black text-rose-400 uppercase tracking-widest font-mono">
          ELIMINADO
        </span>
        <span className="text-slate-400 text-xs font-mono mt-0.5">
          Modo espectador ({aliveCount} en juego)
        </span>
      </div>

      <button
        onClick={onDisconnect}
        className="btn-esports-danger w-full py-2 text-xs font-mono cursor-pointer flex items-center justify-center gap-1.5"
      >
        <LogOutIcon className="w-3.5 h-3.5" />
        <span>Salir de la Partida</span>
      </button>
    </div>
  );
});
