import { useState, useEffect } from "react";
import { isHost, RPC } from "playroomkit";

export function PingCounter() {
  const [ping, setPing] = useState<number>(isHost() ? 0 : 12);

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

  const getPingColor = () => {
    if (isHost() || ping <= 40) return { text: "text-emerald-400", dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" };
    if (ping <= 100) return { text: "text-amber-400", dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" };
    return { text: "text-rose-400", dot: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" };
  };

  const status = getPingColor();

  return (
    <div className="absolute top-33 left-6 ios-pill rounded-full px-3 py-1 text-xs select-none z-50 pointer-events-none flex items-center gap-2 text-white/90 shadow-2xl">
      <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse inline-block`} />
      <span className="text-[11px] font-medium tracking-tight text-white/70">PING</span>
      <span className={`font-semibold text-xs tracking-tight font-mono ${status.text}`}>
        {isHost() ? "0 ms (Host)" : `${ping} ms`}
      </span>
    </div>
  );
}

export default PingCounter;
