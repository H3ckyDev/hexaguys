import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { RapierRigidBody } from "@react-three/rapier";
import type { PlayerState } from "../types/game";
import { NETWORK_TICK_RATE_MS } from "../constants/game";
import { playScoreNotificationSound } from "../utils/sounds";

export function usePlayerNetwork(player: PlayerState, isLocal: boolean) {
  const lastNetworkUpdateRef = useRef(0);
  const [scorePopup, setScorePopup] = useState<{ amount: number; id: string; timestamp: number } | null>(null);
  const lastScoreNotificationId = useRef<string | null>(null);
  const scoreNotificationTimeout = useRef<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const notification = player.getState("scoreNotification") as { amount: number; id: string; timestamp: number } | undefined;
      if (!notification || notification.id === lastScoreNotificationId.current) return;

      lastScoreNotificationId.current = notification.id;
      setScorePopup(notification);
      playScoreNotificationSound();

      if (scoreNotificationTimeout.current !== null) {
        window.clearTimeout(scoreNotificationTimeout.current);
      }
      scoreNotificationTimeout.current = window.setTimeout(() => {
        setScorePopup(null);
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

  const broadcastState = (translation: { x: number; y: number; z: number }, vel: { x: number; y: number; z: number }) => {
    if (!isLocal) return;
    const now = Date.now();
    if (now - lastNetworkUpdateRef.current >= NETWORK_TICK_RATE_MS) {
      player.setState("pos", translation);
      player.setState("vel", vel);
      lastNetworkUpdateRef.current = now;
    }
  };

  const interpolateRemote = (rb: RapierRigidBody | null) => {
    if (isLocal || !rb) return;

    const netPos = player.getState<{x: number, y: number, z: number}>("pos");
    const isAlive = player.getState("isAlive") !== false;

    if (!isAlive) {
      rb.setTranslation({ x: 0, y: -50, z: 0 }, true);
      return;
    }

    if (netPos) {
      const currentTranslation = rb.translation();
      if (currentTranslation.y < -15) {
        rb.setTranslation(netPos, true);
      } else {
        const nextX = THREE.MathUtils.lerp(currentTranslation.x, netPos.x, 0.25);
        const nextY = THREE.MathUtils.lerp(currentTranslation.y, netPos.y, 0.25);
        const nextZ = THREE.MathUtils.lerp(currentTranslation.z, netPos.z, 0.25);
        
        rb.setNextKinematicTranslation({
          x: nextX,
          y: nextY,
          z: nextZ,
        });
      }
    }
  };

  return { scorePopup, broadcastState, interpolateRemote };
}
