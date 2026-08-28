import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { HexGrid } from "./HexGrid";
import { CardboardBoxLobby } from "./CardboardBoxLobby";
import { PlayerBall } from "./PlayerBall";
import { myPlayer } from "playroomkit";

interface GameSceneProps {
  players: any[];
  brokenTiles: Record<string, number>;
  onStepTile: (id: string) => void;
  gameStatus: string;
  mapId: string;
  floorsCount?: number;
  showPlayerPing?: boolean;
  isMobile?: boolean;
}

export function GameScene({
  players,
  brokenTiles,
  onStepTile,
  gameStatus,
  mapId,
  floorsCount = 3,
  showPlayerPing = false,
  isMobile = false,
}: GameSceneProps) {
  const localPlayer = myPlayer();
  const sortedPlayers = [...players].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ position: [60, 10, 15], fov: 45 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0d0e12"]} />
        <fog attach="fog" args={["#0d0e12", 60, 180]} />
        <Stars radius={120} depth={60} count={3500} factor={4} saturation={0.5} fade speed={1.5} />

        {/* Iluminación global */}
        <ambientLight intensity={1.0} />
        <directionalLight
          castShadow
          position={[10, 25, 15]}
          intensity={1.4}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={60}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <pointLight position={[-10, 15, -10]} intensity={0.6} />

        {/* Físicas del mundo 3D */}
        <Physics gravity={[0, -20, 0]}>
          {/* 1. Sala de Espera: Caja de Cartón 3D (Ubicada en X=60, separada de la torre) */}
          <CardboardBoxLobby position={[60, 0, 0]} />

          {/* 2. Torres de Juego Hexagonales (Ubicadas en X=0, Y=0) */}
          <HexGrid
            brokenTiles={brokenTiles}
            onStep={onStepTile}
            mapId={mapId}
            floorsCount={floorsCount}
            gameStatus={gameStatus}
          />
          
          {/* 3. Jugadores 3D */}
          {sortedPlayers.map((p, idx) => (
            <PlayerBall
              key={p.id}
              player={p}
              playerIndex={idx}
              totalPlayers={sortedPlayers.length}
              isLocal={Boolean(localPlayer && p.id === localPlayer.id)}
              gameStatus={gameStatus}
              floorsCount={floorsCount}
              showPlayerPing={showPlayerPing}
              isMobile={isMobile}
            />
          ))}
        </Physics>

        {/* Rejillas visuales de referencia en la base */}
        <gridHelper args={[60, 60, "#1e293b", "#0f172a"]} position={[0, -8, 0]} />
        <gridHelper args={[30, 30, "#27272a", "#18181b"]} position={[60, -0.2, 0]} />
      </Canvas>
    </div>
  );
}
