import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/components/motion/deviceTier";

/** Shared easing curve -- the same cubic-bezier already used throughout
 * app/globals.css, so CSS-driven and Framer-Motion-driven motion read as
 * one language. */
export const EASE = [0.16, 1, 0.3, 1] as const;

/** A single fade-up entrance step, for use as a `variants` value on a
 * motion element that's a direct child of a `staggerContainer`. */
export const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/** Variants for a container whose children are each a `fadeUpItem` (or
 * similar) -- staggers their entrance by `staggerMs` once the container's
 * own `visible` variant is triggered. */
export function staggerContainer(staggerMs: number) {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: staggerMs / 1000 } },
  };
}

/** The single gate every scroll/mount-triggered Framer Motion animation in
 * this app renders behind.
 *
 * Starts `false` unconditionally -- server render and the pre-hydration
 * client render both see `false` -- so callers MUST render a plain element
 * (no motion props at all) while this is `false`. That is what keeps
 * animation state out of server-rendered/no-JS markup entirely: there is
 * no `initial="hidden"` for a crawler to ever see, because the motion
 * element itself doesn't exist yet.
 *
 * Once mounted, flips to `true` -- meaning "render the real motion.*
 * element" -- unless either of two things holds, in which case it
 * deliberately stays `false` forever (same plain-render branch):
 *   - `IntersectionObserver` doesn't exist (very old browser, or a test
 *     environment) -- used as a universal motion-readiness signal even by
 *     components that don't themselves use `whileInView` (e.g. `SplitText`,
 *     `Tilt`), so every consumer shares one simple contract instead of each
 *     needing its own feature check.
 *   - the visitor prefers reduced motion (re-checked on every
 *     prefers-reduced-motion change, so toggling the OS setting mid-session
 *     stops future entrances/interactions from animating).
 */
export function useCanAnimate(): boolean {
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const update = () => setCanAnimate(!prefersReducedMotion());
    update();
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (typeof mql.addEventListener !== "function") return;
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return canAnimate;
}
