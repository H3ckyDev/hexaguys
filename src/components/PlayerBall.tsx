import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, CapsuleCollider } from "@react-three/rapier";
import { useKeyboardControls, Html } from "@react-three/drei";
import { CharacterModel } from "./CharacterModel";
import { playJumpSound, playFallSound } from "../utils/sounds";
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
  showPlayerPing?: boolean;
}

export function PlayerBall({
  player,
  playerIndex = 0,
  totalPlayers = 1,
  isLocal,
  gameStatus,
  floorsCount = 3,
  showPlayerPing = false,
}: PlayerBallProps) {
  const rbRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<THREE.Group>(null);
  
  // Calculate distinct radial spawn position to guarantee zero collider overlaps on game start
  const total = Math.max(1, totalPlayers);
  const angle = (playerIndex / total) * Math.PI * 2;
  const spawnDist = total > 1 ? 2.4 : 0;
  const spawnX = Math.cos(angle) * spawnDist;
  const spawnZ = Math.sin(angle) * spawnDist;
  const topFloorY = (floorsCount - 1) * 4.5;
  const spawnY = topFloorY + 1.8;

  const smoothCamTarget = useRef(new THREE.Vector3(spawnX, spawnY, spawnZ));
  const [, getKeys] = useKeyboardControls();
  const [lastJumpTime, setLastJumpTime] = useState(0);
  const [isGrounded, setIsGrounded] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const playerColor = player.getState("color") || player.getProfile()?.color?.hex || "#38bdf8";
  const playerName = player.getState("name") || player.getProfile()?.name || `Player ${player.id.slice(0, 3)}`;
  
  // Fetch skin from playroom state (default to robot if not chosen)
  const skinType = player.getState("skin") || "robot";

  // Restablecer posición del jugador de forma segura solo al volver al Lobby si estaba caído
  useEffect(() => {
    if (isLocal && gameStatus === "LOBBY") {
      const translation = rbRef.current?.translation();
      if (!player.getState("isAlive") || (translation && translation.y < topFloorY - 2.0)) {
        smoothCamTarget.current.set(spawnX, spawnY, spawnZ);
        player.setState("pos", { x: spawnX, y: spawnY, z: spawnZ });
        player.setState("vel", { x: 0, y: 0, z: 0 });
        player.setState("isAlive", true);
        player.setState("isMoving", false);
        player.setState("isRunning", false);
        
        if (rbRef.current) {
          rbRef.current.setTranslation({ x: spawnX, y: spawnY, z: spawnZ }, true);
          rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rbRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
      }
    }
  }, [gameStatus, isLocal, player, spawnX, spawnY, spawnZ, topFloorY]);

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

      // Auto-reaparición en LOBBY o COUNTDOWN si cae por el borde
      if ((gameStatus === "LOBBY" || gameStatus === "COUNTDOWN") && translation.y < topFloorY - 1.5) {
        rbRef.current.setTranslation({ x: spawnX, y: spawnY, z: spawnZ }, true);
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
          if (keys.right) vx -= speed;

          // Normalizar movimiento diagonal
          if (vx !== 0 && vz !== 0) {
            vx *= 0.7071;
          }
        }

        // Físicas de salto
        let vy = linvel.y;
        if (canMove && keys.jump && grounded && Date.now() - lastJumpTime > 400) {
          vy = 8.0;
          setLastJumpTime(Date.now());
          playJumpSound();
        }

        // Aplicar vector de velocidad con frenado instantáneo al soltar teclas
        if (rbRef.current) {
          rbRef.current.setLinvel({ x: vx, y: vy, z: vz }, true);
        }

        // Turn character mesh in direction of movement
        const moving = Math.abs(vx) > 0.1 || Math.abs(vz) > 0.1;
        const running = moving && isSprinting;
        setIsMoving(moving);
        setIsRunning(running);
        player.setState("isMoving", moving);
        player.setState("isRunning", running);

        if (moving) {
          const targetAngle = Math.atan2(vx, vz);
          const diff = shortestAngleDiff(targetAngle, visualRef.current.rotation.y);
          // Smooth rotation along shortest angle path
          visualRef.current.rotation.y += diff * 0.22;

          // Dynamic banking / tilt into turn
          const targetTilt = -diff * 0.12;
          visualRef.current.rotation.z = THREE.MathUtils.lerp(
            visualRef.current.rotation.z,
            targetTilt,
            0.15
          );
        } else {
          // Reset tilt when standing still
          visualRef.current.rotation.z = THREE.MathUtils.lerp(
            visualRef.current.rotation.z,
            0,
            0.15
          );
        }

        // Void fall check
        if (translation.y < -8) {
          player.setState("isAlive", false);
          player.setState("isMoving", false);
          player.setState("vel", { x: 0, y: 0, z: 0 });
          rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rbRef.current.setTranslation({ x: 0, y: -20, z: 0 }, true);
          playFallSound(); // Play procedural death sweep
        } else {
          // Broadcast position & velocity
          player.setState("pos", { x: translation.x, y: translation.y, z: translation.z });
          player.setState("vel", { x: vx, y: vy, z: vz });
        }

        if (gameStatus === "ROUND_OVER") {
          // Despawn local player from active field on round end
          rbRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rbRef.current.setTranslation({ x: 0, y: -50, z: 0 }, true);
          smoothCamTarget.current.lerp(new THREE.Vector3(0, 0, 0), 0.05);
          state.camera.position.set(
            smoothCamTarget.current.x,
            smoothCamTarget.current.y + 15,
            smoothCamTarget.current.z + 18
          );
          state.camera.lookAt(0, 0, 0);
        } else {
          // Stabilized gimbal-style camera follow
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
        // Smooth spectate camera
        smoothCamTarget.current.lerp(new THREE.Vector3(0, 0, 0), 0.05);
        state.camera.position.set(
          smoothCamTarget.current.x,
          smoothCamTarget.current.y + 15,
          smoothCamTarget.current.z + 18
        );
        state.camera.lookAt(0, 0, 0);
      }
    }
    // 2. REMOTE PLAYER INTERPOLATION
    else {
      const netPos = player.getState("pos");
      const netVel = player.getState("vel");
      const netMoving = player.getState("isMoving") || false;
      const netRunning = player.getState("isRunning") || false;
      const isAlive = player.getState("isAlive") !== false;

      setIsMoving(netMoving);
      setIsRunning(netRunning);

      if (!isAlive) {
        if (rbRef.current) {
          rbRef.current.setTranslation({ x: 0, y: -50, z: 0 }, true);
        }
        return;
      }

      if (netPos && rbRef.current) {
        const nextX = THREE.MathUtils.lerp(rbRef.current.translation().x, netPos.x, 0.25);
        const nextY = THREE.MathUtils.lerp(rbRef.current.translation().y, netPos.y, 0.25);
        const nextZ = THREE.MathUtils.lerp(rbRef.current.translation().z, netPos.z, 0.25);
        
        rbRef.current.setNextKinematicTranslation({
          x: nextX,
          y: nextY,
          z: nextZ,
        });

        // Estado de suelo para jugadores remotos
        setIsGrounded(netVel ? Math.abs(netVel.y) < 0.35 : true);
      }

      // Rotación suave para jugadores remotos
      if (netVel && visualRef.current && (Math.abs(netVel.x) > 0.1 || Math.abs(netVel.z) > 0.1)) {
        const targetAngle = Math.atan2(netVel.x, netVel.z);
        const diff = shortestAngleDiff(targetAngle, visualRef.current.rotation.y);
        visualRef.current.rotation.y += diff * 0.22;
      }
    }
  });

  const isAlive = player.getState("isAlive") !== false;
  const shouldBeVisible = isAlive && gameStatus !== "ROUND_OVER";

  // Comprobar si hay un mensaje de chat reciente para mostrar en la burbuja 3D (duración de 4.5s)
  const lastChat = player.getState("lastChat");
  const isChatActive = lastChat && Date.now() - lastChat.timestamp < 4500;

  return (
    <group>
      <RigidBody
        ref={rbRef}
        type={isLocal ? "dynamic" : "kinematicPosition"}
        colliders={false} // Colisionador de cápsula personalizado
        position={[spawnX, spawnY, spawnZ]}
        enabledTranslations={[true, true, true]}
        enabledRotations={[false, true, false]} // Bloqueo de rotación en X y Z para mantener al personaje erguido
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
            color={playerColor}
            isMoving={isMoving}
            isGrounded={isGrounded}
            isRunning={isRunning}
          />
        </group>

        {/* Etiqueta flotante con nombre y burbuja de chat 3D */}
        {shouldBeVisible && (
          <Html distanceFactor={10} position={[0, 1.5, 0]} center>
            <div className="flex flex-col items-center pointer-events-none select-none">
              {/* Burbuja de diálogo 3D flotante */}
              {isChatActive && (
                <div className="mb-2 px-3 py-1.5 rounded-2xl bg-white/95 text-slate-900 text-xs font-black shadow-2xl border-2 border-sky-400 max-w-[200px] text-center break-words animate-in zoom-in-90 duration-150 relative">
                  <span>{lastChat.text}</span>
                  {/* Flecha inferior de la burbuja */}
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white absolute -bottom-[6px] left-1/2 -translate-x-1/2" />
                </div>
              )}

              {/* Insignia de Apodo, Ping (opcional) y Skin */}
              <div
                className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow bg-slate-900/80 border border-slate-700 whitespace-nowrap flex items-center gap-1.5"
                style={{ borderLeftColor: playerColor, borderLeftWidth: "4px" }}
              >
                <span>{playerName}</span>
                {showPlayerPing && (
                  <span className="text-[9px] text-sky-300 font-mono bg-sky-950/80 px-1 py-0.2 rounded border border-sky-400/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    {player.getState("ping") || (isLocal ? 24 : 32)}ms
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
