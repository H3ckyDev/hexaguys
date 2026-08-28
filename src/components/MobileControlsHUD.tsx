import { useState, useRef, useEffect, useCallback } from "react";
import { setMobileDirection, setMobileJump, setMobileSprint } from "../utils/mobileControls";

interface MobileControlsHUDProps {
  visible: boolean;
}

export function MobileControlsHUD({ visible }: MobileControlsHUDProps) {
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSprinting, setIsSprinting] = useState(false);
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  const maxRadius = 45; // Max joystick deflection radius in px

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;

    if (joystickBaseRef.current) {
      const rect = joystickBaseRef.current.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }

    setIsDragging(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const updateJoystick = useCallback((clientX: number, clientY: number) => {
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
      setStickPos({ x: 0, y: 0 });
      setMobileDirection(0, 0);
      return;
    }

    const clampedDist = Math.min(distance, maxRadius);
    const angle = Math.atan2(dy, dx);
    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    setStickPos({ x: stickX, y: stickY });

    // Normalizado (-1 a 1)
    const strength = clampedDist / maxRadius;
    const normX = (stickX / clampedDist) * strength;
    const normZ = (stickY / clampedDist) * strength;

    setMobileDirection(normX, normZ);
  }, [maxRadius]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  }, [updateJoystick]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setIsDragging(false);
        setStickPos({ x: 0, y: 0 });
        setMobileDirection(0, 0);
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden touch-none">
      {/* ========================================================
          1. JOYSTICK VIRTUAL TÁCTIL (Esquina Inferior Izquierda)
          ======================================================== */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div
          ref={joystickBaseRef}
          onTouchStart={handleTouchStart}
          className={`w-32 h-32 rounded-full bg-slate-950/70 border-2 flex items-center justify-center relative backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.6)] transition-colors ${
            isDragging ? "border-cyan-400/80 shadow-[0_0_25px_rgba(0,240,255,0.3)]" : "border-slate-700/60"
          }`}
        >
          {/* Ejes cardinales de referencia visual */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <div className="w-full h-[1px] bg-cyan-400/50" />
            <div className="h-full w-[1px] bg-cyan-400/50 absolute" />
          </div>

          {/* Anillo de rango */}
          <div className="w-20 h-20 rounded-full border border-cyan-400/20 pointer-events-none" />

          {/* Nub / Perno del Joystick */}
          <div
            className="w-14 h-14 rounded-full bg-gradient-to-b from-cyan-400 to-sky-600 border border-white/80 shadow-[0_0_15px_rgba(0,240,255,0.6)] flex items-center justify-center absolute transition-transform ease-out"
            style={{
              transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
              transitionDuration: isDragging ? "0ms" : "150ms",
            }}
          >
            <div className="w-5 h-5 rounded-full bg-white/40 border border-white/80" />
          </div>
        </div>
      </div>

      {/* ========================================================
          2. BOTONES DE ACCIÓN (Esquina Inferior Derecha)
          ======================================================== */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex items-end gap-3.5">
        {/* Botón de Sprint / Correr */}
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            setIsSprinting(true);
            setMobileSprint(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsSprinting(false);
            setMobileSprint(false);
          }}
          className={`w-14 h-14 rounded-2xl border-2 flex flex-col items-center justify-center font-mono text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg transition-all active:scale-95 ${
            isSprinting
              ? "bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] scale-105"
              : "bg-slate-900/80 text-amber-300 border-amber-500/40"
          }`}
        >
          <span className="text-base leading-none mb-0.5">⚡</span>
          <span>RUN</span>
        </button>

        {/* Botón Principal de Salto */}
        <button
          type="button"
          onTouchStart={(e) => {
            e.preventDefault();
            setMobileJump(true);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setMobileJump(false);
          }}
          className="w-18 h-18 rounded-3xl bg-gradient-to-t from-cyan-600 to-sky-400 border-2 border-white text-slate-950 flex flex-col items-center justify-center font-mono text-xs font-black uppercase tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.6)] transition-all active:scale-90"
        >
          <span className="text-xl leading-none">▲</span>
          <span className="mt-0.5">SALTAR</span>
        </button>
      </div>
    </div>
  );
}
