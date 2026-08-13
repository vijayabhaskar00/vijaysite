"use client";

import { Canvas } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import FlyPath, { type CameraKeyframe } from "./FlyPath";
import type { DeviceTier } from "./deviceTier";

interface SceneCanvasProps {
  progress: MotionValue<number>;
  keyframes: CameraKeyframe[];
  tier: Extract<DeviceTier, "full" | "reduced">;
}

/** Abstract particle field standing in for the scene's geometry -- procedural,
 * not a modeled asset, per the spec's non-goal of not building a bespoke 3D
 * asset pipeline. */
function ParticleField({ count }: { count: number }) {
  const [positions] = useState(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
    }
    return arr;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#5B8CFF" size={0.05} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

export default function SceneCanvas({ progress, keyframes, tier }: SceneCanvasProps) {
  const [active, setActive] = useState(true);

  // Pause rendering (frameloop="never") when the tab is backgrounded --
  // the one visibility signal that actually fires. The canvas is a fixed
  // full-viewport backdrop, so it's always intersecting the viewport; an
  // IntersectionObserver on it would never report off-screen (a Next.js
  // route change unmounts this component entirely rather than scrolling it
  // out of view), so there's nothing for it to usefully observe.
  useEffect(() => {
    const onVisibility = () => setActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const dpr: [number, number] = tier === "full" ? [1, 2] : [1, 1];
  const particleCount = tier === "full" ? 1200 : 400;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        frameloop={active ? "demand" : "never"}
        dpr={dpr}
        camera={{ fov: 50, position: keyframes[0]?.position ?? [0, 0, 5] }}
      >
        <ParticleField count={particleCount} />
        <FlyPath progress={progress} keyframes={keyframes} />
      </Canvas>
    </div>
  );
}
