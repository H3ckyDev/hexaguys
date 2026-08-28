import { useState, useEffect, useCallback } from "react";
import { KeyboardControls } from "@react-three/drei";
import { Toaster } from "sileo";
import { isHost, setState } from "playroomkit";
import "sileo/styles.css";

import { GameScene } from "./components/GameScene";
import { GameUI } from "./components/GameUI";
import { LandingPage } from "./components/LandingPage";
import { PerformanceHUD } from "./components/PerformanceHUD";
import { ChatOverlay } from "./components/ChatOverlay";
import { playStepSound } from "./utils/sounds";

import { useDeviceDetection } from "./hooks/useDeviceDetection";
import { useUrlNavigation } from "./hooks/useUrlNavigation";
import { useKeyboardFlush } from "./hooks/useKeyboardFlush";
import { usePlayroomSession } from "./hooks/usePlayroomSession";
import { useHostGameLoop } from "./hooks/useHostGameLoop";
import { useGameAudio } from "./hooks/useGameAudio";
import { useChatSystem } from "./hooks/useChatSystem";

const keyboardMap = [
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "jump", keys: ["Space"] },
  { name: "sprint", keys: ["ShiftLeft", "ShiftRight"] },
];

function App() {
  const { isMobile } = useDeviceDetection();
  const { isInGame, roomCodeToJoin, afkKickNotice, setAfkKickNotice, handleHostGame, handleJoinGame } = useUrlNavigation();
  
  useKeyboardFlush();

  const {
    connected,
    connectionError,
    players,
    gameStatus,
    countdown,
    winnerId,
    brokenTiles,
    mapId,
    floorsCount,
    chatMessages,
    localPlayer,
    handleStepTile,
    retryConnection,
  } = usePlayroomSession(isInGame, roomCodeToJoin);

  const { handleStartGame } = useHostGameLoop(players, connected);
  const { volume, handleVolumeChange } = useGameAudio(isInGame, gameStatus, connected, winnerId, players, localPlayer);
  const { handleSendMessage } = useChatSystem(localPlayer);

  const [showSettings, setShowSettings] = useState(false);
  const [showFps, setShowFps] = useState(false);

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

  const handleSelectMap = useCallback((newMapId: string) => {
    if (isHost()) setState("mapId", newMapId);
  }, []);

  const handleSelectFloors = useCallback((count: number) => {
    if (isHost()) setState("floorsCount", count);
  }, []);

  const handleToggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const handleToggleFps = useCallback(() => {
    setShowFps((prev) => !prev);
  }, []);

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

  if (connectionError) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center bg-[#07080b] text-white">
        <h2 className="text-xl font-bold text-red-500 mb-4">Error de conexión</h2>
        <button 
          onClick={retryConnection} 
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded text-sm font-bold tracking-wider"
        >
          REINTENTAR
        </button>
      </div>
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
        <Toaster position="top-center" theme="light" />

        <GameScene
          players={players}
          brokenTiles={brokenTiles}
          onStepTile={handleStepTile}
          gameStatus={gameStatus}
          mapId={mapId}
          floorsCount={floorsCount}
          isMobile={isMobile}
        />

        <PerformanceHUD showFps={showFps} />

        <ChatOverlay
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          localPlayerId={localPlayer?.id}
        />

        <GameUI
          players={players}
          gameStatus={gameStatus}
          countdown={countdown}
          winnerId={winnerId}
          mapId={mapId}
          floorsCount={floorsCount}
          onSelectMap={handleSelectMap}
          onSelectFloors={handleSelectFloors}
          onStartGame={() => { playStepSound(); handleStartGame(); }}
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
