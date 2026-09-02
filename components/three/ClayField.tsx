"use client";

import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { SceneVariant } from "./routeScenes";

// Clay tokens (app/globals.css :root) as hex for three materials.
const CLAY = {
  cream: "#FBF3E7",
  amberLight: "#FBE0C4",
  tealLight: "#D8F0EC",
  pinkLight: "#FBE1E9",
  lavenderLight: "#E5E6FD",
} as const;

const VARIANT_ACCENT: Record<SceneVariant, string[]> = {
  home: [CLAY.amberLight, CLAY.pinkLight, CLAY.tealLight, CLAY.lavenderLight],
  about: [CLAY.pinkLight, CLAY.amberLight],
  experience: [CLAY.tealLight, CLAY.cream],
  contact: [CLAY.lavenderLight, CLAY.amberLight],
  drift: [CLAY.cream, CLAY.amberLight],
};

const SEED: Record<SceneVariant, number> = {
  home: 7,
  about: 21,
  experience: 42,
  contact: 63,
  drift: 99,
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ClayFieldProps {
  variant: SceneVariant;
  quality: "full" | "reduced";
  fade: MotionValue<number>;
}

/** Procedural soft-form scene: floating rounded clay blobs in the route's
 * accent tints. `variant` seeds the layout so each route looks distinct;
 * `quality` drops the count on the reduced tier; `fade` (0..1) drives
 * material opacity for the route crossfade. Runs inside <Canvas>. */
export default function ClayField({ variant, quality, fade }: ClayFieldProps) {
  const meshes = useRef<THREE.Group>(null);
  const blobCount = quality === "full" ? 14 : 7;
  const accents = VARIANT_ACCENT[variant];

  const blobs = useMemo(() => {
    const rand = mulberry32(SEED[variant]);
    return Array.from({ length: blobCount }, (_, i) => ({
      position: [
        (rand() - 0.5) * 16,
        (rand() - 0.5) * 12,
        -rand() * 34 - 2,
      ] as [number, number, number],
      scale: 0.6 + rand() * 1.8,
      color: accents[i % accents.length],
      drift: 0.2 + rand() * 0.5,
    }));
  }, [variant, blobCount, accents]);

  useFrame((state) => {
    const group = meshes.current;
    if (!group) return;
    const opacity = fade.get();
    const time = state.clock.elapsedTime;
    group.children.forEach((child, i) => {
      const b = blobs[i];
      if (!b) return;
      child.position.y = b.position[1] + Math.sin(time * b.drift + i) * 0.35;
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (mat) mat.opacity = opacity;
    });
  });

  return (
    <group>
      <ambientLight intensity={0.85} color={CLAY.cream} />
      <directionalLight position={[6, 8, 4]} intensity={0.7} color="#ffffff" />
      <group ref={meshes}>
        {blobs.map((b, i) => (
          <mesh key={i} position={b.position} scale={b.scale}>
            <icosahedronGeometry args={[1, 4]} />
            <meshStandardMaterial color={b.color} roughness={0.9} metalness={0} transparent opacity={1} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
