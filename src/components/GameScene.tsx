import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { HexGrid } from "./HexGrid";
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
        camera={{ position: [0, 15, 18], fov: 45 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0d0e12"]} />
        <fog attach="fog" args={["#0d0e12", 15, 30]} />
        <Stars radius={100} depth={50} count={3500} factor={4} saturation={0.5} fade speed={1.5} />

        {/* Lighting */}
        <ambientLight intensity={0.7} />
        <directionalLight
          castShadow
          position={[10, 20, 10]}
          intensity={1.5}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        {/* Game World Physics */}
        <Physics gravity={[0, -20, 0]}>
          <HexGrid
            brokenTiles={brokenTiles}
            onStep={onStepTile}
            mapId={mapId}
            floorsCount={floorsCount}
            gameStatus={gameStatus}
          />
          
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

        {/* Visual ocean/bottom plane grid far below */}
        <gridHelper args={[60, 60, "#1e293b", "#0f172a"]} position={[0, -8, 0]} />
      </Canvas>
    </div>
  );
}
