import { memo, useEffect, useRef } from "react";
import { SettingsIcon, CloseIcon, LogOutIcon } from "../Icons";
import { playStepSound } from "../../utils/sounds";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  showFps: boolean;
  onToggleFps: () => void;
  onExitGame: () => void;
}

export const SettingsModal = memo(function SettingsModal({
  isOpen,
  onClose,
  volume,
  onVolumeChange,
  showFps,
  onToggleFps,
  onExitGame,
}: SettingsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        playStepSound();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), input[type="range"]:not([disabled])'
        );

        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleVolumeBtn = (change: number) => {
    const newVol = Math.max(0, Math.min(1, volume + change));
    onVolumeChange(newVol);
    playStepSound();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[100] pointer-events-auto p-4 animate-in fade-in duration-150">
      <div 
        ref={modalRef}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="settings-modal-title"
        className="stealth-panel max-w-sm w-full p-6 flex flex-col gap-4 text-slate-100"
      >
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-cyan-400" />
            <h3 id="settings-modal-title" className="text-xs font-black tracking-tight text-white uppercase font-mono">
              AJUSTES DEL SISTEMA
            </h3>
          </div>
          <button
            onClick={() => {
              onClose();
              playStepSound();
            }}
            className="w-6 h-6 bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs cursor-pointer"
            aria-label="Cerrar ajustes"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Slider de Volumen */}
        <div className="bg-[#050811] border border-white/10 p-3.5 rounded-[0.25rem] flex flex-col gap-2">
          <div className="flex justify-between text-xs font-black text-slate-200 font-mono">
            <span>VOLUMEN // AUDIO & MÚSICA</span>
            <span className="text-cyan-400 tabular-nums">{Math.round(volume * 100)}%</span>
          </div>
          <div className="flex items-center gap-2.5 mt-1">
            <button
              onClick={() => handleVolumeBtn(-0.1)}
              className="btn-esports-ghost w-7 h-7 text-xs font-bold flex items-center justify-center cursor-pointer"
              aria-label="Bajar volumen"
            >
              -
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => {
                onVolumeChange(parseFloat(e.target.value));
                if (Math.random() < 0.25) playStepSound();
              }}
              className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-[#121c38] rounded appearance-none"
              aria-label="Control de volumen"
            />
            <button
              onClick={() => handleVolumeBtn(0.1)}
              className="btn-esports-ghost w-7 h-7 text-xs font-bold flex items-center justify-center cursor-pointer"
              aria-label="Subir volumen"
            >
              +
            </button>
          </div>
        </div>

        {/* Toggle de FPS */}
        <div className="bg-[#050811] border border-white/10 p-3.5 rounded-[0.25rem] flex justify-between items-center">
          <div className="flex flex-col text-left">
            <span className="text-xs font-black text-slate-200 font-mono">CONTADOR DE FPS</span>
            <span className="text-[10px] text-slate-400 font-mono">Telemetría en tiempo real</span>
          </div>
          <button
            onClick={() => {
              onToggleFps();
              playStepSound();
            }}
            className={`w-10 h-5 rounded-sm p-0.5 transition-colors cursor-pointer relative ${
              showFps ? "bg-cyan-500" : "bg-[#141c38]"
            }`}
            aria-label="Alternar contador de FPS"
            aria-pressed={showFps}
          >
            <span
              className={`w-4 h-4 bg-white shadow-sm transform transition-transform block ${
                showFps ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={() => {
              onClose();
              playStepSound();
            }}
            className="btn-esports-primary w-full py-2.5 text-xs cursor-pointer"
          >
            GUARDAR Y VOLVER
          </button>
          <button
            onClick={onExitGame}
            className="btn-esports-danger w-full py-2 text-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogOutIcon className="w-3.5 h-3.5" />
            <span>SALIR AL MENÚ PRINCIPAL</span>
          </button>
        </div>
      </div>
    </div>
  );
});
