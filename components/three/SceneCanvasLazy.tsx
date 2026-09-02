"use client";

import dynamic from "next/dynamic";

/** The only entry point app/layout.tsx imports for the 3D scene.
 * next/dynamic with ssr:false, plus the tier gate in SceneLayer, means
 * `three` is fetched only when a visitor actually resolves to the
 * full/reduced tier. */
const SceneCanvasLazy = dynamic(() => import("./SceneCanvas"), { ssr: false });

export default SceneCanvasLazy;
