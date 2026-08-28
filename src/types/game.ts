export type GameStatus = "LOBBY" | "COUNTDOWN" | "PLAYING" | "ROUND_OVER";
export type MapId = "classic" | "tower" | "hourglass";
export type SkinId = "robot" | "ninja" | "astronaut" | "alien";

export interface PlayerProfile {
  name: string;
  color: { hex: string };
  photo?: string;
}

export interface PlayerState {
  id: string;
  getState: <T = unknown>(key: string) => T;
  setState: (key: string, value: unknown, reliable?: boolean) => void;
  getProfile: () => PlayerProfile;
  onQuit: (callback: () => void) => void;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderSkin: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
}

export interface ScoreNotification {
  amount: number;
  id: string;
  timestamp: number;
}

export interface AvatarConfig {
  head: number;
  eyes: number;
  mouth: number;
  accessory: number;
  color: string;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
