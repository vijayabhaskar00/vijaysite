"use client";

import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

interface WaypointProps {
  children: ReactNode;
  /** Scroll-progress range (0-1) over which this waypoint settles into place. */
  range: [number, number];
  progress: MotionValue<number>;
  className?: string;
}

// useLayoutEffect warns when it runs during SSR; useEffect is a safe
// stand-in there since nothing paints server-side anyway.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Waypoint({ children, range, progress, className }: WaypointProps) {
  // Not applied until after mount -- see the file-level note in the plan/spec
  // for why this guards the no-JS/SSR-visible guarantee.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [start, end] = range;
  const mid = (start + end) / 2;
  const opacity = useTransform(progress, [start, mid], [0, 1]);
  const y = useTransform(progress, [start, mid], [40, 0]);

  // Framer Motion's declarative `style` binding for `opacity` stops being
  // reactive on this element once `style` flips from `undefined` (kept that
  // way pre-mount for the no-JS/SSR-visible guarantee, see below) to a
  // populated object post-mount -- confirmed in a real browser via a Playwright
  // scroll sweep: `opacity`'s underlying MotionValue keeps computing the
  // correct value as scroll progresses (its own "change" event fires with the
  // right numbers), but the element's DOM `style` attribute freezes at the
  // first-applied value (0) forever. `y`, a transform prop, isn't affected --
  // Framer Motion's projection system re-applies transforms every animation
  // frame independently of the (broken) change-driven style binding, which is
  // what masked this for `y` while `opacity` stayed invisible. Applying
  // opacity imperatively via a ref sidesteps the broken binding entirely.
  const nodeRef = useRef<HTMLDivElement>(null);
  useMotionValueEvent(opacity, "change", (latest) => {
    if (nodeRef.current) nodeRef.current.style.opacity = String(latest);
  });
  useIsomorphicLayoutEffect(() => {
    if (mounted && nodeRef.current) {
      nodeRef.current.style.opacity = String(opacity.get());
    }
  }, [mounted, opacity]);

  return (
    <motion.div ref={nodeRef} className={className} style={mounted ? { y } : undefined}>
      {children}
    </motion.div>
  );
}
