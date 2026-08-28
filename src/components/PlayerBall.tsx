import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import { Html } from "@react-three/drei";
import * as THREE from "three";

import { CharacterModel } from "./CharacterModel";
import type { PlayerState, GameStatus, MapId, SkinId } from "../types/game";
import { SPAWN_RADIUS, LOBBY_X_OFFSET, FLOOR_Y_OFFSET } from "../constants/game";

import { usePlayerControls } from "../hooks/usePlayerControls";
import { useAfkTracker } from "../hooks/useAfkTracker";
import { useTileDetector } from "../hooks/useTileDetector";
import { usePlayerNetwork } from "../hooks/usePlayerNetwork";
import { usePlayerCamera } from "../hooks/usePlayerCamera";
import { usePlayerPhysics } from "../hooks/usePlayerPhysics";
import { activeLocalPlayerPos } from "../utils/playerTracking";

interface PlayerBallProps {
  player: PlayerState;
  playerIndex?: number;
  totalPlayers?: number;
  isLocal: boolean;
  gameStatus: GameStatus;
  floorsCount?: number;
  mapId?: MapId;
  isMobile?: boolean;
  onStepTile?: (id: string) => void;
}

export function PlayerBall({
  player,
  playerIndex = 0,
  totalPlayers = 1,
  isLocal,
  gameStatus,
  floorsCount = 3,
  mapId = "classic",
  isMobile = false,
  onStepTile,
}: PlayerBallProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<THREE.Group>(null);
  const { world, rapier } = useRapier();

  const total = Math.max(1, totalPlayers);
  const angle = (playerIndex / total) * Math.PI * 2;
  const spawnDist = total > 1 ? SPAWN_RADIUS : 0;
  
  const lobbySpawnX = LOBBY_X_OFFSET + Math.cos(angle) * Math.min(2.2, spawnDist);
  const lobbySpawnY = 0.65;
  const lobbySpawnZ = Math.sin(angle) * Math.min(2.2, spawnDist);

  const topFloorY = (floorsCount - 1) * 4.5;
  const matchSpawnX = Math.cos(angle) * spawnDist;
  const matchSpawnY = topFloorY + FLOOR_Y_OFFSET;
  const matchSpawnZ = Math.sin(angle) * spawnDist;

  const isLobbyMode = gameStatus === "LOBBY" || gameStatus === "ROUND_OVER";
  const spawnX = isLobbyMode ? lobbySpawnX : matchSpawnX;
  const spawnY = isLobbyMode ? lobbySpawnY : matchSpawnY;
  const spawnZ = isLobbyMode ? lobbySpawnZ : matchSpawnZ;

  const { getKeys, touchDirection, touchJump } = usePlayerControls(isLocal, isMobile);
  const { updateActivity } = useAfkTracker({ player, isLocal, gameStatus });
  const { detectTiles } = useTileDetector({ mapId, floorsCount, player, onStepTile });
  const { scorePopup, broadcastState, interpolateRemote } = usePlayerNetwork(player, isLocal);
  const { updateCamera, snapCamera } = usePlayerCamera({
    isLocal, gameStatus, isAlive: player.getState("isAlive") !== false,
    spawnX, spawnY, spawnZ, lobbySpawnX, lobbySpawnY, lobbySpawnZ, topFloorY
  });
  const { isGroundedRef, isMovingRef, isRunningRef, updatePhysics } = usePlayerPhysics({
    player, isLocal, isMobile, gameStatus,
    lobbySpawnX, lobbySpawnY, lobbySpawnZ, matchSpawnX, matchSpawnY, matchSpawnZ, topFloorY
  });

  const prevGameStatusRef = useRef(gameStatus);
  const isInitialMountRef = useRef(true);

  // Transition handler
  useEffect(() => {
    if (!isLocal) return;

    const prevStatus = prevGameStatusRef.current;
    const isFirst = isInitialMountRef.current;
    isInitialMountRef.current = false;
    prevGameStatusRef.current = gameStatus;

    const isLobbyNow = gameStatus === "LOBBY" || gameStatus === "ROUND_OVER";
    const wasLobbyBefore = prevStatus === "LOBBY" || prevStatus === "ROUND_OVER";

    if (!isFirst && isLobbyNow === wasLobbyBefore) return;

    const targetX = isLobbyNow ? lobbySpawnX : matchSpawnX;
    const targetY = isLobbyNow ? lobbySpawnY : matchSpawnY;
    const targetZ = isLobbyNow ? lobbySpawnZ : matchSpawnZ;

    snapCamera(targetX, targetY, targetZ);
    player.setState("pos", { x: targetX, y: targetY, z: targetZ });
    player.setState("vel", { x: 0, y: 0, z: 0 });
    player.setState("isAlive", true);
    player.setState("deathReason", null);
    player.setState("isMoving", false);
    player.setState("isRunning", false);

    if (rbRef.current) {
      rbRef.current.setTranslation({ x: targetX, y: targetY, z: targetZ }, true);
      rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, [gameStatus, isLocal, player, lobbySpawnX, lobbySpawnY, lobbySpawnZ, matchSpawnX, matchSpawnY, matchSpawnZ, snapCamera]);

  useFrame((state, delta) => {
    if (isLocal) {
      if (!rbRef.current || !visualRef.current) return;
      
      const physicsResult = updatePhysics(
        delta, rbRef.current, visualRef.current, world, rapier,
        getKeys(), touchDirection.current, touchJump.current, updateActivity
      );

      touchJump.current = false; // Reset after reading

      if (physicsResult) {
        const { translation, velocity, grounded, horizontalSpeed } = physicsResult;
        activeLocalPlayerPos.x = translation.x;
        activeLocalPlayerPos.y = translation.y;
        activeLocalPlayerPos.z = translation.z;
        activeLocalPlayerPos.isAlive = player.getState("isAlive") !== false;

        broadcastState(translation, velocity);

        if (gameStatus === "PLAYING" && grounded && Math.abs(velocity.y) < 1.2) {
          detectTiles(translation.x, translation.y, translation.z, horizontalSpeed);
        }
      }
      
      updateCamera(state, physicsResult ? physicsResult.translation : null);
    } else {
      interpolateRemote(rbRef.current);
      
      const netVel = player.getState<{x: number, y: number, z: number}>("vel");
      if (netVel && visualRef.current && (Math.abs(netVel.x) > 0.1 || Math.abs(netVel.z) > 0.1)) {
        const targetAngle = Math.atan2(netVel.x, netVel.z);
        let diff = (targetAngle - visualRef.current.rotation.y) % (Math.PI * 2);
        if (diff < -Math.PI) diff += Math.PI * 2;
        if (diff > Math.PI) diff -= Math.PI * 2;
        visualRef.current.rotation.y += diff * 0.35;
      }
      
      isMovingRef.current = player.getState("isMoving") || false;
      isRunningRef.current = player.getState("isRunning") || false;
    }
  });

  const isAlive = player.getState("isAlive") !== false;
  const playerColor = player.getState("color") || player.getProfile()?.color?.hex || "#38bdf8";
  const playerName = player.getState("name") || player.getProfile()?.name || `Player ${player.id.slice(0, 3)}`;
  const skinType = player.getState("skin") || "robot";
  
  const lastChat = player.getState<{text: string, timestamp: number}>("lastChat");
  const isChatActive = isLobbyMode && lastChat && Date.now() - lastChat.timestamp < 4500;
  const isAfk = Boolean(player.getState("isAfk"));

  return (
    <group>
      <RigidBody
        ref={rbRef}
        type={isLocal ? "dynamic" : "kinematicPosition"}
        colliders={false}
        position={[spawnX, spawnY, spawnZ]}
        enabledTranslations={[true, true, true]}
        enabledRotations={[false, false, false]}
        userData={{ type: "player", playerId: player.id }}
        linearDamping={0.4}
        angularDamping={1.0}
        ccd={true}
      >
        <CapsuleCollider args={[0.32, 0.30]} position={[0, 0.20, 0]} friction={0} restitution={0} />

        <group ref={visualRef} visible={isAlive}>
          <CharacterModel
            type={skinType as SkinId}
            avatar={player.getState("avatar")}
            color={playerColor as string}
            isMovingRef={isLocal ? isMovingRef : undefined}
            isGroundedRef={isLocal ? isGroundedRef : undefined}
            isRunningRef={isLocal ? isRunningRef : undefined}
            isMoving={!isLocal ? Boolean(player.getState("isMoving")) : undefined}
            isGrounded={!isLocal ? (player.getState<{y: number}>("vel") ? Math.abs(player.getState<{y: number}>("vel")!.y) < 0.8 : true) : undefined}
            isRunning={!isLocal ? Boolean(player.getState("isRunning")) : undefined}
          />
        </group>

        {isAlive && (
          <Html distanceFactor={10} position={[0, 1.5, 0]} center zIndexRange={[10, 0]}>
            <div className="flex flex-col items-center pointer-events-none select-none">
              {scorePopup && (
                <div
                  key={scorePopup.id}
                  className="mb-1 text-2xl font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce"
                >
                  +{scorePopup.amount}
                </div>
              )}

              {isChatActive && (
                <div className="mb-2 px-3 py-1.5 rounded-2xl bg-white/95 text-slate-900 text-xs font-black shadow-2xl border-2 border-sky-400 max-w-[200px] text-center break-words animate-in zoom-in-90 duration-150 relative">
                  <span>{lastChat.text}</span>
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white absolute -bottom-[6px] left-1/2 -translate-x-1/2" />
                </div>
              )}

              <div
                className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow bg-slate-900/80 border border-slate-700 whitespace-nowrap flex items-center gap-1.5"
                style={{ borderLeftColor: playerColor as string, borderLeftWidth: "4px" }}
              >
                <span>{playerName as string}</span>
                {isAfk && (
                  <span className="text-[9px] text-amber-300 font-mono font-bold bg-amber-950/90 px-1 py-0.5 rounded border border-amber-400/40 uppercase">
                    AFK
                  </span>
                )}
                <span className="text-[9px] text-slate-400 capitalize bg-slate-800 px-1 rounded">
                  {skinType as string}
                </span>
              </div>
            </div>
          </Html>
        )}
      </RigidBody>
    </group>
  );
}
