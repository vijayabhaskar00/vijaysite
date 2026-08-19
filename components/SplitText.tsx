"use client";

import { motion } from "framer-motion";
import { useCanAnimate, EASE } from "@/lib/motion";

interface SplitTextProps {
  text: string;
  className?: string;
  /** Delay before the first character starts, in ms. */
  baseDelayMs?: number;
  /** Delay added per subsequent character, in ms. */
  staggerMs?: number;
}

const container = (baseDelayMs: number, staggerMs: number) => ({
  hidden: {},
  visible: { transition: { delayChildren: baseDelayMs / 1000, staggerChildren: staggerMs / 1000 } },
});

const charVariants = {
  hidden: { opacity: 0, y: "60%", rotate: 4 },
  visible: { opacity: 1, y: "0%", rotate: 0, transition: { duration: 0.6, ease: EASE } },
};

/** Splits text into per-character spans that stagger in on mount. The real
 * string stays in the DOM via aria-label on the wrapper; individual
 * character spans are aria-hidden so screen readers get one clean word,
 * not a letter-by-letter spelling-out. Animation is gated by
 * useCanAnimate (lib/motion.ts) -- the plain branch below is what
 * server-rendered/no-JS/crawler visitors always see. */
export default function SplitText({ text, className, baseDelayMs = 0, staggerMs = 18 }: SplitTextProps) {
  const canAnimate = useCanAnimate();
  const chars = Array.from(text);

  if (!canAnimate) {
    return (
      <span className={className} aria-label={text}>
        {chars.map((char, index) =>
          /\s/.test(char) ? (
            <span key={index} aria-hidden="true">
              {char}
            </span>
          ) : (
            <span key={index} aria-hidden="true" data-testid="split-char">
              {char}
            </span>
          )
        )}
      </span>
    );
  }

  return (
    <motion.span
      className={className}
      aria-label={text}
      variants={container(baseDelayMs, staggerMs)}
      initial="hidden"
      animate="visible"
    >
      {chars.map((char, index) =>
        /\s/.test(char) ? (
          <span key={index} aria-hidden="true">
            {char}
          </span>
        ) : (
          <motion.span
            key={index}
            aria-hidden="true"
            data-testid="split-char"
            className="inline-block"
            variants={charVariants}
          >
            {char}
          </motion.span>
        )
      )}
    </motion.span>
  );
}
