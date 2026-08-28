import { useState, useEffect } from "react";

interface PerformanceHUDProps {
  showFps?: boolean;
}

/**
 * HUD de rendimiento en pantalla (Contador de FPS)
 */
export function PerformanceHUD({ showFps = true }: PerformanceHUDProps) {
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (!showFps) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 pointer-events-none select-none">
      <div className="px-2.5 py-1 bg-[#060912]/90 border border-white/10 text-xs flex items-center gap-2 text-slate-300 shadow-md">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] inline-block" />
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">FPS</span>
        <span className="font-mono text-xs text-white font-bold tabular-nums">{fps}</span>
      </div>
    </div>
  );
}

export default PerformanceHUD;
