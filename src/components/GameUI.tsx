import { useState, useEffect } from "react";
import { isHost, myPlayer } from "playroomkit";
import { playStepSound } from "../utils/sounds";

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
  onReturnToLobby?: () => void;
  // Settings props
  showSettings: boolean;
  onToggleSettings: () => void;
  showFps: boolean;
  onToggleFps: () => void;
  showPing: boolean;
  onTogglePing: () => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

const COLOR_PALETTE = [
  { id: "sky", hex: "#0a84ff", name: "Azul Pro" },
  { id: "rose", hex: "#ff375f", name: "Rosa Neón" },
  { id: "purple", hex: "#bf5af2", name: "Púrpura" },
  { id: "emerald", hex: "#30d158", name: "Esmeralda" },
  { id: "amber", hex: "#ffd60a", name: "Ámbar" },
  { id: "orange", hex: "#ff9f0a", name: "Naranja" },
  { id: "indigo", hex: "#5e5ce6", name: "Índigo" },
  { id: "teal", hex: "#64d2ff", name: "Turquesa" },
];

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
  onReturnToLobby,
  showSettings,
  onToggleSettings,
  showFps,
  onToggleFps,
  showPing,
  onTogglePing,
  volume,
  onVolumeChange,
}: GameUIProps) {
  const alivePlayers = players.filter((p) => p.getState("isAlive") !== false);
  const host = isHost();
  const localPlayer = myPlayer();
  const [showCustomizerInEnd, setShowCustomizerInEnd] = useState(false);
  
  const currentSkin = localPlayer?.getState("skin");
  const currentColor = localPlayer?.getState("color") || localPlayer?.getProfile()?.color?.hex || COLOR_PALETTE[0].hex;
  
  const [nickname, setNickname] = useState(() => {
    return localPlayer?.getState("name") || localPlayer?.getProfile()?.name || `Jugador_${Math.floor(Math.random() * 900 + 100)}`;
  });

  // Sync nickname, default color & auto-assign initial skin on mount so player is immediately ready
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
  }, [localPlayer, host]);

  // Check if all joined players have chosen a character skin
  const allPlayersHaveSkins = players.length > 0 && players.every(
    (p) => p.getState("skin") !== undefined && p.getState("skin") !== null
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    playStepSound();
    alert("¡Enlace copiado al portapapeles!");
  };

  const handleNameChange = (val: string) => {
    const clean = val.slice(0, 15);
    setNickname(clean);
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

  const floorOptions = [
    { count: 2, label: "2 Pisos", desc: "Rápida" },
    { count: 3, label: "3 Pisos", desc: "Estándar" },
    { count: 4, label: "4 Pisos", desc: "Desafío" },
    { count: 5, label: "5 Pisos", desc: "Torre" },
    { count: 6, label: "6 Pisos", desc: "Maratón" },
    { count: 7, label: "7 Pisos", desc: "Mega" },
  ];

  const getWinnerName = () => {
    if (!winnerId) return "Nadie (Empate)";
    const winner = players.find((p) => p.id === winnerId);
    return winner ? (winner.getState("name") || winner.getProfile()?.name || "Desconocido") : "Desconocido";
  };

  const getWinnerColor = () => {
    if (!winnerId) return "#ffffff";
    const winner = players.find((p) => p.id === winnerId);
    return winner?.getState("color") || winner?.getProfile()?.color?.hex || "#ffffff";
  };

  const skinsList = [
    { id: "robot", name: "Robot", icon: "🤖" },
    { id: "ninja", name: "Ninja", icon: "🥷" },
    { id: "astronaut", name: "Astro", icon: "🧑‍🚀" },
    { id: "alien", name: "Alien", icon: "👽" },
  ];

  const mapsList = [
    { id: "classic", name: "Clásico", desc: "Equilibrado" },
    { id: "tower", name: "La Torre", desc: "Vertical" },
    { id: "hourglass", name: "Embudo", desc: "Caótico" },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5 md:p-7 z-10 select-none font-sans">
      {/* TOP DYNAMIC ISLAND BAR */}
      <div className="flex justify-between items-start pointer-events-auto gap-4">
        {/* Game Brand & Action Pill */}
        <div className="ios-glass-panel p-3.5 md:p-4 rounded-[26px] flex flex-col gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-500 to-pink-500 flex items-center justify-center font-black text-white shadow-lg text-sm ring-1 ring-white/30">
              HG
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 leading-none">
                HexaGuys <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10 text-sky-300 font-semibold tracking-wider uppercase">Pro</span>
              </h1>
              <span className="text-[11px] text-white/50 font-medium tracking-tight">
                {host ? "👑 Anfitrión de Sala" : "🎮 Conectado"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="ios-btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold text-white/90 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🔗</span>
              <span>Invitar</span>
            </button>
            <button
              onClick={onToggleSettings}
              className="ios-btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold text-white/90 flex items-center gap-1.5 cursor-pointer"
            >
              <span>⚙️</span>
              <span>Ajustes</span>
            </button>
          </div>
        </div>

        {/* Live Players Widget */}
        <div className="ios-glass-panel p-3.5 md:p-4 rounded-[26px] text-white min-w-52 max-w-64">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-white/10">
            <h2 className="text-[11px] font-bold tracking-wider uppercase text-white/60">
              Jugadores ({players.length})
            </h2>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse inline-block" />
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
            {players.map((p) => {
              const isAlive = p.getState("isAlive") !== false;
              const pName = p.getState("name") || p.getProfile()?.name || "Jugador";
              const pColor = p.getState("color") || p.getProfile()?.color?.hex || "#0a84ff";
              const score = p.getState("score") || 0;
              const skin = p.getState("skin");
              
              const hasSelected = skin !== undefined && skin !== null;
              const skinIcon = hasSelected
                ? skinsList.find((s) => s.id === skin)?.icon || "🤖"
                : "❓";

              return (
                <div key={p.id} className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-3 h-3 rounded-full inline-block shrink-0 shadow-sm ring-1 ring-white/30"
                      style={{ backgroundColor: pColor }}
                    />
                    <span
                      className={`text-xs font-medium truncate ${
                        !hasSelected
                          ? "text-white/40 italic animate-pulse"
                          : isAlive
                          ? "text-white/90"
                          : "text-white/35 line-through"
                      }`}
                    >
                      {skinIcon} {pName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-lg bg-white/10 text-amber-300 ring-1 ring-white/10">
                    🏆 {score}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MIDDLE OVERLAYS / MODALS */}
      <div className="flex-1 flex items-center justify-center pointer-events-auto my-4">
        {/* Settings Menu Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 pointer-events-auto p-4">
            <div className="ios-glass-panel p-7 md:p-8 rounded-[34px] flex flex-col gap-6 max-w-sm w-full text-white animate-in fade-in zoom-in duration-200">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-white/10 flex items-center justify-center text-2xl ring-1 ring-white/20 shadow-inner">
                  ⚙️
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  Ajustes
                </h3>
                <p className="text-white/50 text-xs mt-0.5">Control de rendimiento y preferencias</p>
              </div>

              {/* Volume Slider */}
              <div className="ios-glass-card p-4 rounded-2xl flex flex-col gap-2.5">
                <div className="flex justify-between text-xs font-semibold text-white/80">
                  <span>Efectos de Sonido</span>
                  <span className="text-sky-400 font-mono font-bold">{Math.round(volume * 100)}%</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <button
                    onClick={() => handleVolumeBtn(-0.1)}
                    className="ios-btn-secondary w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs text-white"
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
                    className="flex-1 accent-sky-400 cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none"
                  />
                  <button
                    onClick={() => handleVolumeBtn(0.1)}
                    className="ios-btn-secondary w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* FPS Counter Toggle (iOS Switch) */}
              <div className="ios-glass-card p-4 rounded-2xl flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/90">Contador de FPS</span>
                  <span className="text-[10px] text-white/45">Supervisar fluidez de fotogramas</span>
                </div>
                <button
                  onClick={() => {
                    onToggleFps();
                    playStepSound();
                  }}
                  className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer relative ${
                    showFps ? "ios-toggle-on" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out block ${
                      showFps ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Ping / Latency Toggle (iOS Switch) */}
              <div className="ios-glass-card p-4 rounded-2xl flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white/90">Medidor de Ping</span>
                  <span className="text-[10px] text-white/45">Supervisar latencia de red</span>
                </div>
                <button
                  onClick={() => {
                    onTogglePing();
                    playStepSound();
                  }}
                  className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer relative ${
                    showPing ? "ios-toggle-on" : "bg-white/20"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out block ${
                      showPing ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  onClick={() => {
                    onToggleSettings();
                    playStepSound();
                  }}
                  className="ios-btn-primary w-full py-3.5 text-white font-bold rounded-2xl cursor-pointer text-xs uppercase tracking-wider"
                >
                  Continuar
                </button>
                <button
                  onClick={handleLeaveGame}
                  className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold rounded-2xl transition-all cursor-pointer text-xs active:scale-97 flex items-center justify-center gap-1.5"
                >
                  <span>🚪</span>
                  <span>Salir de la Sala</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Countdown Overlay (5-Second Countdown) */}
        {gameStatus === "COUNTDOWN" && (
          <div className="ios-glass-panel px-8 py-6 rounded-[36px] flex flex-col items-center gap-2 text-white shadow-2xl animate-in zoom-in-95 duration-200 border-amber-400/40">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-300 animate-pulse">
              ⚡ ¡Prepárense! La partida inicia en
            </span>
            <div className="text-7xl md:text-8xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]">
              {countdown}
            </div>
            <span className="text-[11px] text-white/60 font-medium">
              Ubicando jugadores en el primer piso...
            </span>
          </div>
        )}

        {/* Start Game Custom Lobby Overlay */}
        {gameStatus === "LOBBY" && !showSettings && (
          <div className="ios-glass-panel p-6 md:p-8 rounded-[36px] flex flex-col gap-6 max-w-xl w-full text-white animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-400 px-2.5 py-0.5 rounded-full bg-sky-400/10 border border-sky-400/20">
                Lobby Multiplayer
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white mt-2">
                Personaliza tu Personaje
              </h2>
              <p className="text-white/50 text-xs mt-0.5">Configura tu aspecto antes del despegue</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Name & Color */}
              <div className="ios-glass-card p-4 rounded-2xl flex flex-col gap-4">
                {/* 1. NICKNAME INPUT */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-white/70 tracking-tight">
                    Tu Apodo:
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                    onKeyPress={(e) => e.stopPropagation()}
                    placeholder="Escribe tu apodo..."
                    maxLength={15}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 focus:border-sky-400 focus:outline-none text-white text-xs font-semibold placeholder:text-white/30 transition-all shadow-inner"
                  />
                </div>

                {/* 2. COLOR PALETTE */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-white/70 tracking-tight">
                    Color de Traje:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectColor(c.hex)}
                        className={`h-9 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-sm ${
                          currentColor === c.hex
                            ? "ring-2 ring-white scale-105 shadow-md"
                            : "opacity-75 hover:opacity-100 ring-1 ring-white/20"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {currentColor === c.hex && (
                          <span className="text-white drop-shadow font-black text-xs">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Skin & Map */}
              <div className="ios-glass-card p-4 rounded-2xl flex flex-col gap-4">
                {/* 3. SKIN SELECTOR */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-white/70 tracking-tight">
                      Personaje:
                    </label>
                    {!currentSkin && (
                      <span className="text-[10px] text-rose-400 font-semibold animate-pulse">
                        Requerido
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {skinsList.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSkin(s.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                          currentSkin === s.id
                            ? "bg-sky-500/25 border-sky-400/80 text-white shadow-lg ring-1 ring-sky-400/40 scale-105"
                            : "bg-white/5 border-white/10 hover:border-white/25 text-white/60 hover:text-white"
                        }`}
                      >
                        <span className="text-2xl">{s.icon}</span>
                        <span className="text-[10px] font-medium mt-1">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. MAP SELECTOR */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-white/70 tracking-tight">
                    Arena de Combate:
                  </label>
                  {host ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      {mapsList.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => handleSelectMap(m.id)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                            mapId === m.id
                              ? "bg-indigo-500/30 border-indigo-400/80 text-white shadow-md ring-1 ring-indigo-400/40"
                              : "bg-white/5 border-white/10 hover:border-white/25 text-white/60 hover:text-white"
                          }`}
                        >
                          <span className="text-xs font-semibold">{m.name}</span>
                          <span className="text-[8px] text-white/45 mt-0.5">{m.desc}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center text-xs">
                      <span className="text-white/50">Elegido por Anfitrión:</span>
                      <span className="text-indigo-300 font-bold capitalize">
                        {mapsList.find((m) => m.id === mapId)?.name || "Clásico"}
                      </span>
                    </div>
                  )}
                </div>

                {/* 5. FLOORS COUNT SELECTOR */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-white/70 tracking-tight">
                      Pisos Disponibles:
                    </label>
                    <span className="text-[11px] text-sky-400 font-mono font-bold">
                      {floorsCount} Pisos
                    </span>
                  </div>
                  {host ? (
                    <div className="grid grid-cols-6 gap-1">
                      {floorOptions.map((f) => (
                        <button
                          key={f.count}
                          onClick={() => handleSelectFloorsBtn(f.count)}
                          className={`py-1.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                            floorsCount === f.count
                              ? "bg-sky-500/30 border-sky-400/80 text-white shadow-md ring-1 ring-sky-400/40 scale-105"
                              : "bg-white/5 border-white/10 hover:border-white/25 text-white/60 hover:text-white"
                          }`}
                          title={`${f.count} Pisos (${f.desc})`}
                        >
                          <span className="text-xs font-bold">{f.count}</span>
                          <span className="text-[7px] text-white/40 leading-none">{f.desc}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center text-xs">
                      <span className="text-white/50">Configuración:</span>
                      <span className="text-sky-300 font-bold capitalize">
                        {floorsCount} Pisos ({floorOptions.find((f) => f.count === floorsCount)?.desc || "Personalizado"})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* START BUTTON / WAITING BADGE */}
            {host ? (
              <button
                disabled={!allPlayersHaveSkins}
                onClick={() => {
                  if (document.activeElement instanceof HTMLElement) {
                    document.activeElement.blur();
                  }
                  onStartGame();
                }}
                className={`w-full py-4 rounded-2xl text-xs uppercase font-extrabold tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl ${
                  allPlayersHaveSkins
                    ? "ios-btn-primary text-white"
                    : "bg-white/5 border border-white/10 text-white/30 cursor-not-allowed"
                }`}
              >
                <span>🚀 Comenzar Partida</span>
              </button>
            ) : (
              <div className="ios-glass-card py-3.5 rounded-2xl text-amber-300 text-xs font-semibold text-center animate-pulse">
                Esperando a que el Anfitrión inicie la partida...
              </div>
            )}
          </div>
        )}

        {/* Eliminated Spectator Overlay */}
        {gameStatus === "PLAYING" && !isLocalAlive && !showSettings && (
          <div className="ios-glass-panel p-6 md:p-8 rounded-[34px] flex flex-col items-center gap-4 max-w-sm text-center animate-in zoom-in-95 duration-200 text-white pointer-events-auto border-rose-500/30">
            <div className="text-4xl animate-bounce">💀</div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-rose-400 tracking-tight">
                ¡Has caído al vacío!
              </h3>
              <p className="text-white/50 text-xs mt-1">
                Modo espectador ({alivePlayers.length} {alivePlayers.length === 1 ? "jugador restante" : "jugadores restantes"})
              </p>
            </div>

            <div className="w-full flex flex-col gap-2 mt-2">
              <button
                onClick={handleLeaveGame}
                className="w-full py-3.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-semibold rounded-2xl transition-all cursor-pointer text-xs active:scale-97 flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <span>🚪</span>
                <span>Salir de la Partida</span>
              </button>
            </div>
          </div>
        )}

        {/* Round Over Overlay */}
        {gameStatus === "ROUND_OVER" && !showSettings && (
          <div className="ios-glass-panel p-6 md:p-8 rounded-[36px] flex flex-col items-center gap-4 max-w-md w-full text-center animate-in zoom-in-95 duration-200 text-white max-h-[85vh] overflow-y-auto">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-2xl shadow-lg">
              👑
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight text-white">
                ¡Ronda Finalizada!
              </h3>
              <p className="text-white/50 text-xs mt-0.5">Resultados de la partida</p>
            </div>
            
            {/* Winner Card */}
            <div className="ios-glass-card p-3.5 rounded-2xl flex flex-col items-center gap-1.5 w-full">
              <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                Ganador de la Ronda
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full ring-2 ring-white/30 shadow"
                  style={{ backgroundColor: getWinnerColor() }}
                />
                <span className="text-base font-bold text-white">{getWinnerName()}</span>
              </div>
            </div>

            {/* Inline Customizer Toggle */}
            <button
              onClick={() => {
                setShowCustomizerInEnd((prev) => !prev);
                playStepSound();
              }}
              className="ios-btn-secondary w-full py-2.5 px-3 rounded-2xl text-xs font-semibold text-sky-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <span>🎨</span>
              <span>{showCustomizerInEnd ? "Ocultar Personalización" : "Cambiar Nombre, Personaje o Traje"}</span>
              <span className="text-[10px]">{showCustomizerInEnd ? "▲" : "▼"}</span>
            </button>

            {/* Expandable Customizer Section */}
            {showCustomizerInEnd && (
              <div className="ios-glass-card p-4 rounded-2xl flex flex-col gap-4 w-full text-left animate-in fade-in zoom-in-95 duration-150">
                {/* 1. Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-white/70">
                    Tu Apodo:
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onKeyDown={(e) => e.stopPropagation()}
                    onKeyUp={(e) => e.stopPropagation()}
                    onKeyPress={(e) => e.stopPropagation()}
                    placeholder="Escribe tu apodo..."
                    maxLength={15}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 focus:border-sky-400 focus:outline-none text-white text-xs font-semibold"
                  />
                </div>

                {/* 2. Color Palette */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-white/70">
                    Color de Traje:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectColor(c.hex)}
                        className={`h-7 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                          currentColor === c.hex
                            ? "ring-2 ring-white scale-105 shadow"
                            : "opacity-75 hover:opacity-100 ring-1 ring-white/20"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {currentColor === c.hex && (
                          <span className="text-white drop-shadow font-black text-[10px]">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Skin Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-white/70">
                    Personaje:
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {skinsList.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSkin(s.id)}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer ${
                          currentSkin === s.id
                            ? "bg-sky-500/25 border-sky-400/80 text-white ring-1 ring-sky-400/40"
                            : "bg-white/5 border-white/10 hover:border-white/25 text-white/60 hover:text-white"
                        }`}
                      >
                        <span className="text-xl">{s.icon}</span>
                        <span className="text-[9px] font-medium mt-0.5">{s.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Host Arena / Floor settings */}
                {host && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-white/70">
                        Arena:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {mapsList.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => handleSelectMap(m.id)}
                            className={`p-1.5 rounded-xl border text-center transition-all cursor-pointer ${
                              mapId === m.id
                                ? "bg-indigo-500/30 border-indigo-400/80 text-white ring-1 ring-indigo-400/40"
                                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                            }`}
                          >
                            <span className="text-xs font-semibold">{m.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-semibold text-white/70">
                          Pisos:
                        </label>
                        <span className="text-[11px] text-sky-400 font-mono font-bold">
                          {floorsCount} Pisos
                        </span>
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {floorOptions.map((f) => (
                          <button
                            key={f.count}
                            onClick={() => handleSelectFloorsBtn(f.count)}
                            className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
                              floorsCount === f.count
                                ? "bg-sky-500/30 border-sky-400/80 text-white scale-105"
                                : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                            }`}
                          >
                            <span className="text-xs font-bold">{f.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-2 pt-1">
              {host && (
                <button
                  onClick={onStartGame}
                  className="ios-btn-primary w-full py-3.5 text-white font-bold rounded-2xl uppercase tracking-wider text-xs cursor-pointer shadow-lg"
                >
                  🚀 Jugar Siguiente Ronda
                </button>
              )}
              {host && onReturnToLobby && (
                <button
                  onClick={() => {
                    onReturnToLobby();
                    playStepSound();
                  }}
                  className="ios-btn-secondary w-full py-2.5 text-sky-300 font-semibold rounded-2xl transition-all cursor-pointer uppercase tracking-wider text-xs flex items-center justify-center gap-1.5"
                >
                  <span>🏠</span>
                  <span>Volver a la Sala de Espera</span>
                </button>
              )}
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => {
                    onToggleSettings();
                    playStepSound();
                  }}
                  className="ios-btn-secondary flex-1 py-2.5 text-white/80 font-semibold rounded-2xl transition-all cursor-pointer uppercase tracking-wider text-xs flex items-center justify-center gap-1.5"
                >
                  <span>⚙️</span>
                  <span>Ajustes</span>
                </button>
                <button
                  onClick={handleLeaveGame}
                  className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold rounded-2xl transition-all cursor-pointer uppercase tracking-wider text-xs flex items-center justify-center gap-1.5"
                >
                  <span>🚪</span>
                  <span>Salir</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM DOCK */}
      <div className="flex justify-between items-end pointer-events-none">
        <div className="flex items-center gap-2.5">
          <div className="ios-pill px-4 py-2 rounded-full text-white/70 text-[11px] font-medium max-w-sm flex items-center gap-1.5 shadow-lg">
            <strong className="text-sky-400 font-semibold">WASD</strong> caminar •{" "}
            <strong className="text-sky-400 font-semibold">Shift</strong> correr •{" "}
            <strong className="text-sky-400 font-semibold">Espacio</strong> saltar •{" "}
            <strong className="text-sky-400 font-semibold">ESC</strong> menú
          </div>

          {gameStatus === "PLAYING" && (
            <div className="ios-pill px-3.5 py-2 rounded-full text-white text-xs flex items-center gap-2 font-mono shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] inline-block animate-pulse" />
              <span className="text-white/60 text-[11px] font-sans">Vivos:</span>
              <span className="text-emerald-400 font-bold">{alivePlayers.length}</span>
              <span className="text-white/30">/</span>
              <span>{players.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameUI;
