"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useCanAnimate } from "@/lib/motion";

// Approximate color stops across the homepage's total scroll height, one
// per section in the order they appear on the page -- cream for the
// hero/stats/org-grid stretch, then each accent panel's own light tint
// (see tailwind.config.ts). Approximate rather than measured against each
// section's literal boundaries: a single document-scroll interpolation is
// far cheaper than one useScroll listener per section, and reads the same
// to a visitor as an ambient wash rather than a section-locked effect (see
// the spec's accepted-simplification note).
const COLOR_STOPS = [
  "#FBF3E7", // cream -- hero
  "#FBF3E7", // cream -- stats / org grid
  "#FBE1E9", // clay-pink-light -- about
  "#D8F0EC", // clay-teal-light -- experience
  "#E5E6FD", // clay-lavender-light -- contact
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
