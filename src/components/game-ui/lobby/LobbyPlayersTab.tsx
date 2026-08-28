import { memo } from "react";
import { PlayerListItem } from "../PlayerListItem";

interface LobbyPlayersTabProps {
  players: any[];
  localPlayer: any;
  isHost: boolean;
  onKick?: (targetId: string, targetName: string) => void;
}

export const LobbyPlayersTab = memo(function LobbyPlayersTab({
  players,
  localPlayer,
  isHost,
  onKick,
}: LobbyPlayersTabProps) {
  return (
    <div className="bg-[#050811] border border-white/10 p-4 flex flex-col gap-1.5 max-h-60 overflow-y-auto animate-in fade-in duration-150">
      <div className="flex justify-between text-[10px] font-mono uppercase font-bold text-slate-500 pb-1 border-b border-white/5">
        <span>JUGADOR</span>
        <span>PUNTAJE</span>
      </div>

      {players.map((p) => (
        <PlayerListItem
          key={p.id}
          player={p}
          isHost={isHost}
          isLocal={localPlayer && p.id === localPlayer.id}
          isAfk={Boolean(p.getState("isAfk"))}
          score={p.getState("globalScore") || 0}
          onKick={onKick}
          isCompact={true}
        />
      ))}
    </div>
  );
});
