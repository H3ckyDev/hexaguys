export interface AvatarConfig {
  head: number;      // 0 - 5: Forma de casco / base
  eyes: number;      // 0 - 7: Visores y ojos LED
  mouth: number;     // 0 - 5: Rejillas, ecualizadores y sonrisas
  accessory: number; // 0 - 5: Antenas, cuernos, auriculares
  color: string;     // Color base / hex
}

export const HEAD_NAMES = [
  "Cyber Terminal",
  "Visor Hexa",
  "Domo Redondo",
  "Mecha Modular",
  "Cyber Ninja",
  "Bot Arcade",
];

export const EYES_NAMES = [
  "Láser Neón",
  "Matrix Pixel",
  "LED Gemelos",
  "HUD Scanner",
  "Guiño Pícaro",
  "Foco Óptico",
  "Angular Feroz",
  "VR Goggles",
];

export const MOUTH_NAMES = [
  "Rejilla Vent",
  "Sonrisa LED",
  "Ecualizador",
  "Línea Digital",
  "Filtro Respirador",
  "Núcleo Energía",
];

export const ACCESSORY_NAMES = [
  "Ninguno",
  "Antenas Comms",
  "Cuernos Holográficos",
  "Auriculares Pro",
  "Pernos de Carga",
  "Aletas Aero",
];

export const TOTAL_HEADS = HEAD_NAMES.length;
export const TOTAL_EYES = EYES_NAMES.length;
export const TOTAL_MOUTHS = MOUTH_NAMES.length;
export const TOTAL_ACCESSORIES = ACCESSORY_NAMES.length;

// Normalizador seguro de color (soporta string hex, objeto { hex: string } y fallbacks)
export function normalizeColor(input: any, defaultColor = "#0284c7"): string {
  if (!input) return defaultColor;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("#")) return trimmed;
    return `#${trimmed}`;
  }
  if (typeof input === "object" && input !== null) {
    if (typeof input.hex === "string") {
      return normalizeColor(input.hex, defaultColor);
    }
  }
  return defaultColor;
}

// Generador determinista de número a partir de string (Hash)
function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function generateAvatarFromSeed(seed: string, color = "#0284c7"): AvatarConfig {
  const safeColor = normalizeColor(color);
  const hash = simpleHash(seed || "hexaguy_default");
  return {
    head: (hash % TOTAL_HEADS + TOTAL_HEADS) % TOTAL_HEADS,
    eyes: ((hash >> 3) % TOTAL_EYES + TOTAL_EYES) % TOTAL_EYES,
    mouth: ((hash >> 6) % TOTAL_MOUTHS + TOTAL_MOUTHS) % TOTAL_MOUTHS,
    accessory: ((hash >> 9) % TOTAL_ACCESSORIES + TOTAL_ACCESSORIES) % TOTAL_ACCESSORIES,
    color: safeColor,
  };
}

export function generateRandomAvatar(color = "#0284c7"): AvatarConfig {
  const safeColor = normalizeColor(color);
  return {
    head: Math.floor(Math.random() * TOTAL_HEADS),
    eyes: Math.floor(Math.random() * TOTAL_EYES),
    mouth: Math.floor(Math.random() * TOTAL_MOUTHS),
    accessory: Math.floor(Math.random() * TOTAL_ACCESSORIES),
    color: safeColor,
  };
}

export function serializeAvatar(config: AvatarConfig): string {
  if (!config) return "c_0_0_0_0_0284c7";
  const head = typeof config.head === "number" ? config.head : 0;
  const eyes = typeof config.eyes === "number" ? config.eyes : 0;
  const mouth = typeof config.mouth === "number" ? config.mouth : 0;
  const accessory = typeof config.accessory === "number" ? config.accessory : 0;
  const cleanHex = normalizeColor(config.color).replace("#", "");
  return `c_${head}_${eyes}_${mouth}_${accessory}_${cleanHex}`;
}

export function deserializeAvatar(str?: string | null, fallbackColor = "#0284c7"): AvatarConfig {
  const safeColor = normalizeColor(fallbackColor);
  if (!str) {
    return generateRandomAvatar(safeColor);
  }

  if (typeof str === "string" && str.startsWith("c_")) {
    const parts = str.split("_");
    if (parts.length >= 6) {
      return {
        head: Number(parts[1]) || 0,
        eyes: Number(parts[2]) || 0,
        mouth: Number(parts[3]) || 0,
        accessory: Number(parts[4]) || 0,
        color: normalizeColor(parts[5], safeColor),
      };
    }
  }

  // Si viene como nombre de skin antigua (robot, ninja, astronaut, alien)
  switch (str) {
    case "ninja":
      return { head: 4, eyes: 6, mouth: 4, accessory: 5, color: safeColor };
    case "astronaut":
    case "astro":
      return { head: 2, eyes: 7, mouth: 0, accessory: 1, color: safeColor };
    case "alien":
      return { head: 3, eyes: 3, mouth: 5, accessory: 2, color: safeColor };
    default:
      return { head: 0, eyes: 0, mouth: 1, accessory: 3, color: safeColor };
  }
}
