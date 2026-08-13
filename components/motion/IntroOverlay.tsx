"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

const SESSION_KEY = "intro-shown";
const MAX_DURATION_MS = 1500;

interface IntroOverlayProps {
  enabled: boolean;
}

export default function IntroOverlay({ enabled }: IntroOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const finishedRef = useRef(false);
  const frameIdRef = useRef<number | undefined>();

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (frameIdRef.current !== undefined) {
      cancelAnimationFrame(frameIdRef.current);
    }
    setVisible(false);
    document.body.style.overflow = "";
    window.removeEventListener("keydown", finish);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable (e.g. private browsing) -- the intro
      // simply replays next time, which is harmless.
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let alreadyShown = false;
    try {
      alreadyShown = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      alreadyShown = false;
    }
    if (alreadyShown) return;

    finishedRef.current = false;
    setVisible(true);
    document.body.style.overflow = "hidden";
    const start = performance.now();

    // Percent reflects real critical-asset readiness (fonts), not just
    // elapsed time -- but never blocks past the 1.5s cap on a stalled asset.
    // Climbs toward ~95% from elapsed time alone while waiting, then jumps to
    // 100% the instant fonts are confirmed ready, or force-finishes at the
    // cap regardless of font state.
    let fontsReady = !(typeof document !== "undefined" && "fonts" in document);
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(() => {
        fontsReady = true;
      });
    }

    const tick = () => {
      const elapsed = performance.now() - start;
      const elapsedFraction = elapsed / MAX_DURATION_MS;
      const displayFraction = fontsReady ? 1 : Math.min(elapsedFraction, 0.95);
      setPercent(Math.round(displayFraction * 100));
      if (fontsReady || elapsed >= MAX_DURATION_MS) {
        finish();
      } else {
        frameIdRef.current = requestAnimationFrame(tick);
      }
    };
    frameIdRef.current = requestAnimationFrame(tick);
    window.addEventListener("keydown", finish);

    return () => {
      if (frameIdRef.current !== undefined) {
        cancelAnimationFrame(frameIdRef.current);
      }
      document.body.style.overflow = "";
      window.removeEventListener("keydown", finish);
    };
  }, [enabled, finish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="intro-overlay"
          role="presentation"
          aria-hidden="true"
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={finish}
          onWheel={finish}
          onTouchMove={finish}
        >
          <motion.p
            className="font-display text-4xl font-black uppercase tracking-tight text-paper sm:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {site.shortName}
          </motion.p>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-mute">{percent}%</p>
          <p className="mt-10 font-mono text-[11px] uppercase tracking-widest text-mute">
            Scroll to begin
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
