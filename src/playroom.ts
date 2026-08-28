import { insertCoin, isHost, setState, getState } from "playroomkit";
import type { GameStatus, PlayerState as GamePlayerState } from "./types/game";

export interface GameState {
  status: GameStatus;
  winnerId: string | null;
  countdown: number;
}

export type PlayerState = GamePlayerState;

export const initPlayroom = async (roomCode?: string): Promise<boolean> => {
  try {
    const opts: Record<string, unknown> = {
      gameId: "hexaguys",
      skipLobby: true,
      discord: false,
    };
    if (roomCode) {
      opts.roomCode = roomCode;
    }
    await insertCoin(opts);
    console.log("Playroom initialized successfully!");
    return true;
  } catch (error) {
    console.error("Error initializing Playroom:", error);
    throw error;
  }
};

// Room State Helpers
export const updateRoomState = (key: string, value: unknown): boolean => {
  if (isHost()) {
    setState(key, value);
    return true;
  }
  throw new Error("Only the host can update the room state");
};

export const getRoomValue = <T>(key: string): T => {
  return getState(key) as T;
};
