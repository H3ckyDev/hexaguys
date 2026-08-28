import { useEffect } from "react";

export function useKeyboardFlush() {
  useEffect(() => {
    const flushKeyboardInputs = () => {
      const controlKeys = [
        "KeyW", "KeyA", "KeyS", "KeyD",
        "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
        "Space", "ShiftLeft", "ShiftRight"
      ];
      controlKeys.forEach((code) => {
        window.dispatchEvent(new KeyboardEvent("keyup", { code, bubbles: true }));
      });
    };

    window.addEventListener("blur", flushKeyboardInputs);
    window.addEventListener("focus", flushKeyboardInputs);
    document.addEventListener("visibilitychange", flushKeyboardInputs);

    return () => {
      window.removeEventListener("blur", flushKeyboardInputs);
      window.removeEventListener("focus", flushKeyboardInputs);
      document.removeEventListener("visibilitychange", flushKeyboardInputs);
    };
  }, []);
}
