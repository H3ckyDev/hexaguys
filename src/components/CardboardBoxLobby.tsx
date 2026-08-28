import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";

interface CardboardBoxLobbyProps {
  position?: [number, number, number];
  gameStatus?: string;
}

/**
 * Sala de Espera (Lobby) 3D en forma de Caja de Cartón
 * Ubicada de forma independiente y aislada de las torres hexagonales de juego.
 */
export function CardboardBoxLobby({ position = [60, 0, 0], gameStatus }: CardboardBoxLobbyProps) {
  // Desactivar completamente la caja y sus 4 luces durante la partida para maximizar 60 FPS
  if (gameStatus === "PLAYING" || gameStatus === "COUNTDOWN") {
    return null;
  }

  const [posX, posY, posZ] = position;
  const boxWidth = 14; // Ancho en eje X
  const boxLength = 14; // Largo en eje Z
  const wallHeight = 4.5; // Altura de las paredes
  const halfW = boxWidth / 2;
  const halfL = boxLength / 2;
  const halfH = wallHeight / 2;

  // Paleta de colores cálidos y texturas de cartón kraft brillante y vibrante
  const cardboardMain = "#c4925a"; // Cartón principal claro
  const cardboardDark = "#a97843"; // Cartón exterior
  const cardboardFloor = "#b8854f"; // Piso de cartón
  const tapeColor = "#e5aa52"; // Cinta de embalar adhesiva
  const stampRed = "#ef4444"; // Sello "FRÁGIL"
  const stampBlack = "#0f172a"; // Sellos de flechas y código de barras

  return (
    <>
      {/* 1. ILUMINACIÓN DIRECTA DENTRO DE LA CAJA */}
      <directionalLight position={[posX + 5, posY + 18, posZ + 8]} intensity={2.5} color="#ffffff" />
      <pointLight position={[posX, posY + 3.8, posZ]} intensity={2.8} distance={25} color="#fff3db" />
      <pointLight position={[posX - 4, posY + 3.0, posZ - 4]} intensity={1.8} distance={16} color="#ffe8c2" />
      <pointLight position={[posX + 4, posY + 3.0, posZ + 4]} intensity={1.8} distance={16} color="#ffe8c2" />

      {/* 2. PISO SÓLIDO DE CARTÓN CON COLISIONADOR DIRECTO EN COORDENADAS MUNDIALES */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0}
        restitution={0}
        position={[posX, posY, posZ]}
      >
        <CuboidCollider args={[halfW, 0.2, halfL]} position={[0, 0, 0]} />
        {/* Suelo visual */}
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[boxWidth, 0.4, boxLength]} />
          <meshStandardMaterial color={cardboardFloor} roughness={0.65} metalness={0.05} />
        </mesh>
        {/* Cinta adhesiva en la costura central del piso */}
        <mesh position={[0, 0.21, 0]}>
          <boxGeometry args={[0.7, 0.01, boxLength * 0.98]} />
          <meshStandardMaterial color={tapeColor} roughness={0.3} metalness={0.2} transparent opacity={0.9} />
        </mesh>
      </RigidBody>

      {/* 3. PAREDES DE CARTÓN CON COLISIONADORES DIRECTOS */}
      {/* Pared Trasera (-Z) */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0}
        restitution={0}
        position={[posX, posY + halfH, posZ - halfL]}
      >
        <CuboidCollider args={[halfW, halfH, 0.2]} position={[0, 0, 0]} />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[boxWidth, wallHeight, 0.4]} />
          <meshStandardMaterial color={cardboardMain} roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Pared Frontal (+Z) */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0}
        restitution={0}
        position={[posX, posY + halfH, posZ + halfL]}
      >
        <CuboidCollider args={[halfW, halfH, 0.2]} position={[0, 0, 0]} />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[boxWidth, wallHeight, 0.4]} />
          <meshStandardMaterial color={cardboardMain} roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Pared Izquierda (-X) */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0}
        restitution={0}
        position={[posX - halfW, posY + halfH, posZ]}
      >
        <CuboidCollider args={[0.2, halfH, halfL]} position={[0, 0, 0]} />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.4, wallHeight, boxLength]} />
          <meshStandardMaterial color={cardboardDark} roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Pared Derecha (+X) */}
      <RigidBody
        type="fixed"
        colliders={false}
        friction={0}
        restitution={0}
        position={[posX + halfW, posY + halfH, posZ]}
      >
        <CuboidCollider args={[0.2, halfH, halfL]} position={[0, 0, 0]} />
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.4, wallHeight, boxLength]} />
          <meshStandardMaterial color={cardboardDark} roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* 4. ELEMENTOS VISUALES: SOLAPAS ABIERTAS DE LA CAJA */}
      <group position={[posX, posY, posZ]}>
        {/* Solapa Trasera (-Z) */}
        <group position={[0, wallHeight, -halfL]} rotation={[-Math.PI / 4, 0, 0]}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <boxGeometry args={[boxWidth * 0.98, 2.6, 0.15]} />
            <meshStandardMaterial color={cardboardMain} roughness={0.75} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Solapa Frontal (+Z) */}
        <group position={[0, wallHeight, halfL]} rotation={[Math.PI / 4, 0, 0]}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <boxGeometry args={[boxWidth * 0.98, 2.6, 0.15]} />
            <meshStandardMaterial color={cardboardMain} roughness={0.75} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Solapa Izquierda (-X) */}
        <group position={[-halfW, wallHeight, 0]} rotation={[0, 0, Math.PI / 4]}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <boxGeometry args={[0.15, 2.6, boxLength * 0.98]} />
            <meshStandardMaterial color={cardboardDark} roughness={0.75} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Solapa Derecha (+X) */}
        <group position={[halfW, wallHeight, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <mesh position={[0, 1.3, 0]} castShadow>
            <boxGeometry args={[0.15, 2.6, boxLength * 0.98]} />
            <meshStandardMaterial color={cardboardDark} roughness={0.75} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Cintas adhesivas en las esquinas */}
        <mesh position={[-halfW + 0.1, halfH, -halfL + 0.1]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.5, wallHeight * 0.9, 0.02]} />
          <meshStandardMaterial color={tapeColor} roughness={0.3} metalness={0.2} transparent opacity={0.9} />
        </mesh>
        <mesh position={[halfW - 0.1, halfH, -halfL + 0.1]} rotation={[0, -Math.PI / 4, 0]}>
          <boxGeometry args={[0.5, wallHeight * 0.9, 0.02]} />
          <meshStandardMaterial color={tapeColor} roughness={0.3} metalness={0.2} transparent opacity={0.9} />
        </mesh>
        <mesh position={[-halfW + 0.1, halfH, halfL - 0.1]} rotation={[0, -Math.PI / 4, 0]}>
          <boxGeometry args={[0.5, wallHeight * 0.9, 0.02]} />
          <meshStandardMaterial color={tapeColor} roughness={0.3} metalness={0.2} transparent opacity={0.9} />
        </mesh>
        <mesh position={[halfW - 0.1, halfH, halfL - 0.1]} rotation={[0, Math.PI / 4, 0]}>
          <boxGeometry args={[0.5, wallHeight * 0.9, 0.02]} />
          <meshStandardMaterial color={tapeColor} roughness={0.3} metalness={0.2} transparent opacity={0.9} />
        </mesh>

        {/* Sello "ESTE LADO ARRIBA" (Flechas en pared trasera) */}
        <group position={[-3.2, 2.3, -halfL + 0.22]}>
          <mesh>
            <boxGeometry args={[1.6, 2.0, 0.02]} />
            <meshStandardMaterial color="#fef3c7" roughness={0.8} />
          </mesh>
          <mesh position={[-0.38, 0.1, 0.02]}>
            <boxGeometry args={[0.18, 1.1, 0.01]} />
            <meshStandardMaterial color={stampBlack} />
          </mesh>
          <mesh position={[-0.38, 0.7, 0.02]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.38, 0.16, 0.01]} />
            <meshStandardMaterial color={stampBlack} />
          </mesh>
          <mesh position={[0.38, 0.1, 0.02]}>
            <boxGeometry args={[0.18, 1.1, 0.01]} />
            <meshStandardMaterial color={stampBlack} />
          </mesh>
          <mesh position={[0.38, 0.7, 0.02]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.38, 0.16, 0.01]} />
            <meshStandardMaterial color={stampBlack} />
          </mesh>
        </group>

        {/* Sello "FRÁGIL" en color rojo en pared trasera */}
        <group position={[3.2, 2.3, -halfL + 0.22]}>
          <mesh>
            <boxGeometry args={[2.4, 1.4, 0.02]} />
            <meshStandardMaterial color="#fee2e2" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.015]}>
            <boxGeometry args={[2.2, 1.2, 0.01]} />
            <meshStandardMaterial color={stampRed} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[2.0, 1.0, 0.01]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.18, 0.025]}>
            <cylinderGeometry args={[0.3, 0.12, 0.35, 16]} />
            <meshStandardMaterial color={stampRed} />
          </mesh>
          <mesh position={[0, -0.18, 0.025]}>
            <cylinderGeometry args={[0.06, 0.06, 0.28, 8]} />
            <meshStandardMaterial color={stampRed} />
          </mesh>
          <mesh position={[0, -0.33, 0.025]}>
            <cylinderGeometry args={[0.25, 0.25, 0.06, 16]} />
            <meshStandardMaterial color={stampRed} />
          </mesh>
        </group>

        {/* Código de barras en la pared derecha */}
        <group position={[halfW - 0.22, 2.0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh>
            <boxGeometry args={[2.8, 1.4, 0.02]} />
            <meshStandardMaterial color="#ffffff" roughness={0.8} />
          </mesh>
          {[-1.0, -0.8, -0.6, -0.4, -0.15, 0.1, 0.35, 0.55, 0.8, 1.0].map((x, i) => (
            <mesh key={i} position={[x, 0.05, 0.02]}>
              <boxGeometry args={[i % 2 === 0 ? 0.1 : 0.05, 0.95, 0.01]} />
              <meshStandardMaterial color={stampBlack} />
            </mesh>
          ))}
        </group>
      </group>
    </>
  );
}
