import { memo } from "react";
import { PlayIcon, SettingsIcon } from "../../Icons";
import { playStepSound } from "../../../utils/sounds";

interface LobbyFooterControlsProps {
  isHost: boolean;
  onStartGame: () => void;
  onToggleWorkshop: () => void;
  activePlayerCount: number;
  showLobbyDrawer: boolean;
}

export const LobbyFooterControls = memo(function LobbyFooterControls({
  isHost,
  onStartGame,
  onToggleWorkshop,
  activePlayerCount,
  showLobbyDrawer,
}: LobbyFooterControlsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 w-full max-w-xs sm:max-w-sm mx-auto">
      {/* 1. Botón Principal de Partida */}
      {isHost ? (
        <button
          onClick={onStartGame}
          className="btn-esports-primary w-full py-3 text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.35)]"
        >
          <PlayIcon className="w-4 h-4 fill-current" />
          <span>
            {activePlayerCount > 1 ? `INICIAR PARTIDA (${activePlayerCount} JUGADORES)` : "INICIAR PARTIDA"}
          </span>
        </button>
      ) : (
        <div className="w-full py-2.5 bg-[#070a14] border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>ESPERANDO QUE EL ANFITRIÓN INICIE...</span>
        </div>
      )}

      {/* 2. Botón Secundario de Taller */}
      <button
        onClick={() => {
          playStepSound();
          onToggleWorkshop();
        }}
        className="btn-esports-ghost w-full py-2.5 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer"
      >
        <SettingsIcon className="w-3.5 h-3.5 text-cyan-400" />
        <span>{showLobbyDrawer ? "CERRAR TALLER" : "CONFIGURAR SALA // TALLER"}</span>
      </button>
    </div>
  );
});
