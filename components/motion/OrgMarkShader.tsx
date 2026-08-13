"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Suspense, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

interface OrgMarkShaderProps {
  src: string;
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Radial ripple centered on uMouse, strength eased toward uHover. Falls off
// with distance from the pointer so the distortion stays local to where the
// visitor is actually hovering, matching the displacement-on-hover technique
// dungyov.com uses on its project thumbnails.
const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2 uMouse;
  uniform float uHover;
  varying vec2 vUv;

  void main() {
    vec2 toMouse = vUv - uMouse;
    float dist = length(toMouse);
    float falloff = smoothstep(0.6, 0.0, dist);
    float ripple = sin(dist * 22.0 - uHover * 8.0) * 0.035 * uHover * falloff;
    vec2 dir = dist > 0.0001 ? normalize(toMouse) : vec2(0.0);
    vec2 displaced = vUv + dir * ripple;
    gl_FragColor = texture2D(uTexture, displaced);
  }
`;

function DistortionPlane({
  src,
  hover,
  mouse,
}: {
  src: string;
  hover: MutableRefObject<number>;
  mouse: MutableRefObject<[number, number]>;
}) {
  const texture = useLoader(THREE.TextureLoader, src);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, invalidate } = useThree();

  useFrame(() => {
    const material = materialRef.current;
    if (!material) return;
    const target = hover.current;
    const current = material.uniforms.uHover.value as number;
    const next = current + (target - current) * 0.15;
    material.uniforms.uHover.value = next;
    (material.uniforms.uMouse.value as THREE.Vector2).set(mouse.current[0], mouse.current[1]);
    if (Math.abs(next - target) > 0.001 || target > 0.001) {
      invalidate();
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        uniforms={{
          uTexture: { value: texture },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uHover: { value: 0 },
        }}
      />
    </mesh>
  );
}

/** Overlays a WebGL plane on top of an already-visible <img> (rendered by
 * OrgMark) and distorts it with a pointer-following ripple shader on hover.
 * Only ever mounted by OrgLogoGrid for "full"-tier, motion-allowed
 * visitors -- see the gating there. If the texture fails to load, the plain
 * <img> underneath is what visitors see either way, so there's no
 * dedicated error UI here. */
export default function OrgMarkShader({ src }: OrgMarkShaderProps) {
  const hover = useRef(0);
  const mouse = useRef<[number, number]>([0.5, 0.5]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    mouse.current = [
      (event.clientX - rect.left) / rect.width,
      1 - (event.clientY - rect.top) / rect.height,
    ];
  };

  return (
    <div
      ref={containerRef}
      className="org-mark-shader"
      onPointerEnter={() => {
        hover.current = 1;
      }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        hover.current = 0;
      }}
    >
      <Canvas frameloop="demand" dpr={1} gl={{ alpha: true }}>
        <Suspense fallback={null}>
          <DistortionPlane src={src} hover={hover} mouse={mouse} />
        </Suspense>
      </Canvas>
    </div>
  );
}
