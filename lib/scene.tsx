"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useScroll, type MotionValue } from "framer-motion";
import { usePathname } from "next/navigation";
import { resolveDeviceTier, type DeviceTier } from "@/components/motion/deviceTier";
import { getSceneForPath, type RouteScene } from "@/components/three/routeScenes";

export interface SceneContextValue {
  tier: DeviceTier | null;
  scrollProgress: MotionValue<number>;
  scene: RouteScene;
  canFly: boolean;
}

const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene(): SceneContextValue {
  const value = useContext(SceneContext);
  if (!value) throw new Error("useScene must be used within a SceneProvider");
  return value;
}

/** The single coordination point for the site-wide fly-through. Runs on the
 * DOM side (above the <Canvas>), so it can safely use usePathname() and
 * useScroll(). Resolves the device tier exactly once. The canvas, the
 * camera rig (via props), the scroll progress bar, and every Waypoint read
 * this one object. */
export function SceneProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<DeviceTier | null>(null);
  const { scrollYProgress } = useScroll();
  const pathname = usePathname() ?? "/";
  const scene = useMemo(() => getSceneForPath(pathname), [pathname]);

  useEffect(() => {
    let cancelled = false;
    resolveDeviceTier().then((resolved) => {
      if (!cancelled) setTier(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<SceneContextValue>(
    () => ({
      tier,
      scrollProgress: scrollYProgress,
      scene,
      canFly: tier === "full" || tier === "reduced",
    }),
    [tier, scrollYProgress, scene]
  );

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}
