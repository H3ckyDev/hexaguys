import { useEffect, useRef } from "react";
import { sileo } from "sileo";
import type { PlayerState, GameStatus } from "../types/game";
import { AFK_TIMEOUT_MS } from "../constants/game";

interface UseAfkTrackerProps {
  player: PlayerState;
  isLocal: boolean;
  gameStatus: GameStatus;
}

export function useAfkTracker({ player, isLocal }: UseAfkTrackerProps) {
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!isLocal || !player) return;

    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (player.getState("isAfk")) {
        player.setState("isAfk", false);
      }
    };

    const interval = setInterval(() => {
      const isTyping = typeof document !== "undefined" && (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      );

      if (isTyping) {
        handleActivity();
        return;
      }

      const isHidden = typeof document !== "undefined" && document.visibilityState === "hidden";
      const isInactive = Date.now() - lastActivityRef.current > AFK_TIMEOUT_MS;

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

  const updateActivity = () => {
    lastActivityRef.current = Date.now();
    if (player.getState("isAfk")) {
      player.setState("isAfk", false);
    }
  };

  return { updateActivity };
}
