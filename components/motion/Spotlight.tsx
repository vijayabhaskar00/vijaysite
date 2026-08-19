"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

interface SpotlightProps {
  children: ReactNode;
  className?: string;
}

/** Cursor-tracking radial glow behind its children -- a plain,
 * unconditional CSS effect (position tracking only, no transition of its
 * own beyond the opacity fade already unconditional on hover), so it runs
 * the same whether or not useCanAnimate() allows motion elsewhere: like
 * the existing grayscale-to-color .photo-frame:hover treatment, this
 * carries no motion, just a cursor-tracked gradient position. The glow
 * itself is styled by the `.spotlight` rule in globals.css. */
export default function Spotlight({ children, className }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    node.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} className={`spotlight ${className ?? ""}`} onPointerMove={handlePointerMove}>
      {children}
    </div>
  );
}
