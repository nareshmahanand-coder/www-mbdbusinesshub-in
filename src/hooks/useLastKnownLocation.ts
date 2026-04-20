import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { recordLocation } from "@/lib/familySafety";

const FIVE_MIN = 5 * 60 * 1000;

/**
 * Periodic + on-close + low-battery location recorder.
 * Mounted once at app shell.
 */
export const useLastKnownLocation = () => {
  const { user } = useAuth();
  const lastWriteRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;
    if (!("geolocation" in navigator)) return;

    let cancelled = false;

    const writeNow = async (reason: string, batteryLevel?: number) => {
      // throttle: skip if last write < 30s ago unless reason is critical
      const now = Date.now();
      if (
        reason === "periodic" &&
        now - lastWriteRef.current < FIVE_MIN - 5000
      )
        return;
      lastWriteRef.current = now;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          void recordLocation(
            user.id,
            pos.coords.latitude,
            pos.coords.longitude,
            reason,
            pos.coords.accuracy,
            batteryLevel
          );
        },
        (err) => console.warn("[useLastKnownLocation]", err.message),
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
      );
    };

    // 1. Initial + periodic every 5 min
    void writeNow("periodic");
    const interval = window.setInterval(() => writeNow("periodic"), FIVE_MIN);

    // 2. Visibility / unload
    const onVisibility = () => {
      if (document.visibilityState === "hidden") void writeNow("hidden");
    };
    const onPageHide = () => void writeNow("pagehide");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    // 3. Battery API (optional)
    let battery: any = null;
    const onBatteryChange = () => {
      if (!battery) return;
      const level = Math.round(battery.level * 100);
      if (level <= 20) void writeNow("low-battery", level);
    };
    const nav = navigator as any;
    if (nav.getBattery) {
      nav
        .getBattery()
        .then((b: any) => {
          battery = b;
          b.addEventListener("levelchange", onBatteryChange);
          onBatteryChange();
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      if (battery) battery.removeEventListener("levelchange", onBatteryChange);
    };
  }, [user]);
};
