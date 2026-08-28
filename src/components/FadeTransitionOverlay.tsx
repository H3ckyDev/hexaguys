import { useEffect, useState, useRef } from "react";
import type { GameStatus } from "../types/game";

interface FadeTransitionOverlayProps {
  gameStatus: GameStatus;
}

export function FadeTransitionOverlay({ gameStatus }: FadeTransitionOverlayProps) {
  const [opacity, setOpacity] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const prevStatusRef = useRef<GameStatus>(gameStatus);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevStatusRef.current = gameStatus;
      return;
    }

    const prev = prevStatusRef.current;
    prevStatusRef.current = gameStatus;

    // Disparar transición cinematográfica al cambiar entre modos clave
    const isTransitionToMatch = (prev === "LOBBY" || prev === "ROUND_OVER") && gameStatus === "COUNTDOWN";
    const isTransitionToLobby = (prev === "PLAYING" || prev === "ROUND_OVER") && gameStatus === "LOBBY";
    const isRoundOver = prev === "PLAYING" && gameStatus === "ROUND_OVER";

    if (isTransitionToMatch || isTransitionToLobby || isRoundOver) {
      setIsVisible(true);
      setOpacity(1);

      const timer = setTimeout(() => {
        setOpacity(0);
        const hideTimer = setTimeout(() => {
          setIsVisible(false);
        }, 400);
        return () => clearTimeout(hideTimer);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [gameStatus]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[150] pointer-events-none bg-[#030712] transition-opacity duration-400 ease-in-out"
      style={{ opacity }}
    />
  );
}
