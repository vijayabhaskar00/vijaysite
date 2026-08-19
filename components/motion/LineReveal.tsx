"use client";

import { motion } from "framer-motion";
import { useCanAnimate, EASE } from "@/lib/motion";

interface LineRevealProps {
  text: string;
  className?: string;
  /** Delay before the wipe starts, in ms. */
  delayMs?: number;
}

const lineVariants = (delayMs: number) => ({
  hidden: { y: "100%" },
  visible: { y: "0%", transition: { duration: 0.8, ease: EASE, delay: delayMs / 1000 } },
});

/** Masks its text inside an overflow-hidden line and wipes it into view on
 * mount, instead of SplitText's per-character stagger -- reads as more
 * considered at hero display size. The text stays ordinary readable
 * content in both branches (no per-character markup, no aria-label
 * needed): only the containing line is ever translated. Gated by
 * useCanAnimate (lib/motion.ts) -- the plain branch below is what
 * server-rendered/no-JS/crawler/reduced-motion visitors always see. */
export default function LineReveal({ text, className, delayMs = 0 }: LineRevealProps) {
  const canAnimate = useCanAnimate();

  if (!canAnimate) {
    return <span className={`block ${className ?? ""}`}>{text}</span>;
  }

  return (
    <span className={`block overflow-hidden ${className ?? ""}`}>
      <motion.span className="block" variants={lineVariants(delayMs)} initial="hidden" animate="visible">
        {text}
      </motion.span>
    </span>
  );
}
