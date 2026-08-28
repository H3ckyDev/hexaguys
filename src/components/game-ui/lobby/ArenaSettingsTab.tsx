import { memo } from "react";
import { MAPS_LIST, FLOOR_OPTIONS } from "../../../constants/ui";
import { playStepSound } from "../../../utils/sounds";

interface ArenaSettingsTabProps {
  mapId: string;
  floorsCount: number;
  onSelectMap: (mapId: string) => void;
  onSelectFloors: (count: number) => void;
  isHost: boolean;
}

export const ArenaSettingsTab = memo(function ArenaSettingsTab({
  mapId,
  floorsCount,
  onSelectMap,
  onSelectFloors,
  isHost,
}: ArenaSettingsTabProps) {
  const handleSelectMap = (id: string) => {
    if (isHost) {
      onSelectMap(id);
      playStepSound();
    }
  };

  const handleSelectFloorsBtn = (count: number) => {
    if (isHost) {
      onSelectFloors(count);
      playStepSound();
    }
  };

  return (
    <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
      {/* Selector de Arena */}
      <div className="bg-[#050811] border border-white/10 p-4 flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-mono uppercase font-bold text-slate-400">SELECCIONAR ARENA:</label>
          {!isHost && (
            <span className="text-[9px] font-mono text-cyan-400 font-bold">CONFIGURADO POR ANFITRIÓN</span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MAPS_LIST.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelectMap(m.id)}
              disabled={!isHost}
              className={`p-3.5 border text-left transition-all flex flex-col justify-between gap-2.5 ${
                mapId === m.id
                  ? "bg-[#0b1428] border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                  : "bg-[#080c16] border-white/10 hover:border-white/25"
              } ${!isHost ? "cursor-default" : "cursor-pointer active:scale-95"}`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#101930] text-cyan-300 border border-white/10">
                  {m.badge}
                </span>
                {mapId === m.id && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-ping" />
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-black text-white font-mono uppercase">{m.name}</span>
                <span className="text-[11px] text-slate-400 font-mono">{m.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selector de Pisos */}
      <div className="bg-[#050811] border border-white/10 p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-[10px] font-mono uppercase font-bold text-slate-400">NIVELES DE PISOS:</label>
          <span className="text-xs text-cyan-400 font-mono font-black">{floorsCount} NIVELES</span>
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {FLOOR_OPTIONS.map((count) => (
            <button
              key={count}
              onClick={() => handleSelectFloorsBtn(count)}
              disabled={!isHost}
              className={`py-2 border text-center transition-all font-mono font-bold ${
                floorsCount === count
                  ? "bg-cyan-500 border-cyan-300 text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                  : "bg-[#080c16] border-white/10 text-slate-400 hover:text-white"
              } ${!isHost ? "cursor-default" : "cursor-pointer active:scale-95"}`}
            >
              <span className="text-xs">{count}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});
