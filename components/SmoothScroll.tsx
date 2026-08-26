"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { prefersReducedMotion } from "@/components/motion/deviceTier";

/** Drives inertia-smoothed scrolling site-wide -- the single biggest lever
 * for the "premium"/"next level" scroll feel of sites like the one that
 * prompted this (see docs/superpowers/... history for the rest of the
 * motion system this already had). Lenis intercepts wheel/touch input and
 * replays it through requestAnimationFrame with easing, actually moving
 * the real document scroll position (not a virtualized transform), which
 * is what lets every existing scroll-linked effect -- HomeHero's parallax
 * and scroll-exit, AmbientColorDrift's color wash, both built on Framer
 * Motion's useScroll() -- stay in sync with zero changes: Framer Motion
 * reads native scroll position/events, and Lenis keeps writing to that
 * same native position every frame it's active.
 *
 * Renders nothing (no DOM node of its own) -- it's a side-effect-only
 * component, mounted once in the root layout.
 *
 * Reduced motion means no inertia at all, not gentler inertia: this never
 * constructs a Lenis instance while prefersReducedMotion() is true, and
 * re-checks on every OS-level change (mirroring useCanAnimate() in
 * lib/motion.ts) so toggling the setting mid-session takes effect without
 * a reload -- switching off drops straight back to plain native scroll,
 * not a fading-out animation. */
export default function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;

    let lenis: Lenis | undefined;
    let rafId: number | undefined;

    const start = () => {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    };

    const stop = () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      lenis?.destroy();
      lenis = undefined;
      rafId = undefined;
    };

    const sync = () => {
      if (prefersReducedMotion()) {
        stop();
      } else if (!lenis) {
        start();
      }
    };

    sync();
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", sync);
    }

    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", sync);
      }
      stop();
    };
  }, []);

  return null;
}
