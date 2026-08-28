import { memo, useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, DiceIcon, UserIcon } from "../../../components/Icons";
import { CyberAvatar } from "../../CyberAvatar";
import { LayerStepper } from "./LayerStepper";
import { COLOR_PALETTE } from "../../../constants/ui";
import { getCurrentUser, saveUserProfile, signInWithGoogle, subscribeToAuth } from "../../../services/authService";
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
import type { User } from "firebase/auth";

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
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = subscribeToAuth((u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

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
      const user = getCurrentUser();
      if (user) {
        saveUserProfile(user.uid, { nickname: clean, avatarConfig });
      }
    }, 300);
  }, [onNameChange, localPlayer, avatarConfig]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleStepLayer = useCallback((layer: "head" | "eyes" | "mouth" | "accessory", delta: number) => {
    let total: number = TOTAL_HEADS;
    if (layer === "eyes") total = TOTAL_EYES;
    if (layer === "mouth") total = TOTAL_MOUTHS;
    if (layer === "accessory") total = TOTAL_ACCESSORIES;

    const currentVal = avatarConfig[layer];
    const nextVal = (currentVal + delta + total) % total;
    const updated = {
      ...avatarConfig,
      [layer]: nextVal,
    };
    onUpdateAvatar(updated);
    const user = getCurrentUser();
    if (user) {
      saveUserProfile(user.uid, { avatarConfig: updated });
    }
  }, [avatarConfig, onUpdateAvatar]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle(nickname);
    } catch (err) {
      console.warn("Error en login:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ========================================================
  // SI EL USUARIO ES INVITADO (NO LOGUEADO): BLOQUEAR MENÚ
  // ========================================================
  if (!currentUser) {
    return (
      <div className="w-full p-6 sm:p-8 bg-[#050811] border border-amber-500/30 rounded-xl flex flex-col items-center justify-center text-center gap-4 animate-in fade-in duration-150">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <div className="max-w-md space-y-1.5">
          <h3 className="text-sm sm:text-base font-black font-mono text-white uppercase tracking-wider">
            Personalización Bloqueada
          </h3>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            La personalización de capas, colores, skins y guardado en base de datos es exclusiva para usuarios registrados.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-black text-xs uppercase font-mono tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
        >
          <UserIcon className="w-4 h-4" />
          {isLoggingIn ? "Conectando..." : "Iniciar Sesión con Google para Personalizar"}
        </button>
      </div>
    );
  }

  // ========================================================
  // USUARIO LOGUEADO: MENÚ COMPLETO DE PERSONALIZACIÓN
  // ========================================================
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in duration-150">
      {/* Columna Izquierda: Vista Previa, Apodo & Color */}
      <div className="md:col-span-5 bg-[#050811] border border-white/10 p-4 sm:p-5 flex flex-col justify-between items-center text-center gap-4">
        {/* Avatar Preview */}
        <div className="relative group">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 bg-[#080c16] border-2 flex items-center justify-center transition-all duration-300 shadow-lg"
            style={{
              borderColor: currentColor,
              boxShadow: `0 0 15px ${currentColor}30`,
            }}
          >
            <CyberAvatar
              config={avatarConfig}
              color={currentColor}
              size={80}
              className={isRolling ? "animate-pulse" : ""}
            />
          </div>

          <button
            onClick={onRandomize}
            disabled={isRolling}
            className="absolute -bottom-2 -right-2 p-1.5 bg-[#0a0f1d] hover:bg-[#0f172a] border border-white/20 text-cyan-400 transition-transform active:scale-90 cursor-pointer shadow-md"
            title="Generar avatar aleatorio"
          >
            <DiceIcon className={`w-3.5 h-3.5 ${isRolling ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Input Apodo */}
        <div className="w-full flex flex-col gap-1 text-left">
          <label className="text-[10px] font-mono uppercase font-bold text-slate-400">APODO GAMER (FIRESTORE):</label>
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
