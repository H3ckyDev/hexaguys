import { useRef } from "react";
import * as THREE from "three";

interface UsePlayerCameraProps {
  isLocal: boolean;
  gameStatus: string;
  isAlive: boolean;
  spawnX: number;
  spawnY: number;
  spawnZ: number;
  lobbySpawnX: number;
  lobbySpawnY: number;
  lobbySpawnZ: number;
  topFloorY: number;
}

export function usePlayerCamera({
  isLocal,
  gameStatus,
  isAlive,
  spawnX,
  spawnY,
  spawnZ,
  lobbySpawnX,
  lobbySpawnY,
  lobbySpawnZ,
  topFloorY,
}: UsePlayerCameraProps) {
  const smoothCamTarget = useRef(new THREE.Vector3(spawnX, spawnY, spawnZ));
  const instantSnapCamRef = useRef(true);
  
  const snapCamera = (x: number, y: number, z: number) => {
    smoothCamTarget.current.set(x, y, z);
    instantSnapCamRef.current = true;
  };

  const updateCamera = (
    state: any,
    translation: { x: number; y: number; z: number } | null
  ) => {
    if (!isLocal) return;
    
    const isLobbyMode = gameStatus === "LOBBY" || gameStatus === "ROUND_OVER";

    if (isAlive && translation) {
      if (instantSnapCamRef.current) {
        smoothCamTarget.current.set(translation.x, translation.y, translation.z);
        state.camera.position.set(
          translation.x,
          translation.y + 6.8,
          translation.z + 8.8
        );
        state.camera.lookAt(
          translation.x,
          translation.y + 0.5,
          translation.z
        );
        instantSnapCamRef.current = false;
      } else {
        smoothCamTarget.current.lerp(
          new THREE.Vector3(translation.x, translation.y, translation.z),
          0.08
        );
        state.camera.position.set(
          smoothCamTarget.current.x,
          smoothCamTarget.current.y + 6.8,
          smoothCamTarget.current.z + 8.8
        );
        state.camera.lookAt(
          smoothCamTarget.current.x,
          smoothCamTarget.current.y + 0.5,
          smoothCamTarget.current.z
        );
      }
    } else {
      const defaultCamCenter = isLobbyMode
        ? new THREE.Vector3(lobbySpawnX, lobbySpawnY, lobbySpawnZ)
        : new THREE.Vector3(0, topFloorY / 2, 0);
        
      smoothCamTarget.current.lerp(defaultCamCenter, 0.05);
      state.camera.position.set(
        smoothCamTarget.current.x,
        smoothCamTarget.current.y + (isLobbyMode ? 6.8 : 15),
        smoothCamTarget.current.z + (isLobbyMode ? 8.8 : 18)
      );
      state.camera.lookAt(
        smoothCamTarget.current.x,
        smoothCamTarget.current.y + (isLobbyMode ? 0.5 : 0),
        smoothCamTarget.current.z
      );
    }
  };

  return { updateCamera, snapCamera };
}
