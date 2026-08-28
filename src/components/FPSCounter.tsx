import { useState, useEffect } from "react";

export function FPSCounter() {
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

  return (
    <div className="absolute top-24 left-6 bg-[#060912]/90 border border-white/10 px-2.5 py-1 text-xs select-none z-50 pointer-events-none flex items-center gap-2 text-white font-mono shadow-md">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] inline-block" />
      <span className="text-[10px] font-bold tracking-wider text-slate-400">FPS</span>
      <span className="font-bold text-xs text-emerald-400 tabular-nums">{fps}</span>
    </div>
  );
}

export default FPSCounter;
