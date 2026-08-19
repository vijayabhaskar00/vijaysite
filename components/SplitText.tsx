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

// Splits on runs of whitespace, keeping the whitespace itself as its own
// entry (via the capturing group), so re-joining the parts reconstructs
// the original string exactly -- needed because each word's characters
// render inside one shared inline-block wrapper (see below); the spaces
// between words must stay outside any wrapper to remain normal, breakable
// line points.
function splitIntoWords(text: string): string[] {
  return text.split(/(\s+)/).filter((part) => part.length > 0);
}

/** Splits text into per-character spans that stagger in on mount. The real
 * string stays in the DOM via aria-label on the wrapper; individual
 * character spans are aria-hidden so screen readers get one clean word,
 * not a letter-by-letter spelling-out. Each word's characters share one
 * inline-block wrapper -- without it, the browser treats every character
 * span as its own independently-breakable inline box and can insert a
 * line break in the middle of a word (e.g. "pr" / "oduct"), since it no
 * longer sees the run of single-character spans as one indivisible word.
 * Animation is gated by useCanAnimate (lib/motion.ts) -- the plain branch
 * below is what server-rendered/no-JS/crawler visitors always see. */
export default function SplitText({ text, className, baseDelayMs = 0, staggerMs = 18 }: SplitTextProps) {
  const canAnimate = useCanAnimate();
  const words = splitIntoWords(text);

  if (!canAnimate) {
    return (
      <span className={className} aria-label={text}>
        {words.map((word, wordIndex) =>
          /\s/.test(word) ? (
            <span key={wordIndex} aria-hidden="true">
              {word}
            </span>
          ) : (
            <span key={wordIndex} aria-hidden="true" className="inline-block">
              {Array.from(word).map((char, charIndex) => (
                <span key={charIndex} aria-hidden="true" data-testid="split-char">
                  {char}
                </span>
              ))}
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
      {words.map((word, wordIndex) =>
        /\s/.test(word) ? (
          <span key={wordIndex} aria-hidden="true">
            {word}
          </span>
        ) : (
          <span key={wordIndex} aria-hidden="true" className="inline-block">
            {Array.from(word).map((char, charIndex) => (
              <motion.span
                key={charIndex}
                aria-hidden="true"
                data-testid="split-char"
                className="inline-block"
                variants={charVariants}
              >
                {char}
              </motion.span>
            ))}
          </span>
        )
      )}
    </motion.span>
  );
}
