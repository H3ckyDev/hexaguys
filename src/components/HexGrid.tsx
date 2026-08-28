import React, { useState, useEffect, useRef } from "react";
import { RigidBody, CylinderCollider, CuboidCollider } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playBreakSound } from "../utils/sounds";
import { TILE_STEP_DELAY_MS, FLOOR_SPACING } from "../constants/game";
import { activeLocalPlayerPos } from "../utils/playerTracking";

export const HEX_RADIUS = 1.0;
const STEP_DELAY = TILE_STEP_DELAY_MS;

/**
 * Convierte coordenadas 3D de mundo (X, Z) a coordenadas hexagonales axiales (Q, R)
 * con redondeo cúbico fraccional exacto
 */
export function worldToHex(x: number, z: number, hexRadius = HEX_RADIUS) {
  const q_frac = (Math.sqrt(3) / 3 * x - 1 / 3 * z) / hexRadius;
  const r_frac = (2 / 3 * z) / hexRadius;
  const s_frac = -q_frac - r_frac;

  let q = Math.round(q_frac);
  let r = Math.round(r_frac);
  let s = Math.round(s_frac);

  const q_diff = Math.abs(q - q_frac);
  const r_diff = Math.abs(r - r_frac);
  const s_diff = Math.abs(s - s_frac);

  if (q_diff > r_diff && q_diff > s_diff) {
    q = -r - s;
  } else if (r_diff > s_diff) {
    r = -q - s;
  }
  return { q, r };
}

/**
 * Comprueba si una coordenada hexagonal axial (Q, R) pertenece al tablero según el mapa y piso
 */
export function isHexInGrid(q: number, r: number, mapId = "classic", floor = 0) {
  let rad = 4;
  if (mapId === "tower") {
    rad = 3;
  } else if (mapId === "hourglass") {
    rad = Math.max(2, 4 - floor);
  }
  return Math.abs(q) <= rad && Math.abs(r) <= rad && Math.abs(-q - r) <= rad;
}

interface HexTileProps {
  position: [number, number, number];
  floor: number;
  steppedAt: number | null;
  gameStatus?: string;
}

function HexTileComponent({ position, floor, steppedAt, gameStatus }: HexTileProps) {
  const [isBroken, setIsBroken] = useState(false);
  const [scaleY, setScaleY] = useState(1);
  const [dropY, setDropY] = useState(0);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    if (steppedAt === null) {
      setIsBroken(false);
      setScaleY(1);
      setDropY(0);
      return;
    }

    const elapsed = Date.now() - steppedAt;
    const remaining = STEP_DELAY - elapsed;

    if (remaining <= 0) {
      setIsBroken(true);
      playBreakSound();
    } else {
      const timer = setTimeout(() => {
        setIsBroken(true);
        playBreakSound();
      }, remaining);
      return () => clearTimeout(timer);
    }
  }, [steppedAt]);

  // Actualización en tiempo real a 60-144 FPS dentro del bucle de Three.js
  useFrame((_, delta) => {
    // 1. Transparencia en tiempo real de pisos superiores
    if (matRef.current) {
      const isPlaying = gameStatus === "PLAYING";
      const isNearArena = activeLocalPlayerPos.isAlive && (Math.hypot(activeLocalPlayerPos.x, activeLocalPlayerPos.z) < 14);
      const isAbove = isPlaying && isNearArena && (position[1] > activeLocalPlayerPos.y + 1.2);

      const targetOpacity = isAbove ? 0.22 : 1.0;
      if (Math.abs(matRef.current.opacity - targetOpacity) > 0.01) {
        matRef.current.transparent = isAbove;
        matRef.current.opacity = targetOpacity;
        matRef.current.depthWrite = !isAbove;
        matRef.current.needsUpdate = true;
      }
    }

    // 2. Animación de baldosas pisadas / colapso
    if (steppedAt === null && !isBroken) return;

    if (steppedAt !== null && !isBroken) {
      const elapsed = Date.now() - steppedAt;
      const progress = Math.min(1, elapsed / STEP_DELAY);
      const wave = Math.sin(elapsed * 0.04) * (0.02 + progress * 0.06);
      setScaleY(1 - progress * 0.22 + wave);
    }

    if (isBroken && dropY > -30) {
      setDropY((prev) => prev - delta * 20);
      setScaleY((prev) => Math.max(0, prev - delta * 3));
    }
  });

  const FLOOR_COLORS = [
    "#38bdf8", // Sky Blue (Piso 0 / Superior)
    "#818cf8", // Indigo (Piso 1)
    "#a855f7", // Purple (Piso 2)
    "#ec4899", // Pink (Piso 3)
    "#f43f5e", // Rose (Piso 4)
    "#fb923c", // Orange (Piso 5)
    "#facc15", // Gold (Piso 6)
    "#34d399", // Emerald (Piso 7)
  ];

  let color = FLOOR_COLORS[floor % FLOOR_COLORS.length];

  if (steppedAt !== null) {
    const elapsed = Date.now() - steppedAt;
    if (elapsed < 380) {
      color = "#f59e0b"; // Fase 1: Advertencia ámbar
    } else {
      const isBlink = Math.floor((elapsed - 380) / 90) % 2 === 0;
      color = isBlink ? "#f43f5e" : "#e11d48"; // Fase 2: Parpadeo carmesí
    }
  }

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      friction={0}
      restitution={0}
    >
      {/* El colisionador físico se desmonta de inmediato al romperse */}
      {!isBroken && (
        <CylinderCollider
          args={[0.2, HEX_RADIUS * 0.98]}
          friction={0}
          restitution={0}
        />
      )}

      {dropY > -30 && (
        <mesh
          position={[0, isBroken ? dropY : 0, 0]}
          scale={[1, scaleY, 1]}
          rotation={[0, Math.PI / 6, 0]}
          receiveShadow={!isBroken}
        >
          <cylinderGeometry args={[HEX_RADIUS * 1.0, HEX_RADIUS * 1.0, 0.4, 6]} />
          <meshStandardMaterial
            ref={matRef}
            color={color}
            roughness={0.3}
            metalness={0.1}
            transparent={false}
            opacity={1.0}
            depthWrite={true}
            emissive={steppedAt !== null ? "#e11d48" : color}
            emissiveIntensity={steppedAt !== null ? 0.6 : 0.08}
          />
        </mesh>
      )}
    </RigidBody>
  );
}

const HexTile = React.memo(HexTileComponent);

interface HexGridProps {
  brokenTiles: Record<string, number>;
  onStep?: (id: string) => void;
  mapId: string;
  floorsCount?: number;
  gameStatus?: string;
}

export function HexGrid({
  brokenTiles,
  mapId,
  floorsCount = 3,
  gameStatus,
}: HexGridProps) {
  const [tiles, setTiles] = useState<Array<{ id: string; position: [number, number, number]; floor: number }>>([]);
  const isCountdown = gameStatus === "COUNTDOWN";
  const numFloors = Math.max(2, Math.min(8, floorsCount));
  const topFloorY = (numFloors - 1) * FLOOR_SPACING;

  useEffect(() => {
    const list: Array<{ id: string; position: [number, number, number]; floor: number }> = [];

    for (let f = 0; f < numFloors; f++) {
      const floorY = (numFloors - 1 - f) * FLOOR_SPACING;
      
      let rad = 4;
      if (mapId === "tower") {
        rad = 3;
      } else if (mapId === "hourglass") {
        rad = Math.max(2, 4 - f);
      }

      for (let q = -rad; q <= rad; q++) {
        const r1 = Math.max(-rad, -q - rad);
        const r2 = Math.min(rad, -q + rad);
        for (let r = r1; r <= r2; r++) {
          const x = HEX_RADIUS * Math.sqrt(3) * (q + r / 2);
          const z = HEX_RADIUS * 1.5 * r;
          const id = `tile_${f}_${q}_${r}`;
          list.push({ id, position: [x, floorY, z], floor: f });
        }
      }
    }

    setTiles(list);
  }, [mapId, numFloors]);

  // 6 muros de protección perimetrales durante el COUNTDOWN de 5s para evitar caídas previas
  const countdownWalls = [0, 1, 2, 3, 4, 5].map((i) => {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    const dist = mapId === "tower" ? 5.2 : 6.8;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    return {
      id: `wall_${i}`,
      position: [x, topFloorY + 1.5, z] as [number, number, number],
      rotation: [0, -angle + Math.PI / 2, 0] as [number, number, number],
    };
  });

  return (
    <group>
      {/* Baldosas hexagonales del juego con clave única vinculada al número de pisos para evitar reuso erróneo */}
      {tiles.map((tile) => (
        <HexTile
          key={`${mapId}_${numFloors}_${tile.id}`}
          position={tile.position}
          floor={tile.floor}
          steppedAt={brokenTiles[tile.id] || null}
          gameStatus={gameStatus}
        />
      ))}

      {/* Muros de protección persistentes con sensor dinámico durante countdown */}
      {countdownWalls.map((w) => (
        <RigidBody
          key={`${numFloors}_${w.id}`}
          type="fixed"
          colliders={false}
          position={w.position}
          rotation={w.rotation}
        >
          <CuboidCollider
            args={[2.8, 2.5, 0.2]}
            sensor={!isCountdown}
            friction={0}
            restitution={0}
          />
          {isCountdown && (
            <mesh>
              <boxGeometry args={[5.6, 5.0, 0.1]} />
              <meshStandardMaterial
                color="#00f0ff"
                transparent
                opacity={0.25}
                emissive="#00f0ff"
                emissiveIntensity={0.5}
                depthWrite={false}
              />
            </mesh>
          )}
        </RigidBody>
      ))}
    </group>
  );
}
