"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useCanAnimate, EASE } from "@/lib/motion";

interface WaypointProps {
  children: ReactNode;
  /** Kept for call-site compatibility; the reveal is viewport-triggered
   * (below), so an explicit scroll window is no longer needed. */
  range?: [number, number];
  className?: string;
}

const variants = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/** Wraps a page section so it rises and fades into place the first time it
 * scrolls into view -- which, because the camera is scroll-driven, is when
 * the camera is passing that section. Same no-JS/crawler-safe and
 * reduced-motion contract as components/Reveal.tsx (shared useCanAnimate
 * gate): a plain div until animation is confirmed safe. */
export default function Waypoint({ children, className }: WaypointProps) {
  const canAnimate = useCanAnimate();

  if (!canAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
    >
      {children}
    </motion.div>
  );
}
