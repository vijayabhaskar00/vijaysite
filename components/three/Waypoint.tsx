"use client";

import { motion, useTransform } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { useScene } from "@/lib/scene";

interface WaypointProps {
  children: ReactNode;
  /** Scroll-progress window (0..1) over which this section settles in.
   * Default [0, 0] = always settled (hero). */
  range?: [number, number];
  className?: string;
}

/** Wraps a page section so it fades/rises into place as the camera passes
 * its point in the scroll. SSR-safe by construction: no live style until
 * after mount (useEffect never runs server-side), and no transform at all
 * on the static tier -- before mount / on static the element is a plain
 * div in normal flow, so nothing is ever hidden-until-JS. */
export default function Waypoint({ children, range = [0, 0], className }: WaypointProps) {
  const { scrollProgress, tier } = useScene();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [start, end] = range;
  const mid = end > start ? (start + end) / 2 : start;
  const settleAt = Math.max(mid, start + 0.0001);
  const opacity = useTransform(scrollProgress, [start, settleAt], [0, 1]);
  const y = useTransform(scrollProgress, [start, settleAt], [48, 0]);

  const animate = mounted && tier !== "static" && end > start;

  return (
    <motion.div className={className} style={animate ? { opacity, y } : undefined}>
      {children}
    </motion.div>
  );
}
