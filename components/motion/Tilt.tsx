"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { motion, useSpring } from "framer-motion";
import { useCanAnimate } from "@/lib/motion";

interface TiltProps {
  children: ReactNode;
  className?: string;
}

const MAX_ROTATION_DEG = 8;
const SPRING = { stiffness: 300, damping: 20 };

/** Wraps children in a small pointer-following 3D tilt on hover -- a CSS
 * transform (perspective + rotateX/rotateY), not WebGL. Renders an inert
 * plain wrapper (no listeners, no transform) whenever useCanAnimate() is
 * false, so reduced-motion visitors and pre-hydration/no-JS output are
 * completely unaffected. */
export default function Tilt({ children, className }: TiltProps) {
  const canAnimate = useCanAnimate();
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);

  if (!canAnimate) {
    return <div className={className}>{children}</div>;
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * MAX_ROTATION_DEG * 2);
    rotateX.set(py * -MAX_ROTATION_DEG * 2);
  };

  const handlePointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </motion.div>
  );
}
