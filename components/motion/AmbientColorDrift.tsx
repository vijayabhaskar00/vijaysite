"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useCanAnimate } from "@/lib/motion";
import { useTheme } from "@/lib/theme";

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
const LIGHT_COLOR_STOPS = [
  "#FBF3E7", // cream -- hero
  "#FBF3E7", // cream -- stats / org grid
  "#FBEBE8", // cream/clay-pink-light blend -- about
  "#EBF2E9", // cream/clay-teal-light blend -- experience
  "#F1EDF1", // cream/clay-lavender-light blend -- contact
];

// Same 45%-toward-each-accent blend as LIGHT_COLOR_STOPS, computed against
// the dark theme's own cream/accent-light values (see :root[data-theme=
// "dark"] in app/globals.css) instead of the light ones -- kept as a
// literal array, not a runtime blend, so this stays a plain color list
// Framer Motion can interpolate directly.
const DARK_COLOR_STOPS = [
  "#1B140F", // dark cream -- hero
  "#1B140F", // dark cream -- stats / org grid
  "#29191B", // dark cream/clay-pink-light blend -- about
  "#19221D", // dark cream/clay-teal-light blend -- experience
  "#201E2A", // dark cream/clay-lavender-light blend -- contact
];

const INPUT_RANGE = LIGHT_COLOR_STOPS.map((_, index) => index / (LIGHT_COLOR_STOPS.length - 1));

/** A fixed, full-bleed color layer behind the homepage content, tinting
 * ambiently toward each section's accent color as the user scrolls past
 * it -- purely decorative, aria-hidden. Renders nothing under
 * useCanAnimate() === false, leaving the plain cream body background
 * (globals.css) visible exactly as it is without this component at all. */
export default function AmbientColorDrift() {
  const canAnimate = useCanAnimate();
  const [theme] = useTheme();
  const { scrollYProgress } = useScroll();
  const backgroundColor = useTransform(
    scrollYProgress,
    INPUT_RANGE,
    theme === "dark" ? DARK_COLOR_STOPS : LIGHT_COLOR_STOPS
  );

  if (!canAnimate) {
    return null;
  }

  // key={theme} forces React to unmount and remount this element -- with
  // a fresh MotionValue and a fresh DOM-write subscription -- whenever
  // the theme flips, instead of reusing the mounted element across the
  // change. Reusing it is the bug this fixes: useTransform's synchronous
  // updateValue() call does recompute the *value* correctly on a
  // theme-triggered re-render (confirmed via backgroundColor.get()), but
  // that update does not reliably reach the DOM style on an
  // already-mounted <motion.div> -- verified by inspecting the live
  // computed backgroundColor after toggling, which kept tracking
  // LIGHT_COLOR_STOPS at every scroll position after switching to dark.
  // A clean remount sidesteps that stale-subscription class of bug
  // entirely rather than chasing it inside Framer Motion's internals.
  return (
    <motion.div
      key={theme}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-30"
      style={{ backgroundColor }}
    />
  );
}
