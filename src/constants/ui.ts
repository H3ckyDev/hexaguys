import type { MapId } from '../types/game';

export const COLOR_PALETTE = [
  { id: "sky", hex: "#0284c7", name: "Azul" },
  { id: "emerald", hex: "#059669", name: "Esmeralda" },
  { id: "indigo", hex: "#4f46e5", name: "Índigo" },
  { id: "rose", hex: "#e11d48", name: "Rosa" },
  { id: "amber", hex: "#d97706", name: "Ámbar" },
  { id: "purple", hex: "#9333ea", name: "Púrpura" },
  { id: "teal", hex: "#0d9488", name: "Turquesa" },
  { id: "slate", hex: "#475569", name: "Pizarra" },
];

export const MAPS_LIST: { id: MapId; name: string; desc: string; badge: string }[] = [
  { id: "classic", name: "CLÁSICO", desc: "Equilibrado", badge: "Estándar" },
  { id: "tower", name: "LA TORRE", desc: "Supervivencia Vertical", badge: "Vertical" },
  { id: "hourglass", name: "EMBUDO", desc: "Colapso Rápido", badge: "Caótico" },
];

export const FLOOR_OPTIONS = [2, 3, 4, 5, 6, 7];

export const STORAGE_KEYS = {
  AVATAR_CONFIG: "hexaguys_avatar_config",
  USERNAME: "hexaguys_username",
  PLAYER_ID: "hexaguys_player_id",
} as const;
