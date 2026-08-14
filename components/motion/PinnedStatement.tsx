"use client";

import { useLayoutEffect, useEffect, useRef, type ReactNode } from "react";
import { useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";

// useLayoutEffect warns when it runs during SSR; useEffect is a safe
// stand-in there since nothing paints server-side anyway (same pattern as
// Waypoint.tsx).
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Splits `range` into `slotCount` equal-width segments, each described as
 * `[fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd]` for a trapezoid
 * opacity envelope (fade in over the first quarter, hold, fade out over the
 * last quarter) -- except the final slot, whose fade-out points are pinned
 * just past `range`'s end, so it fades in and then holds at full opacity
 * for the rest of the scroll range instead of fading back out. */
export function buildFadeSegments(
  range: [number, number],
  slotCount: number
): [number, number, number, number][] {
  const [start, end] = range;
  const width = (end - start) / slotCount;
  return Array.from({ length: slotCount }, (_, index) => {
    const segStart = start + index * width;
    const segEnd = segStart + width;
    const isLast = index === slotCount - 1;
    const riseEnd = segStart + width * 0.25;
    const fallStart = isLast ? end : segStart + width * 0.75;
    const fallEnd = isLast ? end + 0.0001 : segEnd;
    return [segStart, riseEnd, fallStart, fallEnd];
  });
}

interface FadeSlotProps {
  progress: MotionValue<number>;
  points: [number, number, number, number];
  children: ReactNode;
}

/** One crossfading layer, stacked absolutely over its siblings. Opacity is
 * driven imperatively via useMotionValueEvent rather than Framer Motion's
 * declarative `style` binding -- Waypoint.tsx hit a real-browser bug where
 * the declarative binding stopped writing updated opacity to the DOM after
 * mount (see that file's comments); this reuses the proven fix instead of
 * reintroducing the same class of bug. */
function FadeSlot({ progress, points, children }: FadeSlotProps) {
  const opacity = useTransform(progress, points, [0, 1, 1, 0]);
  const nodeRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(opacity, "change", (latest) => {
    if (nodeRef.current) nodeRef.current.style.opacity = String(latest);
  });
  useIsomorphicLayoutEffect(() => {
    if (nodeRef.current) nodeRef.current.style.opacity = String(opacity.get());
  }, [opacity]);

  return (
    <div
      ref={nodeRef}
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
    >
      {children}
    </div>
  );
}

interface PinnedStatementProps {
  children: ReactNode;
  /** Short lines that crossfade in sequence before `children` (the final,
   * resting content) takes over. */
  lines: string[];
  /** Scroll-progress range (0-1) this section owns, subdivided across
   * `lines.length + 1` sequential fades. */
  range: [number, number];
  progress: MotionValue<number>;
  /** When true, renders every line and `children` statically stacked in
   * document flow -- no `position: sticky`, no crossfade -- same contract
   * Waypoint's `reduceMotion` prop already guarantees. */
  reduceMotion?: boolean;
  className?: string;
}

export default function PinnedStatement({
  children,
  lines,
  range,
  progress,
  reduceMotion = false,
  className,
}: PinnedStatementProps) {
  if (reduceMotion) {
    return (
      <section className={className}>
        <div className="flex flex-col items-center gap-6 py-24 text-center">
          {lines.map((line) => (
            <p key={line} className="max-w-xl text-lg leading-relaxed text-mute sm:text-xl">
              {line}
            </p>
          ))}
          {children}
        </div>
      </section>
    );
  }

  const segments = buildFadeSegments(range, lines.length + 1);

  return (
    <section className={className}>
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        <div className="relative h-full w-full max-w-3xl">
          {lines.map((line, index) => (
            <FadeSlot key={line} progress={progress} points={segments[index]}>
              <p className="max-w-xl text-lg leading-relaxed text-mute sm:text-xl">{line}</p>
            </FadeSlot>
          ))}
          <FadeSlot progress={progress} points={segments[lines.length]}>
            {children}
          </FadeSlot>
        </div>
      </div>
    </section>
  );
}
