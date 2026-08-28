import { useState, useEffect, useRef } from "react";
import { CyberAvatar } from "./CyberAvatar";
import { DiceIcon, UserIcon, CheckIcon, SparklesIcon, CloseIcon } from "./Icons";
import {
  HEAD_NAMES,
  EYES_NAMES,
  MOUTH_NAMES,
  ACCESSORY_NAMES,
  TOTAL_HEADS,
  TOTAL_EYES,
  TOTAL_MOUTHS,
  TOTAL_ACCESSORIES,
  generateRandomAvatar,
  deserializeAvatar,
} from "../utils/avatarGenerator";
import { COLOR_PALETTE } from "../constants/ui";
import { playStepSound } from "../utils/sounds";
import { signInWithGoogle, logoutUser, subscribeToAuth, saveUserProfile, getActiveProfile } from "../services/authService";
import type { AvatarConfig } from "../types/game";
import type { User } from "firebase/auth";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (nickname: string, avatar: AvatarConfig) => void;
}

const PRESET_ARCHETYPES: { name: string; tag: string; config: AvatarConfig; color: string }[] = [
  {
    name: "CYBER NINJA",
    tag: "NINJA // 01",
    color: "#00f0ff",
    config: { head: 4, eyes: 6, mouth: 4, accessory: 5, color: "#00f0ff" },
  },
  {
    name: "NEON GLITCH",
    tag: "GLITCH // 02",
    color: "#ec4899",
    config: { head: 0, eyes: 1, mouth: 2, accessory: 1, color: "#ec4899" },
  },
  {
    name: "GOLDEN KING",
    tag: "PRIME // 03",
    color: "#ffd000",
    config: { head: 3, eyes: 0, mouth: 1, accessory: 2, color: "#ffd000" },
  },
  {
    name: "MECHA TITAN",
    tag: "MECHA // 04",
    color: "#10b981",
    config: { head: 3, eyes: 2, mouth: 5, accessory: 4, color: "#10b981" },
  },
  {
    name: "ASTRO VOYAGER",
    tag: "ASTRO // 05",
    color: "#8b5cf6",
    config: { head: 2, eyes: 7, mouth: 0, accessory: 3, color: "#8b5cf6" },
  },
];

const RANDOM_NICKNAMES = [
  "CyberWolf", "NeonViper", "HexaMaster", "GlitchKing", "PixelRider",
  "ShadowVolt", "HyperNova", "QuantumDash", "PulseRunner", "ApexBot"
];

export function OnboardingModal({ isOpen, onClose, onComplete }: OnboardingModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState(() => {
    return getActiveProfile()?.nickname || "";
  });
  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    return getActiveProfile()?.avatarConfig || deserializeAvatar(null);
  });
  const [selectedColor, setSelectedColor] = useState(() => {
    return getActiveProfile()?.color || "#0284c7";
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser, profile) => {
      setUser(currentUser);
      if (profile && !hasInitializedRef.current) {
        hasInitializedRef.current = true;
        if (profile.nickname) setNickname(profile.nickname);
        if (profile.avatarConfig) setAvatar(profile.avatarConfig);
        if (profile.color) setSelectedColor(profile.color);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      const active = getActiveProfile();
      if (active) {
        setNickname(active.nickname || "");
        setAvatar(active.avatarConfig || deserializeAvatar(null));
        setSelectedColor(active.color || "#0284c7");
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRandomize = () => {
    playStepSound();
    const newAvatar = generateRandomAvatar(selectedColor);
    setAvatar(newAvatar);
  };

  const handleRandomName = () => {
    playStepSound();
    const rand = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
    const num = Math.floor(Math.random() * 900 + 100);
    setNickname(`${rand}_${num}`);
  };

  const handleStep = (layer: keyof AvatarConfig, delta: number, total: number) => {
    playStepSound();
    const current = (avatar[layer] as number) || 0;
    const next = (current + delta + total) % total;
    setAvatar((prev) => ({ ...prev, [layer]: next }));
  };

  const handleColorSelect = (hex: string) => {
    playStepSound();
    setSelectedColor(hex);
    setAvatar((prev) => ({ ...prev, color: hex }));
  };

  const handlePresetSelect = (preset: typeof PRESET_ARCHETYPES[0]) => {
    playStepSound();
    setAvatar(preset.config);
    setSelectedColor(preset.color);
  };

  const handleGoogleLogin = async () => {
    playStepSound();
    setIsLoggingIn(true);
    try {
      const res = await signInWithGoogle(nickname.trim());
      if (res) {
        setUser(res.user);
        if (res.profile) {
          if (res.profile.nickname) setNickname(res.profile.nickname);
          if (res.profile.avatarConfig) setAvatar(res.profile.avatarConfig);
          if (res.profile.color) setSelectedColor(res.profile.color);
        }
      }
    } catch (err) {
      console.warn("Error en login:", err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    playStepSound();
    await logoutUser();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nickname.trim() || `Player_${Math.floor(Math.random() * 900 + 100)}`;
    const finalAvatar = { ...avatar, color: selectedColor };

    // Sincronizar en Firestore exclusivamente si el usuario está autenticado
    if (user) {
      await saveUserProfile(user.uid, {
        nickname: finalName,
        avatarConfig: finalAvatar,
        color: selectedColor,
      });
    }

    playStepSound();
    onComplete(finalName, finalAvatar);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-[#090d1a] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-[#060912] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.3)]">
              <SparklesIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 id="onboarding-title" className="text-base sm:text-lg font-black tracking-wider text-white uppercase">
                Perfil & Personalización
              </h2>
              <p className="text-xs text-cyan-400/80 font-mono">CONFIGURA TU IDENTIDAD CYBER</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Fila Superior: Google Auth status pill */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between gap-3">
            {user ? (
              <div className="flex items-center gap-3 min-w-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Foto de perfil" className="w-9 h-9 rounded-full border border-cyan-400 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center shrink-0">
                    <UserIcon className="w-5 h-5 text-cyan-400" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{user.displayName || user.email || "Cuenta de Google"}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{user.email}</div>
                  <div className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Progreso sincronizado en la nube
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z" />
                  </svg>
                </div>
                <div className="text-xs text-slate-300">
                  Guarda tu progreso y estadísticas en la nube
                </div>
              </div>
            )}

            {user ? (
              <button
                type="button"
                onClick={handleGoogleLogout}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded-lg transition-colors border border-slate-700"
              >
                Cerrar Sesión
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold rounded-lg border border-cyan-500/40 transition-colors flex items-center gap-1.5 shrink-0"
              >
                {isLoggingIn ? "Conectando..." : "Acceder con Google"}
              </button>
            )}
          </div>

          {/* Nombre / Apodo */}
          <div>
            <label className="block text-xs font-bold tracking-wider text-slate-300 uppercase mb-2">
              Apodo en Partida (Max 15 Caracteres)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={15}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Escribe tu nombre..."
                  className="w-full bg-[#060912] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={handleRandomName}
                title="Generar nombre aleatorio"
                className="px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <DiceIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold hidden sm:inline">Aleatorio</span>
              </button>
            </div>
          </div>

          {/* Grid Principal: Avatar Preview + Steppers */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Vista Previa & Colores */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-[#060912] rounded-xl border border-slate-800 space-y-4">
              <div className="relative">
                <div
                  className="w-28 h-28 rounded-2xl bg-gradient-to-b from-slate-800/80 to-slate-950 flex items-center justify-center border-2 shadow-2xl transition-all"
                  style={{ borderColor: selectedColor, boxShadow: `0 0 25px ${selectedColor}40` }}
                >
                  <CyberAvatar config={avatar} color={selectedColor} size={90} glow={true} />
                </div>
                <button
                  type="button"
                  onClick={handleRandomize}
                  title="Avatar aleatorio"
                  className="absolute -bottom-2 -right-2 p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl shadow-lg transition-transform hover:scale-110 active:scale-95"
                >
                  <DiceIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Selector de Color */}
              <div className="w-full">
                <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase text-center mb-2">
                  Paleta Neón
                </span>
                <div className="flex flex-wrap justify-center gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleColorSelect(c.hex)}
                      aria-label={`Color ${c.name}`}
                      className={`w-7 h-7 rounded-lg transition-transform ${
                        selectedColor.toLowerCase() === c.hex.toLowerCase()
                          ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#060912]"
                          : "hover:scale-105 opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Capas Stepper */}
            <div className="md:col-span-7 space-y-2.5">
              {/* Cabeza */}
              <div className="p-2.5 bg-[#060912] border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase w-20">Cabeza</span>
                <span className="text-xs font-mono font-bold text-cyan-300 text-center flex-1 truncate">
                  {HEAD_NAMES[avatar.head] || "Terminal"}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleStep("head", -1, TOTAL_HEADS)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("head", 1, TOTAL_HEADS)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Ojos */}
              <div className="p-2.5 bg-[#060912] border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase w-20">Visor / Ojos</span>
                <span className="text-xs font-mono font-bold text-cyan-300 text-center flex-1 truncate">
                  {EYES_NAMES[avatar.eyes] || "Láser"}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleStep("eyes", -1, TOTAL_EYES)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("eyes", 1, TOTAL_EYES)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Boca */}
              <div className="p-2.5 bg-[#060912] border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase w-20">Boca / Rejilla</span>
                <span className="text-xs font-mono font-bold text-cyan-300 text-center flex-1 truncate">
                  {MOUTH_NAMES[avatar.mouth] || "Rejilla"}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleStep("mouth", -1, TOTAL_MOUTHS)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("mouth", 1, TOTAL_MOUTHS)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Accesorio */}
              <div className="p-2.5 bg-[#060912] border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase w-20">Accesorio</span>
                <span className="text-xs font-mono font-bold text-cyan-300 text-center flex-1 truncate">
                  {ACCESSORY_NAMES[avatar.accessory] || "Ninguno"}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleStep("accessory", -1, TOTAL_ACCESSORIES)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStep("accessory", 1, TOTAL_ACCESSORIES)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Arquetipos Predefinidos */}
          <div>
            <span className="block text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">
              Arquetipos Tácticos
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {PRESET_ARCHETYPES.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className="p-2 rounded-xl bg-[#060912] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex flex-col items-center gap-1.5 transition-all text-center group"
                >
                  <CyberAvatar config={p.config} color={p.color} size={36} glow={false} />
                  <span className="text-[10px] font-bold text-slate-300 group-hover:text-cyan-300 truncate w-full">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              <CheckIcon className="w-5 h-5" />
              Guardar y Entrar a la Arena
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
