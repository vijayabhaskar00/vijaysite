"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useCanAnimate } from "@/lib/motion";

// Approximate color stops across the homepage's total scroll height, one
// per section in the order they appear on the page -- cream for the
// hero/stats/org-grid stretch, then a cream-blended tint of each accent
// panel's own light color (see tailwind.config.ts), NOT that color at
// full strength: each panel already renders in its own solid accent
// color, so if this backdrop ever matched a panel's color exactly, the
// panel would visually merge into it and lose its card boundary entirely
// (that's a real bug this fixes, not a hypothetical). Blended at 45%
// toward each accent from cream keeps the ambient wash clearly visible
// while guaranteeing it never equals a panel's own background.
// Approximate rather than measured against each section's literal
// boundaries: a single document-scroll interpolation is far cheaper than
// one useScroll listener per section, and reads the same to a visitor as
// an ambient wash rather than a section-locked effect (see the spec's
// accepted-simplification note).
const COLOR_STOPS = [
  "#FBF3E7", // cream -- hero
  "#FBF3E7", // cream -- stats / org grid
  "#FBEBE8", // cream/clay-pink-light blend -- about
  "#EBF2E9", // cream/clay-teal-light blend -- experience
  "#F1EDF1", // cream/clay-lavender-light blend -- contact
];

const INPUT_RANGE = COLOR_STOPS.map((_, index) => index / (COLOR_STOPS.length - 1));

/** A fixed, full-bleed color layer behind the homepage content, tinting
 * ambiently toward each section's accent color as the user scrolls past
 * it -- purely decorative, aria-hidden. Renders nothing under
 * useCanAnimate() === false, leaving the plain cream body background
 * (globals.css) visible exactly as it is without this component at all. */
export default function AmbientColorDrift() {
  const canAnimate = useCanAnimate();
  const { scrollYProgress } = useScroll();
  const backgroundColor = useTransform(scrollYProgress, INPUT_RANGE, COLOR_STOPS);

  if (!canAnimate) {
    return null;
  }

  return (
    <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-30" style={{ backgroundColor }} />
  );
}
