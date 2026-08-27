import { useState, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import { onPlayerJoin, isHost, setState, getState, RPC, myPlayer, getRoomCode } from "playroomkit";
import { initPlayroom } from "./playroom";
import { GameScene } from "./components/GameScene";
import { GameUI } from "./components/GameUI";
import { LandingPage } from "./components/LandingPage";
import { playWinSound, playFallSound, playStepSound, playChatSound, setGlobalVolume, getGlobalVolume } from "./utils/sounds";
import { PerformanceHUD } from "./components/PerformanceHUD";
import { ChatOverlay, type ChatMessage } from "./components/ChatOverlay";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
  { name: "sprint", keys: ["ShiftLeft", "ShiftRight"] },
];

function getRoomCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  
  // 1. Parámetros de consulta en URL (?r=abcd, ?room=abcd, ?roomCode=abcd)
  const searchParams = new URLSearchParams(window.location.search);
  const searchRoom = searchParams.get("r") || searchParams.get("room") || searchParams.get("roomCode");
  if (searchRoom && searchRoom.trim()) return searchRoom.trim();

  // 2. Parámetros de hash (#r=abcd, #room=abcd)
  if (window.location.hash) {
    const hashMatch = window.location.hash.match(/[?&#]r(?:oom)?=([^&]+)/i);
    if (hashMatch && hashMatch[1]) return hashMatch[1].trim();
  }

  // 3. Parámetros de ruta (/r/abcd, /room/abcd)
  const pathMatch = window.location.pathname.match(/\/(?:r|room)\/([^/?#]+)/i);
  if (pathMatch && pathMatch[1]) return pathMatch[1].trim();

  return null;
}

function App() {
  const initialRoom = getRoomCodeFromUrl();

  const [isInGame, setIsInGame] = useState<boolean>(Boolean(initialRoom));
  const [roomCodeToJoin, setRoomCodeToJoin] = useState<string | null>(initialRoom);
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Estados reactivos sincronizados desde el estado de sala de Playroom
  const [gameStatus, setGameStatus] = useState<"LOBBY" | "COUNTDOWN" | "PLAYING" | "ROUND_OVER">("LOBBY");
  const [countdown, setCountdown] = useState(5);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [brokenTiles, setBrokenTiles] = useState<Record<string, number>>({});
  const [mapId, setMapId] = useState("classic");
  const [floorsCount, setFloorsCount] = useState(3);

  // Estados del menú de ajustes (FPS y Ping activos por defecto, Ping en nombres en false por defecto)
  const [showSettings, setShowSettings] = useState(false);
  const [showFps, setShowFps] = useState(true);
  const [showPing, setShowPing] = useState(true);
  const [showPlayerPing, setShowPlayerPing] = useState(false);
  const [volume, setVolume] = useState(getGlobalVolume());

  // Listen to browser navigation changes (e.g. back/forward or link paste)
  useEffect(() => {
    const handlePopState = () => {
      const room = getRoomCodeFromUrl();
      if (room) {
        setRoomCodeToJoin(room);
        setIsInGame(true);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Flush stuck keyboard inputs when switching tabs or window losing/gaining focus
  useEffect(() => {
    const flushKeyboardInputs = () => {
      const controlKeys = [
        "KeyW", "KeyA", "KeyS", "KeyD",
        "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
        "Space", "ShiftLeft", "ShiftRight"
      ];
      controlKeys.forEach((code) => {
        window.dispatchEvent(new KeyboardEvent("keyup", { code, bubbles: true }));
      });
    };

    window.addEventListener("blur", flushKeyboardInputs);
    window.addEventListener("focus", flushKeyboardInputs);
    document.addEventListener("visibilitychange", flushKeyboardInputs);

    return () => {
      window.removeEventListener("blur", flushKeyboardInputs);
      window.removeEventListener("focus", flushKeyboardInputs);
      document.removeEventListener("visibilitychange", flushKeyboardInputs);
    };
  }, []);

  useEffect(() => {
    if (!isInGame) return;

    // 1. Initialize Playroom MultiPlayer
    initPlayroom(roomCodeToJoin || undefined).then(() => {
      setConnected(true);

      // Synchronize canonical URL with room code
      const code = getRoomCode() || roomCodeToJoin;
      if (code && typeof window !== "undefined") {
        const canonicalUrl = `${window.location.origin}${window.location.pathname}?r=${code}`;
        window.history.replaceState({}, "", canonicalUrl);
      }

      // Default room states for host
      if (isHost()) {
        if (!getState("status")) setState("status", "LOBBY");
        if (!getState("countdown")) setState("countdown", 5);
        if (!getState("mapId")) setState("mapId", "classic");
        if (!getState("floorsCount")) setState("floorsCount", 3);
      }

      // Register RPC for stepping on tiles (handles tile collapses)
      RPC.register("stepOnTile", async (tileId: string) => {
        if (isHost()) {
          const current = getState("brokenTiles") || {};
          if (!current[tileId]) {
            const now = Date.now();
            const updated = {
              ...current,
              [tileId]: now,
            };
            setState("brokenTiles", updated);
            // Instant broadcast to all clients for real-time synchronization
            RPC.call("tileStepped", { tileId, time: now }, RPC.Mode.ALL);
          }
        }
      });

      // Direct receiver on all clients for 0ms tile break synchronization
      RPC.register("tileStepped", async (data: { tileId: string; time: number }) => {
        if (data && data.tileId) {
          setBrokenTiles((prev) => ({ ...prev, [data.tileId]: data.time }));
        }
      });

      // Registro de mensajes de chat en tiempo real sincronizados
      RPC.register("chatMessage", async (msg: ChatMessage) => {
        if (msg && msg.text) {
          setMessages((prev) => [...prev.slice(-49), msg]);
          playChatSound();
        }
      });

      // Seguimiento de jugadores que se unen/salen
      onPlayerJoin((player) => {
        setPlayers((prev) => {
          if (prev.some((p) => p.id === player.id)) return prev;
          return [...prev, player];
        });

        player.onQuit(() => {
          setPlayers((prev) => prev.filter((p) => p.id !== player.id));
        });
      });
    });
  }, [isInGame]);

  // 2. Poll Room States at 15 FPS (approx every 66ms) to keep React UI reactive and lightweight
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(() => {
      setGameStatus(getState("status") || "LOBBY");
      setCountdown(getState("countdown") ?? 5);
      setWinnerId(getState("winnerId") || null);
      setBrokenTiles(getState("brokenTiles") || {});
      setMapId(getState("mapId") || "classic");
      setFloorsCount(getState("floorsCount") ?? 3);
    }, 66);

    return () => clearInterval(interval);
  }, [connected]);

  // Play win/loss sound effect on round end
  useEffect(() => {
    if (!connected) return;
    if (gameStatus === "ROUND_OVER") {
      const myId = myPlayer()?.id;
      if (winnerId === myId && winnerId !== null) {
        playWinSound();
      } else {
        playFallSound();
      }
    }
  }, [gameStatus, winnerId, connected]);

  // Listener for settings toggling with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSettings((prev) => !prev);
        playStepSound();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 3. HOST LOBBY & LOOP TICKER
  useEffect(() => {
    if (!connected || !isHost()) return;

    const timer = setInterval(() => {
      const status = getState("status") || "LOBBY";
      const activePlayers = players.filter((p) => !p.getState("isAfk"));

      // A. Contador de 5 segundos (se cancela si quedan menos de 2 jugadores activos)
      if (status === "COUNTDOWN") {
        if (activePlayers.length < 2) {
          setState("status", "LOBBY");
          setState("countdown", 5);
          RPC.call("chatMessage", {
            id: `msg_cancel_${Date.now()}`,
            senderId: "system",
            senderName: "Sistema",
            senderColor: "#f59e0b",
            text: "⚠️ Inicio cancelado: se requieren mínimo 2 jugadores activos (no AFK).",
            timestamp: Date.now(),
          }, RPC.Mode.ALL);
          return;
        }

        const countVal = getState("countdown") ?? 5;
        if (countVal > 1) {
          setState("countdown", countVal - 1);
        } else {
          setState("status", "PLAYING");
          setState("countdown", 0);
        }
      }

      // B. Lógica de partida activa
      if (status === "PLAYING" && players.length > 0) {
        const alive = players.filter((p) => p.getState("isAlive") !== false);

        if (alive.length === 0) {
          // Empate: Todos cayeron al mismo tiempo
          setState("status", "ROUND_OVER");
          setState("winnerId", null);
        } else if (alive.length === 1 && players.length > 1) {
          // Ganador en multijugador
          const winner = alive[0];
          setState("status", "ROUND_OVER");
          setState("winnerId", winner.id);
          winner.setState("score", (winner.getState("score") || 0) + 1);
        } else if (players.length === 1 && alive.length === 0) {
          // Muerte en modo individual
          setState("status", "ROUND_OVER");
          setState("winnerId", null);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [connected, players]);

  // Iniciar / reiniciar partida (Solo Anfitrión con mínimo 2 jugadores no AFK)
  const handleStartGame = () => {
    if (!isHost()) return;

    const activePlayers = players.filter((p) => !p.getState("isAfk"));
    if (activePlayers.length < 2) {
      return;
    }

    // Restablecer estados de vida y motivos de muerte
    players.forEach((p) => {
      p.setState("isAlive", true);
      p.setState("deathReason", null);
      p.setState("isMoving", false);
      p.setState("isRunning", false);
    });

    // Reiniciar estado de la sala con contador de 5 segundos
    setState("brokenTiles", {});
    setState("winnerId", null);
    setState("countdown", 5);
    setState("status", "COUNTDOWN");
  };

  // Retornar a la sala de espera (Lobby)
  const handleReturnToLobby = () => {
    if (isHost()) {
      players.forEach((p) => {
        p.setState("isAlive", true);
        p.setState("isMoving", false);
        p.setState("isRunning", false);
      });

      setState("brokenTiles", {});
      setState("winnerId", null);
      setState("countdown", 5);
      setState("status", "LOBBY");
    }

    // Actualización inmediata del estado local reactivo
    setGameStatus("LOBBY");
    setBrokenTiles({});
    setWinnerId(null);
  };

  const handleSelectMap = (newMapId: string) => {
    if (isHost()) {
      setState("mapId", newMapId);
    }
  };

  const handleSelectFloors = (count: number) => {
    if (isHost()) {
      setState("floorsCount", count);
    }
  };

  const handleStepTile = (tileId: string) => {
    // Solo se emite el colapso al anfitrión sin reproducir sonido de paso
    RPC.call("stepOnTile", tileId, RPC.Mode.HOST);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setGlobalVolume(newVol);
  };

  const handleToggleSettings = () => {
    setShowSettings((prev) => !prev);
  };

  const handleToggleFps = () => {
    setShowFps((prev) => !prev);
  };

  const handleTogglePing = () => {
    setShowPing((prev) => !prev);
  };

  const handleSendMessage = (text: string) => {
    const player = myPlayer();
    if (!player) return;

    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      senderId: player.id,
      senderName: player.getState("name") || player.getProfile()?.name || "Jugador",
      senderColor: player.getState("color") || player.getProfile()?.color?.hex || "#38bdf8",
      senderSkin: player.getState("skin") || "robot",
      text: text.slice(0, 120),
      timestamp: Date.now(),
    };

    // Guardar en el estado del jugador para la burbuja 3D sobre su avatar
    player.setState("lastChat", { text: msg.text, timestamp: msg.timestamp });

    // Difusión instantánea a todos los jugadores de la sala
    RPC.call("chatMessage", msg, RPC.Mode.ALL);
  };

  const handleHostGame = () => {
    setRoomCodeToJoin(null);
    setIsInGame(true);
  };

  const handleJoinGame = (roomCode: string) => {
    const clean = roomCode.trim();
    if (!clean) return;
    setRoomCodeToJoin(clean);
    const newUrl = `${window.location.origin}${window.location.pathname}?r=${clean}`;
    window.history.pushState({}, "", newUrl);
    setIsInGame(true);
  };

  if (!isInGame) {
    return <LandingPage onHostGame={handleHostGame} onJoinGame={handleJoinGame} />;
  }

  if (!connected) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center bg-[#07080b] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mb-4"></div>
        <h2 className="text-sm font-bold tracking-wider uppercase animate-pulse text-white/80">
          Conectando a la Sala...
        </h2>
      </div>
    );
  }

  return (
    <KeyboardControls map={keyboardMap}>
      <div className="w-full h-full relative overflow-hidden bg-[#0d0e12]">
        {/* 1. Escena 3D WebGL Canvas (Capa base de fondo) */}
        <GameScene
          players={players}
          brokenTiles={brokenTiles}
          onStepTile={handleStepTile}
          gameStatus={gameStatus}
          mapId={mapId}
          floorsCount={floorsCount}
          showPlayerPing={showPlayerPing}
        />

        {/* 2. HUD de Rendimiento en una sola línea (FPS y Ping en la esquina inferior derecha) */}
        <PerformanceHUD showFps={showFps} showPing={showPing} />

        {/* 3. Chat Multijugador en tiempo real con diseño iOS 26 (Esquina inferior izquierda) */}
        <ChatOverlay
          messages={messages}
          onSendMessage={handleSendMessage}
          localPlayerId={myPlayer()?.id}
        />

        {/* 4. Interfaz 2D React Superpuesta y Modales (Siempre por encima de la escena 3D) */}
        <GameUI
          players={players}
          gameStatus={gameStatus}
          countdown={countdown}
          winnerId={winnerId}
          mapId={mapId}
          floorsCount={floorsCount}
          onSelectMap={handleSelectMap}
          onSelectFloors={handleSelectFloors}
          onStartGame={handleStartGame}
          onReturnToLobby={handleReturnToLobby}
          showSettings={showSettings}
          onToggleSettings={handleToggleSettings}
          showFps={showFps}
          onToggleFps={handleToggleFps}
          showPing={showPing}
          onTogglePing={handleTogglePing}
          showPlayerPing={showPlayerPing}
          onTogglePlayerPing={() => setShowPlayerPing((prev) => !prev)}
          volume={volume}
          onVolumeChange={handleVolumeChange}
        />
      </div>
    </KeyboardControls>
  );
}

export default App;
