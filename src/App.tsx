import { useState, useEffect, useRef } from "react";
import { KeyboardControls } from "@react-three/drei";
import { onPlayerJoin, isHost, setState, getState, RPC, myPlayer, getRoomCode } from "playroomkit";
import { Toaster, sileo } from "sileo";
import "sileo/styles.css";
import { initPlayroom } from "./playroom";
import { GameScene } from "./components/GameScene";
import { GameUI } from "./components/GameUI";
import { LandingPage } from "./components/LandingPage";
import { playWinSound, playFallSound, playStepSound, playChatSound, setGlobalVolume, getGlobalVolume } from "./utils/sounds";
import { startBgm, stopBgm, setBgmState, setBgmVolume } from "./utils/bgm";
import { PerformanceHUD } from "./components/PerformanceHUD";
import { ChatOverlay, type ChatMessage } from "./components/ChatOverlay";
import { recordMatchResult, getPersistentPlayerId } from "./services/leaderboardService";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
  { name: "sprint", keys: ["ShiftLeft", "ShiftRight"] },
];

const GLOBAL_SCORE_PER_WIN = 10;
const GLOBAL_SCORE_PER_SURVIVAL_INTERVAL = 10_000;

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
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Estados reactivos sincronizados desde el estado de sala de Playroom
  const [gameStatus, setGameStatus] = useState<"LOBBY" | "COUNTDOWN" | "PLAYING" | "ROUND_OVER">("LOBBY");
  const [countdown, setCountdown] = useState(5);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [brokenTiles, setBrokenTiles] = useState<Record<string, number>>({});
  const [mapId, setMapId] = useState("classic");
  const [floorsCount, setFloorsCount] = useState(3);

  // Estados del menú de ajustes (FPS y Volumen)
  const [showSettings, setShowSettings] = useState(false);
  const [showFps, setShowFps] = useState(false);
  const [volume, setVolume] = useState(getGlobalVolume());
  const [afkKickNotice, setAfkKickNotice] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const kickType = urlParams.get("kick");
      if (kickType === "host") {
        return "Has sido expulsado de la sala por el anfitrión debido a inactividad (AFK).";
      } else if (kickType === "afk") {
        return "Has sido desconectado de la sala por inactividad prolongada.";
      }
    }
    return null;
  });

  // Escuchar cambios de navegación en el navegador
  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const updateDeviceType = () => setIsMobile(mediaQuery.matches);

    updateDeviceType();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateDeviceType);
      return () => mediaQuery.removeEventListener("change", updateDeviceType);
    }

    mediaQuery.addListener(updateDeviceType);
    return () => mediaQuery.removeListener(updateDeviceType);
  }, []);

  useEffect(() => {
    // Limpiar parámetro de kick en la URL si existe
    if (typeof window !== "undefined" && window.location.search.includes("kick=afk")) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }

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

      // Registro de RPC para expulsión de jugadores AFK por el anfitrión
      RPC.register("kickPlayer", async (data: { targetId: string; targetName: string }) => {
        if (data && data.targetId) {
          const myId = myPlayer()?.id;
          if (myId === data.targetId) {
            // El jugador expulsado es redirigido a la Landing Page
            window.location.href = `${window.location.origin}${window.location.pathname}?kick=host`;
          } else {
            sileo.warning({
              title: "Jugador expulsado",
              description: `El anfitrión expulsó a ${data.targetName} por inactividad.`,
            });
          }
        }
      });

      // Seguimiento de jugadores que se unen/salen con notificaciones Sileo
      onPlayerJoin((player) => {
        if (player.getState("globalScore") === undefined || player.getState("globalScore") === null) {
          player.setState("globalScore", 0);
        }

        const pName = player.getState("name") || player.getProfile()?.name || `Jugador ${player.id.slice(0, 3)}`;
        sileo.info({
          title: "Jugador conectado",
          description: `${pName} se ha unido a la sala.`,
        });

        setPlayers((prev) => {
          if (prev.some((p) => p.id === player.id)) return prev;
          return [...prev, player];
        });

        player.onQuit(() => {
          const qName = player.getState("name") || player.getProfile()?.name || `Jugador ${player.id.slice(0, 3)}`;
          sileo.warning({
            title: "Jugador desconectado",
            description: `${qName} ha salido de la sala.`,
          });
          setPlayers((prev) => prev.filter((p) => p.id !== player.id));
        });
      });
    });
  }, [isInGame]);

  // 2. Consultar estados de sala cada 66ms para reactividad
  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(() => {
      const nextStatus = getState("status") || "LOBBY";
      const nextCountdown = getState("countdown") ?? 5;
      const nextWinnerId = getState("winnerId") || null;
      const nextMapId = getState("mapId") || "classic";
      const nextFloorsCount = getState("floorsCount") ?? 3;
      const nextBroken = getState("brokenTiles") || {};

      setGameStatus((prev) => (prev !== nextStatus ? nextStatus : prev));
      setCountdown((prev) => (prev !== nextCountdown ? nextCountdown : prev));
      setWinnerId((prev) => (prev !== nextWinnerId ? nextWinnerId : prev));
      setMapId((prev) => (prev !== nextMapId ? nextMapId : prev));
      setFloorsCount((prev) => (prev !== nextFloorsCount ? nextFloorsCount : prev));

      setBrokenTiles((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(nextBroken);
        if (prevKeys.length === nextKeys.length && prevKeys.every((k) => prev[k] === nextBroken[k])) {
          return prev;
        }
        return nextBroken;
      });
    }, 66);

    return () => clearInterval(interval);
  }, [connected]);

  // Ciclo de vida y transición adaptativa de la música de fondo chill (BGM)
  useEffect(() => {
    if (!isInGame) {
      stopBgm();
      return;
    }

    startBgm(gameStatus);
    setBgmState(gameStatus);

    const handleFirstInteraction = () => {
      startBgm(gameStatus);
    };

    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [isInGame, gameStatus]);

  // Sonido, notificación Sileo y registro en el tablón de clasificación al finalizar ronda
  const prevWinnerNotified = useRef<string | null>(null);
  const recordedRoundRef = useRef<boolean>(false);
  const roundStartScoreRef = useRef<number>(0);

  useEffect(() => {
    if (!connected) return;

    // Al iniciar el conteo de la ronda, capturar la puntuación base de inicio
    if (gameStatus === "COUNTDOWN") {
      roundStartScoreRef.current = myPlayer()?.getState("globalScore") || 0;
      recordedRoundRef.current = false;
      prevWinnerNotified.current = null;
    }

    if (gameStatus === "ROUND_OVER") {
      if (!recordedRoundRef.current) {
        recordedRoundRef.current = true;
        const myP = myPlayer();
        if (myP) {
          const myId = myP.id;
          const isWin = winnerId === myId;
          const nickname = myP.getState("name") || myP.getProfile()?.name || "Jugador";
          const skin = myP.getState("skin") || "robot";
          const avatar = myP.getState("avatar");
          const color = myP.getState("color") || myP.getProfile()?.color?.hex || "#38bdf8";
          
          // Puntos ganados durante esta ronda específica (supervivencia + victoria)
          const currentTotalScore = myP.getState("globalScore") || 0;
          let scoreGained = Math.max(0, currentTotalScore - roundStartScoreRef.current);
          if (isWin && scoreGained < GLOBAL_SCORE_PER_WIN) {
            scoreGained = GLOBAL_SCORE_PER_WIN;
          }

          console.log("[Leaderboard] Inserción de estadísticas al finalizar partida:", {
            nickname,
            skin,
            avatar,
            scoreGained,
            isWin,
          });

          recordMatchResult({
            playerId: getPersistentPlayerId(),
            nickname,
            skin,
            avatar,
            color,
            scoreGained,
            isWin,
          });
        }
      }

      const myId = myPlayer()?.id;
      if (winnerId === myId && winnerId !== null) {
        playWinSound();
      } else {
        playFallSound();
      }

      if (winnerId && prevWinnerNotified.current !== winnerId) {
        prevWinnerNotified.current = winnerId;
        const winnerPlayer = players.find((p) => p.id === winnerId);
        const winName = winnerPlayer?.getState("name") || winnerPlayer?.getProfile()?.name || "Un jugador";
        sileo.success({
          title: "Ronda Finalizada",
          description: `Victoria de ${winName}`,
        });
      }
    } else if (gameStatus === "PLAYING") {
      prevWinnerNotified.current = null;
    }
  }, [gameStatus, winnerId, connected, players]);

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
          players.forEach((p) => {
            p.setState("isAlive", true);
            p.setState("deathReason", null);
            p.setState("isMoving", false);
            p.setState("isRunning", false);
          });
        } else if (alive.length === 1 && players.length > 1) {
          // Ganador en multijugador
          const winner = alive[0];
          setState("status", "ROUND_OVER");
          setState("winnerId", winner.id);
          players.forEach((p) => {
            p.setState("isAlive", true);
            p.setState("deathReason", null);
            p.setState("isMoving", false);
            p.setState("isRunning", false);
          });
          winner.setState(
            "globalScore",
            (winner.getState("globalScore") || 0) + GLOBAL_SCORE_PER_WIN,
          );
          winner.setState("scoreNotification", {
            id: `${Date.now()}_${winner.id}`,
            amount: GLOBAL_SCORE_PER_WIN,
            timestamp: Date.now(),
          });
        } else if (players.length === 1 && alive.length === 0) {
          // Muerte en modo individual
          setState("status", "ROUND_OVER");
          setState("winnerId", null);
          players.forEach((p) => {
            p.setState("isAlive", true);
            p.setState("deathReason", null);
            p.setState("isMoving", false);
            p.setState("isRunning", false);
          });
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [connected, players]);

  useEffect(() => {
    if (!connected || !isHost()) return;

    const timer = setInterval(() => {
      if (getState("status") !== "PLAYING" || getState("winnerId")) return;

      players.forEach((player) => {
        if (player.getState("isAlive") !== false) {
          player.setState(
            "globalScore",
            (player.getState("globalScore") || 0) + 1,
          );
          player.setState("scoreNotification", {
            id: `${Date.now()}_${player.id}`,
            amount: 1,
            timestamp: Date.now(),
          });
        }
      });
    }, GLOBAL_SCORE_PER_SURVIVAL_INTERVAL);

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
    setBgmVolume(newVol);
  };

  const handleToggleSettings = () => {
    setShowSettings((prev) => !prev);
  };

  const handleToggleFps = () => {
    setShowFps((prev) => !prev);
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
      senderAvatar: player.getState("avatar"),
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

  if (isMobile === null) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#07080b] text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (!isInGame) {
    return (
      <LandingPage
        onHostGame={handleHostGame}
        onJoinGame={handleJoinGame}
        afkKickNotice={afkKickNotice}
        onDismissNotice={() => setAfkKickNotice(null)}
      />
    );
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
        {/* Componente Toaster de Sileo para notificaciones con físicas fluidas */}
        <Toaster position="top-center" theme="light" />

        {/* 1. Escena 3D WebGL Canvas (Capa base de fondo) */}
        <GameScene
          players={players}
          brokenTiles={brokenTiles}
          onStepTile={handleStepTile}
          gameStatus={gameStatus}
          mapId={mapId}
          floorsCount={floorsCount}
          isMobile={isMobile}
        />

        {/* 2. HUD de Rendimiento (Contador de FPS en la esquina inferior derecha) */}
        <PerformanceHUD showFps={showFps} />

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
          showSettings={showSettings}
          onToggleSettings={handleToggleSettings}
          showFps={showFps}
          onToggleFps={handleToggleFps}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isMobile={isMobile}
        />
      </div>
    </KeyboardControls>
  );
}

export default App;
