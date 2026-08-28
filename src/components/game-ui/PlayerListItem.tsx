import { memo } from "react";
import { CyberAvatar } from "../CyberAvatar";

interface PlayerListItemProps {
  player: any; // using any for RoomKit player, but we can access methods
  isHost: boolean;
  isLocal: boolean;
  isAfk: boolean;
  score: number;
  onKick?: (targetId: string, targetName: string) => void;
  // Optional flag to adjust size or layout based on context (header vs lobby)
  isCompact?: boolean;
}

export const PlayerListItem = memo(function PlayerListItem({
  player,
  isHost,
  isLocal,
  isAfk,
  score,
  onKick,
  isCompact = false,
}: PlayerListItemProps) {
  const isAlive = player.getState("isAlive") !== false;
  const pName = player.getState("name") || player.getProfile()?.name || "Jugador";
  const pColor = player.getState("color") || player.getProfile()?.color?.hex || "#00f0ff";
  const pAvatar = player.getState("avatar") || player.getState("skin");

  return (
    <div className={`flex justify-between items-center gap-2.5 bg-[#060912] border border-white/10 ${isCompact ? 'p-2' : 'p-2.5'} text-xs`}>
      <div className="flex items-center gap-2.5 truncate">
        <div className={`${isCompact ? 'w-6 h-6' : 'w-8 h-8'} bg-[#090d1a] border border-white/10 flex items-center justify-center shrink-0`}>
          <CyberAvatar
            config={pAvatar}
            seed={pName}
            color={pColor}
            size={isCompact ? 24 : 28}
          />
        </div>

        <div className="flex flex-col truncate text-left">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={`truncate font-bold text-xs font-mono ${
                isAlive
                  ? isAfk
                    ? "text-amber-300"
                    : "text-white"
                  : "text-slate-500 line-through"
              }`}
            >
              {pName}
            </span>
            {isLocal && (
              <span className="text-[9px] font-mono text-cyan-400 font-bold">(Tú)</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono">
            {!isCompact && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAfk ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
            )}
            <span className={isCompact ? "text-[8px] font-mono text-slate-500 uppercase" : "text-slate-400"}>
              {isAfk ? (isCompact ? "AFK" : "AUSENTE") : (isCompact ? "CONECTADO" : "ACTIVO")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isHost && !isLocal && isAfk && onKick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onKick(player.id, pName);
            }}
            className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[9px] font-mono font-bold cursor-pointer"
          >
            EXPULSAR
          </button>
        )}
        <span className="text-xs font-mono font-bold text-amber-400 bg-[#0c1020] px-2 py-0.5 border border-white/10 tabular-nums">
          {score} PTS
        </span>
      </div>
    </div>
  );
});
