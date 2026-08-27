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
    <div className="absolute top-24 left-6 ios-pill rounded-full px-3 py-1 text-xs select-none z-50 pointer-events-none flex items-center gap-2 text-white/90 shadow-2xl">
      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse inline-block" />
      <span className="text-[11px] font-medium tracking-tight text-white/70">FPS</span>
      <span className="font-semibold text-xs tracking-tight text-emerald-400 font-mono">{fps}</span>
    </div>
  );
}

export default FPSCounter;
