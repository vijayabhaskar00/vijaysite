"use client";

import { useScene } from "@/lib/scene";
import SceneCanvasLazy from "./SceneCanvasLazy";

/** Renders the 3D canvas only once the tier has resolved to full/reduced.
 * Until then (and forever on the static tier) it renders nothing and the
 * plain cream page background shows through. */
export default function SceneLayer() {
  const { canFly, tier, scene, scrollProgress } = useScene();
  if (!canFly || (tier !== "full" && tier !== "reduced")) return null;
  return (
    <SceneCanvasLazy
      progress={scrollProgress}
      keyframes={scene.keyframes}
      variant={scene.variant}
      tier={tier}
    />
  );
}
