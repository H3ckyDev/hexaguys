import { useState, useEffect, useCallback, useMemo } from "react";
import { isHost, myPlayer, RPC } from "playroomkit";
import { sileo } from "sileo";
import { playStepSound } from "../utils/sounds";

import { LeaderboardModal } from "./LeaderboardModal";
import type { AvatarConfig, GameStatus } from "../types/game";
import {
  generateRandomAvatar,
  serializeAvatar,
  deserializeAvatar,
  normalizeColor,
} from "../utils/avatarGenerator";
import { COLOR_PALETTE } from "../constants/ui";
import { getActiveProfile, getCurrentUser, saveUserProfile } from "../services/authService";

// Sub-components
import { GameHeader } from "./game-ui/GameHeader";
import { ParticipantsDropdown } from "./game-ui/ParticipantsDropdown";
import { CountdownOverlay } from "./game-ui/CountdownOverlay";
import { SettingsModal } from "./game-ui/SettingsModal";
import { RoundOverModal } from "./game-ui/RoundOverModal";
import { SpectatorOverlay } from "./game-ui/SpectatorOverlay";
import { LobbyDrawer } from "./game-ui/lobby/LobbyDrawer";
import { AvatarCustomizerTab } from "./game-ui/lobby/AvatarCustomizerTab";
import { ArenaSettingsTab } from "./game-ui/lobby/ArenaSettingsTab";
import { LobbyPlayersTab } from "./game-ui/lobby/LobbyPlayersTab";
import { LobbyFooterControls } from "./game-ui/lobby/LobbyFooterControls";
import { FadeTransitionOverlay } from "./FadeTransitionOverlay";

interface GameUIProps {
  players: any[];
  gameStatus: GameStatus;
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
  const host = isHost();
  const localPlayer = myPlayer();

  const alivePlayers = useMemo(
    () => players.filter((p) => p.getState("isAlive") !== false),
    [players]
  );
  
  const isLocalAlive = localPlayer ? localPlayer.getState("isAlive") !== false : true;

  // Local UI state
  const [activeTab, setActiveTab] = useState<"custom" | "match" | "players">("custom");
  const [showLobbyDrawer, setShowLobbyDrawer] = useState(false);
  const [showPlayersMenu, setShowPlayersMenu] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const currentColor = normalizeColor(
    localPlayer?.getState("color") || localPlayer?.getProfile()?.color || COLOR_PALETTE[0].hex
  );

  // Avatar and Nickname State
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    return getActiveProfile()?.avatarConfig || deserializeAvatar(localPlayer?.getState("avatar"), currentColor);
  });

  const [nickname, setNickname] = useState(() => {
    return getActiveProfile()?.nickname || localPlayer?.getState("name") || localPlayer?.getProfile()?.name || `Jugador_${Math.floor(Math.random() * 900 + 100)}`;
  });

  const updateAvatar = useCallback((newConfig: AvatarConfig) => {
    setAvatarConfig(newConfig);
    const serialized = serializeAvatar(newConfig);
    if (localPlayer) {
      localPlayer.setState("avatar", serialized);
    }
    const user = getCurrentUser();
    if (user) {
      saveUserProfile(user.uid, { avatarConfig: newConfig, color: newConfig.color });
    }
  }, [localPlayer]);

  const handleRandomizeAvatar = useCallback(() => {
    playStepSound();
    setIsRolling(true);
    const randomConfig = generateRandomAvatar(currentColor);
    updateAvatar(randomConfig);
    setTimeout(() => setIsRolling(false), 450);
    sileo.success({
      title: "Rostro Aleatorizado",
      description: "¡Nuevo avatar generado con éxito!",
    });
  }, [currentColor, updateAvatar]);

  const handleNameChange = useCallback((cleanName: string) => {
    setNickname(cleanName);
    const user = getCurrentUser();
    if (user) {
      saveUserProfile(user.uid, { nickname: cleanName });
    }
  }, []);

  const handleSelectColor = useCallback((hex: string) => {
    if (localPlayer) {
      localPlayer.setState("color", hex);
      updateAvatar({ ...avatarConfig, color: hex });
      playStepSound();
    }
  }, [localPlayer, avatarConfig, updateAvatar]);

  const handleKickPlayer = useCallback((targetId: string, targetName: string) => {
    if (!host) return;
    playStepSound();
    RPC.call("kickPlayer", { targetId, targetName }, RPC.Mode.ALL);
  }, [host]);

  const handleLeaveGame = useCallback(() => {
    playStepSound();
    window.location.href = window.location.origin + window.location.pathname;
  }, []);

  const handleStartGameWrap = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onStartGame();
  }, [onStartGame]);

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

  // Derived Winner State
  const winner = useMemo(() => winnerId ? players.find((p) => p.id === winnerId) : null, [winnerId, players]);
  const winnerName = winner ? (winner.getState("name") || winner.getProfile()?.name || "Desconocido") : "Empate";
  const winnerColor = winner ? (winner.getState("color") || winner.getProfile()?.color?.hex || "#ffffff") : "#ffffff";

  return (
    <div className={`absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 z-30 select-none font-sans antialiased ${isMobile ? "mobile-game-ui" : ""}`}>
      {/* Transición cinematográfica suave entre lobby y partida */}
      <FadeTransitionOverlay gameStatus={gameStatus} />

      {/* 1. BARRA SUPERIOR HUD VISOR */}
      <div className="relative pointer-events-none">
        <GameHeader
          score={localPlayer?.getState("globalScore") || 0}
          aliveCount={alivePlayers.length}
          totalCount={players.length}
          onToggleSettings={onToggleSettings}
          onToggleParticipants={() => {
            playStepSound();
            setShowPlayersMenu((prev) => !prev);
          }}
          onOpenLeaderboard={() => {
            playStepSound();
            setShowLeaderboard(true);
          }}
          isPlaying={gameStatus === "PLAYING"}
        />
        <ParticipantsDropdown
          players={players}
          localPlayer={localPlayer}
          isHost={host}
          isOpen={showPlayersMenu}
          onClose={() => setShowPlayersMenu(false)}
          onKick={handleKickPlayer}
        />
      </div>

      {/* 2. OVERLAYS EN PARTIDA Y MODALES */}
      <div className="flex-1 flex items-center justify-center pointer-events-none my-auto relative z-40">
        {gameStatus === "COUNTDOWN" && (
          <CountdownOverlay countdown={countdown} />
        )}

        <SettingsModal
          isOpen={showSettings}
          onClose={onToggleSettings}
          volume={volume}
          onVolumeChange={onVolumeChange}
          showFps={showFps}
          onToggleFps={onToggleFps}
          onExitGame={handleLeaveGame}
        />

        {gameStatus === "ROUND_OVER" && !showSettings && (
          <RoundOverModal
            winnerName={winnerName}
            winnerColor={winnerColor}
            isHost={host}
            onRematch={onStartGame}
            onOpenWorkshop={() => {
              playStepSound();
              setShowLobbyDrawer((prev) => !prev);
            }}
            onExitGame={handleLeaveGame}
          />
        )}

        {gameStatus === "PLAYING" && !isLocalAlive && !showSettings && (
          <SpectatorOverlay
            aliveCount={alivePlayers.length}
            onDisconnect={handleLeaveGame}
          />
        )}
      </div>

      {/* 3. LOBBY HUB & TALLER INFERIOR */}
      {(gameStatus === "LOBBY" || gameStatus === "ROUND_OVER") && !showSettings && (
        <footer className="w-full max-w-5xl mx-auto flex flex-col items-center gap-3 z-40 pointer-events-auto overflow-auto">
          <LobbyDrawer
            isOpen={showLobbyDrawer}
            onToggle={() => setShowLobbyDrawer(false)}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            playerCount={players.length}
          >
            {activeTab === "custom" && (
              <AvatarCustomizerTab
                localPlayer={localPlayer}
                avatarConfig={avatarConfig}
                onUpdateAvatar={updateAvatar}
                nickname={nickname}
                onNameChange={handleNameChange}
                currentColor={currentColor}
                onSelectColor={handleSelectColor}
                isRolling={isRolling}
                onRandomize={handleRandomizeAvatar}
              />
            )}
            {activeTab === "match" && (
              <ArenaSettingsTab
                mapId={mapId}
                floorsCount={floorsCount}
                onSelectMap={onSelectMap}
                onSelectFloors={onSelectFloors}
                isHost={host}
              />
            )}
            {activeTab === "players" && (
              <LobbyPlayersTab
                players={players}
                localPlayer={localPlayer}
                isHost={host}
                onKick={handleKickPlayer}
              />
            )}
          </LobbyDrawer>

          {gameStatus === "LOBBY" && (
            <LobbyFooterControls
              isHost={host}
              onStartGame={handleStartGameWrap}
              onToggleWorkshop={() => setShowLobbyDrawer((prev) => !prev)}
              activePlayerCount={players.length}
              showLobbyDrawer={showLobbyDrawer}
            />
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
