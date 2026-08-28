import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type AvatarConfig, deserializeAvatar } from "../utils/avatarGenerator";

interface CharacterModelProps {
  type: "robot" | "ninja" | "astronaut" | "alien";
  avatar?: AvatarConfig | string | null;
  color: string;
  isMoving?: boolean;
  isGrounded?: boolean;
  isRunning?: boolean;
  isMovingRef?: React.MutableRefObject<boolean>;
  isGroundedRef?: React.MutableRefObject<boolean>;
  isRunningRef?: React.MutableRefObject<boolean>;
}

export function CharacterModel({
  type,
  avatar,
  color,
  isMoving,
  isGrounded,
  isRunning = false,
  isMovingRef,
  isGroundedRef,
  isRunningRef,
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
  const idleTime = useRef(0);

  useFrame((_, delta) => {
    // Lectura en tiempo real directo del ref sin depender del ciclo de re-renderizado de React
    const moving = isMovingRef ? isMovingRef.current : Boolean(isMoving);
    const grounded = isGroundedRef ? isGroundedRef.current : (isGrounded !== undefined ? isGrounded : true);
    const running = isRunningRef ? isRunningRef.current : Boolean(isRunning);

    // 1. Animación de Caminata y Carrera
    if (moving && grounded) {
      const speedMultiplier = running ? 14.0 : 8.0;
      animTime.current += delta * speedMultiplier;
      
      const swingAmp = running ? 0.75 : 0.45;
      const swing = Math.sin(animTime.current) * swingAmp;
      
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing;

      // Rebote y pequeña inclinación al correr
      if (bodyRef.current) {
        const bounceAmp = running ? 0.12 : 0.05;
        bodyRef.current.position.y = Math.abs(Math.sin(animTime.current * 2)) * bounceAmp;
        
        const targetPitch = running ? -0.2 : 0;
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, targetPitch, delta * 10);
      }

      if (leftLegRef.current) leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, 0, delta * 8);
      if (rightLegRef.current) rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, 0, delta * 8);
    } else if (grounded) {
      // 2. Animación Idle en Reposo (Respiración y balanceo sutil)
      idleTime.current += delta * 2.2;
      animTime.current = 0;
      const lerpSpeed = delta * 10;
      
      const breath = Math.sin(idleTime.current) * 0.02;
      const armIdle = Math.sin(idleTime.current * 0.8) * 0.04;

      if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, lerpSpeed);
      if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, lerpSpeed);
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, armIdle, lerpSpeed);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -armIdle, lerpSpeed);
      
      if (bodyRef.current) {
        bodyRef.current.position.y = THREE.MathUtils.lerp(bodyRef.current.position.y, breath, lerpSpeed);
        bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, 0, lerpSpeed);
      }

      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(idleTime.current * 0.5) * 0.05;
      }

      if (leftLegRef.current) leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, 0, lerpSpeed);
      if (rightLegRef.current) rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, 0, lerpSpeed);
    } else {
      // 3. Postura en el aire / Salto
      const lerpSpeed = delta * 8;
      if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI * 0.8, lerpSpeed);
      if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI * 0.8, lerpSpeed);
      if (leftLegRef.current) leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, -0.15, lerpSpeed);
      if (rightLegRef.current) rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, 0.15, lerpSpeed);
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
    <group position={[0, 0, 0]}>
      {/* CUERPO CENTRAL */}
      <group ref={bodyRef} position={[0, 0, 0]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.42, 0.45, 0.28]} />
          {mainMaterial}
        </mesh>

        {/* Franja o núcleo en el pecho */}
        <mesh position={[0, 0.38, 0.142]}>
          <planeGeometry args={[0.22, 0.16]} />
          <meshStandardMaterial
            color={avatarConfig.color || color}
            emissive={avatarConfig.color || color}
            emissiveIntensity={0.6}
            roughness={0.2}
          />
        </mesh>

        {/* CABEZA */}
        <group ref={headRef} position={[0, 0.72, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.38, 0.36, 0.36]} />
            {mainMaterial}
          </mesh>

          {/* VISOR / OJOS LED */}
          <mesh position={[0, 0.02, 0.182]}>
            <planeGeometry args={[0.28, 0.14]} />
            <meshStandardMaterial
              color="#00f0ff"
              emissive="#00f0ff"
              emissiveIntensity={1.5}
              roughness={0.1}
            />
          </mesh>

          {/* CASCO / BASE ADICIONAL SEGÚN AVATAR */}
          {avatarConfig.head === 1 && (
            // Cuernos mecha
            <group position={[0, 0.22, 0]}>
              <mesh position={[-0.18, 0.08, 0]} rotation={[0, 0, 0.4]}>
                <boxGeometry args={[0.06, 0.18, 0.06]} />
                <meshStandardMaterial color={color} metalness={0.8} />
              </mesh>
              <mesh position={[0.18, 0.08, 0]} rotation={[0, 0, -0.4]}>
                <boxGeometry args={[0.06, 0.18, 0.06]} />
                <meshStandardMaterial color={color} metalness={0.8} />
              </mesh>
            </group>
          )}

          {avatarConfig.head === 2 && (
            // Corona Cyber
            <mesh position={[0, 0.22, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.08, 6]} />
              <meshStandardMaterial color="#ffd000" metalness={0.9} roughness={0.2} />
            </mesh>
          )}

          {avatarConfig.head === 3 && (
            // Casco Cyber Samurai / Ninja
            <mesh position={[0, 0.22, 0]}>
              <boxGeometry args={[0.42, 0.08, 0.42]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} />
            </mesh>
          )}

          {avatarConfig.head === 4 && (
            // Cresta Mohicano Neón
            <mesh position={[0, 0.24, 0]}>
              <boxGeometry args={[0.06, 0.14, 0.36]} />
              <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.8} />
            </mesh>
          )}

          {/* ACCESORIO / ANTENAS */}
          {avatarConfig.accessory === 1 && (
            <mesh position={[0.2, 0.15, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.22]} />
              <meshStandardMaterial color="#ffd000" metalness={0.8} />
            </mesh>
          )}
          {avatarConfig.accessory === 2 && (
            // Auriculares DJ Neón
            <group position={[0, 0, 0]}>
              <mesh position={[-0.21, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, 0.06, 12]} />
                <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.8} />
              </mesh>
              <mesh position={[0.21, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.08, 0.08, 0.06, 12]} />
                <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.8} />
              </mesh>
            </group>
          )}
          {avatarConfig.accessory === 3 && (
            // Halo Holográfico
            <mesh position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.22, 0.02, 8, 24]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.8} transparent opacity={0.85} />
            </mesh>
          )}
          {avatarConfig.accessory === 4 && (
            // Monóculo Táctico
            <mesh position={[0.08, 0.03, 0.19]}>
              <circleGeometry args={[0.06, 12]} />
              <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={1.5} />
            </mesh>
          )}
        </group>

        {/* BRAZO IZQUIERDO */}
        <group ref={leftArmRef} position={[-0.28, 0.48, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <boxGeometry args={[0.12, 0.36, 0.12]} />
            {mainMaterial}
          </mesh>
        </group>

        {/* BRAZO DERECHO */}
        <group ref={rightArmRef} position={[0.28, 0.48, 0]}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <boxGeometry args={[0.12, 0.36, 0.12]} />
            {mainMaterial}
          </mesh>
        </group>
      </group>

      {/* PIERNA IZQUIERDA */}
      <group ref={leftLegRef} position={[-0.12, 0.18, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <boxGeometry args={[0.14, 0.32, 0.14]} />
          {mainMaterial}
        </mesh>
      </group>

      {/* PIERNA DERECHA */}
      <group ref={rightLegRef} position={[0.12, 0.18, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow>
          <boxGeometry args={[0.14, 0.32, 0.14]} />
          {mainMaterial}
        </mesh>
      </group>
    </group>
  );
}
