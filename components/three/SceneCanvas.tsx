"use client";

import { Canvas } from "@react-three/fiber";
import { motionValue, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import ClayField from "./ClayField";
import FlyPath from "./FlyPath";
import type { CameraKeyframe, SceneVariant } from "./routeScenes";

interface SceneCanvasProps {
  progress: MotionValue<number>;
  keyframes: CameraKeyframe[];
  variant: SceneVariant;
  tier: "full" | "reduced";
}

interface Layer {
  variant: SceneVariant;
  fade: MotionValue<number>;
}

const CROSSFADE_MS = 600;

/** The persistent <Canvas>. Pauses when off-screen or the tab is hidden,
 * and crossfades the ClayField when the route (variant) changes. */
export default function SceneCanvas({ progress, keyframes, variant, tier }: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [layers, setLayers] = useState<Layer[]>(() => [{ variant, fade: motionValue(1) }]);

  useEffect(() => {
    setLayers((prev) => {
      if (prev[prev.length - 1]?.variant === variant) return prev;
      const incoming: Layer = { variant, fade: motionValue(0) };
      const outgoing = prev;
      const start = performance.now();
      const tick = () => {
        const k = Math.min(1, (performance.now() - start) / CROSSFADE_MS);
        incoming.fade.set(k);
        outgoing.forEach((l) => l.fade.set(1 - k));
        if (k < 1) requestAnimationFrame(tick);
        else setLayers([incoming]);
      };
      requestAnimationFrame(tick);
      return [...prev, incoming];
    });
  }, [variant]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 });
    observer.observe(node);
    const onVis = () => setActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const dpr: [number, number] = tier === "full" ? [1, 2] : [1, 1];

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 -z-0" aria-hidden="true">
      <Canvas
        frameloop={active ? "demand" : "never"}
        dpr={dpr}
        gl={{ antialias: tier === "full", powerPreference: "high-performance" }}
        camera={{ fov: 50, position: keyframes[0]?.position ?? [0, 0, 8] }}
      >
        <color attach="background" args={["#FBF3E7"]} />
        {layers.map((l, i) => (
          <ClayField key={`${l.variant}-${i}`} variant={l.variant} quality={tier} fade={l.fade} />
        ))}
        <FlyPath progress={progress} keyframes={keyframes} />
      </Canvas>
    </div>
  );
}
