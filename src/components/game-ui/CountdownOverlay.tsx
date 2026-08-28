import { memo } from "react";

interface CountdownOverlayProps {
  countdown: number;
}

export const CountdownOverlay = memo(function CountdownOverlay({
  countdown,
}: CountdownOverlayProps) {
  return (
    <div 
      className="stealth-panel p-8 sm:p-10 flex flex-col items-center gap-2 text-white animate-in zoom-in-95 duration-150"
      role="status"
      aria-live="polite"
    >
      <span className="text-xs font-mono font-black uppercase tracking-widest text-cyan-400">
        PREPARADOS PARA LA CAÍDA
      </span>
      <div className="text-8xl sm:text-9xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_35px_rgba(0,240,255,0.8)] tabular-nums animate-pulse">
        {countdown}
      </div>
      <span className="text-xs text-slate-400 font-mono">
        ¡DOMINA EL SALTO Y NO TE DETENGAS!
      </span>
    </div>
  );
});
