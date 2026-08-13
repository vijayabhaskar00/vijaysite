"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

interface WaypointProps {
  children: ReactNode;
  /** Scroll-progress range (0-1) over which this waypoint settles into place. */
  range: [number, number];
  progress: MotionValue<number>;
  className?: string;
}

export default function Waypoint({ children, range, progress, className }: WaypointProps) {
  // Not applied until after mount -- see the file-level note in the plan/spec
  // for why this guards the no-JS/SSR-visible guarantee.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [start, end] = range;
  const mid = (start + end) / 2;
  const opacity = useTransform(progress, [start, mid], [0, 1]);
  const y = useTransform(progress, [start, mid], [40, 0]);

  return (
    <motion.div className={className} style={mounted ? { opacity, y } : undefined}>
      {children}
    </motion.div>
  );
}
