import { useCallback } from "react";
import { RPC } from "playroomkit";
import type { ChatMessage, PlayerState } from "../types/game";

export function useChatSystem(localPlayer: PlayerState | null) {
  const handleSendMessage = useCallback((text: string) => {
    if (!localPlayer) return;

    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      senderId: localPlayer.id,
      senderName: localPlayer.getState<string>("name") || localPlayer.getProfile()?.name || "Jugador",
      senderColor: localPlayer.getState<string>("color") || localPlayer.getProfile()?.color?.hex || "#38bdf8",
      senderSkin: localPlayer.getState<string>("skin") || "robot",
      senderAvatar: localPlayer.getState<any>("avatar") as string,
      text: text.slice(0, 120),
      timestamp: Date.now(),
    };

    localPlayer.setState("lastChat", { text: msg.text, timestamp: msg.timestamp });
    RPC.call("chatMessage", msg, RPC.Mode.ALL);
  }, [localPlayer]);

  return { handleSendMessage };
}
