"use client";

import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

export interface CameraKeyframe {
  /** Scroll progress (0-1) at which the camera reaches this position. */
  at: number;
  position: [number, number, number];
  lookAt: [number, number, number];
}

interface FlyPathProps {
  progress: MotionValue<number>;
  keyframes: CameraKeyframe[];
}

function lerpVector(a: [number, number, number], b: [number, number, number], t: number): THREE.Vector3 {
  return new THREE.Vector3(
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  );
}

export default function FlyPath({ progress, keyframes }: FlyPathProps) {
  const { camera, invalidate } = useThree();
  const sorted = useMemo(() => [...keyframes].sort((a, b) => a.at - b.at), [keyframes]);

  // The canvas uses frameloop="demand" (see SceneCanvas) to avoid a
  // continuous 60fps loop on low-end devices, so nothing re-renders unless
  // something explicitly asks for it. Scroll progress changes outside
  // React's render cycle (it's a framer-motion MotionValue), so we have to
  // manually invalidate the frame whenever it changes.
  useEffect(() => {
    const unsubscribe = progress.on("change", () => invalidate());
    return () => unsubscribe();
  }, [progress, invalidate]);

  useFrame(() => {
    const t = progress.get();
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
    const localT = Math.min(1, Math.max(0, (t - from.at) / span));
    camera.position.copy(lerpVector(from.position, to.position, localT));
    camera.lookAt(lerpVector(from.lookAt, to.lookAt, localT));
  });

  return null;
}
