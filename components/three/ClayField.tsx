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

// Per-route layout so each scene reads as its own place: how far blobs
// spread sideways, how deep the field runs, and a density multiplier.
const VARIANT_LAYOUT: Record<
  SceneVariant,
  { spreadX: number; spreadY: number; depth: number; countScale: number }
> = {
  home: { spreadX: 16, spreadY: 15, depth: 34, countScale: 1 },
  about: { spreadX: 11, spreadY: 12, depth: 26, countScale: 0.8 },
  experience: { spreadX: 20, spreadY: 26, depth: 46, countScale: 1.1 }, // long corridor
  contact: { spreadX: 8, spreadY: 8, depth: 16, countScale: 0.6 }, // small room
  drift: { spreadX: 12, spreadY: 12, depth: 24, countScale: 0.7 },
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
  const layout = VARIANT_LAYOUT[variant];
  const blobCount = Math.round((quality === "full" ? 14 : 7) * layout.countScale);
  const accents = VARIANT_ACCENT[variant];

  const blobs = useMemo(() => {
    const rand = mulberry32(SEED[variant]);
    return Array.from({ length: blobCount }, (_, i) => {
      // Bias away from dead-center on X so blobs frame the content rather
      // than sit on top of it, and keep them well behind the camera plane.
      const side = rand() < 0.5 ? -1 : 1;
      return {
        position: [
          side * (5 + rand() * layout.spreadX),
          (rand() - 0.5) * layout.spreadY,
          -12 - rand() * layout.depth,
        ] as [number, number, number],
        scale: 0.5 + rand() * 1.4,
        color: accents[i % accents.length],
        drift: 0.2 + rand() * 0.5,
      };
    });
  }, [variant, blobCount, accents, layout]);

  useFrame((state) => {
    const group = meshes.current;
    if (!group) return;
    // Blobs sit behind the content, so keep them subtle -- 0.5 of the
    // crossfade value is plenty of presence without competing with text.
    const opacity = fade.get() * 0.5;
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
      {/* Bright, near-flat lighting so the pale clay tints read true rather
          than falling into muddy shadow. Tone mapping is disabled on the
          Canvas (see SceneCanvas) for the same reason. */}
      <ambientLight intensity={1.4} color={CLAY.cream} />
      <directionalLight position={[6, 8, 4]} intensity={0.35} color="#ffffff" />
      <group ref={meshes}>
        {blobs.map((b, i) => (
          <mesh key={i} position={b.position} scale={b.scale}>
            <icosahedronGeometry args={[1, 4]} />
            <meshStandardMaterial
              color={b.color}
              emissive={b.color}
              emissiveIntensity={0.35}
              roughness={1}
              metalness={0}
              transparent
              opacity={0.5}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
