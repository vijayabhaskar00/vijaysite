"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { motion, useSpring } from "framer-motion";
import { useCanAnimate, POINTER_SPRING } from "@/lib/motion";

interface MagneticProps {
  children: ReactNode;
  className?: string;
}

const MAX_NUDGE_PX = 8;

/** Nudges its children a few pixels toward the cursor when it's over the
 * element, springing back on leave -- the same POINTER_SPRING primitive
 * Tilt uses, applied to x/y translation instead of rotation. Renders as a
 * <span> (not <div>), since some callers (the mailto links) place it
 * inside a <p> -- a <div> there is invalid HTML and the browser's parser
 * auto-closes the <p> early, causing a hydration mismatch. Always
 * inline-block (in both branches, so there's no layout shift when
 * useCanAnimate() flips), with zero listeners/style whenever
 * useCanAnimate() is false. */
export default function Magnetic({ children, className }: MagneticProps) {
  const canAnimate = useCanAnimate();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, POINTER_SPRING);
  const y = useSpring(0, POINTER_SPRING);

  if (!canAnimate) {
    return <span className={`inline-block ${className ?? ""}`}>{children}</span>;
  }

  const handlePointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    x.set(px * MAX_NUDGE_PX * 2);
    y.set(py * MAX_NUDGE_PX * 2);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      className={`inline-block ${className ?? ""}`}
      style={{ x, y }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </motion.span>
  );
}
