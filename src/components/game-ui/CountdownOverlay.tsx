import { memo } from "react";

interface CountdownOverlayProps {
  countdown: number;
}

export const CountdownOverlay = memo(function CountdownOverlay({
  countdown,
}: CountdownOverlayProps) {
  return (
    <div 
      className="pointer-events-none select-none flex flex-col items-center justify-center gap-1 text-white animate-in zoom-in-95 duration-150"
      role="status"
      aria-live="polite"
    >
      <span className="text-3xl sm:text-4xl font-black font-mono uppercase text-white drop-shadow-[0_0_40px_rgba(0,240,255,0.85)]">
        ¡PREPÁRATE!
      </span>
      <div className="text-8xl sm:text-9xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_40px_rgba(0,240,255,0.85)] tabular-nums animate-pulse leading-none">
        {countdown}
      </div>
    </div>
  );
});
