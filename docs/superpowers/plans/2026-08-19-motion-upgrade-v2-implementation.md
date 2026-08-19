# Framer Motion Upgrade (v2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the site's scroll/entrance animation on Framer Motion (already a dependency), add lightweight CSS/Framer 3D pointer-tilt as the site's "3D" element, and add tasteful new micro-interactions — while preserving the site's hard SSR guarantee (no baked `opacity:0` in server-rendered markup) and leaving components that already work well (the marquee loop, the stat counter) untouched.

**Architecture:** One shared hook, `useCanAnimate()` in a new `lib/motion.ts`, is the single gate every rewritten/new component renders behind: `false` (unconditional on server + pre-hydration) → render a plain, fully-visible element with zero motion props; `true` (only reachable client-side, after mount, when `IntersectionObserver` exists and reduced-motion is not preferred) → render the real `motion.*` element. Every component in this plan follows that same two-branch shape.

**Tech Stack:** Framer Motion `^13.1.0` (already installed, no new dependencies), Next.js 14 static export, Vitest + Testing Library (`renderHook` from `@testing-library/react`).

**Spec:** `docs/superpowers/specs/2026-08-19-motion-upgrade-v2-design.md`

## Global Constraints

- Server-rendered/no-JS markup must never contain a baked `opacity:0` (or any motion-driven inline style) — verified by `app/__tests__/page.test.tsx`'s existing SSR composition test, which must keep passing unmodified throughout this plan.
- No new npm dependencies.
- No WebGL/Three.js — 3D means CSS/Framer `rotateX`/`rotateY`/`perspective` transforms only.
- Every animated interaction must be inert (no listeners attached, no transform applied) when `prefers-reduced-motion: reduce` is set — verified via `useCanAnimate()`'s reduced-motion branch, or (for the CSS-only additions in `lib/ui.ts`) via Tailwind's `motion-safe:` variant.
- `Marquee`, `StatCounter`'s counting mechanism, and `Header`/`Footer` (as zero-JS server components) are explicitly out of scope — do not modify their animation engines.

---

## Task 1: Shared motion foundation

**Files:**
- Create: `lib/motion.ts`
- Create: `lib/__tests__/motion.test.ts`

**Interfaces:**
- Produces: `EASE` (readonly tuple `[0.16, 1, 0.3, 1]`), `fadeUpItem` (Framer variants object), `staggerContainer(staggerMs: number)` (returns a variants object), `useCanAnimate(): boolean` — every later task in this plan imports one or more of these from `@/lib/motion`.

- [ ] **Step 1: Write `lib/motion.ts`**

```ts
import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/components/motion/deviceTier";

/** Shared easing curve -- the same cubic-bezier already used throughout
 * app/globals.css, so CSS-driven and Framer-Motion-driven motion read as
 * one language. */
export const EASE = [0.16, 1, 0.3, 1] as const;

/** A single fade-up entrance step, for use as a `variants` value on a
 * motion element that's a direct child of a `staggerContainer`. */
export const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

/** Variants for a container whose children are each a `fadeUpItem` (or
 * similar) -- staggers their entrance by `staggerMs` once the container's
 * own `visible` variant is triggered. */
export function staggerContainer(staggerMs: number) {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: staggerMs / 1000 } },
  };
}

/** The single gate every scroll/mount-triggered Framer Motion animation in
 * this app renders behind.
 *
 * Starts `false` unconditionally -- server render and the pre-hydration
 * client render both see `false` -- so callers MUST render a plain element
 * (no motion props at all) while this is `false`. That is what keeps
 * animation state out of server-rendered/no-JS markup entirely: there is
 * no `initial="hidden"` for a crawler to ever see, because the motion
 * element itself doesn't exist yet.
 *
 * Once mounted, flips to `true` -- meaning "render the real motion.*
 * element" -- unless either of two things holds, in which case it
 * deliberately stays `false` forever (same plain-render branch):
 *   - `IntersectionObserver` doesn't exist (very old browser, or a test
 *     environment) -- used as a universal motion-readiness signal even by
 *     components that don't themselves use `whileInView` (e.g. `SplitText`,
 *     `Tilt`), so every consumer shares one simple contract instead of each
 *     needing its own feature check.
 *   - the visitor prefers reduced motion (re-checked on every
 *     prefers-reduced-motion change, so toggling the OS setting mid-session
 *     stops future entrances/interactions from animating).
 */
export function useCanAnimate(): boolean {
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const update = () => setCanAnimate(!prefersReducedMotion());
    update();
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (typeof mql.addEventListener !== "function") return;
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return canAnimate;
}
```

- [ ] **Step 2: Write `lib/__tests__/motion.test.ts`**

```ts
import { renderHook, act, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCanAnimate } from "../motion";

class StubIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("useCanAnimate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts false on the very first render (SSR/pre-hydration safe)", () => {
    const { result } = renderHook(() => useCanAnimate());
    expect(result.current).toBe(false);
  });

  it("stays false when IntersectionObserver is unavailable (jsdom has none by default)", async () => {
    const { result } = renderHook(() => useCanAnimate());
    await act(async () => {});
    expect(result.current).toBe(false);
  });

  it("becomes true once mounted, when IntersectionObserver exists and motion is not reduced", async () => {
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);
    const { result } = renderHook(() => useCanAnimate());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("stays false when the visitor prefers reduced motion", async () => {
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    );
    const { result } = renderHook(() => useCanAnimate());
    await act(async () => {});
    expect(result.current).toBe(false);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run lib/__tests__/motion.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 4: Commit**

```bash
git add lib/motion.ts lib/__tests__/motion.test.ts
git commit -m "Add the shared useCanAnimate motion gate and Framer variants"
```

---

## Task 2: Rewrite `Reveal` on Framer Motion

**Files:**
- Modify: `components/Reveal.tsx`
- Modify: `components/__tests__/Reveal.test.tsx`

**Interfaces:**
- Consumes: `useCanAnimate` from `@/lib/motion` (Task 1).
- Produces: unchanged public API — `Reveal({ children: ReactNode; className?: string; delayMs?: number })`. Every existing call site (About, Experience, Contact, and the Home page panels) keeps working without changes.

- [ ] **Step 1: Rewrite `components/Reveal.tsx`**

```tsx
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
```

- [ ] **Step 2: Rewrite `components/__tests__/Reveal.test.tsx`**

```tsx
import { render, screen, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Reveal from "../Reveal";

describe("Reveal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders its children", () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders plain, immediately-visible content with no motion styles when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>
    );
    const wrapper = screen.getByText("Hello").parentElement;
    expect(wrapper).not.toHaveAttribute("style");
  });

  it("passes the className through on the plain (pre-motion) render", () => {
    render(
      <Reveal className="my-class">
        <p>Hello</p>
      </Reveal>
    );
    expect(screen.getByText("Hello").parentElement).toHaveClass("my-class");
  });

  it("animates to visible once the observed element intersects, when IntersectionObserver is available", async () => {
    let trigger: (() => void) | null = null;
    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        trigger = () =>
          callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    render(
      <Reveal delayMs={120}>
        <p>Hello</p>
      </Reveal>
    );

    await act(async () => {});
    await act(async () => {
      trigger?.();
    });

    const wrapper = screen.getByText("Hello").parentElement as HTMLElement;
    expect(getComputedStyle(wrapper).opacity).not.toBe("0");
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `npx vitest run components/__tests__/Reveal.test.tsx`
Expected: PASS (4 tests). If the last test is flaky against jsdom's animation timing, that's expected friction with testing a real Framer Motion transition in jsdom — the fix is to add a small `await waitFor(...)` around the final assertion rather than removing the test.

- [ ] **Step 4: Commit**

```bash
git add components/Reveal.tsx components/__tests__/Reveal.test.tsx
git commit -m "Rebuild Reveal on Framer Motion, same public API"
```

---

## Task 3: Rewrite `SplitText` on Framer Motion

**Files:**
- Modify: `components/SplitText.tsx`
- Modify: `components/__tests__/SplitText.test.tsx`

**Interfaces:**
- Consumes: `useCanAnimate`, `EASE` from `@/lib/motion` (Task 1).
- Produces: unchanged public API — `SplitText({ text, className?, baseDelayMs?, staggerMs? })`.

- [ ] **Step 1: Rewrite `components/SplitText.tsx`**

```tsx
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
```

- [ ] **Step 2: Rewrite `components/__tests__/SplitText.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SplitText from "../SplitText";

describe("SplitText", () => {
  it("exposes the real string to assistive tech via aria-label", () => {
    render(<SplitText text="Vijaya Bhaskar" />);
    expect(screen.getByLabelText("Vijaya Bhaskar")).toBeInTheDocument();
  });

  it("hides individual character spans from assistive tech", () => {
    render(<SplitText text="Hi" />);
    const charSpans = screen.getAllByTestId("split-char");
    expect(charSpans).toHaveLength(2);
    charSpans.forEach((span) => expect(span).toHaveAttribute("aria-hidden", "true"));
  });

  it("does not wrap whitespace in a split-char span", () => {
    render(<SplitText text="A B" />);
    expect(screen.getAllByTestId("split-char")).toHaveLength(2);
  });

  it("accepts baseDelayMs and staggerMs without breaking the rendered character spans", () => {
    render(<SplitText text="Hi" baseDelayMs={100} staggerMs={20} />);
    expect(screen.getAllByTestId("split-char")).toHaveLength(2);
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `npx vitest run components/__tests__/SplitText.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 4: Commit**

```bash
git add components/SplitText.tsx components/__tests__/SplitText.test.tsx
git commit -m "Rebuild SplitText on Framer Motion, same public API"
```

---

## Task 4: New `Tilt` component (pointer-driven 3D)

**Files:**
- Create: `components/motion/Tilt.tsx`
- Create: `components/motion/__tests__/Tilt.test.tsx`

**Interfaces:**
- Consumes: `useCanAnimate` from `@/lib/motion` (Task 1).
- Produces: `Tilt({ children: ReactNode; className?: string })` — consumed by `OrgLogoGrid` (Task 6) and `HomeHero`/About page (Task 7).

- [ ] **Step 1: Write `components/motion/Tilt.tsx`**

```tsx
"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { motion, useSpring } from "framer-motion";
import { useCanAnimate } from "@/lib/motion";

interface TiltProps {
  children: ReactNode;
  className?: string;
}

const MAX_ROTATION_DEG = 8;
const SPRING = { stiffness: 300, damping: 20 };

/** Wraps children in a small pointer-following 3D tilt on hover -- a CSS
 * transform (perspective + rotateX/rotateY), not WebGL. Renders an inert
 * plain wrapper (no listeners, no transform) whenever useCanAnimate() is
 * false, so reduced-motion visitors and pre-hydration/no-JS output are
 * completely unaffected. */
export default function Tilt({ children, className }: TiltProps) {
  const canAnimate = useCanAnimate();
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, SPRING);
  const rotateY = useSpring(0, SPRING);

  if (!canAnimate) {
    return <div className={className}>{children}</div>;
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * MAX_ROTATION_DEG * 2);
    rotateX.set(py * -MAX_ROTATION_DEG * 2);
  };

  const handlePointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Write `components/motion/__tests__/Tilt.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Tilt from "../Tilt";

describe("Tilt", () => {
  it("renders its children", () => {
    render(
      <Tilt>
        <p>Hello</p>
      </Tilt>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders a plain, unstyled wrapper with no pointer listeners when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(
      <Tilt className="my-class">
        <p>Hello</p>
      </Tilt>
    );
    const wrapper = screen.getByText("Hello").parentElement;
    expect(wrapper).toHaveClass("my-class");
    expect(wrapper).not.toHaveAttribute("style");
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `npx vitest run components/motion/__tests__/Tilt.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 4: Commit**

```bash
git add components/motion/Tilt.tsx components/motion/__tests__/Tilt.test.tsx
git commit -m "Add Tilt: a reusable pointer-driven 3D tilt wrapper"
```

---

## Task 5: `StatBand` staggered entrance

**Files:**
- Modify: `components/StatBand.tsx`

**Interfaces:**
- Consumes: `useCanAnimate`, `fadeUpItem`, `staggerContainer` from `@/lib/motion` (Task 1).
- No prop change; becomes a client component.

- [ ] **Step 1: Rewrite `components/StatBand.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import { stats } from "@/content/site";
import StatCounter from "@/components/StatCounter";
import { useCanAnimate, fadeUpItem, staggerContainer } from "@/lib/motion";

const ACCENTS = [
  { bg: "bg-clay-amber-light", text: "text-clay-amber" },
  { bg: "bg-clay-teal-light", text: "text-clay-teal" },
  { bg: "bg-clay-pink-light", text: "text-clay-pink" },
  { bg: "bg-clay-lavender-light", text: "text-clay-lavender" },
];

function Tile({ label, value, index }: { label: string; value: string; index: number }) {
  const accent = ACCENTS[index % ACCENTS.length];
  return (
    <>
      <p className={`font-display text-3xl font-extrabold tabular-nums ${accent.text} sm:text-4xl`}>
        <StatCounter value={value} />
      </p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink/70">{label}</p>
    </>
  );
}

export default function StatBand() {
  const canAnimate = useCanAnimate();

  if (!canAnimate) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`rounded-[2rem] ${ACCENTS[index % ACCENTS.length].bg} p-6 text-center shadow-clay-raised`}
          >
            <Tile label={stat.label} value={stat.value} index={index} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      variants={staggerContainer(80)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={fadeUpItem}
          className={`rounded-[2rem] ${ACCENTS[index % ACCENTS.length].bg} p-6 text-center shadow-clay-raised`}
        >
          <Tile label={stat.label} value={stat.value} index={index} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

- [ ] **Step 2: Run the existing test (no changes needed — verify it still passes)**

Run: `npx vitest run components/__tests__/StatBand.test.tsx`
Expected: PASS (1 test) — it only asserts each stat's value/label text is present, which holds in both the plain and animated branch.

- [ ] **Step 3: Commit**

```bash
git add components/StatBand.tsx
git commit -m "Give StatBand a staggered grid entrance"
```

---

## Task 6: `OrgLogoGrid` staggered entrance + pointer tilt

**Files:**
- Modify: `components/OrgLogoGrid.tsx`

**Interfaces:**
- Consumes: `Tilt` from `@/components/motion/Tilt` (Task 4); `useCanAnimate`, `fadeUpItem`, `staggerContainer` from `@/lib/motion` (Task 1).
- No prop change; becomes a client component.

- [ ] **Step 1: Rewrite `components/OrgLogoGrid.tsx`**

```tsx
"use client";

import { motion } from "framer-motion";
import { orgNames } from "@/content/site";
import OrgMark from "@/components/OrgMark";
import Tilt from "@/components/motion/Tilt";
import { useCanAnimate, fadeUpItem, staggerContainer } from "@/lib/motion";

function Card({ org }: { org: string }) {
  return (
    <div className="flex h-full flex-col items-center rounded-[2rem] bg-surface p-5 text-center shadow-clay-raised">
      <OrgMark org={org} className="h-16 w-16" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-mute">{org}</p>
    </div>
  );
}

export default function OrgLogoGrid() {
  const canAnimate = useCanAnimate();

  if (!canAnimate) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {orgNames.map((org) => (
          <Tilt key={org} className="h-full">
            <Card org={org} />
          </Tilt>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      variants={staggerContainer(60)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      {orgNames.map((org) => (
        <motion.div key={org} variants={fadeUpItem}>
          <Tilt className="h-full">
            <Card org={org} />
          </Tilt>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

- [ ] **Step 2: Run the existing test (no changes needed — verify it still passes)**

Run: `npx vitest run components/__tests__/OrgLogoGrid.test.tsx`
Expected: PASS (2 tests) — the org-name text assertion and the "one top-level child per org, no canvas" structural assertion both hold regardless of the `Tilt`/motion wrapping inside each child.

- [ ] **Step 3: Commit**

```bash
git add components/OrgLogoGrid.tsx
git commit -m "Give OrgLogoGrid a staggered entrance and pointer-driven 3D tilt"
```

---

## Task 7: Hero orchestration, scroll-linked blob parallax, and photo tilt

**Files:**
- Create: `components/HomeHero.tsx`
- Modify: `app/page.tsx`
- Modify: `app/about/page.tsx`
- Modify: `lib/ui.ts`

**Interfaces:**
- Consumes: `Tilt` (Task 4), `useCanAnimate`/`fadeUpItem`/`staggerContainer` (Task 1), `Reveal`/`SplitText` (Tasks 2-3, unchanged public API).
- Produces: `HomeHero()` — a zero-prop client component rendering the hero section + credentials marquee as one mount-triggered staggered sequence. `app/page.tsx` renders `<HomeHero />` in place of its previous inline hero/blob/marquee JSX.

- [ ] **Step 1: Write `components/HomeHero.tsx`**

```tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { site, orgNames } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import SplitText from "@/components/SplitText";
import Marquee from "@/components/Marquee";
import Tilt from "@/components/motion/Tilt";
import { useCanAnimate, fadeUpItem, staggerContainer } from "@/lib/motion";

/** Two overlapping soft blobs behind the hero portrait -- the clay
 * illustration that replaces the removed Three.js flythrough canvas. Pure
 * decoration (aria-hidden), so it carries no content of its own. Drifts
 * subtly as the page scrolls past the hero (scroll-linked, not an
 * autonomous loop -- inert entirely under reduced motion, since the
 * transform values are only attached when useCanAnimate() is true). */
function ClayBlobBackdrop() {
  const canAnimate = useCanAnimate();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 40]);
  const scale = useTransform(scrollY, [0, 600], [1, 1.08]);

  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -right-12 -top-12 -z-10 h-40 w-40 opacity-90 sm:-right-14 sm:-top-14 sm:h-48 sm:w-48 lg:-right-16 lg:-top-16 lg:h-56 lg:w-56"
      style={canAnimate ? { y, scale } : undefined}
    >
      <path
        fill="#FBE0C4"
        d="M281,305Q246,360,183,347Q120,334,88,281Q56,228,80,169Q104,110,163,86Q222,62,272,101Q322,140,323,199Q324,258,281,305Z"
      />
      <path
        fill="#FBE1E9"
        opacity="0.8"
        d="M255,120Q270,180,235,220Q200,260,150,245Q100,230,90,175Q80,120,125,90Q170,60,215,80Q260,100,255,120Z"
      />
    </motion.svg>
  );
}

export default function HomeHero() {
  const canAnimate = useCanAnimate();

  const pill = (
    <p className="inline-block rounded-full bg-clay-amber-light px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-amber">
      {site.location} — {site.tagline}
    </p>
  );

  const heading = (
    <h1 className="mt-4 text-balance font-display text-[clamp(2.75rem,9vw,7rem)] font-extrabold leading-[0.95] text-ink">
      <SplitText text={site.name} baseDelayMs={80} staggerMs={18} />
    </h1>
  );

  const descriptionRow = (
    <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
      <p className="max-w-xl text-lg leading-relaxed text-mute">{site.description}</p>
      <Tilt>
        <PhotoFrame
          src={site.photo.src}
          alt={site.photo.alt}
          width={site.photo.width}
          height={site.photo.height}
          loading="eager"
          className="h-28 w-28 shrink-0 md:h-32 md:w-32"
        />
      </Tilt>
    </div>
  );

  const marquee = (
    <Marquee
      items={orgNames}
      className="rounded-full bg-surface py-4 text-sm font-semibold text-mute shadow-clay-raised"
    />
  );

  if (!canAnimate) {
    return (
      <>
        <section className="relative overflow-hidden pt-16 sm:pt-24 md:pt-32">
          <ClayBlobBackdrop />
          {pill}
          {heading}
          {descriptionRow}
        </section>
        {marquee}
      </>
    );
  }

  return (
    <motion.div variants={staggerContainer(160)} initial="hidden" animate="visible">
      <section className="relative overflow-hidden pt-16 sm:pt-24 md:pt-32">
        <ClayBlobBackdrop />
        <motion.div variants={fadeUpItem}>{pill}</motion.div>
        <motion.div variants={fadeUpItem}>{heading}</motion.div>
        <motion.div variants={fadeUpItem}>{descriptionRow}</motion.div>
      </section>
      <motion.div variants={fadeUpItem}>{marquee}</motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Update `app/page.tsx`** — replace the inline hero/blob/marquee with `<HomeHero />`, drop now-unused imports, and add a small arrow-nudge on the three "View full…" CTA links

```tsx
import Link from "next/link";
import { site, social } from "@/content/site";
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import HomeHero from "@/components/HomeHero";
import StatBand from "@/components/StatBand";
import Reveal from "@/components/Reveal";
import OrgLogoGrid from "@/components/OrgLogoGrid";
import OrgMark from "@/components/OrgMark";
import { linkClass, navLinkClass } from "@/lib/ui";

const EXPERIENCE_HIGHLIGHTS: (TimelineEntry & { number: string })[] = [
  { ...employment[0], number: "01" },
  { ...credentials[0], number: "02" },
  { ...education[0], number: "03" },
];

function ArrowLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className={`mt-6 inline-block ${linkClass}`}>
      {children}{" "}
      <span className="inline-block motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <HomeHero />

      <Reveal>
        <StatBand />
      </Reveal>

      <Reveal>
        <p className="inline-block rounded-full bg-clay-amber-light px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-amber">
          Affiliations &amp; credentials
        </p>
        <div className="mt-6">
          <OrgLogoGrid />
        </div>
      </Reveal>

      <Reveal className="rounded-[2rem] bg-clay-pink-light px-6 py-14 sm:py-20">
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-pink">
          About
        </p>
        <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold text-ink sm:text-5xl">
          {site.tagline}
        </h2>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink/80">{site.description}</p>
        <ArrowLink href="/about">View full profile</ArrowLink>
      </Reveal>

      <Reveal className="rounded-[2rem] bg-clay-teal-light px-6 py-14 sm:py-20">
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-teal">
          Experience
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">A working history.</h2>
        <ol className="mt-8 max-w-xl space-y-6">
          {EXPERIENCE_HIGHLIGHTS.map((entry) => (
            <li key={`${entry.org}-${entry.period}`} className="flex items-start gap-4">
              <span className="mt-1 shrink-0 text-sm font-bold tabular-nums text-clay-teal">{entry.number}</span>
              <OrgMark org={entry.org} className="h-10 w-10 shrink-0" />
              <div className="min-w-0">
                <p className="font-display text-lg font-bold text-ink">
                  {entry.role} · {entry.org}
                </p>
                <p className="mt-1 text-sm text-ink/70">{entry.period}</p>
              </div>
            </li>
          ))}
        </ol>
        <ArrowLink href="/experience">View full timeline</ArrowLink>
      </Reveal>

      <Reveal className="rounded-[2rem] bg-clay-lavender-light px-6 py-14 text-center sm:py-20">
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-lavender">
          Contact
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">Get in touch.</h2>
        <p className="mt-6">
          <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
            {site.email}
          </a>
        </p>
        <ul aria-label="Social links" className="mt-6 flex list-none flex-wrap justify-center gap-2 p-0">
          {social.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <ArrowLink href="/contact">View full contact</ArrowLink>
      </Reveal>
    </div>
  );
}
```

- [ ] **Step 3: Add `group` to `linkClass` in `lib/ui.ts`** so `ArrowLink`'s arrow span can react to `group-hover`

```ts
export const linkClass = `link-sweep group font-semibold text-clay-amber rounded-sm ${focusRingClass}`;
```

(Only this one line changes in `lib/ui.ts` for this task — `navLinkClass` is untouched here, see Task 8.)

- [ ] **Step 4: Wrap the About page's portrait in `Tilt`**

In `app/about/page.tsx`, add the import and wrap the existing `<PhotoFrame>`:

```tsx
import Tilt from "@/components/motion/Tilt";
```

```tsx
      <Reveal>
        <Tilt>
          <PhotoFrame
            src={site.photo.src}
            alt={site.photo.alt}
            width={site.photo.width}
            height={site.photo.height}
            loading="eager"
            className="mx-auto h-40 w-40 md:mx-0 md:h-48 md:w-48"
          />
        </Tilt>
      </Reveal>
```

- [ ] **Step 5: Run the homepage SSR test — the most important check in this whole plan**

Run: `npx vitest run app/__tests__/page.test.tsx`
Expected: PASS (2 tests), **unmodified** — `useCanAnimate()` starts `false` in every component (`HomeHero`, `Reveal`, `SplitText`, `StatBand`, `OrgLogoGrid`, `Tilt`) during `renderToStaticMarkup`, since `renderToStaticMarkup` never runs effects, so the whole tree renders through its plain branch with zero motion props. The `site.name`, "View full profile", "View full timeline", and "Get in touch" content anchors are all still present in the plain-branch JSX.

- [ ] **Step 6: Commit**

```bash
git add components/HomeHero.tsx app/page.tsx app/about/page.tsx lib/ui.ts
git commit -m "Orchestrate the hero entrance, add scroll-linked blob parallax and photo tilt"
```

---

## Task 8: Page-transition polish and CSS-only hover/press micro-interactions

**Files:**
- Modify: `app/template.tsx`
- Modify: `lib/ui.ts`
- Modify: `app/not-found.tsx`

**Interfaces:** none new — small, independent polish edits.

- [ ] **Step 1: Add a subtle scale to `app/template.tsx`'s page-enter transition, reusing the shared `EASE`**

```tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "@/components/motion/deviceTier";
import { EASE } from "@/lib/motion";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

let hasEnteredOnce = false;

/** Test-only: resets the module-level flag between cases. */
export function __resetTemplateStateForTests() {
  hasEnteredOnce = false;
}

export default function Template({ children }: { children: ReactNode }) {
  const [animate, setAnimate] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (hasEnteredOnce && !prefersReducedMotion()) {
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
```

(Only the `initial`/`animate`/`transition` values and the `EASE` import change — every comment and the `hasEnteredOnce` SSR-safety mechanism are untouched verbatim.)

- [ ] **Step 2: Add a Tailwind-only hover/press scale to `navLinkClass` in `lib/ui.ts`, gated by `motion-safe:`**

```ts
// Shared Tailwind utility strings for clay pill-styled links, kept here so
// styling stays consistent across Header, Footer, and page-level links
// without duplicating the same class list by hand in every file.
const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-amber/40";

// link-sweep (globals.css) draws an animated underline on hover/focus for
// inline body-text links (mailto, "View full profile"-style CTAs). `group`
// lets an arrow glyph nested inside react to group-hover (see app/page.tsx).
export const linkClass = `link-sweep group font-semibold text-clay-amber rounded-sm ${focusRingClass}`;

// Pill-shaped nav/social links: fills with the site's primary accent and
// scales up slightly on hover/focus, presses back down on click --
// motion-safe: means this stays purely a color change under
// prefers-reduced-motion, with zero JS involved either way.
export const navLinkClass = `inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-ink shadow-clay-raised transition-[background-color,color,transform] duration-300 hover:bg-clay-amber hover:text-surface focus-visible:bg-clay-amber focus-visible:text-surface motion-safe:hover:scale-[1.03] motion-safe:focus-visible:scale-[1.03] motion-safe:active:scale-95 active:shadow-clay-pressed ${focusRingClass}`;
```

- [ ] **Step 3: Wrap the 404 page's content in `Reveal` for consistency with every other route**

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/content/site";
import { linkClass } from "@/lib/ui";
import Reveal from "@/components/Reveal";

// Deliberately not using buildMetadata()'s canonical/OG wiring here — a 404
// response shouldn't declare a canonical URL for itself. It still renders
// inside the shared app/layout.tsx, so it keeps the real Header/Footer,
// fonts, and palette rather than falling back to Next's bare default page.
export const metadata: Metadata = {
  title: `Page not found | ${site.name}`,
  description: "The page you're looking for doesn't exist.",
};

export default function NotFound() {
  return (
    <Reveal>
      <section className="mx-auto max-w-md rounded-[2rem] bg-surface px-8 py-16 text-center shadow-clay-raised sm:py-20">
        <p className="inline-block rounded-full bg-clay-amber-light px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-amber">
          404
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-mute">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
        </p>
        <Link href="/" className={`mt-8 inline-block text-lg ${linkClass}`}>
          Back to home
        </Link>
      </section>
    </Reveal>
  );
}
```

- [ ] **Step 4: Run the template test (no changes needed — verify it still passes)**

Run: `npx vitest run app/__tests__/template.test.tsx`
Expected: PASS (4 tests) — none of the assertions check the exact `initial`/`animate` values, only the presence/absence of a `[style]` attribute and the reduced-motion skip behavior, none of which changed.

- [ ] **Step 5: Commit**

```bash
git add app/template.tsx lib/ui.ts app/not-found.tsx
git commit -m "Polish the page transition and add CSS-only pill hover/press motion"
```

---

## Task 9: Delete dead CSS

**Files:**
- Modify: `app/globals.css`

**Interfaces:** none — pure deletion, verified by grep (Step 1) before removal.

- [ ] **Step 1: Confirm nothing still references the classes about to be deleted**

Run: `grep -rn "\"reveal\"\|reveal \[animation-delay\|reveal-scroll\|split-char" app components lib --include="*.tsx" --include="*.ts"`
Expected: no matches outside `components/Reveal.tsx`/`SplitText.tsx`'s own internal implementation details (which no longer reference these CSS class names at all after Tasks 2-3) and `data-testid="split-char"` (a different string, `split-char` as a *test id*, not a CSS class — this grep is a sanity check, not a hard gate; confirm by eye that any remaining hits are the `data-testid` attribute, not a CSS class usage).

- [ ] **Step 2: Delete `.reveal`/`@keyframes reveal-up`, `.split-char`, and `.reveal-scroll.is-pending`/`.is-visible` from `app/globals.css`**

Replace the full file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Reserves the scrollbar's own width permanently, so no layout shift occurs
   if any future overlay locks body scroll. */
html {
  scrollbar-gutter: stable;
}

body {
  background-color: #fbf3e7;
  color: #2c2013;
}

/* Registered so `--num` is animatable (not just a plain custom property
   swap) -- lives outside any media query since @property registration
   itself is not motion, only the transition on it is. */
@property --num {
  syntax: "<integer>";
  inherits: false;
  initial-value: 0;
}

.stat-counter {
  counter-reset: num var(--num, 0);
}

.stat-counter::before {
  content: counter(num);
}

/* Grayscale-to-color reveal on hover — a small, deliberate interaction
   detail rather than a decorative frame. Hover-only: pure color shift with
   no content hidden or revealed, so no keyboard equivalent is needed. The
   colour shift itself isn't motion, so it runs unconditionally; the
   accompanying zoom is real motion and lives in the reduced-motion-gated
   block below. */
.photo-frame {
  overflow: hidden;
  display: inline-block;
}

.photo-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(1) contrast(1.05);
  transition: filter 0.5s ease;
}

.photo-frame:hover img {
  filter: grayscale(0);
}

/* Animated underline sweep for inline text links (mailto, "View full
   profile" CTAs) — a transform on a pseudo-element rather than a
   text-decoration toggle, so it can ease in and out instead of snapping.
   The scaleX(0)/(1) states are the static (non-motion) part and stay
   unconditional; only the eased transition between them is gated below. */
.link-sweep {
  position: relative;
}

.link-sweep::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;
}

.link-sweep:hover::after,
.link-sweep:focus-visible::after {
  transform: scaleX(1);
  transform-origin: left;
}

/* Motion, gated behind prefers-reduced-motion in one shared block. */
@media (prefers-reduced-motion: no-preference) {
  @keyframes marquee {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }

  .marquee-track {
    animation: marquee 32s linear infinite;
  }

  .marquee-track:hover {
    animation-play-state: paused;
  }

  .photo-frame img {
    transition:
      filter 0.5s ease,
      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .photo-frame:hover img {
    transform: scale(1.045);
  }

  .link-sweep::after {
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .stat-counter {
    transition: --num 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

/* Slow-scrolling credentials ticker beneath the hero — the page's one
   pure-CSS kinetic-type move, deliberately left as-is by the Framer Motion
   upgrade (see docs/superpowers/specs/2026-08-19-motion-upgrade-v2-design.md).
   The track holds two identical copies of its content so it can loop
   seamlessly; reduced-motion hides the second copy and leaves the first
   sitting still instead of animating. */
.marquee-track {
  display: flex;
  width: max-content;
}

@media (prefers-reduced-motion: reduce) {
  .marquee-copy-2 {
    display: none;
  }
}
```

- [ ] **Step 3: Run the full test suite**

Run: `npm run test`
Expected: PASS, all files — this is the first point in the plan where every rewritten component and its CSS dependency are simultaneously in their final state.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "Delete the CSS made dead by the Framer Motion rewrite"
```

---

## Task 10: Full verification gate + manual QA

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 2: Full test suite**

Run: `npm run test`
Expected: exits 0, all suites pass — pay special attention to `app/__tests__/page.test.tsx` and `app/__tests__/template.test.tsx`, the two tests that guard this plan's core SSR-safety invariant.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: exits 0. Framer Motion adds to the client JS bundle for every route that now uses it (Home, About — both already used `Reveal`/`SplitText` before) — compare the route sizes in the build output against the pre-upgrade numbers as a sanity check, not a hard gate (some growth is expected and fine; a large jump on a route that shouldn't have changed, like `/experience` or `/contact`, would indicate an accidental new client boundary).

- [ ] **Step 4: Verify the export**

Run: `npm run verify:export`
Expected: `Export verification passed: no placeholders, all required facts present.`

- [ ] **Step 5: Manual browser pass**

Run: `npm run build && npx serve@latest out -l 4173` (this is a static-export site — `next start` doesn't work here, see the project's own README/prior verification steps) and check in a real browser:
- Golden path: home hero's staggered entrance (pill → heading → description/photo → marquee) on first load; scroll down and confirm StatBand tiles and OrgLogoGrid cards each stagger in; hover an OrgLogoGrid card and the hero/About portrait and confirm the pointer-tilt follows the cursor and springs back on mouse-leave; hover nav/social pills and confirm the scale+color-fill; scroll past the hero and confirm the blob drifts/scales subtly; navigate between routes and confirm the page-enter transition.
- `prefers-reduced-motion: reduce` (DevTools rendering emulation): confirm nothing animates at all anywhere — no stagger, no tilt (hovering a card/photo does nothing), no blob parallax, no page-transition, no pill scale — content is fully visible immediately and pill hover still shows the color fill (that part is unconditional CSS, only the `motion-safe:` scale is suppressed).
- Mobile viewport widths (375px, 768px): no horizontal scroll on any page; tilt/parallax are pointer-driven so they're simply inert on touch (no error, no broken layout).
- View source / disable JS: confirm every page's content (including the hero heading text, stat values, org names) is present and fully visible in the raw HTML, matching the `page.test.tsx` guarantee in a real browser, not just the test environment.

- [ ] **Step 6: Final commit (only if Step 5 surfaced fixes)**

If manual QA required any follow-up edits, stage and commit them with a message describing what the QA pass caught. If nothing needed fixing, this plan is complete as of Task 9's commit — no empty commit needed.
