"use client";

import { useEffect, useRef, useState } from "react";

interface StatCounterProps {
  value: string;
  className?: string;
}

const NUMERIC = /^\d+$/;

/** Counts a numeric stat value up into view on scroll. Mirrors Reveal's
 * "visible by default, JS opts into a pending/animated state" contract: the
 * real value renders as plain text until a mounted-and-observing effect
 * confirms it's safe to switch to the animated counter, so a no-JS/crawler
 * visitor always sees the real number, never a stuck "0". The counter
 * itself (the `--num` custom property and its transition) lives in
 * app/globals.css -- this component only decides *when* to set the target,
 * same "JS flips a value, CSS owns the motion" split Reveal already uses. */
export default function StatCounter({ value, className }: StatCounterProps) {
  const isNumeric = NUMERIC.test(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [pending, setPending] = useState(false);
  const [target, setTarget] = useState(0);

  useEffect(() => {
    if (!isNumeric) return;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPending(true);
          setTarget(Number(value));
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isNumeric, value]);

  if (!isNumeric || !pending) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }

  return (
    <span
      ref={ref}
      className={["stat-counter", className].filter(Boolean).join(" ")}
      style={{ "--num": target } as React.CSSProperties}
      aria-label={value}
    />
  );
}
