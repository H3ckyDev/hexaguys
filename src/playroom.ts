import { insertCoin, isHost, setState, getState } from "playroomkit";

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  getProfile: () => { name: string; color: { hex: string } };
  setState: (key: string, value: any, reliable?: boolean) => void;
  getState: (key: string) => any;
}

export interface GameState {
  status: "LOBBY" | "COUNTDOWN" | "PLAYING" | "ROUND_OVER";
  winnerId: string | null;
  countdown: number;
}

export const initPlayroom = async (roomCode?: string) => {
  try {
    const opts: any = {
      skipLobby: true,
      discord: false,
    };
    if (roomCode) {
      opts.roomCode = roomCode;
    }
    await insertCoin(opts);
    console.log("Playroom initialized successfully!");
  } catch (error) {
    console.error("Error initializing Playroom:", error);
  }
};

// Room State Helpers
export const updateRoomState = (key: string, value: any) => {
  if (isHost()) {
    setState(key, value);
  }
};

export const getRoomValue = (key: string) => {
  return getState(key);
};
