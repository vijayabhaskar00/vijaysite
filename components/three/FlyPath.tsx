"use client";

import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { CameraKeyframe } from "./routeScenes";

const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3); // matches lib/motion EASE feel

function lerp(a: readonly [number, number, number], b: readonly [number, number, number], t: number) {
  return new THREE.Vector3(
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  );
}

/** Drives the camera along the active route's authored keyframes, indexed
 * by scroll progress. Runs inside <Canvas>. Renders nothing. */
export default function FlyPath({
  progress,
  keyframes,
}: {
  progress: MotionValue<number>;
  keyframes: CameraKeyframe[];
}) {
  const { camera, invalidate } = useThree();
  const sorted = useMemo(() => [...keyframes].sort((a, b) => a.at - b.at), [keyframes]);
  const smoothed = useMemo(() => ({ t: progress.get() }), [progress]);

  // frameloop="demand": nothing re-renders unless asked. Scroll progress
  // changes outside React (it's a MotionValue), so invalidate on change.
  useEffect(() => {
    const unsubscribe = progress.on("change", () => invalidate());
    return () => unsubscribe();
  }, [progress, invalidate]);

  useFrame((_, delta) => {
    if (sorted.length === 0) return;
    // Damp toward the scroll target so a fast flick still eases.
    smoothed.t += (progress.get() - smoothed.t) * Math.min(1, delta * 4);
    const t = smoothed.t;
    let from = sorted[0];
    let to = sorted[sorted.length - 1];
    for (let i = 0; i < sorted.length - 1; i++) {
      if (t >= sorted[i].at && t <= sorted[i + 1].at) {
        from = sorted[i];
        to = sorted[i + 1];
        break;
      }
    }
    const span = to.at - from.at || 1;
    const localT = EASE_OUT(Math.min(1, Math.max(0, (t - from.at) / span)));
    camera.position.copy(lerp(from.position, to.position, localT));
    camera.lookAt(lerp(from.lookAt, to.lookAt, localT));
    if (Math.abs(progress.get() - smoothed.t) > 0.0005) invalidate();
  });

  return null;
}
