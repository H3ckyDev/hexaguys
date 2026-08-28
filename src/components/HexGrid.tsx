import { useRef, useState, useEffect } from "react";
import { RigidBody } from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { myPlayer } from "playroomkit";
import * as THREE from "three";
import { playBreakSound } from "../utils/sounds";

export const HEX_RADIUS = 1.0;
const STEP_DELAY = 500; // 0.5 seconds delay before tile falls

interface HexTileProps {
  id: string;
  position: [number, number, number];
  floor: number;
  steppedAt: number | null;
  onStep: (id: string) => void;
  gameStatus?: string;
}

function HexTile({ id, position, floor, steppedAt, onStep, gameStatus }: HexTileProps) {
  const [isBroken, setIsBroken] = useState(false);
  const [scaleY, setScaleY] = useState(1);
  const [posY, setPosY] = useState(position[1]);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useEffect(() => {
    if (steppedAt === null) {
      setIsBroken(false);
      setScaleY(1);
      setPosY(position[1]);
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
  }, [steppedAt, position]);

  // Animation for falling and shrinking when broken, plus dynamic upper-floor opacity
  useFrame((_, delta) => {
    if (steppedAt !== null && !isBroken) {
      // Blinking scale/vibration before breaking
      const elapsed = Date.now() - steppedAt;
      const wave = Math.sin(elapsed * 0.05) * 0.08;
      setScaleY(1 - (elapsed / STEP_DELAY) * 0.3 + wave);
    }

    if (isBroken && posY > -20) {
      // Fall down
      setPosY((prev) => prev - delta * 15);
      setScaleY((prev) => Math.max(0, prev - delta * 2));
    }

    // Dynamic upper-floor transparency: fade tiles above the local player so character is never obscured
    if (matRef.current) {
      const localPos = myPlayer()?.getState("pos");
      if (localPos) {
        const isAbovePlayer = localPos.y < position[1] - 1.2;
        const targetOpacity = isAbovePlayer ? 0.2 : 1.0;
        
        if (Math.abs(matRef.current.opacity - targetOpacity) > 0.01) {
          matRef.current.transparent = isAbovePlayer;
          matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOpacity, delta * 12);
          matRef.current.needsUpdate = true;
        }
      }
    }
  });

  if (isBroken && posY <= -20) {
    return null; // Don't render if fallen too deep
  }

  const FLOOR_COLORS = [
    "#38bdf8", // Sky Blue
    "#818cf8", // Indigo
    "#a855f7", // Purple
    "#ec4899", // Pink
    "#f43f5e", // Rose
    "#fb923c", // Orange
    "#facc15", // Gold
    "#34d399", // Emerald
  ];

  // Define color based on floor index
  let color = FLOOR_COLORS[floor % FLOOR_COLORS.length];

  if (steppedAt !== null) {
    // Alert state: Amber/Red blink
    const elapsed = Date.now() - steppedAt;
    const isBlink = Math.floor(elapsed / 100) % 2 === 0;
    color = isBlink ? "#f43f5e" : "#e11d48"; // Rose 500 / Rose 600
  }

  if (isBroken) {
    return (
      <mesh
        position={[position[0], posY, position[2]]}
        scale={[1, scaleY, 1]}
        rotation={[0, Math.PI / 6, 0]}
        castShadow
      >
        <cylinderGeometry args={[HEX_RADIUS * 0.985, HEX_RADIUS * 0.985, 0.4, 6]} />
        <meshStandardMaterial
          color={color}
          roughness={0.2}
          metalness={0.1}
          emissive="#e11d48"
          emissiveIntensity={0.5}
        />
      </mesh>
    );
  }

  return (
    <RigidBody
      type="fixed"
      colliders="hull"
      position={[position[0], position[1], position[2]]}
      friction={0}
      restitution={0}
      onCollisionEnter={(event) => {
        const otherNode = event.other.rigidBodyObject;
        if (otherNode && otherNode.userData && otherNode.userData.type === "player") {
          // Only collapse tiles during active match (never in LOBBY or COUNTDOWN)
          if (steppedAt === null && gameStatus === "PLAYING") {
            onStep(id);
          }
        }
      }}
    >
      <mesh scale={[1, scaleY, 1]} rotation={[0, Math.PI / 6, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[HEX_RADIUS * 0.985, HEX_RADIUS * 0.985, 0.4, 6]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          roughness={0.2}
          metalness={0.1}
          emissive={steppedAt !== null ? "#e11d48" : "#000000"}
          emissiveIntensity={steppedAt !== null ? 0.5 : 0}
        />
      </mesh>
    </RigidBody>
  );
}

interface HexGridProps {
  brokenTiles: Record<string, number>;
  onStep: (id: string) => void;
  mapId: string;
  floorsCount?: number;
  gameStatus?: string;
}

export function HexGrid({ brokenTiles, onStep, mapId, floorsCount = 3, gameStatus }: HexGridProps) {
  const [tiles, setTiles] = useState<any[]>([]);
  const isLobby = gameStatus === "LOBBY";
  const isCountdown = gameStatus === "COUNTDOWN";
  const floorDistance = 4.5;
  const topFloorY = (floorsCount - 1) * floorDistance;

  useEffect(() => {
    // Si estamos en el Lobby (Caja de Cartón), no se renderizan las baldosas de la torre de juego
    if (isLobby) {
      setTiles([]);
      return;
    }

    const list: any[] = [];
    const rad = mapId === "tower" ? 3 : 4; // 37 baldosas para tower, 61 para classic

    if (isCountdown) {
      // DURANTE LA CUENTA REGRESIVA: Solo el piso superior con barreras protectoras
      const floorY = topFloorY;
      for (let q = -rad; q <= rad; q++) {
        const r1 = Math.max(-rad, -q - rad);
        const r2 = Math.min(rad, -q + rad);
        for (let r = r1; r <= r2; r++) {
          const x = HEX_RADIUS * Math.sqrt(3) * (q + r / 2);
          const z = HEX_RADIUS * 1.5 * r;
          const id = `tile_countdown_${q}_${r}`;
          list.push({ id, position: [x, floorY, z], floor: 0 });
        }
      }
    } else {
      // EN PARTIDA ACTIVA (PLAYING o ROUND_OVER): Cargar los N pisos de juego
      const numFloors = Math.max(2, Math.min(8, floorsCount));
      for (let f = 0; f < numFloors; f++) {
        const floorY = (numFloors - 1 - f) * floorDistance;
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
    }

    setTiles(list);
  }, [mapId, floorsCount, isLobby, isCountdown, topFloorY]);

  // 6 muros de protección perimetrales durante el COUNTDOWN de 5s para evitar caídas previas
  const countdownWalls = [0, 1, 2, 3, 4, 5].map((i) => {
    const angle = (i * Math.PI) / 3 + Math.PI / 6;
    const dist = 6.8;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    return {
      id: `wall_${i}`,
      position: [x, topFloorY + 1.5, z] as [number, number, number],
      rotation: [0, -angle + Math.PI / 2, 0] as [number, number, number],
    };
  });

  if (isLobby) return null;

  return (
    <group>
      {/* Baldosas hexagonales del juego */}
      {tiles.map((tile) => (
        <HexTile
          key={tile.id}
          id={tile.id}
          position={tile.position}
          floor={tile.floor}
          steppedAt={brokenTiles[tile.id] || null}
          onStep={onStep}
          gameStatus={gameStatus}
        />
      ))}

      {/* Muros de protección holográfica durante la cuenta regresiva */}
      {isCountdown && (
        <group>
          {countdownWalls.map((w) => (
            <RigidBody
              key={w.id}
              type="fixed"
              position={w.position}
              rotation={w.rotation}
              friction={0}
              restitution={0.2}
            >
              {/* Cristal de energía */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[7.8, 3.2, 0.3]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  transparent
                  opacity={0.2}
                  roughness={0.1}
                  metalness={0.8}
                  emissive="#0284c7"
                  emissiveIntensity={0.3}
                />
              </mesh>
              {/* Barra superior brillante */}
              <mesh position={[0, 1.6, 0]}>
                <boxGeometry args={[7.85, 0.12, 0.35]} />
                <meshStandardMaterial
                  color="#38bdf8"
                  emissive="#38bdf8"
                  emissiveIntensity={1.5}
                  roughness={0.2}
                />
              </mesh>
            </RigidBody>
          ))}
        </group>
      )}
    </group>
  );
}
