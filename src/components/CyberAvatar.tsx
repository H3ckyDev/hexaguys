import { useId } from "react";
import {
  type AvatarConfig,
  deserializeAvatar,
  generateAvatarFromSeed,
} from "../utils/avatarGenerator";

interface CyberAvatarProps {
  config?: AvatarConfig | string | null;
  seed?: string;
  color?: string;
  size?: number | string;
  className?: string;
  glow?: boolean;
}

export function CyberAvatar({
  config,
  seed,
  color,
  size = 48,
  className = "",
  glow = true,
}: CyberAvatarProps) {
  const uniqueId = useId();

  // Resolver configuración final
  let avatar: AvatarConfig;
  if (typeof config === "object" && config !== null) {
    avatar = config;
  } else if (typeof config === "string") {
    avatar = deserializeAvatar(config, color);
  } else if (seed) {
    avatar = generateAvatarFromSeed(seed, color);
  } else {
    avatar = deserializeAvatar(null, color);
  }

  const baseColor = color || avatar.color || "#0284c7";
  const glowFilterId = `avatar-glow-${uniqueId.replace(/:/g, "")}`;
  const gradientId = `avatar-grad-${uniqueId.replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 select-none overflow-visible ${className}`}
    >
      <defs>
        {/* Filtro de Resplandor Neón */}
        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Gradiente de Base Metálica / Cyber */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={baseColor} stopOpacity="1" />
          <stop offset="100%" stopColor="#080d1e" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* ========================================================
          CAPA 1: ACCESORIOS DE FONDO (Antenas, Cuernos, etc.)
          ======================================================== */}
      {avatar.accessory === 1 && (
        /* Antenas Dobles con LED */
        <g className="text-cyan-400">
          <line x1="28" y1="25" x2="18" y2="8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="18" cy="8" r="4.5" fill="#38bdf8" filter={glow ? `url(#${glowFilterId})` : undefined} />
          <line x1="72" y1="25" x2="82" y2="8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <circle cx="82" cy="8" r="4.5" fill="#38bdf8" filter={glow ? `url(#${glowFilterId})` : undefined} />
        </g>
      )}

      {avatar.accessory === 2 && (
        /* Cuernos Holográficos */
        <g className="text-amber-400" filter={glow ? `url(#${glowFilterId})` : undefined}>
          <polygon points="25,28 15,10 32,20" fill="#f59e0b" fillOpacity="0.85" />
          <polygon points="75,28 85,10 68,20" fill="#f59e0b" fillOpacity="0.85" />
        </g>
      )}

      {avatar.accessory === 3 && (
        /* Auriculares Gamer Pro */
        <g>
          <path d="M 16 50 A 34 34 0 0 1 84 50" fill="none" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
          <rect x="10" y="40" width="10" height="24" rx="4" fill={baseColor} stroke="#64748b" strokeWidth="2" />
          <rect x="80" y="40" width="10" height="24" rx="4" fill={baseColor} stroke="#64748b" strokeWidth="2" />
        </g>
      )}

      {avatar.accessory === 4 && (
        /* Pernos de Carga Laterales */
        <g fill="#94a3b8" stroke="#1e293b" strokeWidth="1.5">
          <polygon points="12,45 6,42 6,58 12,55" />
          <polygon points="88,45 94,42 94,58 88,55" />
        </g>
      )}

      {avatar.accessory === 5 && (
        /* Aletas Aero */
        <g fill={baseColor} opacity="0.9">
          <polygon points="18,30 4,20 16,50" />
          <polygon points="82,30 96,20 84,50" />
        </g>
      )}

      {/* ========================================================
          CAPA 2: CASCO / FORMA DE CABEZA
          ======================================================== */}
      {avatar.head === 0 && (
        /* Cyber Terminal CRT */
        <g>
          <rect x="18" y="16" width="64" height="68" rx="18" fill={`url(#${gradientId})`} stroke="#475569" strokeWidth="2.5" />
          <rect x="24" y="22" width="52" height="56" rx="12" fill="#060913" stroke="#1e293b" strokeWidth="2" />
          {/* Reflejo de pantalla de cristal */}
          <path d="M 28 26 L 68 26 A 6 6 0 0 1 74 32 L 32 74 A 6 6 0 0 1 26 68 Z" fill="white" fillOpacity="0.04" />
        </g>
      )}

      {avatar.head === 1 && (
        /* Visor Hexa Deportivo */
        <g>
          <polygon points="50,14 84,28 84,72 50,86 16,72 16,28" fill={`url(#${gradientId})`} stroke="#475569" strokeWidth="2.5" />
          <polygon points="50,20 78,32 78,68 50,80 22,68 22,32" fill="#060913" stroke="#1e293b" strokeWidth="1.5" />
        </g>
      )}

      {avatar.head === 2 && (
        /* Domo Redondo Holográfico */
        <g>
          <circle cx="50" cy="50" r="35" fill={`url(#${gradientId})`} stroke="#475569" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="29" fill="#060913" stroke="#1e293b" strokeWidth="1.5" />
          <ellipse cx="50" cy="28" rx="16" ry="5" fill="white" fillOpacity="0.08" />
        </g>
      )}

      {avatar.head === 3 && (
        /* Mecha Modular */
        <g>
          <polygon points="26,16 74,16 86,34 82,78 64,86 36,86 18,78 14,34" fill={`url(#${gradientId})`} stroke="#64748b" strokeWidth="2.5" />
          <polygon points="30,24 70,24 78,36 74,74 60,80 40,80 26,74 22,36" fill="#060913" stroke="#1e293b" strokeWidth="2" />
        </g>
      )}

      {avatar.head === 4 && (
        /* Cyber Ninja */
        <g>
          <rect x="20" y="16" width="60" height="68" rx="16" fill={`url(#${gradientId})`} stroke="#475569" strokeWidth="2.5" />
          {/* Cinta ninja */}
          <rect x="18" y="18" width="64" height="14" rx="4" fill="#0f172a" />
          <circle cx="50" cy="25" r="4" fill={baseColor} />
          {/* Pantalla oscura de máscara */}
          <rect x="24" y="34" width="52" height="44" rx="10" fill="#060913" stroke="#1e293b" strokeWidth="2" />
        </g>
      )}

      {avatar.head === 5 && (
        /* Bot Arcade Cuadrado */
        <g>
          <rect x="18" y="18" width="64" height="64" rx="8" fill={`url(#${gradientId})`} stroke="#475569" strokeWidth="2.5" />
          <rect x="25" y="25" width="50" height="50" rx="4" fill="#060913" stroke="#1e293b" strokeWidth="1.5" />
          {/* Remaches */}
          <circle cx="22" cy="22" r="1.5" fill="#94a3b8" />
          <circle cx="78" cy="22" r="1.5" fill="#94a3b8" />
          <circle cx="22" cy="78" r="1.5" fill="#94a3b8" />
          <circle cx="78" cy="78" r="1.5" fill="#94a3b8" />
        </g>
      )}

      {/* ========================================================
          CAPA 3: OJOS / VISOR LED
          ======================================================== */}
      {avatar.eyes === 0 && (
        /* Láser Neón Horizontal */
        <g filter={glow ? `url(#${glowFilterId})` : undefined}>
          <rect x="30" y="42" width="40" height="6" rx="3" fill="#38bdf8" />
          <rect x="34" y="43.5" width="32" height="3" rx="1.5" fill="white" />
        </g>
      )}

      {avatar.eyes === 1 && (
        /* Matrix Pixel Shades */
        <g fill="#22c55e" filter={glow ? `url(#${glowFilterId})` : undefined}>
          <rect x="30" y="40" width="7" height="6" rx="1" />
          <rect x="38" y="40" width="7" height="6" rx="1" />
          <rect x="55" y="40" width="7" height="6" rx="1" />
          <rect x="63" y="40" width="7" height="6" rx="1" />
          <rect x="34" y="47" width="6" height="4" rx="1" />
          <rect x="60" y="47" width="6" height="4" rx="1" />
        </g>
      )}

      {avatar.eyes === 2 && (
        /* LED Gemelos Circulares */
        <g filter={glow ? `url(#${glowFilterId})` : undefined}>
          <circle cx="38" cy="44" r="6" fill="#38bdf8" />
          <circle cx="38" cy="44" r="2.5" fill="white" />
          <circle cx="62" cy="44" r="6" fill="#38bdf8" />
          <circle cx="62" cy="44" r="2.5" fill="white" />
        </g>
      )}

      {avatar.eyes === 3 && (
        /* HUD Scanner */
        <g stroke="#f43f5e" strokeWidth="2" fill="none" filter={glow ? `url(#${glowFilterId})` : undefined}>
          <path d="M 33 39 L 30 39 L 30 49 L 33 49" />
          <path d="M 67 39 L 70 39 L 70 49 L 67 49" />
          <circle cx="50" cy="44" r="3" fill="#f43f5e" />
          <line x1="44" y1="44" x2="56" y2="44" strokeWidth="1" />
        </g>
      )}

      {avatar.eyes === 4 && (
        /* Guiño Pícaro */
        <g filter={glow ? `url(#${glowFilterId})` : undefined}>
          <circle cx="38" cy="44" r="6" fill="#fbbf24" />
          <circle cx="38" cy="44" r="2" fill="white" />
          {/* Arco de guiño */}
          <path d="M 56 46 L 62 40 L 68 46" fill="none" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}

      {avatar.eyes === 5 && (
        /* Foco Óptico Cámara */
        <g filter={glow ? `url(#${glowFilterId})` : undefined}>
          <circle cx="50" cy="43" r="9" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
          <circle cx="50" cy="43" r="4.5" fill="#06b6d4" />
          <circle cx="52" cy="41" r="1.5" fill="white" />
        </g>
      )}

      {avatar.eyes === 6 && (
        /* Angular Feroz */
        <g fill="#ec4899" filter={glow ? `url(#${glowFilterId})` : undefined}>
          <polygon points="30,41 44,45 34,49" />
          <polygon points="70,41 56,45 66,49" />
        </g>
      )}

      {avatar.eyes === 7 && (
        /* VR Goggles */
        <g filter={glow ? `url(#${glowFilterId})` : undefined}>
          <rect x="28" y="38" width="44" height="12" rx="4" fill="#a855f7" stroke="#c084fc" strokeWidth="1.5" />
          <rect x="32" y="41" width="16" height="6" rx="2" fill="#e9d5ff" />
          <rect x="52" y="41" width="16" height="6" rx="2" fill="#e9d5ff" />
        </g>
      )}

      {/* ========================================================
          CAPA 4: BOCA / REJILLA DIGITAL
          ======================================================== */}
      {avatar.mouth === 0 && (
        /* Rejilla de Ventilación */
        <g stroke="#64748b" strokeWidth="2" strokeLinecap="round">
          <line x1="40" y1="62" x2="60" y2="62" />
          <line x1="42" y1="66" x2="58" y2="66" />
          <line x1="45" y1="70" x2="55" y2="70" />
        </g>
      )}

      {avatar.mouth === 1 && (
        /* Sonrisa LED Digital */
        <path
          d="M 38 60 Q 50 72 62 60"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter={glow ? `url(#${glowFilterId})` : undefined}
        />
      )}

      {avatar.mouth === 2 && (
        /* Ecualizador de Sonido */
        <g fill="#22c55e" filter={glow ? `url(#${glowFilterId})` : undefined}>
          <rect x="37" y="62" width="3.5" height="7" rx="1" />
          <rect x="43" y="58" width="3.5" height="11" rx="1" />
          <rect x="49" y="56" width="3.5" height="13" rx="1" />
          <rect x="55" y="60" width="3.5" height="9" rx="1" />
          <rect x="61" y="63" width="3.5" height="6" rx="1" />
        </g>
      )}

      {avatar.mouth === 3 && (
        /* Línea Digital Minimalista */
        <g stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" filter={glow ? `url(#${glowFilterId})` : undefined}>
          <line x1="38" y1="64" x2="45" y2="64" />
          <line x1="45" y1="64" x2="48" y2="59" />
          <line x1="48" y1="59" x2="52" y2="68" />
          <line x1="52" y1="68" x2="55" y2="64" />
          <line x1="55" y1="64" x2="62" y2="64" />
        </g>
      )}

      {avatar.mouth === 4 && (
        /* Filtro de Respiración / Cyber Mask */
        <g>
          <polygon points="50,56 62,69 38,69" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
          <circle cx="50" cy="64" r="3" fill="#f43f5e" filter={glow ? `url(#${glowFilterId})` : undefined} />
        </g>
      )}

      {avatar.mouth === 5 && (
        /* Núcleo de Energía Romboide */
        <g filter={glow ? `url(#${glowFilterId})` : undefined}>
          <polygon points="50,58 57,64 50,70 43,64" fill="#a855f7" />
          <polygon points="50,60 54,64 50,68 46,64" fill="white" />
        </g>
      )}
    </svg>
  );
}

export default CyberAvatar;
