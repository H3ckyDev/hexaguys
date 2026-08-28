import { memo, useCallback, useEffect, useRef } from "react";
import { CheckIcon, DiceIcon } from "../../../components/Icons";
import { CyberAvatar } from "../../CyberAvatar";
import { LayerStepper } from "./LayerStepper";
import { COLOR_PALETTE } from "../../../constants/ui";
import {
  type AvatarConfig,
  HEAD_NAMES,
  EYES_NAMES,
  MOUTH_NAMES,
  ACCESSORY_NAMES,
  TOTAL_HEADS,
  TOTAL_EYES,
  TOTAL_MOUTHS,
  TOTAL_ACCESSORIES,
} from "../../../utils/avatarGenerator";

interface AvatarCustomizerTabProps {
  localPlayer: any;
  avatarConfig: AvatarConfig;
  onUpdateAvatar: (config: AvatarConfig) => void;
  nickname: string;
  onNameChange: (name: string) => void;
  currentColor: string;
  onSelectColor: (hex: string) => void;
  isRolling: boolean;
  onRandomize: () => void;
}

export const AvatarCustomizerTab = memo(function AvatarCustomizerTab({
  localPlayer,
  avatarConfig,
  onUpdateAvatar,
  nickname,
  onNameChange,
  currentColor,
  onSelectColor,
  isRolling,
  onRandomize,
}: AvatarCustomizerTabProps) {
  // Debounce implementation for nickname syncing to network
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNameInputChange = useCallback((val: string) => {
    const clean = val.slice(0, 15);
    onNameChange(clean);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (localPlayer) {
        localPlayer.setState("name", clean || "Jugador");
      }
    }, 300);
  }, [onNameChange, localPlayer]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleStepLayer = useCallback((layer: "head" | "eyes" | "mouth" | "accessory", delta: number) => {
    let total = TOTAL_HEADS;
    if (layer === "eyes") total = TOTAL_EYES;
    if (layer === "mouth") total = TOTAL_MOUTHS;
    if (layer === "accessory") total = TOTAL_ACCESSORIES;

    const currentVal = avatarConfig[layer];
    const nextVal = (currentVal + delta + total) % total;
    onUpdateAvatar({
      ...avatarConfig,
      [layer]: nextVal,
    });
  }, [avatarConfig, onUpdateAvatar]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in duration-150">
      {/* Columna Izquierda: Vista Previa, Apodo & Color */}
      <div className="md:col-span-5 bg-[#050811] border border-white/10 p-4 sm:p-5 flex flex-col items-center gap-3.5">
        {/* Live Avatar Preview en Cyber-Forge */}
        <div className="cyber-containment w-full py-3 flex flex-col items-center justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center p-1">
            <CyberAvatar
              config={avatarConfig}
              color={currentColor}
              size={85}
            />
          </div>
        </div>

        {/* Botón Aleatorizar Rostro */}
        <button
          onClick={onRandomize}
          className={`btn-esports-gold w-full py-2 px-3 text-xs flex items-center justify-center gap-2 cursor-pointer ${
            isRolling ? "animate-dice-shake" : ""
          }`}
        >
          <DiceIcon className="w-3.5 h-3.5 text-black" />
          <span>ALEATORIZAR CARA</span>
        </button>

        {/* Apodo */}
        <div className="w-full flex flex-col gap-1 text-left">
          <label className="text-[10px] font-mono uppercase font-bold text-slate-400">APODO DEL JUGADOR:</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => handleNameInputChange(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            maxLength={15}
            className="w-full px-3 py-1.5 bg-[#080c16] border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-bold font-mono"
          />
        </div>

        {/* Paleta de Color */}
        <div className="w-full flex flex-col gap-1 text-left">
          <label className="text-[10px] font-mono uppercase font-bold text-slate-400">COLOR BASE // NEÓN:</label>
          <div className="grid grid-cols-4 gap-1.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectColor(c.hex)}
                className={`h-6 transition-all cursor-pointer flex items-center justify-center ${
                  currentColor === c.hex
                    ? "border-2 border-white scale-105 shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                    : "border border-white/20 opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {currentColor === c.hex && (
                  <CheckIcon className="w-3 h-3 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Selectores de Capas Faciales */}
      <div className="md:col-span-7 bg-[#050811] border border-white/10 p-4 sm:p-5 flex flex-col justify-between gap-2">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <span className="text-xs font-mono uppercase font-black text-white">
            MODIFICADOR DE CAPAS
          </span>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">
            100% MODULAR
          </span>
        </div>

        <LayerStepper
          label="1. CASCO / BASE"
          name={HEAD_NAMES[avatarConfig.head]}
          onPrev={() => handleStepLayer("head", -1)}
          onNext={() => handleStepLayer("head", 1)}
        />
        <LayerStepper
          label="2. OJOS // VISOR LED"
          name={EYES_NAMES[avatarConfig.eyes]}
          onPrev={() => handleStepLayer("eyes", -1)}
          onNext={() => handleStepLayer("eyes", 1)}
        />
        <LayerStepper
          label="3. BOCA // REJILLA"
          name={MOUTH_NAMES[avatarConfig.mouth]}
          onPrev={() => handleStepLayer("mouth", -1)}
          onNext={() => handleStepLayer("mouth", 1)}
        />
        <LayerStepper
          label="4. ACCESORIO // ANTENAS"
          name={ACCESSORY_NAMES[avatarConfig.accessory]}
          onPrev={() => handleStepLayer("accessory", -1)}
          onNext={() => handleStepLayer("accessory", 1)}
        />
      </div>
    </div>
  );
});
