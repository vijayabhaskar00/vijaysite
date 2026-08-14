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

// Below this opacity a slot is visually gone -- but without more, its
// interactive descendants (the final slot holds the mailto/social/Link
// content) would still sit geometrically on top of whichever slot IS
// visible, absolutely positioned via `inset-0`. `opacity: 0` alone doesn't
// stop mouse clicks or keyboard focus: a keyboard user tabbing through the
// page triggers the browser's default scrollIntoView, which only cares
// about geometric bounding rects, not CSS opacity -- once the sticky
// wrapper is on-screen at all (it's h-screen, so it fills the viewport by
// design), every slot's content is already geometrically "in view," so
// focus can land on invisible links with no further scroll to reveal them.
const HIDDEN_OPACITY_THRESHOLD = 0.05;

/** One crossfading layer, stacked absolutely over its siblings. Opacity is
 * driven imperatively via useMotionValueEvent rather than Framer Motion's
 * declarative `style` binding -- Waypoint.tsx hit a real-browser bug where
 * the declarative binding stopped writing updated opacity to the DOM after
 * mount (see that file's comments); this reuses the proven fix instead of
 * reintroducing the same class of bug. The same callback also toggles
 * `pointer-events` and the `inert` attribute at the same opacity threshold:
 * `inert` is the purpose-built primitive for "present in the DOM (so
 * no-JS/crawler/SSR visitors still see the content), but not interactive,
 * not focusable, not exposed to assistive tech" -- it removes a near-
 * invisible slot from tab order and screen-reader traversal without
 * touching DOM structure. `pointer-events: none` is set alongside it as a
 * belt-and-suspenders measure for mouse clicks specifically (pointer-events
 * has no bearing on keyboard tab order on its own -- inert is what actually
 * fixes that). Both are applied imperatively, same as opacity, so
 * server-rendered/pre-mount markup never carries them either. */
function FadeSlot({ progress, points, children }: FadeSlotProps) {
  const opacity = useTransform(progress, points, [0, 1, 1, 0]);
  const nodeRef = useRef<HTMLDivElement>(null);

  const applyVisibility = (latest: number) => {
    const node = nodeRef.current;
    if (!node) return;
    node.style.opacity = String(latest);
    const hidden = latest < HIDDEN_OPACITY_THRESHOLD;
    node.style.pointerEvents = hidden ? "none" : "auto";
    if (hidden) {
      node.setAttribute("inert", "");
    } else {
      node.removeAttribute("inert");
    }
  };

  useMotionValueEvent(opacity, "change", applyVisibility);
  useIsomorphicLayoutEffect(() => {
    applyVisibility(opacity.get());
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
