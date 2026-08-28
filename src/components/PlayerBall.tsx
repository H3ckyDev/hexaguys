import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, CapsuleCollider } from "@react-three/rapier";
import { useKeyboardControls, Html } from "@react-three/drei";
import { isHost, RPC } from "playroomkit";
import { CharacterModel } from "./CharacterModel";
import { playJumpSound, playFallSound, playScoreNotificationSound } from "../utils/sounds";
import { worldToHex, isHexInGrid } from "./HexGrid";
import { sileo } from "sileo";
import * as THREE from "three";

function shortestAngleDiff(target: number, current: number) {
  let diff = (target - current) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return diff;
}

interface PlayerBallProps {
  player: any; // Estado de jugador en Playroom
  playerIndex?: number;
  totalPlayers?: number;
  isLocal: boolean;
  gameStatus: string;
  floorsCount?: number;
  mapId?: string;
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
  
  // Cálculo de posiciones de aparición en la Caja de Cartón (Lobby en X=60) y en la Torre (Partida en X=0)
  const total = Math.max(1, totalPlayers);
  const angle = (playerIndex / total) * Math.PI * 2;
  const spawnDist = total > 1 ? 2.4 : 0;
  
  // 1. Posición dentro de la Caja de Cartón del Lobby (Piso en Y=0.2, spawn en Y=1.0)
  const lobbySpawnX = 60 + Math.cos(angle) * Math.min(2.2, spawnDist);
  const lobbySpawnY = 1.0;
  const lobbySpawnZ = Math.sin(angle) * Math.min(2.2, spawnDist);

  // 2. Posición en la cima de la Torre Hexagonal
  const topFloorY = (floorsCount - 1) * 4.5;
  const matchSpawnX = Math.cos(angle) * spawnDist;
  const matchSpawnY = topFloorY + 1.2;
  const matchSpawnZ = Math.sin(angle) * spawnDist;

  // Determinar posición según el estado actual (Lobby y Fin de Ronda en la Caja de Cartón)
  const isLobbyMode = gameStatus === "LOBBY" || gameStatus === "ROUND_OVER";
  const spawnX = isLobbyMode ? lobbySpawnX : matchSpawnX;
  const spawnY = isLobbyMode ? lobbySpawnY : matchSpawnY;
  const spawnZ = isLobbyMode ? lobbySpawnZ : matchSpawnZ;

  const smoothCamTarget = useRef(new THREE.Vector3(spawnX, spawnY, spawnZ));
  const prevGameStatusRef = useRef(gameStatus);
  const isInitialMountRef = useRef(true);
  const instantSnapCamRef = useRef(true);
  const [, getKeys] = useKeyboardControls();
  const [lastJumpTime, setLastJumpTime] = useState(0);
  const [isGrounded, setIsGrounded] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [scoreNotification, setScoreNotification] = useState<{ amount: number; id: string; timestamp: number } | null>(null);
  const lastScoreNotificationId = useRef<string | null>(null);
  const scoreNotificationTimeout = useRef<number | null>(null);
  const touchDirection = useRef({ x: 0, z: 0 });
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchJump = useRef(false);
  const lastActivityRef = useRef(Date.now());

  const playerColor = player.getState("color") || player.getProfile()?.color?.hex || "#38bdf8";
  const playerName = player.getState("name") || player.getProfile()?.name || `Player ${player.id.slice(0, 3)}`;
  
  // Skin del jugador
  const skinType = player.getState("skin") || "robot";

  useEffect(() => {
    if (!isLocal || !isMobile) return;

    const isInteractiveTarget = (target: EventTarget | null) => {
      return target instanceof Element && Boolean(target.closest("button, input, textarea, a"));
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (isInteractiveTarget(event.target)) return;
      const touch = event.changedTouches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      touchDirection.current = { x: 0, z: 0 };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!touchStart.current) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const distance = Math.hypot(deltaX, deltaY);
      const maxDistance = 90;

      if (distance > 8) {
        event.preventDefault();
        const strength = Math.min(distance, maxDistance) / maxDistance;
        touchDirection.current = {
          x: (deltaX / distance) * strength,
          z: (deltaY / distance) * strength,
        };
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!touchStart.current) return;
      const touch = event.changedTouches[0];
      const distance = Math.hypot(
        touch.clientX - touchStart.current.x,
        touch.clientY - touchStart.current.y,
      );
      const duration = Date.now() - touchStart.current.time;

      if (distance < 18 && duration < 350) {
        touchJump.current = true;
      }
      touchStart.current = null;
      touchDirection.current = { x: 0, z: 0 };
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isLocal, isMobile]);

  // Teletransporte EXCLUSIVO ante transiciones reales de estado (Lobby <-> Partida)
  useEffect(() => {
    if (!isLocal) return;

    const prevStatus = prevGameStatusRef.current;
    const isFirst = isInitialMountRef.current;
    isInitialMountRef.current = false;
    prevGameStatusRef.current = gameStatus;

    const isLobbyNow = gameStatus === "LOBBY" || gameStatus === "ROUND_OVER";
    const wasLobbyBefore = prevStatus === "LOBBY" || prevStatus === "ROUND_OVER";

    // Si ya estábamos en el Lobby y seguimos en el Lobby (o viceversa), NO re-spawnear al jugador
    if (!isFirst && isLobbyNow === wasLobbyBefore) {
      return;
    }

    // A. Transición hacia el Lobby (Caja de Cartón en X=60)
    if (isLobbyNow) {
      instantSnapCamRef.current = true;
      smoothCamTarget.current.set(lobbySpawnX, lobbySpawnY, lobbySpawnZ);
      player.setState("pos", { x: lobbySpawnX, y: lobbySpawnY, z: lobbySpawnZ });
      player.setState("vel", { x: 0, y: 0, z: 0 });
      player.setState("isAlive", true);
      player.setState("deathReason", null);
      player.setState("isMoving", false);
      player.setState("isRunning", false);

      if (rbRef.current) {
        rbRef.current.setTranslation({ x: lobbySpawnX, y: lobbySpawnY, z: lobbySpawnZ }, true);
        rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    }

    // B. Transición hacia la Partida (Cima de la Torre Hexagonal en X=0)
    if (!isLobbyNow) {
      instantSnapCamRef.current = true;
      smoothCamTarget.current.set(matchSpawnX, matchSpawnY, matchSpawnZ);
      player.setState("pos", { x: matchSpawnX, y: matchSpawnY, z: matchSpawnZ });
      player.setState("vel", { x: 0, y: 0, z: 0 });
      player.setState("isAlive", true);
      player.setState("deathReason", null);
      player.setState("isMoving", false);
      player.setState("isRunning", false);

      if (rbRef.current) {
        rbRef.current.setTranslation({ x: matchSpawnX, y: matchSpawnY, z: matchSpawnZ }, true);
        rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
  }, [gameStatus, isLocal, player, lobbySpawnX, lobbySpawnY, lobbySpawnZ, matchSpawnX, matchSpawnY, matchSpawnZ]);

  // Detección de inactividad AFK confiable con listeners globales en fase de captura (sin auto-kick)
  useEffect(() => {
    if (!isLocal || !player) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (player.getState("isAfk")) {
        player.setState("isAfk", false);
      }
    };

    const interval = setInterval(() => {
      // Si el usuario está escribiendo o interactuando con inputs, se mantiene activo
      const isTyping = typeof document !== "undefined" && (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      );

      if (isTyping) {
        lastActivityRef.current = Date.now();
        if (player.getState("isAfk")) {
          player.setState("isAfk", false);
        }
        return;
      }

      const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      const isInactive = Date.now() - lastActivityRef.current > 20000; // 20s de inactividad

      const shouldBeAfk = isHidden || isInactive;
      const currentAfk = Boolean(player.getState("isAfk"));

      if (shouldBeAfk && !currentAfk) {
        player.setState("isAfk", true);
        sileo.warning({
          title: "Inactividad Detectada",
          description: "Has entrado en modo AFK por inactividad prolongada.",
        });
      } else if (!shouldBeAfk && currentAfk) {
        player.setState("isAfk", false);
      }
    }, 1000);

    // Listeners globales en fase de captura para interceptar cualquier pulsación o movimiento
    const captureOptions = { capture: true, passive: true };
    window.addEventListener("mousemove", handleActivity, captureOptions);
    window.addEventListener("keydown", handleActivity, captureOptions);
    window.addEventListener("input", handleActivity, captureOptions);
    window.addEventListener("pointerdown", handleActivity, captureOptions);
    window.addEventListener("click", handleActivity, captureOptions);
    window.addEventListener("touchstart", handleActivity, captureOptions);
    window.addEventListener("touchmove", handleActivity, captureOptions);
    window.addEventListener("focus", handleActivity, captureOptions);
    window.addEventListener("wheel", handleActivity, captureOptions);
    document.addEventListener("visibilitychange", handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleActivity, captureOptions);
      window.removeEventListener("keydown", handleActivity, captureOptions);
      window.removeEventListener("input", handleActivity, captureOptions);
      window.removeEventListener("pointerdown", handleActivity, captureOptions);
      window.removeEventListener("click", handleActivity, captureOptions);
      window.removeEventListener("touchstart", handleActivity, captureOptions);
      window.removeEventListener("touchmove", handleActivity, captureOptions);
      window.removeEventListener("focus", handleActivity, captureOptions);
      window.removeEventListener("wheel", handleActivity, captureOptions);
      document.removeEventListener("visibilitychange", handleActivity);
    };
  }, [isLocal, player]);

  const userData = { type: "player", playerId: player.id };

  useFrame((state) => {
    // 1. CONTROLADOR DE JUGADOR LOCAL
    if (isLocal) {
      if (!rbRef.current || !visualRef.current) return;

      const keys = getKeys();
      const linvel = rbRef.current.linvel();
      const translation = rbRef.current.translation();
      const isAlive = player.getState("isAlive") !== false;

      // Verificación de suelo basada en velocidad Y
      const grounded = Math.abs(linvel.y) < 0.35;
      setIsGrounded(grounded);

      // Auto-reaparición de seguridad en LOBBY y ROUND_OVER (Caja de Cartón) o COUNTDOWN (Torre)
      if ((gameStatus === "LOBBY" || gameStatus === "ROUND_OVER") && translation.y < -5.0) {
        rbRef.current.setTranslation({ x: lobbySpawnX, y: lobbySpawnY, z: lobbySpawnZ }, true);
        rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      } else if (gameStatus === "COUNTDOWN" && translation.y < topFloorY - 1.5) {
        rbRef.current.setTranslation({ x: matchSpawnX, y: matchSpawnY, z: matchSpawnZ }, true);
        rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      }

      if (isAlive) {
        // Comprobar si el usuario está escribiendo en algún input de texto
        const isTyping = typeof document !== "undefined" && (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        );

        // Movimiento activo en PLAYING, LOBBY y COUNTDOWN
        let vx = 0;
        let vz = 0;
        
        const isSprinting = Boolean(keys.sprint);
        const speed = isSprinting ? 6.8 : 3.8;

        const isTabActive = typeof document === "undefined" || (document.hasFocus() && document.visibilityState === "visible");
        const canMove = (gameStatus === "PLAYING" || gameStatus === "LOBBY" || gameStatus === "COUNTDOWN") && isTabActive && !isTyping;

        if (canMove) {
          if (keys.forward) vz -= speed;
          if (keys.backward) vz += speed;
          if (keys.left) vx -= speed;
          if (keys.right) vx += speed;

          if (isMobile) {
            vx = touchDirection.current.x * speed;
            vz = touchDirection.current.z * speed;
          }

          // Normalizar movimiento diagonal
          if (vx !== 0 && vz !== 0) {
            vx *= 0.7071;
          }
        }

        // Físicas de salto
        let vy = linvel.y;
        if (canMove && (keys.jump || touchJump.current) && grounded && Date.now() - lastJumpTime > 400) {
          vy = 8.0;
          setLastJumpTime(Date.now());
          touchJump.current = false;
          playJumpSound();
        } else if (vy > 8.0) {
          // Prevenir impulsos físicos anómalos por desmonte de colisionadores que eleven al jugador
          vy = 8.0;
        }

        // Aplicar vector de velocidad con frenado instantáneo al soltar teclas
        if (rbRef.current) {
          rbRef.current.setLinvel({ x: vx, y: vy, z: vz }, true);
        }

        // Giro del personaje hacia la dirección de movimiento con alta reactividad
        const moving = Math.abs(vx) > 0.1 || Math.abs(vz) > 0.1;
        const running = moving && isSprinting;
        setIsMoving(moving);
        setIsRunning(running);
        player.setState("isMoving", moving);
        // Si el usuario está interactuando o desplazándose, limpiar AFK al instante
        if (canMove && (moving || keys.jump || touchJump.current || isTyping)) {
          lastActivityRef.current = Date.now();
          if (player.getState("isAfk")) {
            player.setState("isAfk", false);
          }
        }

        if (moving) {
          const targetAngle = Math.atan2(vx, vz);
          const diff = shortestAngleDiff(targetAngle, visualRef.current.rotation.y);
          // Giro suave y directo sin desvíos
          visualRef.current.rotation.y += diff * 0.35;

          // Inclinación dinámica en curva
          const targetTilt = Math.max(-0.25, Math.min(0.25, -diff * 0.15));
          visualRef.current.rotation.z = THREE.MathUtils.lerp(
            visualRef.current.rotation.z,
            targetTilt,
            0.2
          );
        } else {
          // Restablecer inclinación al detenerse
          visualRef.current.rotation.z = THREE.MathUtils.lerp(
            visualRef.current.rotation.z,
            0,
            0.2
          );
        }

        // Verificación de caída al vacío
        if (translation.y < -8) {
          player.setState("isAlive", false);
          player.setState("isMoving", false);
          player.setState("vel", { x: 0, y: 0, z: 0 });
          rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rbRef.current.setTranslation({ x: 0, y: -25, z: 0 }, true);
          playFallSound();
        } else {
          // Sincronizar posición y velocidad
          player.setState("pos", { x: translation.x, y: translation.y, z: translation.z });
          player.setState("vel", { x: vx, y: vy, z: vz });

          // Detección proactiva calibrada de baldosas bajo los pies
          if (gameStatus === "PLAYING" && (grounded || Math.abs(linvel.y) < 1.6)) {
            const numFloors = Math.max(2, Math.min(8, floorsCount));
            const floorDistance = 4.5;
            for (let f = 0; f < numFloors; f++) {
              const floorY = (numFloors - 1 - f) * floorDistance;
              if (translation.y >= floorY - 0.4 && translation.y <= floorY + 1.2) {
                const horizontalSpeed = Math.hypot(vx, vz);
                const isStationary = horizontalSpeed < 0.5;

                // Al desplazarse rápido: huella pura en el centro exacto para no activar baldosas laterales
                // En reposo / AFK: micro-muestreo (±0.12) para que los bordes no se queden flotando
                const footOffsets = isStationary
                  ? [
                      { dx: 0, dz: 0 },
                      { dx: 0.12, dz: 0 },
                      { dx: -0.12, dz: 0 },
                      { dx: 0, dz: 0.12 },
                      { dx: 0, dz: -0.12 },
                    ]
                  : [{ dx: 0, dz: 0 }];

                const checkedTiles = new Set<string>();
                for (const off of footOffsets) {
                  const { q, r } = worldToHex(translation.x + off.dx, translation.z + off.dz);
                  if (isHexInGrid(q, r, mapId)) {
                    const tileId = `tile_${f}_${q}_${r}`;
                    if (!checkedTiles.has(tileId)) {
                      checkedTiles.add(tileId);
                      onStepTile?.(tileId);
                      RPC.call("stepOnTile", tileId, RPC.Mode.HOST);
                    }
                  }
                }
                break;
              }
            }
          }
        }

        // Seguimiento de cámara en tercera persona con anclaje instantáneo al reaparecer
        if (instantSnapCamRef.current) {
          smoothCamTarget.current.set(translation.x, translation.y, translation.z);
          state.camera.position.set(
            translation.x,
            translation.y + 6.8,
            translation.z + 8.8
          );
          state.camera.lookAt(
            translation.x,
            translation.y + 0.5,
            translation.z
          );
          instantSnapCamRef.current = false;
        } else {
          smoothCamTarget.current.lerp(
            new THREE.Vector3(translation.x, translation.y, translation.z),
            0.08
          );
          state.camera.position.set(
            smoothCamTarget.current.x,
            smoothCamTarget.current.y + 6.8,
            smoothCamTarget.current.z + 8.8
          );
          state.camera.lookAt(
            smoothCamTarget.current.x,
            smoothCamTarget.current.y + 0.5,
            smoothCamTarget.current.z
          );
        }
      } else {
        // Congelar cuerpo físico mientras está caído / espectando
        if (rbRef.current) {
          rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
          rbRef.current.setTranslation({ x: 0, y: -25, z: 0 }, true);
        }

        const defaultCamCenter = isLobbyMode
          ? new THREE.Vector3(lobbySpawnX, lobbySpawnY, lobbySpawnZ)
          : new THREE.Vector3(0, topFloorY / 2, 0);
        smoothCamTarget.current.lerp(defaultCamCenter, 0.05);
        state.camera.position.set(
          smoothCamTarget.current.x,
          smoothCamTarget.current.y + (isLobbyMode ? 6.8 : 15),
          smoothCamTarget.current.z + (isLobbyMode ? 8.8 : 18)
        );
        state.camera.lookAt(
          smoothCamTarget.current.x,
          smoothCamTarget.current.y + (isLobbyMode ? 0.5 : 0),
          smoothCamTarget.current.z
        );
      }
    }
    // 2. INTERPOLACIÓN DE JUGADORES REMOTOS
    else {
      const netPos = player.getState("pos");
      const netVel = player.getState("vel");
      const netMoving = player.getState("isMoving") || false;
      const netRunning = player.getState("isRunning") || false;
      const isAlive = player.getState("isAlive") !== false;

      setIsMoving(netMoving);
      setIsRunning(netRunning);

      // Detección proactiva en el Host para jugadores remotos (AFK / bordes)
      if (isHost() && isAlive && gameStatus === "PLAYING" && netPos) {
        const numFloors = Math.max(2, Math.min(8, floorsCount));
        const floorDistance = 4.5;
        for (let f = 0; f < numFloors; f++) {
          const floorY = (numFloors - 1 - f) * floorDistance;
          if (netPos.y >= floorY - 0.4 && netPos.y <= floorY + 1.2) {
            const remoteSpeed = netVel ? Math.hypot(netVel.x, netVel.z) : 0;
            const isStationary = remoteSpeed < 0.5;
            const footOffsets = isStationary
              ? [
                  { dx: 0, dz: 0 },
                  { dx: 0.12, dz: 0 },
                  { dx: -0.12, dz: 0 },
                  { dx: 0, dz: 0.12 },
                  { dx: 0, dz: -0.12 },
                ]
              : [{ dx: 0, dz: 0 }];

            const checkedTiles = new Set<string>();
            for (const off of footOffsets) {
              const { q, r } = worldToHex(netPos.x + off.dx, netPos.z + off.dz);
              if (isHexInGrid(q, r, mapId)) {
                const tileId = `tile_${f}_${q}_${r}`;
                if (!checkedTiles.has(tileId)) {
                  checkedTiles.add(tileId);
                  onStepTile?.(tileId);
                  RPC.call("stepOnTile", tileId, RPC.Mode.HOST);
                }
              }
            }
            break;
          }
        }
      }

      if (!isAlive) {
        if (rbRef.current) {
          rbRef.current.setTranslation({ x: 0, y: -50, z: 0 }, true);
        }
        return;
      }

      if (netPos && rbRef.current) {
        const currentY = rbRef.current.translation().y;
        // Si el jugador remoto estaba en el abismo (-50), teletransportarlo al instante sin lerp
        if (currentY < -15) {
          rbRef.current.setTranslation(netPos, true);
        } else {
          const nextX = THREE.MathUtils.lerp(rbRef.current.translation().x, netPos.x, 0.25);
          const nextY = THREE.MathUtils.lerp(currentY, netPos.y, 0.25);
          const nextZ = THREE.MathUtils.lerp(rbRef.current.translation().z, netPos.z, 0.25);
          
          rbRef.current.setNextKinematicTranslation({
            x: nextX,
            y: nextY,
            z: nextZ,
          });
        }

        // Estado de suelo para jugadores remotos
        setIsGrounded(netVel ? Math.abs(netVel.y) < 0.35 : true);
      }

      // Rotación suave para jugadores remotos
      if (netVel && visualRef.current && (Math.abs(netVel.x) > 0.1 || Math.abs(netVel.z) > 0.1)) {
        const targetAngle = Math.atan2(netVel.x, netVel.z);
        const diff = shortestAngleDiff(targetAngle, visualRef.current.rotation.y);
        visualRef.current.rotation.y += diff * 0.35;
      }
    }
  });

  const isAlive = player.getState("isAlive") !== false;
  const shouldBeVisible = isAlive;

  useEffect(() => {
    const interval = setInterval(() => {
      const notification = player.getState("scoreNotification") as { amount: number; id: string; timestamp: number } | undefined;
      if (!notification || notification.id === lastScoreNotificationId.current) return;

      lastScoreNotificationId.current = notification.id;
      setScoreNotification(notification);
      playScoreNotificationSound();

      if (scoreNotificationTimeout.current !== null) {
        window.clearTimeout(scoreNotificationTimeout.current);
      }
      scoreNotificationTimeout.current = window.setTimeout(() => {
        setScoreNotification(null);
        scoreNotificationTimeout.current = null;
      }, 2000);
    }, 100);

    return () => {
      clearInterval(interval);
      if (scoreNotificationTimeout.current !== null) {
        window.clearTimeout(scoreNotificationTimeout.current);
      }
    };
  }, [player]);

  // Comprobar si hay un mensaje de chat reciente para mostrar en la burbuja 3D (duración de 4.5s)
  const lastChat = player.getState("lastChat");
  const isChatActive = lastChat && Date.now() - lastChat.timestamp < 4500;

  // Comprobar estado de inactividad AFK
  const isAfk = Boolean(player.getState("isAfk"));

  return (
    <group>
      <RigidBody
        ref={rbRef}
        type={isLocal ? "dynamic" : "kinematicPosition"}
        colliders={false} // Colisionador de cápsula personalizado
        position={[spawnX, spawnY, spawnZ]}
        enabledTranslations={[true, true, true]}
        enabledRotations={[false, false, false]} // Bloqueo total de rotación física para que el giro visual sea 100% puro y preciso
        userData={userData}
        linearDamping={0.4}
        angularDamping={1.0}
        ccd={true}
      >
        {/* Colisionador de cápsula perfectamente alineado; fricción cero para evitar atascos */}
        <CapsuleCollider args={[0.32, 0.30]} position={[0, 0.20, 0]} friction={0} restitution={0} />

        {/* Modelo visual 3D del personaje */}
        <group ref={visualRef} visible={shouldBeVisible}>
          <CharacterModel
            type={skinType}
            avatar={player.getState("avatar")}
            color={playerColor}
            isMoving={isMoving}
            isGrounded={isGrounded}
            isRunning={isRunning}
          />
        </group>

        {/* Etiqueta flotante con nombre, insignia AFK y burbuja de chat 3D */}
        {shouldBeVisible && (
          <Html distanceFactor={10} position={[0, 1.5, 0]} center zIndexRange={[10, 0]}>
            <div className="flex flex-col items-center pointer-events-none select-none">
              {scoreNotification && (
                <div
                  key={scoreNotification.id}
                  className="mb-1 text-2xl font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce"
                >
                  +{scoreNotification.amount}
                </div>
              )}

              {/* Burbuja de diálogo 3D flotante */}
              {isChatActive && (
                <div className="mb-2 px-3 py-1.5 rounded-2xl bg-white/95 text-slate-900 text-xs font-black shadow-2xl border-2 border-sky-400 max-w-[200px] text-center break-words animate-in zoom-in-90 duration-150 relative">
                  <span>{lastChat.text}</span>
                  {/* Flecha inferior de la burbuja */}
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white absolute -bottom-[6px] left-1/2 -translate-x-1/2" />
                </div>
              )}

              {/* Insignia de Apodo, AFK y Skin */}
              <div
                className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow bg-slate-900/80 border border-slate-700 whitespace-nowrap flex items-center gap-1.5"
                style={{ borderLeftColor: playerColor, borderLeftWidth: "4px" }}
              >
                <span>{playerName}</span>
                {isAfk && (
                  <span className="text-[9px] text-amber-300 font-mono font-bold bg-amber-950/90 px-1 py-0.5 rounded border border-amber-400/40 uppercase">
                    AFK
                  </span>
                )}
                <span className="text-[9px] text-slate-400 capitalize bg-slate-800 px-1 rounded">
                  {skinType}
                </span>
              </div>
            </div>
          </Html>
        )}
      </RigidBody>
    </group>
  );
}
