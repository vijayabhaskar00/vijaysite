"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms, applied once the element scrolls into view. */
  delayMs?: number;
}

/** Fades an element up into place the first time it scrolls into view.
 * Content is visible by default (no-JS/crawler safe) — see the
 * reveal-scroll rules in globals.css, which only hide it once an
 * observer is confirmed and watching. Reduced motion is handled by
 * scoping those rules inside a prefers-reduced-motion media query
 * rather than a JS check, so there is nothing to keep in sync here. */
export default function Reveal({ children, className, delayMs }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    setPending(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const classes = [
    "reveal-scroll",
    pending && !visible ? "is-pending" : "",
    visible ? "is-visible" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}>
      {children}
    </div>
  );
}
