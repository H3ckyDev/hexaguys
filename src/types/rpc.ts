import type { ChatMessage } from './game';

export interface StepOnTilePayload {
  tileId: string;
  time: number;
}

export interface KickPlayerPayload {
  targetId: string;
  targetName: string;
}

export type RpcEventMap = {
  stepOnTile: string; // tileId
  tileStepped: StepOnTilePayload;
  chatMessage: ChatMessage;
  kickPlayer: KickPlayerPayload;
};
