import { useState, useEffect, useCallback } from "react";
import { onPlayerJoin, isHost, setState, getState, RPC, myPlayer, getRoomCode } from "playroomkit";
import { sileo } from "sileo";
import { initPlayroom } from "../playroom";
import { playChatSound } from "../utils/sounds";
import { serializeAvatar } from "../utils/avatarGenerator";
import { getActiveProfile } from "../services/authService";
import type { PlayerState, GameStatus, MapId, ChatMessage } from "../types/game";
import { ROOM_STATE_POLL_INTERVAL_MS } from "../constants/game";

export function usePlayroomSession(isInGame: boolean, roomCodeToJoin: string | null) {
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>("LOBBY");
  const [countdown, setCountdown] = useState(5);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [brokenTiles, setBrokenTiles] = useState<Record<string, number>>({});
  const [mapId, setMapId] = useState<MapId>("classic");
  const [floorsCount, setFloorsCount] = useState(3);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!isInGame) return;

    initPlayroom(roomCodeToJoin || undefined).then(() => {
      setConnected(true);

      const code = getRoomCode() || roomCodeToJoin;
      if (code && typeof window !== "undefined") {
        const canonicalUrl = `${window.location.origin}${window.location.pathname}?r=${code}`;
        window.history.replaceState({}, "", canonicalUrl);
      }

      if (isHost()) {
        if (!getState("status")) setState("status", "LOBBY");
        if (!getState("countdown")) setState("countdown", 5);
        if (!getState("mapId")) setState("mapId", "classic");
        if (!getState("floorsCount")) setState("floorsCount", 3);
      }

      // Sincronizar perfil activo en el estado del jugador local
      const currentRoomStatus = getState("status") || "LOBBY";
      const localP = myPlayer();
      const active = getActiveProfile();
      if (localP) {
        if (active) {
          localP.setState("name", active.nickname);
          localP.setState("avatar", serializeAvatar(active.avatarConfig));
          localP.setState("color", active.color);
        }
        if (currentRoomStatus === "PLAYING" || currentRoomStatus === "COUNTDOWN") {
          localP.setState("isAlive", false);
          localP.setState("isSpectator", true);
          localP.setState("deathReason", "midgame_join");
        }
      }

      RPC.register("stepOnTile", async (tileId: string) => {
        if (isHost()) {
          const current = getState("brokenTiles") || {};
          if (!current[tileId]) {
            const now = Date.now();
            const updated = { ...current, [tileId]: now };
            setState("brokenTiles", updated);
            RPC.call("tileStepped", { tileId, time: now }, RPC.Mode.ALL);
          }
        }
      });

      RPC.register("tileStepped", async (data: { tileId: string; time: number }) => {
        if (data && data.tileId) {
          setBrokenTiles((prev) => ({ ...prev, [data.tileId]: data.time }));
        }
      });

      RPC.register("resetTiles", async () => {
        setBrokenTiles({});
      });

      RPC.register("chatMessage", async (msg: ChatMessage) => {
        if (msg && msg.text) {
          setChatMessages((prev) => [...prev.slice(-49), msg]);
          playChatSound();
        }
      });

      RPC.register("kickPlayer", async (data: { targetId: string; targetName: string }) => {
        if (data && data.targetId) {
          const myId = myPlayer()?.id;
          if (myId === data.targetId) {
            window.location.href = `${window.location.origin}${window.location.pathname}?kick=host`;
          } else {
            sileo.warning({
              title: "Jugador expulsado",
              description: `El anfitrión expulsó a ${data.targetName} por inactividad.`,
            });
          }
        }
      });

      onPlayerJoin((player: any) => {
        if (player.getState("globalScore") === undefined || player.getState("globalScore") === null) {
          player.setState("globalScore", 0);
        }

        // Si la partida ya empezó, el nuevo jugador entra como espectador
        const activeStatus = getState("status") || "LOBBY";
        if (activeStatus === "PLAYING" || activeStatus === "COUNTDOWN") {
          player.setState("isAlive", false);
          player.setState("isSpectator", true);
          player.setState("deathReason", "midgame_join");
        }

        const pName = player.getState("name") || player.getProfile()?.name || `Jugador ${player.id.slice(0, 3)}`;
        sileo.info({
          title: "Jugador conectado",
          description: `${pName} se ha unido a la sala.`,
        });

        setPlayers((prev) => {
          if (prev.some((p) => p.id === player.id)) return prev;
          return [...prev, player];
        });

        player.onQuit(() => {
          const qName = player.getState("name") || player.getProfile()?.name || `Jugador ${player.id.slice(0, 3)}`;
          sileo.warning({
            title: "Jugador desconectado",
            description: `${qName} ha salido de la sala.`,
          });
          setPlayers((prev) => prev.filter((p) => p.id !== player.id));
        });
      });
    }).catch((err) => {
      console.error("Connection failed:", err);
      setConnectionError(true);
    });
  }, [isInGame, roomCodeToJoin]);

  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(() => {
      const nextStatus = getState("status") || "LOBBY";
      const nextCountdown = getState("countdown") ?? 5;
      const nextWinnerId = getState("winnerId") || null;
      const nextMapId = getState("mapId") || "classic";
      const nextFloorsCount = getState("floorsCount") ?? 3;
      const nextBroken = getState("brokenTiles") || {};

      setGameStatus((prev) => (prev !== nextStatus ? nextStatus : prev));
      setCountdown((prev) => (prev !== nextCountdown ? nextCountdown : prev));
      setWinnerId((prev) => (prev !== nextWinnerId ? nextWinnerId : prev));
      setMapId((prev) => (prev !== nextMapId ? nextMapId : prev));
      setFloorsCount((prev) => (prev !== nextFloorsCount ? nextFloorsCount : prev));

      setBrokenTiles((prev) => {
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(nextBroken);
        if (prevKeys.length === nextKeys.length && prevKeys.every((k) => prev[k] === nextBroken[k])) {
          return prev;
        }
        return nextBroken;
      });
    }, ROOM_STATE_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [connected]);

  const handleStepTile = useCallback((tileId: string) => {
    RPC.call("stepOnTile", tileId, RPC.Mode.HOST);
  }, []);

  const retryConnection = useCallback(() => {
    window.location.reload();
  }, []);

  return {
    connected,
    connectionError,
    players,
    gameStatus,
    countdown,
    winnerId,
    brokenTiles,
    mapId,
    floorsCount,
    chatMessages,
    localPlayer: connected ? (myPlayer() as any) : null,
    handleStepTile,
    retryConnection,
  };
}
