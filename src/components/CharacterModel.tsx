import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type AvatarConfig, deserializeAvatar } from "../utils/avatarGenerator";

interface CharacterModelProps {
  type: "robot" | "ninja" | "astronaut" | "alien";
  avatar?: AvatarConfig | string | null;
  color: string;
  isMoving: boolean;
  isGrounded: boolean;
  isRunning?: boolean;
}

export function CharacterModel({
  type,
  avatar,
  color,
  isMoving,
  isGrounded,
  isRunning = false,
}: CharacterModelProps) {
  const avatarConfig = typeof avatar === "object" && avatar !== null
    ? avatar
    : deserializeAvatar(avatar || type, color);

  // Anim refs
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const animTime = useRef(0);

  useFrame((_, delta) => {
    // 1. Walking vs Running animation
    if (isMoving && isGrounded) {
      const speedMultiplier = isRunning ? 14.0 : 7.5;
      animTime.current += delta * speedMultiplier;
      
      const swingAmp = isRunning ? 0.75 : 0.45;
      const swing = Math.sin(animTime.current) * swingAmp;
      
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing;

      // Bounce & Sprint forward lean
      if (bodyRef.current) {
        const bounceAmp = isRunning ? 0.12 : 0.05;
        bodyRef.current.position.y = Math.abs(Math.sin(animTime.current * 2)) * bounceAmp;
        
        // Lean forward into sprint
        const targetPitch = isRunning ? -0.2 : 0;
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, targetPitch, delta * 10);
      }
    } else {
      // Return slowly to idle
      animTime.current = 0;
      const lerpSpeed = delta * 10;
      
      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpSpeed);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpSpeed);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0, lerpSpeed);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0, lerpSpeed);
      if (bodyRef.current) {
        bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, 0, lerpSpeed);
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, lerpSpeed);
      }
    }

    // 2. Jumping pose
    if (!isGrounded) {
      const lerpSpeed = delta * 8;
      // Lift arms up in panic/joy
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI * 0.8, lerpSpeed);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI * 0.8, lerpSpeed);
      // Legs separate slightly
      if (leftLegRef.current) leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, -0.15, lerpSpeed);
      if (rightLegRef.current) rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, 0.15, lerpSpeed);
    } else {
      const lerpSpeed = delta * 8;
      if (leftLegRef.current) leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, 0, lerpSpeed);
      if (rightLegRef.current) rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, 0, lerpSpeed);
    }
  });

  // Material specifications based on types
  const mainMaterial = (
    <meshStandardMaterial
      color={color}
      roughness={type === "robot" || type === "astronaut" ? 0.2 : 0.7}
      metalness={type === "robot" ? 0.8 : type === "astronaut" ? 0.1 : 0.0}
    />
  );

  return (
    <group ref={bodyRef} position={[0, -0.4, 0]}>
      {/* 1. MAIN BODY COB */}
      <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
        <boxGeometry args={[0.55, 0.55, 0.35]} />
        {mainMaterial}
      </mesh>

      {/* Backpack for Astronaut */}
      {type === "astronaut" && (
        <mesh castShadow position={[0, 0.6, -0.22]}>
          <boxGeometry args={[0.35, 0.4, 0.15]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
      )}

      {/* Ninja belt */}
      {type === "ninja" && (
        <mesh castShadow position={[0, 0.45, 0]}>
          <boxGeometry args={[0.57, 0.08, 0.37]} />
          <meshStandardMaterial color="#ef4444" roughness={0.6} />
        </mesh>
      )}

      {/* Robot screen chest */}
      {type === "robot" && (
        <mesh castShadow position={[0, 0.6, 0.185]}>
          <boxGeometry args={[0.3, 0.2, 0.02]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} />
        </mesh>
      )}

      {/* 2. HEAD */}
      <group ref={headRef} position={[0, 1.05, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.42, 0.42]} />
          {mainMaterial}
        </mesh>

        {/* Visor / Ojos LED dinámicos según AvatarConfig */}
        {avatarConfig ? (
          <>
            {/* Ojos / Visor LED frontal */}
            <mesh position={[0, 0.06, 0.22]}>
              <boxGeometry args={[0.3, 0.08, 0.02]} />
              <meshStandardMaterial
                color={avatarConfig.eyes === 0 ? "#06b6d4" : avatarConfig.eyes === 1 ? "#10b981" : avatarConfig.eyes === 2 ? "#3b82f6" : avatarConfig.eyes === 3 ? "#ef4444" : avatarConfig.eyes === 4 ? "#f59e0b" : avatarConfig.eyes === 5 ? "#06b6d4" : avatarConfig.eyes === 6 ? "#ec4899" : "#a855f7"}
                emissive={avatarConfig.eyes === 0 ? "#06b6d4" : avatarConfig.eyes === 1 ? "#10b981" : avatarConfig.eyes === 2 ? "#3b82f6" : avatarConfig.eyes === 3 ? "#ef4444" : avatarConfig.eyes === 4 ? "#f59e0b" : avatarConfig.eyes === 5 ? "#06b6d4" : avatarConfig.eyes === 6 ? "#ec4899" : "#a855f7"}
                emissiveIntensity={1.2}
              />
            </mesh>

            {/* Accesorio 3D 1: Antenas Dobles */}
            {avatarConfig.accessory === 1 && (
              <>
                <mesh position={[-0.12, 0.28, 0]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.16]} />
                  <meshStandardMaterial color="#64748b" metalness={0.9} />
                </mesh>
                <mesh position={[-0.12, 0.36, 0]}>
                  <sphereGeometry args={[0.03, 8, 8]} />
                  <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1} />
                </mesh>
                <mesh position={[0.12, 0.28, 0]}>
                  <cylinderGeometry args={[0.015, 0.015, 0.16]} />
                  <meshStandardMaterial color="#64748b" metalness={0.9} />
                </mesh>
                <mesh position={[0.12, 0.36, 0]}>
                  <sphereGeometry args={[0.03, 8, 8]} />
                  <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1} />
                </mesh>
              </>
            )}

            {/* Accesorio 3D 2: Cuernos Cibernéticos */}
            {avatarConfig.accessory === 2 && (
              <>
                <mesh position={[-0.18, 0.24, 0]} rotation={[0, 0, 0.4]}>
                  <coneGeometry args={[0.05, 0.15, 8]} />
                  <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
                </mesh>
                <mesh position={[0.18, 0.24, 0]} rotation={[0, 0, -0.4]}>
                  <coneGeometry args={[0.05, 0.15, 8]} />
                  <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
                </mesh>
              </>
            )}

            {/* Accesorio 3D 3: Auriculares Gamer */}
            {avatarConfig.accessory === 3 && (
              <>
                {/* Diadema */}
                <mesh position={[0, 0.22, 0]}>
                  <boxGeometry args={[0.48, 0.04, 0.08]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} />
                </mesh>
                {/* Orejeras */}
                <mesh position={[-0.23, 0.04, 0]}>
                  <cylinderGeometry args={[0.08, 0.08, 0.05]} />
                  <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
                </mesh>
                <mesh position={[0.23, 0.04, 0]}>
                  <cylinderGeometry args={[0.08, 0.08, 0.05]} />
                  <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
                </mesh>
              </>
            )}

            {/* Accesorio 3D 4: Tornillos Laterales */}
            {avatarConfig.accessory === 4 && (
              <>
                <mesh position={[-0.23, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.06]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.9} />
                </mesh>
                <mesh position={[0.23, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.04, 0.04, 0.06]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.9} />
                </mesh>
              </>
            )}

            {/* Accesorio 3D 5: Aleta Superior */}
            {avatarConfig.accessory === 5 && (
              <mesh position={[0, 0.28, 0]}>
                <boxGeometry args={[0.04, 0.14, 0.3]} />
                <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.8} />
              </mesh>
            )}
          </>
        ) : (
          /* Fallback por tipo */
          type === "robot" ? (
            <mesh position={[0, 0.08, 0.22]}>
              <boxGeometry args={[0.3, 0.08, 0.02]} />
              <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={1} />
            </mesh>
          ) : null
        )}
      </group>

      {/* 3. LEFT ARM */}
      <group ref={leftArmRef} position={[-0.38, 0.8, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.38, 0.15]} />
          {mainMaterial}
        </mesh>
      </group>

      {/* 4. RIGHT ARM */}
      <group ref={rightArmRef} position={[0.38, 0.8, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.15, 0.38, 0.15]} />
          {mainMaterial}
        </mesh>
      </group>

      {/* 5. LEFT LEG */}
      <group ref={leftLegRef} position={[-0.16, 0.35, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.18, 0.38, 0.18]} />
          {mainMaterial}
        </mesh>
      </group>

      {/* 6. RIGHT LEG */}
      <group ref={rightLegRef} position={[0.16, 0.35, 0]}>
        <mesh castShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[0.18, 0.38, 0.18]} />
          {mainMaterial}
        </mesh>
      </group>
    </group>
  );
}
