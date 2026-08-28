import { useRef } from "react";
import { playJumpSound, playFallSound } from "../utils/sounds";
import { RapierRigidBody } from "@react-three/rapier";
import type { PlayerState, GameStatus } from "../types/game";
import { WALK_SPEED, SPRINT_SPEED, JUMP_VELOCITY, JUMP_COOLDOWN_MS } from "../constants/game";
import * as THREE from "three";

interface UsePlayerPhysicsProps {
  player: PlayerState;
  isLocal: boolean;
  isMobile: boolean;
  gameStatus: GameStatus;
  lobbySpawnX: number;
  lobbySpawnY: number;
  lobbySpawnZ: number;
  matchSpawnX: number;
  matchSpawnY: number;
  matchSpawnZ: number;
  topFloorY: number;
}

function shortestAngleDiff(target: number, current: number) {
  let diff = (target - current) % (Math.PI * 2);
  if (diff < -Math.PI) diff += Math.PI * 2;
  if (diff > Math.PI) diff -= Math.PI * 2;
  return diff;
}

function dampedLerp(current: number, target: number, smoothing: number, delta: number): number {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * delta));
}

export function usePlayerPhysics({
  player,
  isLocal,
  isMobile,
  gameStatus,
  lobbySpawnX,
  lobbySpawnY,
  lobbySpawnZ,
  matchSpawnX,
  matchSpawnY,
  matchSpawnZ,
  topFloorY,
}: UsePlayerPhysicsProps) {
  const isGroundedRef = useRef(true);
  const isMovingRef = useRef(false);
  const isRunningRef = useRef(false);
  const lastJumpTime = useRef(0);

  const updatePhysics = (
    delta: number,
    rb: RapierRigidBody,
    visualRef: THREE.Group,
    world: any,
    rapier: any,
    keys: any,
    touchDirection: { x: number; z: number },
    touchJump: boolean,
    onActive: () => void
  ) => {
    if (!isLocal) return null;

    const linvel = rb.linvel();
    const translation = rb.translation();
    const isAlive = player.getState("isAlive") !== false;

    // Raycast for ground detection
    const origin = { x: translation.x, y: translation.y - 0.1, z: translation.z };
    const direction = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(origin, direction);
    const hit = world.castRay(ray, 0.4, true);
    const grounded = hit !== null;
    isGroundedRef.current = grounded;

    // Safety despawn
    if ((gameStatus === "LOBBY" || gameStatus === "ROUND_OVER") && translation.y < -5.0) {
      rb.setTranslation({ x: lobbySpawnX, y: lobbySpawnY, z: lobbySpawnZ }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    } else if (gameStatus === "COUNTDOWN" && translation.y < topFloorY - 1.5) {
      rb.setTranslation({ x: matchSpawnX, y: matchSpawnY, z: matchSpawnZ }, true);
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }

    if (isAlive) {
      const isTyping = typeof document !== "undefined" && (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      );

      let vx = 0;
      let vz = 0;
      
      const isSprinting = Boolean(keys.sprint);
      const speed = isSprinting ? SPRINT_SPEED : WALK_SPEED;

      const isTabActive = typeof document === "undefined" || (document.hasFocus() && document.visibilityState === "visible");
      const canMove = (gameStatus === "PLAYING" || gameStatus === "LOBBY" || gameStatus === "COUNTDOWN") && isTabActive && !isTyping;

      if (canMove) {
        if (keys.forward) vz -= speed;
        if (keys.backward) vz += speed;
        if (keys.left) vx -= speed;
        if (keys.right) vx += speed;

        if (isMobile) {
          vx = touchDirection.x * speed;
          vz = touchDirection.z * speed;
        }

        if (!isMobile && vx !== 0 && vz !== 0) {
          vx *= 0.7071;
          vz *= 0.7071;
        }
      }

      let vy = linvel.y;
      if (canMove && (keys.jump || touchJump) && grounded && Date.now() - lastJumpTime.current > JUMP_COOLDOWN_MS) {
        vy = JUMP_VELOCITY;
        lastJumpTime.current = Date.now();
        playJumpSound();
      } else if (vy > 8.0) {
        vy = 8.0;
      }

      rb.setLinvel({ x: vx, y: vy, z: vz }, true);

      const moving = Math.abs(vx) > 0.1 || Math.abs(vz) > 0.1;
      const running = moving && isSprinting;
      isMovingRef.current = moving;
      isRunningRef.current = running;
      player.setState("isMoving", moving);

      if (canMove && (moving || keys.jump || touchJump || isTyping)) {
        onActive();
      }

      if (moving) {
        const targetAngle = Math.atan2(vx, vz);
        const diff = shortestAngleDiff(targetAngle, visualRef.rotation.y);
        visualRef.rotation.y += diff * 20 * delta;

        const targetTilt = Math.max(-0.25, Math.min(0.25, -diff * 0.15));
        visualRef.rotation.z = dampedLerp(
          visualRef.rotation.z,
          targetTilt,
          12,
          delta
        );
      } else {
        visualRef.rotation.z = dampedLerp(
          visualRef.rotation.z,
          0,
          12,
          delta
        );
      }

      // Void death
      if (translation.y < -8) {
        player.setState("isAlive", false);
        player.setState("isMoving", false);
        player.setState("vel", { x: 0, y: 0, z: 0 });
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.setTranslation({ x: 0, y: -25, z: 0 }, true);
        playFallSound();
      }

      return { translation, velocity: { x: vx, y: vy, z: vz }, grounded, horizontalSpeed: Math.hypot(vx, vz) };
    } else {
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.setAngvel({ x: 0, y: 0, z: 0 }, true);
      rb.setTranslation({ x: 0, y: -25, z: 0 }, true);
      return null;
    }
  };

  return { isGroundedRef, isMovingRef, isRunningRef, updatePhysics, shortestAngleDiff };
}
