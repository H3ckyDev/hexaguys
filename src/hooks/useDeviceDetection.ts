import { useState, useEffect } from "react";

export function useDeviceDetection() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px), (pointer: coarse)");
    const updateDeviceType = () => setIsMobile(mediaQuery.matches);

    updateDeviceType();
    
    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateDeviceType);
      return () => mediaQuery.removeEventListener("change", updateDeviceType);
    }
  }, []);

  return { isMobile };
}
