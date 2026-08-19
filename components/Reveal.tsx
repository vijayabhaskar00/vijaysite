"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useCanAnimate, EASE } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms, applied once the element scrolls into view. */
  delayMs?: number;
}

const variants = (delayMs?: number) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE, delay: delayMs ? delayMs / 1000 : 0 },
  },
});

/** Fades an element up into place the first time it scrolls into view.
 * Content is visible by default (no-JS/crawler safe) -- see useCanAnimate
 * in lib/motion.ts, which this renders a plain element under until it's
 * confirmed safe to animate. Reduced motion is handled by the same gate. */
export default function Reveal({ children, className, delayMs }: RevealProps) {
  const canAnimate = useCanAnimate();

  if (!canAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants(delayMs)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -10% 0px" }}
    >
      {children}
    </motion.div>
  );
}
