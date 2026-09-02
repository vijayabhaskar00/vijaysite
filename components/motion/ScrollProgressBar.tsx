"use client";

import { motion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { useScene } from "@/lib/scene";

/** Fixed thin bar at the top of the viewport whose fill tracks progress
 * through the current route. Spring-smoothed on the full tier, direct
 * everywhere else. Renders nothing until after mount (SSR-safe) or when the
 * document is too short to scroll. Decorative -- the native scrollbar is
 * the accessible affordance. */
export default function ScrollProgressBar() {
  const { scrollProgress, tier } = useScene();
  const [mounted, setMounted] = useState(false);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => {
      const el = document.documentElement;
      setScrollable(el.scrollHeight - el.clientHeight > 2);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const springed = useSpring(scrollProgress, { stiffness: 220, damping: 40, mass: 0.4 });
  const scaleX = tier === "full" ? springed : scrollProgress;

  if (!mounted || !scrollable) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px] bg-transparent"
    >
      <motion.div
        data-testid="scroll-progress-bar"
        aria-hidden="true"
        className="h-full origin-left bg-clay-amber"
        style={{ scaleX }}
      />
    </div>
  );
}
