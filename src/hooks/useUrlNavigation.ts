import { useState, useEffect, useCallback } from "react";

function getRoomCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  
  const searchParams = new URLSearchParams(window.location.search);
  const searchRoom = searchParams.get("r") || searchParams.get("room") || searchParams.get("roomCode");
  if (searchRoom && searchRoom.trim()) return searchRoom.trim();

  if (window.location.hash) {
    const hashMatch = window.location.hash.match(/[?&#]r(?:oom)?=([^&]+)/i);
    if (hashMatch && hashMatch[1]) return hashMatch[1].trim();
  }

  const pathMatch = window.location.pathname.match(/\/(?:r|room)\/([^/?#]+)/i);
  if (pathMatch && pathMatch[1]) return pathMatch[1].trim();

  return null;
}

export function useUrlNavigation() {
  const initialRoom = getRoomCodeFromUrl();
  const [isInGame, setIsInGame] = useState<boolean>(Boolean(initialRoom));
  const [roomCodeToJoin, setRoomCodeToJoin] = useState<string | null>(initialRoom);
  const [afkKickNotice, setAfkKickNotice] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const kickType = urlParams.get("kick");
      if (kickType === "host") {
        return "Has sido expulsado de la sala por el anfitrión debido a inactividad (AFK).";
      } else if (kickType === "afk") {
        return "Has sido desconectado de la sala por inactividad prolongada.";
      }
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("kick=")) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }

    const handlePopState = () => {
      const room = getRoomCodeFromUrl();
      if (room) {
        setRoomCodeToJoin(room);
        setIsInGame(true);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleHostGame = useCallback(() => {
    setRoomCodeToJoin(null);
    setIsInGame(true);
  }, []);

  const handleJoinGame = useCallback((roomCode: string) => {
    const clean = roomCode.trim();
    if (!clean) return;
    setRoomCodeToJoin(clean);
    const newUrl = `${window.location.origin}${window.location.pathname}?r=${clean}`;
    window.history.pushState({}, "", newUrl);
    setIsInGame(true);
  }, []);

  return {
    isInGame,
    roomCodeToJoin,
    afkKickNotice,
    setAfkKickNotice,
    handleHostGame,
    handleJoinGame
  };
}
