import { useState, useEffect } from "react";
import { isHost, RPC } from "playroomkit";

interface PerformanceHUDProps {
  showFps?: boolean;
  showPing?: boolean;
}

export function PerformanceHUD({ showFps = true, showPing = true }: PerformanceHUDProps) {
  const [fps, setFps] = useState(60);
  const [ping, setPing] = useState<number>(isHost() ? 0 : 12);

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

  useEffect(() => {
    if (isHost()) {
      RPC.register("pingHost", async (clientTimestamp: number) => {
        return clientTimestamp;
      });
      setPing(0);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const start = performance.now();
        await RPC.call("pingHost", Date.now(), RPC.Mode.HOST);
        const latency = Math.round(performance.now() - start);
        setPing(latency);
      } catch {
        // Fallback
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!showFps && !showPing) return null;

  const getPingColor = () => {
    if (isHost() || ping <= 40) return { text: "text-emerald-400", dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" };
    if (ping <= 100) return { text: "text-amber-400", dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" };
    return { text: "text-rose-400", dot: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" };
  };

  const pingStatus = getPingColor();

  return (
    <div className="fixed bottom-5 right-5 z-40 pointer-events-none select-none">
      <div className="ios-pill rounded-full px-3.5 py-1.5 text-xs flex items-center gap-3 text-white/90 shadow-2xl">
        {showFps && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse inline-block" />
            <span className="text-[10px] font-bold text-white/50 tracking-wider">FPS</span>
            <span className="font-semibold text-xs text-emerald-400 font-mono">{fps}</span>
          </div>
        )}

        {showFps && showPing && (
          <span className="w-[1px] h-3 bg-white/20 inline-block" />
        )}

        {showPing && (
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${pingStatus.dot} animate-pulse inline-block`} />
            <span className="text-[10px] font-bold text-white/50 tracking-wider">PING</span>
            <span className={`font-semibold text-xs font-mono ${pingStatus.text}`}>
              {isHost() ? "0 ms" : `${ping} ms`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PerformanceHUD;
