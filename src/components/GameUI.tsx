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
  RobotSkinIcon,
  NinjaSkinIcon,
  AstroSkinIcon,
  AlienSkinIcon,
} from "./Icons";

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

const SKINS_LIST = [
  { id: "robot", name: "Robot", Icon: RobotSkinIcon },
  { id: "ninja", name: "Ninja", Icon: NinjaSkinIcon },
  { id: "astronaut", name: "Astronauta", Icon: AstroSkinIcon },
  { id: "alien", name: "Alien", Icon: AlienSkinIcon },
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
  const activePlayers = players.filter((p) => !p.getState("isAfk"));
  const host = isHost();
  const localPlayer = myPlayer();

  // Estados de navegación
  const [activeTab, setActiveTab] = useState<"custom" | "match" | "players">("custom");
  const [showLobbyDrawer, setShowLobbyDrawer] = useState(false);
  const [showEndCustomizer, setShowEndCustomizer] = useState(false);
  const [showPlayersMenu, setShowPlayersMenu] = useState(false);

  const currentSkin = localPlayer?.getState("skin") || "robot";
  const currentColor = localPlayer?.getState("color") || localPlayer?.getProfile()?.color?.hex || COLOR_PALETTE[0].hex;

  // Apodo
  const [nickname, setNickname] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("hexaguys_username") : null;
    return saved || localPlayer?.getState("name") || localPlayer?.getProfile()?.name || `Jugador_${Math.floor(Math.random() * 900 + 100)}`;
  });

  useEffect(() => {
    if (localPlayer) {
      if (!localPlayer.getState("name")) {
        localPlayer.setState("name", nickname);
      }
      if (!localPlayer.getState("color")) {
        localPlayer.setState("color", currentColor);
      }
      if (!localPlayer.getState("skin")) {
        const defaultSkin = host ? "robot" : "ninja";
        localPlayer.setState("skin", defaultSkin);
      }
    }
  }, [localPlayer, host, nickname, currentColor]);

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
      playStepSound();
    }
  };

  const handleSelectSkin = (skin: string) => {
    if (localPlayer) {
      localPlayer.setState("skin", skin);
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

  const CurrentSkinComponent = SKINS_LIST.find((s) => s.id === currentSkin)?.Icon || RobotSkinIcon;

  return (
    <div className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-30 select-none font-sans antialiased ${isMobile ? "mobile-game-ui" : ""}`}>
      {/* 1. BARRA SUPERIOR (Cápsulas a la izquierda, Centro despejado para notificaciones, Perfil a la derecha) */}
      <header className="flex justify-between items-center pointer-events-auto gap-3 w-full max-w-6xl mx-auto z-50">
        {/* Lado Izquierdo: Cápsulas de Estado (Sala, Pisos, Puntos) */}
        <div className="flex items-center gap-2.5 overflow-x-auto py-1">
          <div className={isMobile && gameStatus === "LOBBY" ? "flex flex-col items-start gap-1" : "contents"}>
            {/* Cápsula Naranja: Código de Sala con botón de copiar */}
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-2xl bg-[#131a33] hover:bg-[#1a2345] border border-orange-500/80 text-sm font-bold text-orange-400 hover:text-orange-300 flex items-center gap-2 shadow-[0_0_12px_rgba(249,115,22,0.25)] transition-all cursor-pointer active:scale-95"
              title="Copiar código de invitación"
            >
              <CopyIcon className="w-4 h-4 text-orange-400" />
              <span className="font-mono text-sm text-white font-bold">{getRoomCode() || "SALA"}</span>
              <span className="text-xs text-orange-400/80 uppercase font-bold tracking-wider">Copiar</span>
            </button>

            {isMobile && gameStatus === "LOBBY" && (
              <span className="max-w-36 truncate pl-1 text-[11px] font-bold text-white/80">
                {nickname || "Jugador"}
              </span>
            )}
          </div>

          {/* Cápsula Dorada: Puntuación del Jugador */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#11172f] border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <CoinIcon className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-mono text-amber-300 font-black">{localPlayer?.getState("globalScore") || 0}</span>
            <span className="text-xs text-amber-400/80 font-mono font-bold">PTS</span>
          </div>
        </div>

        {/* Lado Derecho: Perfil de Usuario y Acciones Rápidas */}
        <div className="flex items-center gap-2.5">

          {/* Botón de Lista de Jugadores */}
          <button
            onClick={() => {
              playStepSound();
              setShowPlayersMenu((prev) => !prev);
            }}
            className="w-10 h-10 rounded-2xl bg-[#131a33] hover:bg-[#1a2345] border border-[#243464] hover:border-blue-500 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shadow-md relative active:scale-95"
            title="Participantes"
          >
            <UsersIcon className="w-4.5 h-4.5" />
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-mono text-[10px] font-bold border border-[#090d1a]">
              {players.length}
            </span>
          </button>

          {/* Botón de Ajustes */}
          <button
            onClick={onToggleSettings}
            className="w-10 h-10 rounded-2xl bg-[#131a33] hover:bg-[#1a2345] border border-[#243464] hover:border-blue-500 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shadow-md active:scale-95"
            title="Ajustes del sistema"
          >
            <SettingsIcon className="w-4.5 h-4.5" />
          </button>

          {/* Menú Desplegable de Participantes (Estilo Friends / Online Panel de la Referencia) */}
          {showPlayersMenu && (
            <div className="absolute right-3 top-16 bg-[#0f152b] border border-[#243464] p-5 rounded-3xl text-slate-100 min-w-80 max-w-96 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 animate-in fade-in duration-150">
              <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-[#1b2548]">
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-4.5 h-4.5 text-cyan-400" />
                  <span className="text-sm font-mono uppercase font-black text-white">
                    Participantes ({players.length})
                  </span>
                </div>
                <button
                  onClick={() => setShowPlayersMenu(false)}
                  className="w-7 h-7 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white text-sm flex items-center justify-center cursor-pointer"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1 divide-y divide-[#182142]">
                {players.map((p) => {
                  const isAlive = p.getState("isAlive") !== false;
                  const pName = p.getState("name") || p.getProfile()?.name || "Jugador";
                  const pColor = p.getState("color") || p.getProfile()?.color?.hex || "#0284c7";
                  const score = p.getState("globalScore") || 0;
                  const skin = p.getState("skin") || "robot";
                  const SkinComp = SKINS_LIST.find((s) => s.id === skin)?.Icon || RobotSkinIcon;
                  const isAfk = Boolean(p.getState("isAfk"));

                  return (
                    <div key={p.id} className="flex justify-between items-center gap-2 pt-2 text-xs">
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-white border border-white/20 shrink-0 shadow-sm"
                          style={{ backgroundColor: pColor }}
                        >
                          <SkinComp className="w-3.5 h-3.5 text-white" />
                        </div>

                        <div className="flex flex-col truncate">
                          <span
                            className={`truncate font-bold text-xs ${
                              isAlive
                                ? isAfk
                                ? "text-amber-300 font-black"
                                : "text-white"
                                : "text-slate-500 line-through"
                            }`}
                          >
                            {pName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-medium">
                            {isAfk ? "AUSENTE / AFK" : "ACTIVO"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {host && localPlayer && p.id !== localPlayer.id && isAfk && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleKickPlayer(p.id, pName);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-bold cursor-pointer transition-all"
                          >
                            Expulsar
                          </button>
                        )}
                        <span className="text-xs font-mono font-bold text-amber-400 bg-[#141b36] px-2 py-1 rounded-lg border border-[#243464]">
                          {score} PTS
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 2. OVERLAYS EN PARTIDA Y MODALES */}
      <div className="flex-1 flex items-center justify-center pointer-events-auto my-auto relative z-40">
        {/* Countdown Overlay */}
        {gameStatus === "COUNTDOWN" && (
          <div className="bg-[#0f152b] border border-cyan-500/60 px-12 py-10 rounded-3xl flex flex-col items-center gap-3 text-white shadow-[0_0_50px_rgba(6,182,212,0.35)] animate-in zoom-in-95 duration-150">
            <span className="text-sm font-mono font-bold uppercase tracking-widest text-cyan-400">
              INICIO DE RONDA
            </span>
            <div className="text-9xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.7)]">
              {countdown}
            </div>
            <span className="text-sm text-slate-300 font-medium">
              ¡Mantén el balance y no te detengas!
            </span>
          </div>
        )}

        {/* Modal de Ajustes */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] pointer-events-auto p-4 animate-in fade-in duration-150">
            <div className="bg-[#0f152b] border border-[#243464] p-6 sm:p-7 rounded-3xl flex flex-col gap-5 max-w-sm w-full text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
              <div className="flex justify-between items-center border-b border-[#1f2a50] pb-3">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-black tracking-tight text-white uppercase font-mono">
                    Ajustes del Sistema
                  </h3>
                </div>
                <button
                  onClick={onToggleSettings}
                  className="w-6 h-6 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white text-xs flex items-center justify-center cursor-pointer"
                >
                  <CloseIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Slider de Volumen */}
              <div className="bg-[#0a0f22] border border-[#243058] p-4 rounded-2xl flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-200 font-mono">
                  <span>EFECTOS DE SONIDO</span>
                  <span className="text-cyan-400">{Math.round(volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => handleVolumeBtn(-0.1)}
                    className="w-8 h-8 rounded-xl bg-[#141c38] hover:bg-[#1b264d] text-xs font-bold text-white flex items-center justify-center cursor-pointer transition-colors"
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
                    className="flex-1 accent-cyan-400 cursor-pointer h-2 bg-[#141c38] rounded-lg appearance-none"
                  />
                  <button
                    onClick={() => handleVolumeBtn(0.1)}
                    className="w-8 h-8 rounded-xl bg-[#141c38] hover:bg-[#1b264d] text-xs font-bold text-white flex items-center justify-center cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Toggle de FPS */}
              <div className="bg-[#0a0f22] border border-[#243058] p-4 rounded-2xl flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-200 font-mono">CONTADOR DE FPS</span>
                  <span className="text-[10px] text-slate-500">Muestra la fluidez en pantalla</span>
                </div>
                <button
                  onClick={() => {
                    onToggleFps();
                    playStepSound();
                  }}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-150 cursor-pointer relative ${
                    showFps ? "bg-cyan-500" : "bg-[#141c38]"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-150 block ${
                      showFps ? "translate-x-6" : "translate-x-0"
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
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] cursor-pointer"
                >
                  Guardar y Cerrar
                </button>
                <button
                  onClick={handleLeaveGame}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOutIcon className="w-3.5 h-3.5" />
                  <span>Salir al Menú Principal</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pantalla de Fin de Ronda (Estilo Podio de Recompensas de la Referencia) */}
        {gameStatus === "ROUND_OVER" && !showSettings && (
          <div className="bg-[#0f152b] border border-amber-500/40 p-6 sm:p-8 rounded-3xl flex flex-col items-center gap-4 max-w-sm w-full text-center animate-in zoom-in-95 duration-150 text-slate-100 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <CrownIcon className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-black tracking-tight text-white uppercase font-mono">
                Ronda Finalizada
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Resultados de la partida</p>
            </div>

            {/* Ganador */}
            <div className="bg-[#0a0f22] border border-[#243058] p-4 rounded-2xl flex flex-col items-center gap-1.5 w-full shadow-inner">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest">
                GANADOR DE LA RONDA (+20 PTS)
              </span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span
                  className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                  style={{ backgroundColor: getWinnerColor() }}
                />
                <span className="text-lg font-black text-white">{getWinnerName()}</span>
              </div>
            </div>

            {/* Selector Desplegable de Personalización en Fin de Ronda */}
            <button
              onClick={() => {
                setShowEndCustomizer((prev) => !prev);
                playStepSound();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-[#141b36] hover:bg-[#1c264d] border border-[#263461] text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>{showEndCustomizer ? "Ocultar Aspecto" : "Cambiar Skin o Color"}</span>
            </button>

            {showEndCustomizer && (
              <div className="bg-[#0a0f22] border border-[#243058] p-4 rounded-2xl flex flex-col gap-3.5 w-full text-left animate-in fade-in duration-150">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono uppercase font-bold text-slate-400">Apodo:</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                    onKeyPress={(e) => e.stopPropagation()}
                    maxLength={15}
                    className="w-full px-3 py-2 rounded-xl bg-[#0f152b] border border-[#243058] focus:border-cyan-400 focus:outline-none text-white text-xs font-semibold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono uppercase font-bold text-slate-400">Skin:</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SKINS_LIST.map((s) => {
                      const Icon = s.Icon;
                      return (
                        <button
                          key={s.id}
                          onClick={() => handleSelectSkin(s.id)}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                            currentSkin === s.id
                              ? "bg-blue-600/30 border-blue-400 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                              : "bg-[#0f152b] border-[#243058] text-slate-400 hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[9px] font-bold mt-1">{s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono uppercase font-bold text-slate-400">Color:</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectColor(c.hex)}
                        className={`h-6 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                          currentColor === c.hex
                            ? "border-2 border-white scale-105 shadow-md"
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
            )}

            {/* Acciones */}
            <div className="w-full flex flex-col gap-2 pt-1">
              {host && (
                activePlayers.length >= 2 ? (
                  <button
                    onClick={onStartGame}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.6)] flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <PlayIcon className="w-4 h-4" />
                    <span>Jugar Siguiente Ronda</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full py-3 rounded-2xl text-xs font-bold text-slate-500 bg-[#0a0f22] border border-[#243058] flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    Mínimo 2 Jugadores ({activePlayers.length}/2)
                  </button>
                )
              )}

              <div className="flex gap-2 w-full">
                <button
                  onClick={handleLeaveGame}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modo Espectador */}
        {gameStatus === "PLAYING" && !isLocalAlive && !showSettings && (
          <div className="bg-[#0f152b] border border-rose-500/40 p-6 rounded-3xl flex flex-col items-center gap-3 max-w-xs text-center animate-in zoom-in-95 duration-150 text-slate-100 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <div className="flex flex-col">
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest font-mono">
                ELIMINADO
              </span>
              <span className="text-slate-400 text-xs mt-0.5">
                Modo espectador ({alivePlayers.length} en juego)
              </span>
            </div>

            <button
              onClick={handleLeaveGame}
              className="w-full py-2.5 bg-[#141b36] hover:bg-rose-600/30 border border-rose-500/30 text-rose-200 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOutIcon className="w-3.5 h-3.5" />
              <span>Salir de la Partida</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. LOBBY HUB INFERIOR (Estilo Game Tiles de la Referencia: ROULETTE / CRASH / TOWERS) */}
      {gameStatus === "LOBBY" && !showSettings && (
        <footer className="w-full max-w-5xl mx-auto flex flex-col items-center gap-3 z-40 pointer-events-auto">
          {/* Panel Desplegable de Configuración y Personalización */}
          {showLobbyDrawer && (
            <div className="w-full bg-[#0f152b] border border-[#243464] p-5 sm:p-6 rounded-3xl text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-150 flex flex-col gap-4">
              {/* Segmented Control Bar */}
              <div className="flex justify-between items-center pb-2 border-b border-[#1b2548]">
                <div className="flex p-1 rounded-2xl bg-[#0a0f22] border border-[#1f2a50] gap-1 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setActiveTab("custom");
                      playStepSound();
                    }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      activeTab === "custom"
                        ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Aspecto</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("match");
                      playStepSound();
                    }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      activeTab === "match"
                        ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <GridIcon className="w-3.5 h-3.5" />
                    <span>Arena & Pisos</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("players");
                      playStepSound();
                    }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black uppercase font-mono tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      activeTab === "players"
                        ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <UsersIcon className="w-3.5 h-3.5" />
                    <span>Jugadores ({players.length})</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowLobbyDrawer(false)}
                  className="w-7 h-7 rounded-xl bg-[#141b36] hover:bg-white/10 text-slate-400 hover:text-white text-xs flex items-center justify-center cursor-pointer ml-2"
                >
                  <CloseIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Pestaña 1: Aspecto y Skin */}
              {activeTab === "custom" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
                  {/* Apodo y Color */}
                  <div className="bg-[#0a0f22] border border-[#1f2a50] p-4 rounded-2xl flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-mono uppercase font-bold text-slate-400">Apodo del Jugador:</label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => handleNameChange(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onKeyUp={(e) => e.stopPropagation()}
                        onKeyPress={(e) => e.stopPropagation()}
                        maxLength={15}
                        className="w-full px-3 py-2 rounded-xl bg-[#0f152b] border border-[#243464] focus:border-cyan-400 focus:outline-none text-white text-xs font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-mono uppercase font-bold text-slate-400">Color del Traje:</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {COLOR_PALETTE.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleSelectColor(c.hex)}
                            className={`h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
                              currentColor === c.hex
                                ? "border-2 border-white scale-105 shadow-md"
                                : "border border-white/20 opacity-70 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {currentColor === c.hex && (
                              <CheckIcon className="w-3.5 h-3.5 text-white" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Selector de Skins (Estilo Badges de la Imagen) */}
                  <div className="bg-[#0a0f22] border border-[#1f2a50] p-4 rounded-2xl flex flex-col gap-2">
                    <label className="text-[11px] font-mono uppercase font-bold text-slate-400">Skin de Avatar:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {SKINS_LIST.map((s) => {
                        const Icon = s.Icon;
                        return (
                          <button
                            key={s.id}
                            onClick={() => handleSelectSkin(s.id)}
                            className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                              currentSkin === s.id
                                ? "bg-blue-600/25 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                                : "bg-[#0f152b] border-[#1f2a50] text-slate-400 hover:text-white"
                            }`}
                          >
                            <div className="w-8 h-8 rounded-xl bg-[#141b36] border border-[#243464] flex items-center justify-center text-white shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black uppercase font-mono">{s.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Pestaña 2: Modo y Arena (Estilo Game Cards: ROULETTE / CRASH / TOWERS) */}
              {activeTab === "match" && (
                <div className="flex flex-col gap-3.5 animate-in fade-in duration-150">
                  {/* Selector de Arena */}
                  <div className="bg-[#0a0f22] border border-[#1f2a50] p-4 rounded-2xl flex flex-col gap-2.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-mono uppercase font-bold text-slate-400">Seleccionar Arena:</label>
                      {!host && (
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">CONFIGURADO POR HOST</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {MAPS_LIST.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleSelectMap(m.id)}
                          disabled={!host}
                          className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                            mapId === m.id
                              ? "bg-gradient-to-br from-[#122b52] to-[#0f1730] border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                              : "bg-[#0f152b] border-[#1f2a50] hover:border-[#2b3a6d]"
                          } ${!host ? "cursor-default" : "cursor-pointer active:scale-95"}`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#162142] text-cyan-300 border border-[#243464]">
                              {m.badge}
                            </span>
                            {mapId === m.id && (
                              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-sm font-black text-white font-mono uppercase">{m.name}</span>
                            <span className="text-xs text-slate-400">{m.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Selector de Pisos */}
                  <div className="bg-[#0a0f22] border border-[#1f2a50] p-4 rounded-2xl flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-mono uppercase font-bold text-slate-400">Niveles de Pisos:</label>
                      <span className="text-xs text-cyan-400 font-mono font-black">{floorsCount} NIVELES</span>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5">
                      {FLOOR_OPTIONS.map((count) => (
                        <button
                          key={count}
                          onClick={() => handleSelectFloorsBtn(count)}
                          disabled={!host}
                          className={`py-2.5 rounded-xl border text-center transition-all font-mono font-bold ${
                            floorsCount === count
                              ? "bg-blue-600 border-blue-400 text-white shadow-[0_0_12px_rgba(37,99,235,0.5)]"
                              : "bg-[#0f152b] border-[#1f2a50] text-slate-400 hover:text-white"
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
                <div className="bg-[#0a0f22] border border-[#1f2a50] p-4 rounded-2xl flex flex-col gap-2 max-h-60 overflow-y-auto animate-in fade-in duration-150 divide-y divide-[#182142]">
                  <div className="flex justify-between text-[11px] font-mono uppercase font-bold text-slate-500 pb-1">
                    <span>JUGADOR</span>
                    <span>PUNTAJE</span>
                  </div>

                  {players.map((p) => {
                    const pName = p.getState("name") || p.getProfile()?.name || "Jugador";
                    const pColor = p.getState("color") || p.getProfile()?.color?.hex || "#0284c7";
                    const score = p.getState("globalScore") || 0;
                    const skin = p.getState("skin") || "robot";
                    const SkinComp = SKINS_LIST.find((s) => s.id === skin)?.Icon || RobotSkinIcon;
                    const isAfk = Boolean(p.getState("isAfk"));

                    return (
                      <div key={p.id} className="flex justify-between items-center pt-2 text-xs">
                        <div className="flex items-center gap-2.5 truncate">
                          <div
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-white border border-white/20 shrink-0 shadow-sm"
                            style={{ backgroundColor: pColor }}
                          >
                            <SkinComp className="w-3.5 h-3.5 text-white" />
                          </div>

                          <div className="flex flex-col truncate">
                            <span className="text-xs font-bold text-white truncate">{pName}</span>
                            <span className="text-[9px] font-mono text-slate-400 font-semibold uppercase">
                              {isAfk ? "AFK" : "CONECTADO"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {host && localPlayer && p.id !== localPlayer.id && isAfk && (
                            <button
                              onClick={() => handleKickPlayer(p.id, pName)}
                              className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[10px] font-bold cursor-pointer"
                            >
                              Expulsar
                            </button>
                          )}
                          <span className="text-xs font-mono font-bold text-amber-400 bg-[#141b36] px-2 py-1 rounded-lg border border-[#243464]">
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

          {/* Barra de Control Inferior: Botón de Personalizar y Comenzar Partida */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <button
              onClick={() => {
                playStepSound();
                setShowLobbyDrawer((prev) => !prev);
              }}
              className="px-5 py-3 rounded-2xl bg-[#0f152b] hover:bg-[#141b36] border border-[#243464] hover:border-cyan-400 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
            >
              <SettingsIcon className="w-4 h-4 text-cyan-400" />
              <span>{showLobbyDrawer ? "Cerrar Configuración" : "Configurar Sala & Aspecto"}</span>
            </button>

            {host ? (
              activePlayers.length >= 2 ? (
                <button
                  onClick={() => {
                    if (document.activeElement instanceof HTMLElement) {
                      document.activeElement.blur();
                    }
                    onStartGame();
                  }}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-black uppercase tracking-wider shadow-[0_0_30px_rgba(37,99,235,0.7)] border border-blue-300/50 flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                >
                  <PlayIcon className="w-4 h-4 text-white" />
                  <span>INICIAR PARTIDA</span>
                </button>
              ) : (
                <button
                  disabled
                  className="px-6 py-3.5 rounded-2xl text-xs font-bold text-slate-500 bg-[#0f152b] border border-[#1f2a50] flex items-center gap-2 cursor-not-allowed font-mono"
                  title="Se requieren al menos 2 jugadores activos"
                >
                  <span>MÍNIMO 2 JUGADORES ({activePlayers.length}/2)</span>
                </button>
              )
            ) : (
              <div className="px-5 py-3 rounded-2xl bg-[#0f152b] border border-[#243464] text-cyan-300 text-xs font-mono font-bold flex items-center gap-2 shadow-md">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>ESPERANDO QUE EL ANFITRIÓN INICIE...</span>
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

export default GameUI;
