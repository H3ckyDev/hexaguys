import { useState, useEffect } from "react";
import { playStepSound } from "../utils/sounds";
import { PlayIcon, CloseIcon, FlameIcon, TrophyIcon, DiceIcon, SparklesIcon, UserIcon } from "./Icons";
import { LeaderboardModal } from "./LeaderboardModal";
import { OnboardingModal } from "./OnboardingModal";
import { CyberAvatar } from "./CyberAvatar";
import { generateRandomAvatar, deserializeAvatar } from "../utils/avatarGenerator";
import { subscribeToAuth, signInWithGoogle, logoutUser, saveUserProfile, getActiveProfile } from "../services/authService";
import type { AvatarConfig } from "../types/game";
import type { User } from "firebase/auth";

interface LandingPageProps {
  onHostGame: () => void;
  onJoinGame: (roomCode: string) => void;
  afkKickNotice?: string | null;
  onDismissNotice?: () => void;
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

export function LandingPage({ onHostGame, onJoinGame, afkKickNotice, onDismissNotice }: LandingPageProps) {
  const [roomInput, setRoomInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [nickname, setNickname] = useState<string>(() => {
    return getActiveProfile()?.nickname || "";
  });

  const [previewAvatar, setPreviewAvatar] = useState<AvatarConfig>(() => {
    return getActiveProfile()?.avatarConfig || deserializeAvatar(null);
  });

  const [selectedColor, setSelectedColor] = useState<string>(() => {
    return getActiveProfile()?.color || previewAvatar.color || "#00f0ff";
  });

  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((currentUser, profile) => {
      setUser(currentUser);
      if (profile) {
        if (profile.nickname) setNickname(profile.nickname);
        if (profile.avatarConfig) setPreviewAvatar(profile.avatarConfig);
        if (profile.color) setSelectedColor(profile.color);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = roomInput.trim();
    if (!raw) {
      setErrorMessage("Ingresa un código de 4 letras o enlace.");
      return;
    }

    playStepSound();

    let code = raw;
    if (raw.includes("?r=")) {
      const match = raw.match(/[?&]r=([^&]+)/);
      if (match && match[1]) code = match[1];
    } else if (raw.includes("?room=")) {
      const match = raw.match(/[?&]room=([^&]+)/);
      if (match && match[1]) code = match[1];
    }

    onJoinGame(code);
  };

  const handleGoogleLogin = async () => {
    playStepSound();
    try {
      const res = await signInWithGoogle(nickname);
      if (res) {
        setUser(res.user);
        if (res.isNewUser) {
          // Primer registro: abrir modal de personalización
          setShowOnboarding(true);
        } else {
          // Usuario existente: datos ya cargados desde Firestore
          setNickname(res.profile.nickname);
          setPreviewAvatar(res.profile.avatarConfig);
          setSelectedColor(res.profile.color);
        }
      }
    } catch (err) {
      console.warn("Error al iniciar sesión con Google:", err);
    }
  };

  const handleQuickDiceRoll = () => {
    playStepSound();
    setIsRolling(true);
    const newAvatar = generateRandomAvatar(selectedColor);
    setPreviewAvatar(newAvatar);

    if (user) {
      saveUserProfile(user.uid, { avatarConfig: newAvatar, color: selectedColor });
    }
    setTimeout(() => setIsRolling(false), 450);
  };

  const handleSelectArchetype = (preset: typeof PRESET_ARCHETYPES[0]) => {
    playStepSound();
    setPreviewAvatar(preset.config);
    setSelectedColor(preset.color);

    if (user) {
      saveUserProfile(user.uid, { avatarConfig: preset.config, color: preset.color });
    }
  };

  const handleOnboardingComplete = (newName: string, newAvatar: AvatarConfig) => {
    setNickname(newName);
    setPreviewAvatar(newAvatar);
    setSelectedColor(newAvatar.color);
  };

  return (
    <div className="w-full h-full min-h-screen tactical-grid-bg text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 relative overflow-y-auto select-none antialiased">
      {/* 1. Header Táctico */}
      <header className="w-full max-w-6xl flex flex-wrap justify-between items-center gap-3 relative z-20 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#0d1222] border border-cyan-400/50 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <span className="text-sm font-black font-mono tracking-tighter text-cyan-400">
              HG
            </span>
          </div>
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase font-mono">
                HEXAGUYS PRO
              </span>
              <span className="tech-tag flex items-center gap-1">
                <span className="led-indicator led-indicator-pulse" />
                <span>ONLINE // MULTIPLAYER</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
              PLATAFORMA DE SUPERVIVENCIA HEXAGONAL 3D
            </span>
          </div>
        </div>

        {/* Header Right Actions & Google Auth Pill */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full border border-cyan-400 shrink-0" />
              ) : (
                <UserIcon className="w-5 h-5 text-cyan-400 shrink-0" />
              )}
              <div className="flex flex-col text-left min-w-0 max-w-[120px]">
                <span className="text-xs font-black text-cyan-300 truncate font-mono">{nickname}</span>
                <span className="text-[9px] text-slate-400 truncate" title={user.email || user.displayName || ""}>
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                onClick={() => { playStepSound(); logoutUser(); }}
                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold ml-1 px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-800/40 cursor-pointer"
                title="Cerrar sesión de Google"
              >
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 rounded-lg border border-white/15 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Iniciar sesión con Google para guardar tu apodo, avatar y ranking en la base de datos"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 17C3.7 20.7 7.5 24 12 24z" />
              </svg>
              <span>Acceder con Google</span>
            </button>
          )}

          <button
            onClick={() => {
              playStepSound();
              setShowLeaderboard(true);
            }}
            className="btn-esports-gold px-3.5 py-2 text-xs flex items-center gap-2 cursor-pointer"
            title="Abrir Salón de la Fama"
          >
            <TrophyIcon className="w-3.5 h-3.5 text-black" />
            <span>RANKING</span>
          </button>
        </div>
      </header>

      {/* 2. Main Hero Layout */}
      <main className="w-full max-w-6xl my-auto py-6 sm:py-8 relative z-10 flex flex-col gap-6">

        {/* Banner de Aviso AFK */}
        {afkKickNotice && (
          <div className="w-full p-3.5 bg-[#140b0b] border border-rose-500/50 text-rose-200 text-xs font-mono flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span className="text-left font-bold">{afkKickNotice}</span>
            </div>
            {onDismissNotice && (
              <button
                onClick={onDismissNotice}
                className="w-6 h-6 bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs cursor-pointer shrink-0"
              >
                <CloseIcon className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Grid: Sala & Cyber-Forge */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Panel Izquierdo: Operaciones & Despliegue (7 Columnas) */}
          <div className="lg:col-span-7 stealth-panel p-6 sm:p-8 flex flex-col justify-between gap-6 text-left">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="tech-tag flex items-center gap-1.5">
                  <FlameIcon className="w-3 h-3 text-cyan-400" />
                  <span>ARENA COMPETITIVA</span>
                </span>
                <span className="text-xs font-mono text-slate-400">
                  TEMPORADA 01 // MULTIPLAYER REAL-TIME
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight leading-none text-white">
                SOBREVIVE <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  AL COLAPSO TOTAL
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono max-w-lg">
                Pisos hexagonales reactivos que caen al menor impacto. Transparencia superior inteligente, físicas 3D y combate multijugador en tiempo real.
              </p>
            </div>

            {/* Operaciones de Inicio de Partida */}
            <div className="flex flex-col gap-4 pt-2 border-t border-white/10">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => {
                    playStepSound();
                    onHostGame();
                  }}
                  className="btn-esports-primary px-7 py-3.5 text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer flex-1 sm:flex-initial"
                >
                  <PlayIcon className="w-4 h-4 fill-current" />
                  <span>CREAR NUEVA SALA</span>
                </button>

                {user && (
                  <button
                    onClick={() => {
                      playStepSound();
                      setShowOnboarding(true);
                    }}
                    className="btn-esports-ghost px-5 py-3.5 text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-500/10"
                  >
                    <SparklesIcon className="w-4 h-4 text-cyan-400" />
                    <span>PERSONALIZAR PERFIL</span>
                  </button>
                )}
              </div>

              {/* Formulario Unirse con Código */}
              <form onSubmit={handleJoinSubmit} className="flex flex-col gap-2 pt-2">
                <span className="text-[11px] font-mono text-slate-400">
                  ¿TIENES UN CÓDIGO DE SALA O ENLACE?
                </span>
                <div className="flex items-center gap-2 max-w-md">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={roomInput}
                      onChange={(e) => {
                        setRoomInput(e.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="EJ: ABCD O ENLACE"
                      className="input-esports w-full py-2.5 px-3 text-xs sm:text-sm uppercase font-mono tracking-wider"
                      maxLength={120}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-esports-secondary px-5 py-2.5 text-xs font-mono cursor-pointer shrink-0"
                  >
                    UNIRSE
                  </button>
                </div>
                {errorMessage && (
                  <span className="text-[11px] font-mono text-rose-400">
                    {errorMessage}
                  </span>
                )}
              </form>
            </div>
          </div>

          {/* Panel Derecho: Cyber-Forge de Avatar (Solo para usuarios logueados) */}
          <div className="lg:col-span-5 stealth-panel p-6 sm:p-8 flex flex-col justify-between items-center text-center gap-6 relative overflow-hidden">
            {user ? (
              <>
                <div className="w-full flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-slate-400 tracking-wider uppercase">
                    TU AVATAR // {nickname}
                  </span>
                  <button
                    onClick={handleQuickDiceRoll}
                    disabled={isRolling}
                    className="btn-esports-ghost px-2.5 py-1 text-[11px] flex items-center gap-1.5 cursor-pointer"
                    title="Generar configuración aleatoria"
                  >
                    <DiceIcon className={`w-3.5 h-3.5 text-cyan-400 ${isRolling ? "animate-spin" : ""}`} />
                    <span>ALEATORIO</span>
                  </button>
                </div>

                {/* Avatar 2D Neón con Resplandor */}
                <div className="relative my-auto py-2">
                  <div
                    className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-[#060913] border-2 flex items-center justify-center transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                    style={{
                      borderColor: selectedColor,
                      boxShadow: `0 0 25px ${selectedColor}40`,
                    }}
                  >
                    <CyberAvatar
                      config={previewAvatar}
                      color={selectedColor}
                      size={110}
                      className={isRolling ? "animate-pulse" : ""}
                    />
                  </div>
                </div>

                {/* Presets Rápidos */}
                <div className="w-full flex flex-col gap-2.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-left">
                    ARQUETIPOS RÁPIDOS
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_ARCHETYPES.map((preset) => (
                      <button
                        key={preset.tag}
                        onClick={() => handleSelectArchetype(preset)}
                        className="p-1.5 bg-[#060913] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 flex flex-col items-center gap-1 transition-colors cursor-pointer rounded-lg group"
                        title={preset.name}
                      >
                        <CyberAvatar config={preset.config} color={preset.color} size={28} glow={false} />
                        <span className="text-[8px] font-mono font-bold text-slate-400 group-hover:text-cyan-400 truncate w-full">
                          {preset.name.split(" ")[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="my-auto flex flex-col items-center justify-center text-center gap-4 py-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.25)]">
                  <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                <div className="space-y-1 max-w-xs">
                  <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest block">
                    MODO INVITADO
                  </span>
                  <h3 className="text-sm font-black font-mono text-white uppercase tracking-wider">
                    Personalización Bloqueada
                  </h3>
                  <p className="text-xs text-slate-400 font-mono leading-relaxed pt-1">
                    Usa el botón <strong>"Acceder con Google"</strong> en la esquina superior derecha para desbloquear tu avatar y ranking.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full max-w-6xl flex justify-between items-center text-[10px] sm:text-xs font-mono text-slate-500 border-t border-white/10 pt-4 relative z-20">
        <span>HEXAGUYS PRO // BUILD 2026</span>
        <span>FIREBASE DB // WEBRTC // THREE.JS</span>
      </footer>

      {/* Modales */}
      <LeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
