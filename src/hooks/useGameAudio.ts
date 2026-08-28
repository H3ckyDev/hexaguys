import { useEffect, useState, useRef, useCallback } from "react";
import { startBgm, stopBgm, setBgmState } from "../utils/bgm";
import { playWinSound, playFallSound, setGlobalVolume, getGlobalVolume } from "../utils/sounds";
import { recordMatchResult, getPersistentPlayerId } from "../services/leaderboardService";
import { sileo } from "sileo";
import { SCORE_PER_WIN } from "../constants/game";
import type { GameStatus, PlayerState } from "../types/game";

export function useGameAudio(
  isInGame: boolean, 
  gameStatus: GameStatus, 
  connected: boolean, 
  winnerId: string | null, 
  players: PlayerState[], 
  localPlayer: PlayerState | null
) {
  const [volume, setVolume] = useState(getGlobalVolume());

  useEffect(() => {
    if (!isInGame) {
      stopBgm();
      return;
    }

    startBgm(gameStatus);
    setBgmState(gameStatus);

    const handleFirstInteraction = () => {
      startBgm(gameStatus);
    };

    window.addEventListener("pointerdown", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, [isInGame, gameStatus]);

  const prevWinnerNotified = useRef<string | null>(null);
  const recordedRoundRef = useRef<boolean>(false);
  const roundStartScoreRef = useRef<number>(0);

  useEffect(() => {
    if (!connected) return;

    if (gameStatus === "COUNTDOWN") {
      roundStartScoreRef.current = localPlayer?.getState<number>("globalScore") || 0;
      recordedRoundRef.current = false;
      prevWinnerNotified.current = null;
    }

    if (gameStatus === "ROUND_OVER") {
      if (!recordedRoundRef.current && localPlayer) {
        recordedRoundRef.current = true;
        const myId = localPlayer.id;
        const isWin = winnerId === myId;
        const nickname = localPlayer.getState<string>("name") || localPlayer.getProfile()?.name || "Jugador";
        const skin = localPlayer.getState<string>("skin") || "robot";
        const avatar = localPlayer.getState<any>("avatar");
        const color = localPlayer.getState<string>("color") || localPlayer.getProfile()?.color?.hex || "#38bdf8";
        
        const currentTotalScore = localPlayer.getState<number>("globalScore") || 0;
        let scoreGained = Math.max(0, currentTotalScore - roundStartScoreRef.current);
        if (isWin && scoreGained < SCORE_PER_WIN) {
          scoreGained = SCORE_PER_WIN;
        }

        recordMatchResult({
          playerId: getPersistentPlayerId(),
          nickname,
          skin,
          avatar,
          color,
          scoreGained,
          isWin,
        });
      }

      const myId = localPlayer?.id;
      if (winnerId === myId && winnerId !== null) {
        playWinSound();
      } else {
        playFallSound();
      }

      if (winnerId && prevWinnerNotified.current !== winnerId) {
        prevWinnerNotified.current = winnerId;
        const winnerPlayer = players.find((p) => p.id === winnerId);
        const winName = winnerPlayer?.getState<string>("name") || winnerPlayer?.getProfile()?.name || "Un jugador";
        sileo.success({
          title: "Ronda Finalizada",
          description: `Victoria de ${winName}`,
        });
      }
    } else if (gameStatus === "PLAYING") {
      prevWinnerNotified.current = null;
    }
  }, [gameStatus, winnerId, connected, players, localPlayer]);

  const handleVolumeChange = useCallback((newVol: number) => {
    setVolume(newVol);
    setGlobalVolume(newVol);
  }, []);

  return { volume, handleVolumeChange };
}
