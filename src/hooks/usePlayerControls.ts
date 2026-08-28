import { useEffect, useRef } from "react";
import { useKeyboardControls } from "@react-three/drei";

export function usePlayerControls(isLocal: boolean, isMobile: boolean = false) {
  const [, getKeys] = useKeyboardControls();
  const touchDirection = useRef({ x: 0, z: 0 });
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchJump = useRef(false);

  useEffect(() => {
    if (!isLocal || !isMobile) return;

    const isInteractiveTarget = (target: EventTarget | null) => {
      return target instanceof Element && Boolean(target.closest("button, input, textarea, a"));
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (isInteractiveTarget(event.target)) return;
      const touch = event.changedTouches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      touchDirection.current = { x: 0, z: 0 };
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!touchStart.current) return;
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
        touch.clientY - touchStart.current.y,
      );
      const duration = Date.now() - touchStart.current.time;

      if (distance < 18 && duration < 350) {
        touchJump.current = true;
      }
      touchStart.current = null;
      touchDirection.current = { x: 0, z: 0 };
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

  return { getKeys, touchDirection, touchJump };
}
