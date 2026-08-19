"use client";

import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "@/components/motion/deviceTier";
import { EASE } from "@/lib/motion";

// useLayoutEffect warns when it runs during SSR; useEffect is a safe
// stand-in there since nothing paints server-side anyway (same pattern as
// Waypoint.tsx).
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Next re-mounts `template.tsx` fresh on every route change (unlike
// layout.tsx), which is what makes it the hook for a per-navigation enter
// transition. This flag is only ever read/written inside the client effect
// below -- NEVER used to decide the initial render, which must always be
// deterministic (`animate` starts false unconditionally). That matters
// because static export/SSR reuses one Node process across every route:
// a module-level flag consulted at render time would leak across pages and
// could permanently bake opacity:0 into whichever page's HTML got
// generated after the first one. Confined to an effect, it only ever
// observes real browser navigations, where each fresh page load gets a
// clean module instance and each subsequent in-app navigation shares one.
let hasEnteredOnce = false;

/** Test-only: resets the module-level flag between cases. */
export function __resetTemplateStateForTests() {
  hasEnteredOnce = false;
}

export default function Template({ children }: { children: ReactNode }) {
  // Every render -- server or the pre-hydration client render -- starts
  // here, so nothing is ever baked into the static HTML at opacity 0.
  const [animate, setAnimate] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (hasEnteredOnce && !prefersReducedMotion()) {
      // Runs before paint, so there's no flash of fully-visible content
      // between this and the browser's first paint of this instance.
      setAnimate(true);
    }
    hasEnteredOnce = true;
  }, []);

  if (!animate) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
