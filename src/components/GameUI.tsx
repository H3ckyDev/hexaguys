import { useState, useEffect } from "react";
import { isHost, myPlayer, getRoomCode, RPC } from "playroomkit";
import { sileo } from "sileo";
import { playStepSound } from "../utils/sounds";
import {
  CopyIcon,
  UsersIcon,
  SettingsIcon,
  PlayIcon,
  CrownIcon,
  LogOutIcon,
  CheckIcon,
  CloseIcon,
  GridIcon,
  UserIcon,
  CoinIcon,
  TrophyIcon,
  DiceIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./Icons";
import { LeaderboardModal } from "./LeaderboardModal";
import { CyberAvatar } from "./CyberAvatar";
import {
  type AvatarConfig,
  generateRandomAvatar,
  serializeAvatar,
  deserializeAvatar,
  normalizeColor,
  HEAD_NAMES,
  EYES_NAMES,
  MOUTH_NAMES,
  ACCESSORY_NAMES,
  TOTAL_HEADS,
  TOTAL_EYES,
  TOTAL_MOUTHS,
  TOTAL_ACCESSORIES,
} from "../utils/avatarGenerator";

interface GameUIProps {
  players: any[];
  gameStatus: "LOBBY" | "COUNTDOWN" | "PLAYING" | "ROUND_OVER";
  countdown: number;
  winnerId: string | null;
  mapId: string;
  floorsCount: number;
  onSelectMap: (mapId: string) => void;
  onSelectFloors: (count: number) => void;
  onStartGame: () => void;
  showSettings: boolean;
  onToggleSettings: () => void;
  showFps: boolean;
  onToggleFps: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMobile?: boolean;
}

const COLOR_PALETTE = [
  { id: "sky", hex: "#0284c7", name: "Azul" },
  { id: "emerald", hex: "#059669", name: "Esmeralda" },
  { id: "indigo", hex: "#4f46e5", name: "Índigo" },
  { id: "rose", hex: "#e11d48", name: "Rosa" },
  { id: "amber", hex: "#d97706", name: "Ámbar" },
  { id: "purple", hex: "#9333ea", name: "Púrpura" },
  { id: "teal", hex: "#0d9488", name: "Turquesa" },
  { id: "slate", hex: "#475569", name: "Pizarra" },
];

const MAPS_LIST = [
  { id: "classic", name: "CLÁSICO", desc: "Equilibrado", badge: "Estándar" },
  { id: "tower", name: "LA TORRE", desc: "Supervivencia Vertical", badge: "Vertical" },
  { id: "hourglass", name: "EMBUDO", desc: "Colapso Rápido", badge: "Caótico" },
];

const FLOOR_OPTIONS = [2, 3, 4, 5, 6, 7];

export function GameUI({
  players,
  gameStatus,
  countdown,
  winnerId,
  mapId,
  floorsCount,
  onSelectMap,
  onSelectFloors,
  onStartGame,
  showSettings,
  onToggleSettings,
  showFps,
  onToggleFps,
  volume,
  onVolumeChange,
  isMobile = false,
}: GameUIProps) {
  const alivePlayers = players.filter((p) => p.getState("isAlive") !== false);
  const host = isHost();
  const localPlayer = myPlayer();

  // Estados de navegación
  const [activeTab, setActiveTab] = useState<"custom" | "match" | "players">("custom");
  const [showLobbyDrawer, setShowLobbyDrawer] = useState(false);
  const [showPlayersMenu, setShowPlayersMenu] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const currentColor = normalizeColor(
    localPlayer?.getState("color") || localPlayer?.getProfile()?.color || COLOR_PALETTE[0].hex
  );

  // Estado del Avatar Procedural
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("hexaguys_avatar_config") : null;
    return deserializeAvatar(saved, currentColor);
  });

  // Apodo
  const [nickname, setNickname] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("hexaguys_username") : null;
    return saved || localPlayer?.getState("name") || localPlayer?.getProfile()?.name || `Jugador_${Math.floor(Math.random() * 900 + 100)}`;
  });

  const updateAvatar = (newConfig: AvatarConfig) => {
    setAvatarConfig(newConfig);
    const serialized = serializeAvatar(newConfig);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hexaguys_avatar_config", serialized);
      } catch (e) {
        console.warn("Error al persistir avatar:", e);
      }
    }
    if (localPlayer) {
      localPlayer.setState("avatar", serialized);
    }
  };

  const [isRolling, setIsRolling] = useState(false);

  const handleRandomizeAvatar = () => {
    playStepSound();
    setIsRolling(true);
    const randomConfig = generateRandomAvatar(currentColor);
    updateAvatar(randomConfig);
    setTimeout(() => setIsRolling(false), 450);
    sileo.success({
      title: "Rostro Aleatorizado",
      description: "¡Nuevo avatar generado con éxito!",
    });
  };

  const handleStepLayer = (layer: "head" | "eyes" | "mouth" | "accessory", delta: number) => {
    playStepSound();
    let total = TOTAL_HEADS;
    if (layer === "eyes") total = TOTAL_EYES;
    if (layer === "mouth") total = TOTAL_MOUTHS;
    if (layer === "accessory") total = TOTAL_ACCESSORIES;

    const currentVal = avatarConfig[layer];
    const nextVal = (currentVal + delta + total) % total;
    updateAvatar({
      ...avatarConfig,
      [layer]: nextVal,
    });
  };

  useEffect(() => {
    if (localPlayer) {
      if (!localPlayer.getState("name")) {
        localPlayer.setState("name", nickname);
      }
      if (!localPlayer.getState("color")) {
        localPlayer.setState("color", currentColor);
      }
      if (!localPlayer.getState("avatar")) {
        localPlayer.setState("avatar", serializeAvatar(avatarConfig));
      }
    }
  }, [localPlayer, nickname, currentColor, avatarConfig]);

  const handleCopyLink = async () => {
    const code = getRoomCode() || new URLSearchParams(window.location.search).get("r");
    const inviteUrl = code
      ? `${window.location.origin}${window.location.pathname}?r=${code}`
      : window.location.href;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      playStepSound();
      sileo.success({
        title: "Enlace copiado",
        description: `Código de sala: ${code || "activo"}. Compártelo para invitar.`,
      });
    } catch {
      sileo.error({
        title: "Error al copiar",
        description: "Copia la URL manualmente desde la barra de direcciones.",
      });
    }
  };

  const handleKickPlayer = (targetId: string, targetName: string) => {
    if (!host) return;
    playStepSound();
    RPC.call("kickPlayer", { targetId, targetName }, RPC.Mode.ALL);
  };

  const handleNameChange = (val: string) => {
    const clean = val.slice(0, 15);
    setNickname(clean);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("hexaguys_username", clean);
      } catch (e) {
        console.warn("Error al persistir apodo:", e);
      }
    }
    if (localPlayer) {
      localPlayer.setState("name", clean || "Jugador");
    }
  };

  const handleSelectColor = (hex: string) => {
    if (localPlayer) {
      localPlayer.setState("color", hex);
      updateAvatar({ ...avatarConfig, color: hex });
      playStepSound();
    }
  };

  const handleSelectMap = (map: string) => {
    if (host) {
      onSelectMap(map);
      playStepSound();
    }
  };

  const handleSelectFloorsBtn = (count: number) => {
    if (host) {
      onSelectFloors(count);
      playStepSound();
    }
  };

  const handleVolumeBtn = (change: number) => {
    const newVol = Math.max(0, Math.min(1, volume + change));
    onVolumeChange(newVol);
    playStepSound();
  };

  const handleLeaveGame = () => {
    playStepSound();
    window.location.href = window.location.origin + window.location.pathname;
  };

  const isLocalAlive = localPlayer ? localPlayer.getState("isAlive") !== false : true;

  const getWinnerName = () => {
    if (!winnerId) return "Empate";
    const winner = players.find((p) => p.id === winnerId);
    return winner ? (winner.getState("name") || winner.getProfile()?.name || "Desconocido") : "Desconocido";
  };

  const getWinnerColor = () => {
    if (!winnerId) return "#ffffff";
    const winner = players.find((p) => p.id === winnerId);
    return winner?.getState("color") || winner?.getProfile()?.color?.hex || "#ffffff";
  };

  return (
    <div className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-30 select-none font-sans antialiased ${isMobile ? "mobile-game-ui" : ""}`}>
      {/* 1. BARRA SUPERIOR HUD VISOR */}
      <header className="flex justify-between items-center pointer-events-auto gap-3 w-full max-w-6xl mx-auto z-50">
        {/* Lado Izquierdo: Código de Sala y Puntuación Tabular */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {/* Código de Sala con Botón de Copiar */}
          <button
            onClick={handleCopyLink}
            className="btn-esports-ghost px-3.5 py-2 text-xs font-mono flex items-center gap-2 cursor-pointer"
            title="Copiar código de invitación"
          >
            <CopyIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white font-black">{getRoomCode() || "SALA"}</span>
            <span className="text-[10px] text-cyan-300 uppercase tracking-wider hidden sm:inline-block">COPIAR</span>
          </button>

          {/* Cápsula Dorada: Puntuación Tabular del Jugador */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0d18] border border-amber-500/40 rounded-[0.25rem]">
            <CoinIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-mono text-amber-300 font-black tabular-nums">{localPlayer?.getState("globalScore") || 0}</span>
            <span className="text-[10px] text-amber-400/80 font-mono font-bold">PTS</span>
          </div>

          {/* Durante la Partida: Indicador Central de Supervivientes */}
          {gameStatus === "PLAYING" && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[#070a14] border border-cyan-500/50 rounded-[0.25rem]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-xs font-mono text-cyan-300 font-black tabular-nums">
                {alivePlayers.length} / {players.length}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold hidden sm:inline-block">VIVOS</span>
            </div>
          )}
        </div>

        {/* Lado Derecho: Ranking, Participantes y Ajustes */}
        <div className="flex items-center gap-2 relative">
          {/* Botón de Tabla de Clasificación / Ranking */}
          <button
            onClick={() => {
              playStepSound();
              setShowLeaderboard(true);
            }}
            className="btn-esports-gold px-3.5 py-2 flex items-center gap-2 text-xs cursor-pointer"
            title="Ver Tabla de Clasificación"
          >
            <TrophyIcon className="w-3.5 h-3.5 text-black" />
            <span className="hidden sm:inline-block font-black">RANKING</span>
          </button>

          {/* Botón de Lista de Jugadores */}
          <button
            onClick={() => {
              playStepSound();
              setShowPlayersMenu((prev) => !prev);
            }}
            className={`btn-esports-ghost w-9 h-9 flex items-center justify-center cursor-pointer relative ${
              showPlayersMenu ? "border-cyan-400 bg-cyan-950/40 text-white" : ""
            }`}
            title="Participantes"
          >
            <UsersIcon className="w-4 h-4 text-cyan-400" />
            <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-sm bg-cyan-500 text-black font-mono text-[9px] font-black tabular-nums">
              {players.length}
            </span>
          </button>

          {/* Botón de Ajustes */}
          <button
            onClick={onToggleSettings}
            className="btn-esports-ghost w-9 h-9 flex items-center justify-center cursor-pointer"
            title="Ajustes del sistema"
          >
            <SettingsIcon className="w-4 h-4 text-slate-300" />
          </button>

          {/* Menú Desplegable de Participantes Anclado Directamente */}
          {showPlayersMenu && (
            <div className="absolute! right-0 top-full mt-2.5 stealth-panel w-80 sm:w-96 z-50 animate-in fade-in zoom-in-95 duration-150 p-4 shadow-[0_15px_40px_rgba(0,0,0,0.9)]">
              <div className="flex flex-col gap-3 text-slate-100">
                <div className="flex justify-between items-center pb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono uppercase font-black text-white">
                      PARTICIPANTES ({players.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPlayersMenu(false)}
                    className="w-6 h-6 bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs cursor-pointer"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
                  {players.map((p) => {
                    const isAlive = p.getState("isAlive") !== false;
                    const pName = p.getState("name") || p.getProfile()?.name || "Jugador";
                    const pColor = p.getState("color") || p.getProfile()?.color?.hex || "#00f0ff";
                    const score = p.getState("globalScore") || 0;
                    const pAvatar = p.getState("avatar") || p.getState("skin");
                    const isAfk = Boolean(p.getState("isAfk"));
                    const isMe = localPlayer && p.id === localPlayer.id;

                    return (
                      <div key={p.id} className="flex justify-between items-center gap-2.5 p-2.5 bg-[#060912] border border-white/10 text-xs">
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="w-8 h-8 bg-[#090d1a] border border-white/10 flex items-center justify-center shrink-0">
                            <CyberAvatar
                              config={pAvatar}
                              seed={pName}
                              color={pColor}
                              size={28}
                            />
                          </div>

                          <div className="flex flex-col truncate text-left">
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className={`truncate font-bold text-xs font-mono ${
                                  isAlive
                                    ? isAfk
                                    ? "text-amber-300"
                                    : "text-white"
                                    : "text-slate-500 line-through"
                                }`}
                              >
                                {pName}
                              </span>
                              {isMe && (
                                <span className="text-[9px] font-mono text-cyan-400 font-bold">(Tú)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-mono">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAfk ? "bg-amber-400" : "bg-emerald-400"
                                }`}
                              />
                              <span className="text-slate-400">
                                {isAfk ? "AUSENTE" : "ACTIVO"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {host && localPlayer && p.id !== localPlayer.id && isAfk && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleKickPlayer(p.id, pName);
                              }}
                              className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[9px] font-mono font-bold cursor-pointer"
                            >
                              EXPULSAR
                            </button>
                          )}
                          <span className="text-xs font-mono font-bold text-amber-400 bg-[#0c1020] px-2 py-0.5 border border-white/10 tabular-nums">
                            {score} PTS
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. OVERLAYS EN PARTIDA Y MODALES */}
      <div className="flex-1 flex items-center justify-center pointer-events-auto my-auto relative z-40">
        {/* Countdown Overlay */}
        {gameStatus === "COUNTDOWN" && (
          <div className="stealth-panel p-8 sm:p-10 flex flex-col items-center gap-2 text-white animate-in zoom-in-95 duration-150">
            <span className="text-xs font-mono font-black uppercase tracking-widest text-cyan-400">
              PREPARADOS PARA LA CAÍDA
            </span>
            <div className="text-8xl sm:text-9xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_35px_rgba(0,240,255,0.8)] tabular-nums animate-pulse">
              {countdown}
            </div>
            <span className="text-xs text-slate-400 font-mono">
              ¡DOMINA EL SALTO Y NO TE DETENGAS!
            </span>
          </div>
        )}

        {/* Modal de Ajustes */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-[100] pointer-events-auto p-4 animate-in fade-in duration-150">
            <div className="stealth-panel max-w-sm w-full p-6 flex flex-col gap-4 text-slate-100">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-black tracking-tight text-white uppercase font-mono">
                    AJUSTES DEL SISTEMA
                  </h3>
                </div>
                <button
                  onClick={onToggleSettings}
                  className="w-6 h-6 bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs cursor-pointer"
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
                  />
                  <button
                    onClick={() => handleVolumeBtn(0.1)}
                    className="btn-esports-ghost w-7 h-7 text-xs font-bold flex items-center justify-center cursor-pointer"
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
                    onToggleSettings();
                    playStepSound();
                  }}
                  className="btn-esports-primary w-full py-2.5 text-xs cursor-pointer"
                >
                  GUARDAR Y VOLVER
                </button>
                <button
                  onClick={handleLeaveGame}
                  className="btn-esports-danger w-full py-2 text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOutIcon className="w-3.5 h-3.5" />
                  <span>SALIR AL MENÚ PRINCIPAL</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pantalla de Fin de Ronda (Estilo Torneo Esports) */}
        {gameStatus === "ROUND_OVER" && !showSettings && (
          <div className="stealth-panel max-w-sm w-full p-6 sm:p-7 flex flex-col items-center gap-4 text-center text-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(255,208,0,0.4)]">
              <CrownIcon className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black uppercase font-mono tracking-tight text-white">
                RONDA FINALIZADA
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">SOBREVIVIENTE SUPREMO DE LA ARENA</p>
            </div>

            {/* Ganador */}
            <div className="bg-[#050811] border border-amber-500/40 p-4 rounded-[0.25rem] flex flex-col items-center gap-1 w-full">
              <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest">
                CAMPEÓN (+20 PTS)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/60"
                  style={{ backgroundColor: getWinnerColor() }}
                />
                <span className="text-base font-black font-mono text-white tracking-tight">{getWinnerName()}</span>
              </div>
            </div>

            {/* Botón Siguiente Ronda para Host / Espera y Acceso al Taller */}
            <div className="w-full flex flex-col gap-2 pt-1">
              {host ? (
                <button
                  onClick={onStartGame}
                  className="btn-esports-primary w-full py-3 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.35)]"
                >
                  <PlayIcon className="w-4 h-4 fill-current" />
                  <span>SIGUIENTE RONDA</span>
                </button>
              ) : (
                <div className="px-4 py-2.5 bg-[#070b18] border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>ESPERANDO AL ANFITRIÓN...</span>
                </div>
              )}

              {/* Botón para abrir el Taller de Personalización / Configuración de Sala */}
              <button
                onClick={() => {
                  playStepSound();
                  setShowLobbyDrawer((prev) => !prev);
                }}
                className="btn-esports-ghost w-full py-2.5 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showLobbyDrawer ? "CERRAR TALLER" : "CONFIGURAR SALA // TALLER"}</span>
              </button>

              <button
                onClick={handleLeaveGame}
                className="w-full py-1 text-[11px] text-slate-400 hover:text-rose-400 font-mono transition-colors cursor-pointer"
              >
                Salir de la Sala
              </button>
            </div>
          </div>
        )}

        {/* Modo Espectador */}
        {gameStatus === "PLAYING" && !isLocalAlive && !showSettings && (
          <div className="stealth-panel max-w-xs w-full p-5 flex flex-col items-center gap-3 text-center text-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex flex-col">
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest font-mono">
                ELIMINADO
              </span>
              <span className="text-slate-400 text-xs font-mono mt-0.5">
                Modo espectador ({alivePlayers.length} en juego)
              </span>
            </div>

            <button
              onClick={handleLeaveGame}
              className="btn-esports-danger w-full py-2 text-xs font-mono cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOutIcon className="w-3.5 h-3.5" />
              <span>Salir de la Partida</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. LOBBY HUB & TALLER INFERIOR */}
      {(gameStatus === "LOBBY" || gameStatus === "ROUND_OVER") && !showSettings && (
        <footer className="w-full max-w-5xl mx-auto flex flex-col items-center gap-3 z-40 pointer-events-auto overflow-auto">
          {/* Panel Desplegable de Configuración y Personalización */}
          {showLobbyDrawer && (
            <div className="stealth-panel w-full p-5 sm:p-6 text-slate-100 flex flex-col gap-4 animate-in slide-in-from-bottom duration-150">
              {/* Segmented Control Bar */}
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <div className="flex p-1 bg-[#050811] border border-white/10 gap-1 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setActiveTab("custom");
                      playStepSound();
                    }}
                    className={`btn-esports-tab ${
                      activeTab === "custom" ? "btn-esports-tab-active" : "btn-esports-tab-inactive"
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5 inline mr-1" />
                    <span>ASPECTO</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("match");
                      playStepSound();
                    }}
                    className={`btn-esports-tab ${
                      activeTab === "match" ? "btn-esports-tab-active" : "btn-esports-tab-inactive"
                    }`}
                  >
                    <GridIcon className="w-3.5 h-3.5 inline mr-1" />
                    <span>ARENA & PISOS</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("players");
                      playStepSound();
                    }}
                    className={`btn-esports-tab ${
                      activeTab === "players" ? "btn-esports-tab-active" : "btn-esports-tab-inactive"
                    }`}
                  >
                    <UsersIcon className="w-3.5 h-3.5 inline mr-1" />
                    <span>JUGADORES ({players.length})</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowLobbyDrawer(false)}
                  className="w-6 h-6 bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center text-xs cursor-pointer ml-2"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Pestaña 1: Aspecto y Personalizador de Avatar */}
              {activeTab === "custom" && (
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
                      onClick={handleRandomizeAvatar}
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
                        onChange={(e) => handleNameChange(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                        onKeyPress={(e) => e.stopPropagation()}
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
                            onClick={() => handleSelectColor(c.hex)}
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

                    {/* 1. Casco / Base */}
                    <div className="flex items-center justify-between p-2 bg-[#080c16] border border-white/10">
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">1. CASCO / BASE</span>
                        <span className="text-xs font-bold text-white font-mono">{HEAD_NAMES[avatarConfig.head]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStepLayer("head", -1)}
                          className="btn-esports-ghost w-7 h-7 flex items-center justify-center cursor-pointer"
                        >
                          <ChevronLeftIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStepLayer("head", 1)}
                          className="btn-esports-ghost w-7 h-7 flex items-center justify-center cursor-pointer"
                        >
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 2. Ojos LED */}
                    <div className="flex items-center justify-between p-2 bg-[#080c16] border border-white/10">
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">2. OJOS // VISOR LED</span>
                        <span className="text-xs font-bold text-white font-mono">{EYES_NAMES[avatarConfig.eyes]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStepLayer("eyes", -1)}
                          className="btn-esports-ghost w-7 h-7 flex items-center justify-center cursor-pointer"
                        >
                          <ChevronLeftIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStepLayer("eyes", 1)}
                          className="btn-esports-ghost w-7 h-7 flex items-center justify-center cursor-pointer"
                        >
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 3. Boca / Sensor */}
                    <div className="flex items-center justify-between p-2 bg-[#080c16] border border-white/10">
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">3. BOCA // REJILLA</span>
                        <span className="text-xs font-bold text-white font-mono">{MOUTH_NAMES[avatarConfig.mouth]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStepLayer("mouth", -1)}
                          className="btn-esports-ghost w-7 h-7 flex items-center justify-center cursor-pointer"
                        >
                          <ChevronLeftIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStepLayer("mouth", 1)}
                          className="btn-esports-ghost w-7 h-7 flex items-center justify-center cursor-pointer"
                        >
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 4. Accesorios */}
                    <div className="flex items-center justify-between p-2 bg-[#080c16] border border-white/10">
                      <div className="flex flex-col text-left">
                        <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">4. ACCESORIO // ANTENAS</span>
                        <span className="text-xs font-bold text-white font-mono">{ACCESSORY_NAMES[avatarConfig.accessory]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStepLayer("accessory", -1)}
                          className="btn-esports-ghost w-7 h-7 flex items-center justify-center cursor-pointer"
                        >
                          <ChevronLeftIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleStepLayer("accessory", 1)}
                          className="btn-esports-ghost w-7 h-7 flex items-center justify-center cursor-pointer"
                        >
                          <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña 2: Modo y Arena */}
              {activeTab === "match" && (
                <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
                  {/* Selector de Arena */}
                  <div className="bg-[#050811] border border-white/10 p-4 flex flex-col gap-2.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase font-bold text-slate-400">SELECCIONAR ARENA:</label>
                      {!host && (
                        <span className="text-[9px] font-mono text-cyan-400 font-bold">CONFIGURADO POR ANFITRIÓN</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {MAPS_LIST.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleSelectMap(m.id)}
                          disabled={!host}
                          className={`p-3.5 border text-left transition-all flex flex-col justify-between gap-2.5 ${
                            mapId === m.id
                              ? "bg-[#0b1428] border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                              : "bg-[#080c16] border-white/10 hover:border-white/25"
                          } ${!host ? "cursor-default" : "cursor-pointer active:scale-95"}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-[#101930] text-cyan-300 border border-white/10">
                              {m.badge}
                            </span>
                            {mapId === m.id && (
                              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-ping" />
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-xs font-black text-white font-mono uppercase">{m.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{m.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de Pisos */}
                  <div className="bg-[#050811] border border-white/10 p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono uppercase font-bold text-slate-400">NIVELES DE PISOS:</label>
                      <span className="text-xs text-cyan-400 font-mono font-black">{floorsCount} NIVELES</span>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5">
                      {FLOOR_OPTIONS.map((count) => (
                        <button
                          key={count}
                          onClick={() => handleSelectFloorsBtn(count)}
                          disabled={!host}
                          className={`py-2 border text-center transition-all font-mono font-bold ${
                            floorsCount === count
                              ? "bg-cyan-500 border-cyan-300 text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                              : "bg-[#080c16] border-white/10 text-slate-400 hover:text-white"
                          } ${!host ? "cursor-default" : "cursor-pointer active:scale-95"}`}
                        >
                          <span className="text-xs">{count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña 3: Jugadores */}
              {activeTab === "players" && (
                <div className="bg-[#050811] border border-white/10 p-4 flex flex-col gap-1.5 max-h-60 overflow-y-auto animate-in fade-in duration-150">
                  <div className="flex justify-between text-[10px] font-mono uppercase font-bold text-slate-500 pb-1 border-b border-white/5">
                    <span>JUGADOR</span>
                    <span>PUNTAJE</span>
                  </div>

                  {players.map((p) => {
                    const pName = p.getState("name") || p.getProfile()?.name || "Jugador";
                    const pColor = p.getState("color") || p.getProfile()?.color?.hex || "#00f0ff";
                    const score = p.getState("globalScore") || 0;
                    const pAvatar = p.getState("avatar") || p.getState("skin");
                    const isAfk = Boolean(p.getState("isAfk"));

                    return (
                      <div key={p.id} className="flex justify-between items-center p-2 bg-[#080c16] border border-white/5 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <CyberAvatar
                              config={pAvatar}
                              seed={pName}
                              color={pColor}
                              size={24}
                            />
                          </div>

                          <div className="flex flex-col truncate text-left">
                            <span className="text-xs font-bold text-white truncate font-mono">{pName}</span>
                            <span className="text-[8px] font-mono text-slate-500 uppercase">
                              {isAfk ? "AFK" : "CONECTADO"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {host && localPlayer && p.id !== localPlayer.id && isAfk && (
                            <button
                              onClick={() => handleKickPlayer(p.id, pName)}
                              className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[9px] font-mono font-bold cursor-pointer"
                            >
                              EXPULSAR
                            </button>
                          )}
                          <span className="text-xs font-mono font-bold text-amber-400 bg-[#0c1020] px-2 py-0.5 border border-white/10 tabular-nums">
                            {score} PTS
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Barra de Control Inferior: Botón de Personalizar y Comenzar Partida (En LOBBY) */}
          {gameStatus === "LOBBY" && (
            <div className="flex flex-col items-center justify-center gap-2.5 w-full max-w-xs sm:max-w-sm mx-auto">
              {/* 1. Botón Principal de Partida */}
              {host ? (
                <button
                  onClick={() => {
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                    onStartGame();
                  }}
                  className="btn-esports-primary w-full py-3 text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.35)]"
                >
                  <PlayIcon className="w-4 h-4 fill-current" />
                  <span>
                    {players.length > 1 ? `INICIAR PARTIDA (${players.length} JUGADORES)` : "INICIAR PARTIDA"}
                  </span>
                </button>
              ) : (
                <div className="w-full py-2.5 bg-[#070a14] border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>ESPERANDO QUE EL ANFITRIÓN INICIE...</span>
                </div>
              )}

              {/* 2. Botón Secundario de Taller */}
              <button
                onClick={() => {
                  playStepSound();
                  setShowLobbyDrawer((prev) => !prev);
                }}
                className="btn-esports-ghost w-full py-2.5 text-xs font-mono flex items-center justify-center gap-2 cursor-pointer"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showLobbyDrawer ? "CERRAR TALLER" : "CONFIGURAR SALA // TALLER"}</span>
              </button>
            </div>
          )}
        </footer>
      )}

      {/* 5. MODAL DE CLASIFICACIÓN / LEADERBOARD */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentNickname={nickname}
      />
    </div>
  );
}

export default GameUI;

