import { useEffect, useRef, useCallback } from "react";
import { isHost, getState, setState, RPC } from "playroomkit";
import { SCORE_PER_WIN, SCORE_PER_SURVIVAL_INTERVAL, COUNTDOWN_DURATION } from "../constants/game";
import type { PlayerState } from "../types/game";

export function useHostGameLoop(players: PlayerState[], connected: boolean) {
  const playersRef = useRef(players);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const resetAllPlayers = useCallback((playersList: PlayerState[]) => {
    playersList.forEach((p) => {
      p.setState("isAlive", true);
      p.setState("deathReason", null);
      p.setState("isMoving", false);
      p.setState("isRunning", false);
    });
  }, []);

  useEffect(() => {
    if (!connected || !isHost()) return;

    const timer = setInterval(() => {
      const currentPlayers = playersRef.current;
      const status = getState("status") || "LOBBY";

      if (status === "COUNTDOWN") {
        if (currentPlayers.length < 1) {
          setState("status", "LOBBY");
          setState("countdown", COUNTDOWN_DURATION);
          return;
        }

        const countVal = getState("countdown") ?? COUNTDOWN_DURATION;
        if (countVal > 1) {
          setState("countdown", countVal - 1);
        } else {
          setState("status", "PLAYING");
          setState("countdown", 0);
        }
      }

      if (status === "PLAYING" && currentPlayers.length > 0) {
        const alive = currentPlayers.filter((p) => p.getState("isAlive") !== false);

        if (alive.length === 0) {
          setState("status", "ROUND_OVER");
          setState("winnerId", null);
          resetAllPlayers(currentPlayers);
        } else if (alive.length === 1 && currentPlayers.length > 1) {
          const winner = alive[0];
          setState("status", "ROUND_OVER");
          setState("winnerId", winner.id);
          resetAllPlayers(currentPlayers);
          
          const currentScore = winner.getState<number>("globalScore") || 0;
          winner.setState("globalScore", currentScore + SCORE_PER_WIN);
          winner.setState("scoreNotification", {
            id: `${Date.now()}_${winner.id}`,
            amount: SCORE_PER_WIN,
            timestamp: Date.now(),
          });
        } else if (currentPlayers.length === 1 && alive.length === 0) {
          setState("status", "ROUND_OVER");
          setState("winnerId", null);
          resetAllPlayers(currentPlayers);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [connected, resetAllPlayers]);

  useEffect(() => {
    if (!connected || !isHost()) return;

    const timer = setInterval(() => {
      const currentPlayers = playersRef.current;
      if (getState("status") !== "PLAYING" || getState("winnerId")) return;

      currentPlayers.forEach((player) => {
        if (player.getState("isAlive") !== false) {
          const currentScore = player.getState<number>("globalScore") || 0;
          player.setState("globalScore", currentScore + 1);
          player.setState("scoreNotification", {
            id: `${Date.now()}_${player.id}`,
            amount: 1,
            timestamp: Date.now(),
          });
        }
      });
    }, SCORE_PER_SURVIVAL_INTERVAL);

    return () => clearInterval(timer);
  }, [connected]);

  const handleStartGame = useCallback(() => {
    if (!isHost()) return;
    if (playersRef.current.length < 1) return;

    playersRef.current.forEach((p) => {
      p.setState("isAlive", true);
      p.setState("isAfk", false);
      p.setState("deathReason", null);
      p.setState("isMoving", false);
      p.setState("isRunning", false);
    });

    setState("brokenTiles", {});
    RPC.call("resetTiles", {}, RPC.Mode.ALL);
    setState("winnerId", null);
    setState("countdown", COUNTDOWN_DURATION);
    setState("status", "COUNTDOWN");
  }, []);

  return { handleStartGame };
}
