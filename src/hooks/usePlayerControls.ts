import { useEffect, useRef } from "react";
import { useKeyboardControls } from "@react-three/drei";
import { mobileControlsState } from "../utils/mobileControls";

export function usePlayerControls(isLocal: boolean, isMobile: boolean = false) {
  const [, getKeys] = useKeyboardControls();
  const touchDirection = useRef({ x: 0, z: 0 });
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchJump = useRef(false);

  useEffect(() => {
    if (!isLocal || !isMobile) return;

    const isInteractiveTarget = (target: EventTarget | null) => {
      return target instanceof Element && Boolean(target.closest("button, input, textarea, a, [role='button']"));
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (isInteractiveTarget(event.target)) return;
      const touch = event.changedTouches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!touchStart.current) return;
      // Solo si no se está usando el joystick HUD dedicado
      if (mobileControlsState.x !== 0 || mobileControlsState.z !== 0) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const distance = Math.hypot(deltaX, deltaY);
      const maxDistance = 90;

      if (distance > 8) {
        event.preventDefault();
        const strength = Math.min(distance, maxDistance) / maxDistance;
        touchDirection.current = {
          x: (deltaX / distance) * strength,
          z: (deltaY / distance) * strength,
        };
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!touchStart.current) return;
      const touch = event.changedTouches[0];
      const distance = Math.hypot(
        touch.clientX - touchStart.current.x,
        touch.clientY - touchStart.current.y
      );
      const duration = Date.now() - touchStart.current.time;

      if (distance < 18 && duration < 350) {
        touchJump.current = true;
      }
      touchStart.current = null;
      if (mobileControlsState.x === 0 && mobileControlsState.z === 0) {
        touchDirection.current = { x: 0, z: 0 };
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isLocal, isMobile]);

  // Getter unificado para inputs de teclado + joystick móvil
  const unifiedGetKeys = () => {
    const keys = getKeys();
    if (isMobile) {
      return {
        ...keys,
        jump: Boolean(keys.jump || mobileControlsState.jump),
        sprint: Boolean(keys.sprint || mobileControlsState.sprint),
      };
    }
    return keys;
  };

  const dynamicTouchDirection = {
    get current() {
      if (isMobile && (mobileControlsState.x !== 0 || mobileControlsState.z !== 0)) {
        return { x: mobileControlsState.x, z: mobileControlsState.z };
      }
      return touchDirection.current;
    },
    set current(val: { x: number; z: number }) {
      touchDirection.current = val;
    },
  };

  const dynamicTouchJump = {
    get current() {
      return touchJump.current || mobileControlsState.jump;
    },
    set current(val: boolean) {
      touchJump.current = val;
      if (!val) mobileControlsState.jump = false;
    },
  };

  return {
    getKeys: unifiedGetKeys,
    touchDirection: dynamicTouchDirection,
    touchJump: dynamicTouchJump,
  };
}
