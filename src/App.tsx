import { useState, useEffect } from "react";
import { KeyboardControls } from "@react-three/drei";
import { onPlayerJoin, isHost, setState, getState, RPC, myPlayer } from "playroomkit";
import { initPlayroom } from "./playroom";
import { GameScene } from "./components/GameScene";
import { GameUI } from "./components/GameUI";
import { playWinSound, playFallSound, playStepSound, setGlobalVolume, getGlobalVolume } from "./utils/sounds";
import { FPSCounter } from "./components/FPSCounter";
import { PingCounter } from "./components/PingCounter";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
  { name: "sprint", keys: ["ShiftLeft", "ShiftRight"] },
];

function App() {
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  
  // Local reactive room states synced from Playroom Room State
  const [gameStatus, setGameStatus] = useState<"LOBBY" | "COUNTDOWN" | "PLAYING" | "ROUND_OVER">("LOBBY");
  const [countdown, setCountdown] = useState(5);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [brokenTiles, setBrokenTiles] = useState<Record<string, number>>({});
  const [mapId, setMapId] = useState("classic");
  const [floorsCount, setFloorsCount] = useState(3);

  // Settings menu states
  const [showSettings, setShowSettings] = useState(false);
  const [showFps, setShowFps] = useState(false);
  const [showPing, setShowPing] = useState(false);
  const [volume, setVolume] = useState(getGlobalVolume());

  useEffect(() => {
    // 1. Initialize Playroom MultiPlayer
    initPlayroom().then(() => {
      setConnected(true);

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

      // Track players joining/leaving
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
  }, []);

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

      // A. 5-Second Countdown tick
      if (status === "COUNTDOWN") {
        const countVal = getState("countdown") ?? 5;
        if (countVal > 1) {
          setState("countdown", countVal - 1);
        } else {
          setState("status", "PLAYING");
          setState("countdown", 0);
        }
      }

      // B. Game playing logic (check win/lose states)
      if (status === "PLAYING" && players.length > 0) {
        const alive = players.filter((p) => p.getState("isAlive") !== false);

        if (alive.length === 0) {
          // Draw: Everyone fell at the same time
          setState("status", "ROUND_OVER");
          setState("winnerId", null);
        } else if (alive.length === 1 && players.length > 1) {
          // Winner found in multiplayer
          const winner = alive[0];
          setState("status", "ROUND_OVER");
          setState("winnerId", winner.id);
          winner.setState("score", (winner.getState("score") || 0) + 1);
        } else if (players.length === 1 && alive.length === 0) {
          // Solo mode death
          setState("status", "ROUND_OVER");
          setState("winnerId", null);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [connected, players]);

  // Handle game start/restart (Host only)
  const handleStartGame = () => {
    if (!isHost()) return;

    // Reset player alive status directly from host
    players.forEach((p) => {
      p.setState("isAlive", true);
      p.setState("isMoving", false);
      p.setState("isRunning", false);
    });

    // Reset room state with 5-second countdown
    setState("brokenTiles", {});
    setState("winnerId", null);
    setState("countdown", 5);
    setState("status", "COUNTDOWN");
  };

  // Handle returning to Lobby (Host only)
  const handleReturnToLobby = () => {
    if (!isHost()) return;

    players.forEach((p) => {
      p.setState("isAlive", true);
      p.setState("isMoving", false);
      p.setState("isRunning", false);
    });

    setState("brokenTiles", {});
    setState("winnerId", null);
    setState("countdown", 5);
    setState("status", "LOBBY");
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
    playStepSound(); // Play procedural step beep locally
    // Broadcast tile step event to the host
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

  if (!connected) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center bg-[#0d0e12] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500 mb-4"></div>
        <h2 className="text-lg font-bold tracking-wide animate-pulse">
          CONECTANDO CON PLAYROOM KIT...
        </h2>
      </div>
    );
  }

  return (
    <KeyboardControls map={keyboardMap}>
      <div className="w-full h-full relative overflow-hidden bg-[#0d0e12]">
        {/* FPS Counter overlay */}
        {showFps && <FPSCounter />}

        {/* Ping / Latency Indicator overlay */}
        {showPing && <PingCounter />}

        {/* React 2D User Interface Overlay */}
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
          volume={volume}
          onVolumeChange={handleVolumeChange}
        />

        {/* 3D WebGL Canvas Scene */}
        <GameScene
          players={players}
          brokenTiles={brokenTiles}
          onStepTile={handleStepTile}
          gameStatus={gameStatus}
          mapId={mapId}
          floorsCount={floorsCount}
        />
      </div>
    </KeyboardControls>
  );
}

export default App;
