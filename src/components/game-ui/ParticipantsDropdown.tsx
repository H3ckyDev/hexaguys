import { memo } from "react";
import { UsersIcon, CloseIcon } from "../Icons";
import { PlayerListItem } from "./PlayerListItem";

interface ParticipantsDropdownProps {
  players: any[];
  localPlayer: any;
  isHost: boolean;
  isOpen: boolean;
  onClose: () => void;
  onKick?: (targetId: string, targetName: string) => void;
}

export const ParticipantsDropdown = memo(function ParticipantsDropdown({
  players,
  localPlayer,
  isHost,
  isOpen,
  onClose,
  onKick,
}: ParticipantsDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute! right-0 top-full mt-2.5 stealth-panel w-80 sm:w-96 z-50 animate-in fade-in zoom-in-95 duration-150 p-4 shadow-[0_15px_40px_rgba(0,0,0,0.9)]">
      <div className="flex flex-col gap-3 text-slate-100">
        <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono uppercase font-black text-white">
              PARTICIPANTES ({players.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs cursor-pointer"
          >
            <CloseIcon className="w-3 h-3" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
          {players.map((p) => (
            <PlayerListItem
              key={p.id}
              player={p}
              isHost={isHost}
              isLocal={localPlayer && p.id === localPlayer.id}
              isAfk={Boolean(p.getState("isAfk"))}
              score={p.getState("globalScore") || 0}
              onKick={onKick}
              isCompact={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
