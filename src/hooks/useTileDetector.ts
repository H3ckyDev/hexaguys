import { worldToHex, isHexInGrid } from "../components/HexGrid";
import { RPC } from "playroomkit";
import type { MapId, PlayerState } from "../types/game";
import { FLOOR_SPACING } from "../constants/game";

interface UseTileDetectorProps {
  mapId: MapId;
  floorsCount: number;
  player: PlayerState;
  onStepTile?: (id: string) => void;
}

const FOOT_OFFSETS_STATIONARY = [
  { dx: 0, dz: 0 },
  { dx: 0.12, dz: 0 },
  { dx: -0.12, dz: 0 },
  { dx: 0, dz: 0.12 },
  { dx: 0, dz: -0.12 },
];
const FOOT_OFFSETS_MOVING = [{ dx: 0, dz: 0 }];

export function useTileDetector({ mapId, floorsCount, onStepTile }: UseTileDetectorProps) {
  const detectTiles = (
    translationX: number,
    translationY: number,
    translationZ: number,
    horizontalSpeed: number
  ) => {
    const numFloors = Math.max(2, Math.min(8, floorsCount));
    
    for (let f = 0; f < numFloors; f++) {
      const floorY = (numFloors - 1 - f) * FLOOR_SPACING;
      if (translationY >= floorY - 0.4 && translationY <= floorY + 1.2) {
        const isStationary = horizontalSpeed < 0.5;
        const footOffsets = isStationary ? FOOT_OFFSETS_STATIONARY : FOOT_OFFSETS_MOVING;
        const checkedTiles = new Set<string>();

        for (const off of footOffsets) {
          const { q, r } = worldToHex(translationX + off.dx, translationZ + off.dz);
          if (isHexInGrid(q, r, mapId)) {
            const tileId = `tile_${f}_${q}_${r}`;
            if (!checkedTiles.has(tileId)) {
              checkedTiles.add(tileId);
              onStepTile?.(tileId);
              RPC.call("stepOnTile", tileId, RPC.Mode.HOST);
            }
          }
        }
        break; // Only check the closest matching floor
      }
    }
  };

  return { detectTiles };
}
