# Signature Motion Craft (v3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the site a homepage-showcase scroll-choreography layer (cursor-reactive hero depth, scroll exit, line-mask heading reveal, ambient section color drift) plus a sitewide interaction-craft layer (spotlight hover, magnetic links, a morphing active-nav indicator), on top of the existing clay visual system and the v2 Framer Motion foundation — no new dependencies, no WebGL, no scroll-hijacking.

**Architecture:** Every new motion piece is its own small component under `components/motion/`, following the exact two-branch shape already established by `Tilt`/`Reveal`/`SplitText`: a plain, fully-visible/inert render when `useCanAnimate()` is false, and the real Framer Motion behavior only once mounted and confirmed safe. `Spotlight` is the one deliberate exception (pure cursor-position CSS, no motion), matching the existing `.photo-frame` hover precedent.

**Tech Stack:** Framer Motion `13.1.0` (already installed, no new dependencies), Next.js 14 static export, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-19-motion-upgrade-v3-design.md`

## Global Constraints

- No new npm dependencies, no WebGL, no scroll-hijacking/pinning of the whole page — `position: sticky`/`fixed` and scroll-linked transforms only, the page always scrolls natively.
- Every new motion component renders through the same `useCanAnimate()` gate as v2: plain/inert on server, pre-hydration, `IntersectionObserver`-less environments, and reduced motion; real motion only once mounted and confirmed safe. `Spotlight` is the sole exception — it carries no motion, only a cursor-tracked CSS custom property, so it runs unconditionally like `.photo-frame`'s grayscale-to-color hover.
- The homepage SSR test (`app/__tests__/page.test.tsx` — no baked `opacity:0` anywhere in the full composition) must keep passing, unmodified, throughout this plan.
- Visual identity (clay palette, type scale, shadow system, rounding) does not change. `Marquee`, `StatCounter`'s counting mechanism, and `Footer` are explicitly out of scope — do not modify them.

---

## Task 1: Shared pointer-spring config

**Files:**
- Modify: `lib/motion.ts`
- Modify: `lib/__tests__/motion.test.ts`
- Modify: `components/motion/Tilt.tsx`

**Interfaces:**
- Produces: `POINTER_SPRING` (`{ stiffness: 300, damping: 20 }`) from `@/lib/motion` — every later cursor-driven component (`Magnetic`, `HomeHero`'s parallax layers) imports this instead of redefining its own spring tuning.

- [ ] **Step 1: Add `POINTER_SPRING` to `lib/motion.ts`**

Add this export anywhere after the `EASE` export:

```ts
/** Spring tuning shared by every pointer-driven motion value in this app
 * (Tilt's rotation, Magnetic's nudge, HomeHero's parallax layers) -- one
 * constant so they all feel like the same physical material. */
export const POINTER_SPRING = { stiffness: 300, damping: 20 };
```

- [ ] **Step 2: Add a test for it to `lib/__tests__/motion.test.ts`**

Add this import alongside the existing one:

```ts
import { useCanAnimate, POINTER_SPRING } from "../motion";
```

Add this `describe` block at the end of the file:

```ts
describe("POINTER_SPRING", () => {
  it("is the shared spring config used by every cursor-driven component", () => {
    expect(POINTER_SPRING).toEqual({ stiffness: 300, damping: 20 });
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run lib/__tests__/motion.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 4: Refactor `Tilt` to use `POINTER_SPRING` instead of its own local constant**

Replace the whole file with:

```tsx
"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { motion, useSpring } from "framer-motion";
import { useCanAnimate, POINTER_SPRING } from "@/lib/motion";

interface TiltProps {
  children: ReactNode;
  className?: string;
}

const MAX_ROTATION_DEG = 8;

/** Wraps children in a small pointer-following 3D tilt on hover -- a CSS
 * transform (perspective + rotateX/rotateY), not WebGL. Renders an inert
 * plain wrapper (no listeners, no transform) whenever useCanAnimate() is
 * false, so reduced-motion visitors and pre-hydration/no-JS output are
 * completely unaffected. */
export default function Tilt({ children, className }: TiltProps) {
  const canAnimate = useCanAnimate();
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, POINTER_SPRING);
  const rotateY = useSpring(0, POINTER_SPRING);

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

- [ ] **Step 5: Run Tilt's existing tests to confirm nothing broke**

Run: `npx vitest run components/motion/__tests__/Tilt.test.tsx`
Expected: PASS (2 tests) — unmodified, since neither test inspects spring values.

- [ ] **Step 6: Commit**

```bash
git add lib/motion.ts lib/__tests__/motion.test.ts components/motion/Tilt.tsx
git commit -m "Add the shared POINTER_SPRING config, used by Tilt and later cursor-driven components"
```

---

## Task 2: `LineReveal` — line-mask heading reveal

**Files:**
- Create: `components/motion/LineReveal.tsx`
- Create: `components/motion/__tests__/LineReveal.test.tsx`

**Interfaces:**
- Consumes: `useCanAnimate`, `EASE` from `@/lib/motion` (Task 1... already exists from v2).
- Produces: `LineReveal({ text: string; className?: string; delayMs?: number })` — consumed by `HomeHero` (Task 9) in place of `SplitText` for the hero heading only.

- [ ] **Step 1: Write `components/motion/LineReveal.tsx`**

```tsx
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
```

- [ ] **Step 2: Write `components/motion/__tests__/LineReveal.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LineReveal from "../LineReveal";

describe("LineReveal", () => {
  it("renders the real text as plain readable content", () => {
    render(<LineReveal text="Vijaya Bhaskar Jatoth" />);
    expect(screen.getByText("Vijaya Bhaskar Jatoth")).toBeInTheDocument();
  });

  it("renders a single plain block with no motion styles when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(<LineReveal text="Hello" className="my-class" />);
    const el = screen.getByText("Hello");
    expect(el).toHaveClass("block", "my-class");
    expect(el).not.toHaveAttribute("style");
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `npx vitest run components/motion/__tests__/LineReveal.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 4: Commit**

```bash
git add components/motion/LineReveal.tsx components/motion/__tests__/LineReveal.test.tsx
git commit -m "Add LineReveal: a masked line-wipe text reveal for hero-scale headings"
```

---

## Task 3: `Magnetic` — cursor-proximity nudge

**Files:**
- Create: `components/motion/Magnetic.tsx`
- Create: `components/motion/__tests__/Magnetic.test.tsx`

**Interfaces:**
- Consumes: `useCanAnimate`, `POINTER_SPRING` from `@/lib/motion` (Task 1).
- Produces: `Magnetic({ children: ReactNode; className?: string })` — consumed by `Header` (Task 10), homepage `ArrowLink` CTAs and the Contact-page/homepage social+mailto links (Task 8).

- [ ] **Step 1: Write `components/motion/Magnetic.tsx`**

```tsx
"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { motion, useSpring } from "framer-motion";
import { useCanAnimate, POINTER_SPRING } from "@/lib/motion";

interface MagneticProps {
  children: ReactNode;
  className?: string;
}

const MAX_NUDGE_PX = 8;

/** Nudges its children a few pixels toward the cursor when it's over the
 * element, springing back on leave -- the same POINTER_SPRING primitive
 * Tilt uses, applied to x/y translation instead of rotation. Always
 * renders as an inline-block wrapper (in both branches, so there's no
 * layout shift when useCanAnimate() flips), with zero listeners/style
 * whenever useCanAnimate() is false. */
export default function Magnetic({ children, className }: MagneticProps) {
  const canAnimate = useCanAnimate();
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, POINTER_SPRING);
  const y = useSpring(0, POINTER_SPRING);

  if (!canAnimate) {
    return <div className={`inline-block ${className ?? ""}`}>{children}</div>;
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    x.set(px * MAX_NUDGE_PX * 2);
    y.set(py * MAX_NUDGE_PX * 2);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className ?? ""}`}
      style={{ x, y }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Write `components/motion/__tests__/Magnetic.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Magnetic from "../Magnetic";

describe("Magnetic", () => {
  it("renders its children", () => {
    render(
      <Magnetic>
        <p>Hello</p>
      </Magnetic>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders a plain inline-block wrapper with no pointer listeners when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(
      <Magnetic className="my-class">
        <p>Hello</p>
      </Magnetic>
    );
    const wrapper = screen.getByText("Hello").parentElement;
    expect(wrapper).toHaveClass("inline-block", "my-class");
    expect(wrapper).not.toHaveAttribute("style");
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `npx vitest run components/motion/__tests__/Magnetic.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 4: Commit**

```bash
git add components/motion/Magnetic.tsx components/motion/__tests__/Magnetic.test.tsx
git commit -m "Add Magnetic: a cursor-proximity nudge wrapper for links and pills"
```

---

## Task 4: `Spotlight` — cursor-tracking card glow

**Files:**
- Create: `components/motion/Spotlight.tsx`
- Create: `components/motion/__tests__/Spotlight.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `Spotlight({ children: ReactNode; className?: string })` — consumed by `OrgLogoGrid`'s `Card` and `StatBand`'s tile wrapper (Task 7). No `useCanAnimate` dependency: this is pure cursor-position CSS, not motion (see Global Constraints).

- [ ] **Step 1: Write `components/motion/Spotlight.tsx`**

```tsx
"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

interface SpotlightProps {
  children: ReactNode;
  className?: string;
}

/** Cursor-tracking radial glow behind its children -- a plain,
 * unconditional CSS effect (position tracking only, no transition of its
 * own beyond the opacity fade already unconditional on hover), so it runs
 * the same whether or not useCanAnimate() allows motion elsewhere: like
 * the existing grayscale-to-color .photo-frame:hover treatment, this
 * carries no motion, just a cursor-tracked gradient position. The glow
 * itself is styled by the `.spotlight` rule in globals.css. */
export default function Spotlight({ children, className }: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    node.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  };

  return (
    <div ref={ref} className={`spotlight ${className ?? ""}`} onPointerMove={handlePointerMove}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Write `components/motion/__tests__/Spotlight.test.tsx`**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Spotlight from "../Spotlight";

describe("Spotlight", () => {
  it("renders its children", () => {
    render(
      <Spotlight>
        <p>Hello</p>
      </Spotlight>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("applies the spotlight class and passed className unconditionally", () => {
    render(
      <Spotlight className="my-class">
        <p>Hello</p>
      </Spotlight>
    );
    const wrapper = screen.getByText("Hello").parentElement;
    expect(wrapper).toHaveClass("spotlight", "my-class");
  });

  it("sets --spot-x/--spot-y custom properties from the pointer position on move", () => {
    render(
      <Spotlight>
        <p>Hello</p>
      </Spotlight>
    );
    const wrapper = screen.getByText("Hello").parentElement as HTMLElement;
    wrapper.getBoundingClientRect = () =>
      ({ left: 10, top: 5, width: 200, height: 100, right: 210, bottom: 105, x: 10, y: 5, toJSON() {} }) as DOMRect;

    fireEvent.pointerMove(wrapper, { clientX: 60, clientY: 25 });

    expect(wrapper.style.getPropertyValue("--spot-x")).toBe("50px");
    expect(wrapper.style.getPropertyValue("--spot-y")).toBe("20px");
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail (component doesn't exist yet if run out of order) or pass**

Run: `npx vitest run components/motion/__tests__/Spotlight.test.tsx`
Expected: PASS (3 tests) once Step 1 is in place.

- [ ] **Step 4: Add the `.spotlight` styles to `app/globals.css`**

Insert this block immediately after the existing `.link-sweep:hover::after, .link-sweep:focus-visible::after { ... }` rule and before the `@media (prefers-reduced-motion: no-preference)` block:

```css
/* Cursor-tracking glow on card surfaces (OrgLogoGrid, StatBand) -- pure
   position tracking via a CSS custom property set on pointermove, with no
   translate/scale of its own. Like .photo-frame's grayscale-to-color
   fade, it runs unconditionally regardless of prefers-reduced-motion: an
   opacity fade on a static-position glow, not a movement. z-index: -1
   inside its own isolated stacking context keeps it above the card's own
   background but below the card's actual content, without needing to
   touch that content's markup. */
.spotlight {
  position: relative;
  isolation: isolate;
}

.spotlight::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: radial-gradient(220px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(255, 255, 255, 0.55), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.spotlight:hover::before,
.spotlight:focus-within::before {
  opacity: 1;
}
```

- [ ] **Step 5: Run the full test suite to confirm the CSS change didn't break anything**

Run: `npm run test`
Expected: PASS, all files.

- [ ] **Step 6: Commit**

```bash
git add components/motion/Spotlight.tsx components/motion/__tests__/Spotlight.test.tsx app/globals.css
git commit -m "Add Spotlight: a cursor-tracking glow for card surfaces"
```

---

## Task 5: `AmbientColorDrift` — homepage scroll-linked background tint

**Files:**
- Create: `components/motion/AmbientColorDrift.tsx`
- Create: `components/motion/__tests__/AmbientColorDrift.test.tsx`

**Interfaces:**
- Consumes: `useCanAnimate` from `@/lib/motion` (Task 1).
- Produces: `AmbientColorDrift()` (zero props) — mounted once at the top of the homepage (Task 9).

- [ ] **Step 1: Write `components/motion/AmbientColorDrift.tsx`**

```tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useCanAnimate } from "@/lib/motion";

// Approximate color stops across the homepage's total scroll height, one
// per section in the order they appear on the page -- cream for the
// hero/stats/org-grid stretch, then each accent panel's own light tint
// (see tailwind.config.ts). Approximate rather than measured against each
// section's literal boundaries: a single document-scroll interpolation is
// far cheaper than one useScroll listener per section, and reads the same
// to a visitor as an ambient wash rather than a section-locked effect (see
// the spec's accepted-simplification note).
const COLOR_STOPS = [
  "#FBF3E7", // cream -- hero
  "#FBF3E7", // cream -- stats / org grid
  "#FBE1E9", // clay-pink-light -- about
  "#D8F0EC", // clay-teal-light -- experience
  "#E5E6FD", // clay-lavender-light -- contact
];

const INPUT_RANGE = COLOR_STOPS.map((_, index) => index / (COLOR_STOPS.length - 1));

/** A fixed, full-bleed color layer behind the homepage content, tinting
 * ambiently toward each section's accent color as the user scrolls past
 * it -- purely decorative, aria-hidden. Renders nothing under
 * useCanAnimate() === false, leaving the plain cream body background
 * (globals.css) visible exactly as it is without this component at all. */
export default function AmbientColorDrift() {
  const canAnimate = useCanAnimate();
  const { scrollYProgress } = useScroll();
  const backgroundColor = useTransform(scrollYProgress, INPUT_RANGE, COLOR_STOPS);

  if (!canAnimate) {
    return null;
  }

  return (
    <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-30" style={{ backgroundColor }} />
  );
}
```

- [ ] **Step 2: Write `components/motion/__tests__/AmbientColorDrift.test.tsx`**

```tsx
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AmbientColorDrift from "../AmbientColorDrift";

describe("AmbientColorDrift", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders nothing when IntersectionObserver is unavailable (jsdom has none)", () => {
    const { container } = render(<AmbientColorDrift />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an aria-hidden, pointer-events-none full-bleed layer once IntersectionObserver is available", async () => {
    class StubIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);

    const { container } = render(<AmbientColorDrift />);

    const layer = await waitFor(() => {
      const el = container.querySelector('[aria-hidden="true"]');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });

    expect(layer).toHaveClass("pointer-events-none", "fixed", "inset-0", "-z-30");
    expect(layer).toHaveAttribute("style");
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `npx vitest run components/motion/__tests__/AmbientColorDrift.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 4: Commit**

```bash
git add components/motion/AmbientColorDrift.tsx components/motion/__tests__/AmbientColorDrift.test.tsx
git commit -m "Add AmbientColorDrift: a scroll-linked ambient background tint for the homepage"
```

---

## Task 6: Refactor `navLinkClass` into a function (enables Header's active-pill state)

**Files:**
- Modify: `lib/ui.ts`
- Modify: `components/Header.tsx`
- Modify: `components/Footer.tsx`
- Modify: `app/contact/page.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Produces: `navLinkClass(active?: boolean): string` from `@/lib/ui` (was a plain string constant) — every existing caller updates to `navLinkClass()`, and `Header` (Task 10) will call `navLinkClass(isActive)`.

This is a small, mechanical, behavior-preserving refactor: `navLinkClass()` with no argument returns exactly the same class list as the old constant did. It's done as its own task, ahead of any task that needs the `active` variant, so every call site stays in a working state after each commit.

- [ ] **Step 1: Change `navLinkClass` from a constant to a function in `lib/ui.ts`**

Replace the whole file with:

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
// prefers-reduced-motion, with zero JS involved either way. A function
// (not a plain string) so Header can request the permanently-filled
// `active` variant for the current page's nav pill without duplicating
// this whole class list -- every other caller keeps calling it with no
// argument, identical to the old constant's output.
export function navLinkClass(active = false): string {
  const state = active
    ? "text-surface"
    : "text-ink hover:bg-clay-amber hover:text-surface focus-visible:bg-clay-amber focus-visible:text-surface";
  return `inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold shadow-clay-raised transition-[background-color,color,transform] duration-300 motion-safe:hover:scale-[1.03] motion-safe:focus-visible:scale-[1.03] motion-safe:active:scale-95 active:shadow-clay-pressed ${state} ${focusRingClass}`;
}
```

- [ ] **Step 2: Update `components/Header.tsx`'s call site**

Change:

```tsx
                <Link href={item.href} className={navLinkClass}>
```

to:

```tsx
                <Link href={item.href} className={navLinkClass()}>
```

- [ ] **Step 3: Update `components/Footer.tsx`'s call site**

Change:

```tsx
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
```

to:

```tsx
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass()}>
```

- [ ] **Step 4: Update `app/contact/page.tsx`'s call site**

Change:

```tsx
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
```

to:

```tsx
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass()}>
```

- [ ] **Step 5: Update `app/page.tsx`'s call site**

Change:

```tsx
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
```

to:

```tsx
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass()}>
```

- [ ] **Step 6: Typecheck and run the full test suite**

Run: `npm run typecheck && npm run test`
Expected: both succeed — this refactor changes no visible behavior (`navLinkClass()` produces the same string the old constant held), so every existing test keeps passing unmodified.

- [ ] **Step 7: Commit**

```bash
git add lib/ui.ts components/Header.tsx components/Footer.tsx app/contact/page.tsx app/page.tsx
git commit -m "Turn navLinkClass into a function so Header can request its active-pill variant"
```

---

## Task 7: Wire `Spotlight` into `OrgLogoGrid` and `StatBand`

**Files:**
- Modify: `components/OrgLogoGrid.tsx`
- Modify: `components/StatBand.tsx`

**Interfaces:**
- Consumes: `Spotlight` from `@/components/motion/Spotlight` (Task 4).
- No prop changes to either component.

- [ ] **Step 1: Wrap `OrgLogoGrid`'s `Card` in `Spotlight`**

Replace the whole file with:

```tsx
"use client";

import { motion } from "framer-motion";
import { orgNames } from "@/content/site";
import OrgMark from "@/components/OrgMark";
import Tilt from "@/components/motion/Tilt";
import Spotlight from "@/components/motion/Spotlight";
import { useCanAnimate, fadeUpItem, staggerContainer } from "@/lib/motion";

function Card({ org }: { org: string }) {
  return (
    <Spotlight className="flex h-full flex-col items-center rounded-[2rem] bg-surface p-5 text-center shadow-clay-raised">
      <OrgMark org={org} className="h-16 w-16" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-mute">{org}</p>
    </Spotlight>
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

- [ ] **Step 2: Run `OrgLogoGrid`'s existing test (no changes needed)**

Run: `npx vitest run components/__tests__/OrgLogoGrid.test.tsx`
Expected: PASS (2 tests) — neither test inspects structure below the per-org wrapper, so nesting `Spotlight` one level deeper inside `Card` doesn't affect them.

- [ ] **Step 3: Wrap `StatBand`'s tile surface in `Spotlight`**

Replace the whole file with:

```tsx
"use client";

import { motion } from "framer-motion";
import { stats } from "@/content/site";
import StatCounter from "@/components/StatCounter";
import Spotlight from "@/components/motion/Spotlight";
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
          <Spotlight
            key={stat.label}
            className={`rounded-[2rem] ${ACCENTS[index % ACCENTS.length].bg} p-6 text-center shadow-clay-raised`}
          >
            <Tile label={stat.label} value={stat.value} index={index} />
          </Spotlight>
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
        <motion.div key={stat.label} variants={fadeUpItem}>
          <Spotlight
            className={`rounded-[2rem] ${ACCENTS[index % ACCENTS.length].bg} p-6 text-center shadow-clay-raised`}
          >
            <Tile label={stat.label} value={stat.value} index={index} />
          </Spotlight>
        </motion.div>
      ))}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run `StatBand`'s existing test (no changes needed)**

Run: `npx vitest run components/__tests__/StatBand.test.tsx`
Expected: PASS (1 test) — it only asserts each stat's value/label text is present, which holds regardless of the `Spotlight` wrapper.

- [ ] **Step 5: Commit**

```bash
git add components/OrgLogoGrid.tsx components/StatBand.tsx
git commit -m "Give OrgLogoGrid and StatBand a cursor-tracking spotlight glow on their cards"
```

---

## Task 8: Wire `Magnetic` into homepage and Contact-page CTAs

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/contact/page.tsx`

**Interfaces:**
- Consumes: `Magnetic` from `@/components/motion/Magnetic` (Task 3).
- No prop changes to either page's exported component.

- [ ] **Step 1: Wrap the homepage's `ArrowLink`, mailto link, and social links in `Magnetic`**

In `app/page.tsx`, add the import:

```tsx
import Magnetic from "@/components/motion/Magnetic";
```

Change `ArrowLink` from:

```tsx
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
```

to:

```tsx
function ArrowLink({ href, children }: { href: string; children: string }) {
  return (
    <Magnetic className="mt-6">
      <Link href={href} className={linkClass}>
        {children}{" "}
        <span className="inline-block motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:translate-x-1">
          →
        </span>
      </Link>
    </Magnetic>
  );
}
```

Change the homepage's contact section from:

```tsx
        <p className="mt-6">
          <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
            {site.email}
          </a>
        </p>
        <ul aria-label="Social links" className="mt-6 flex list-none flex-wrap justify-center gap-2 p-0">
          {social.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass()}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
```

to:

```tsx
        <p className="mt-6">
          <Magnetic>
            <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
              {site.email}
            </a>
          </Magnetic>
        </p>
        <ul aria-label="Social links" className="mt-6 flex list-none flex-wrap justify-center gap-2 p-0">
          {social.map((item) => (
            <li key={item.href}>
              <Magnetic>
                <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass()}>
                  {item.label}
                </a>
              </Magnetic>
            </li>
          ))}
        </ul>
```

- [ ] **Step 2: Run the homepage SSR test — the most important check in this task**

Run: `npx vitest run app/__tests__/page.test.tsx`
Expected: PASS (2 tests), unmodified — `Magnetic`'s plain branch adds only a static `inline-block` div with no `style` attribute, so it never bakes `opacity:0` or any other motion style into server-rendered markup.

- [ ] **Step 3: Wrap the Contact page's mailto link and social links in `Magnetic`**

In `app/contact/page.tsx`, add the import:

```tsx
import Magnetic from "@/components/motion/Magnetic";
```

Change:

```tsx
        <p className="mt-8">
          <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
            {site.email}
          </a>
        </p>
      </Reveal>
      <Reveal delayMs={120}>
        <ul aria-label="Social links" className="mt-10 flex list-none flex-wrap gap-2 p-0 pt-8">
          {social.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass()}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
```

to:

```tsx
        <p className="mt-8">
          <Magnetic>
            <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
              {site.email}
            </a>
          </Magnetic>
        </p>
      </Reveal>
      <Reveal delayMs={120}>
        <ul aria-label="Social links" className="mt-10 flex list-none flex-wrap gap-2 p-0 pt-8">
          {social.map((item) => (
            <li key={item.href}>
              <Magnetic>
                <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass()}>
                  {item.label}
                </a>
              </Magnetic>
            </li>
          ))}
        </ul>
      </Reveal>
```

- [ ] **Step 4: Typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: both succeed; `out/contact/index.html` still contains `href="mailto:me@vijayabhaskar.in"`.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/contact/page.tsx
git commit -m "Give homepage and Contact-page CTAs and social links a magnetic cursor nudge"
```

---

## Task 9: Hero depth, scroll exit, line-mask heading, and the ambient color layer

**Files:**
- Modify: `components/HomeHero.tsx`
- Create: `components/__tests__/HomeHero.test.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `LineReveal` (Task 2), `AmbientColorDrift` (Task 5), `POINTER_SPRING` (Task 1), `useCanAnimate`/`fadeUpItem`/`staggerContainer` (existing).
- No prop changes to `HomeHero` (still zero-prop) or `HomePage`.

- [ ] **Step 1: Rewrite `components/HomeHero.tsx`**

Replace the whole file with:

```tsx
"use client";

import { useRef, type PointerEvent } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { site, orgNames } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import Marquee from "@/components/Marquee";
import Tilt from "@/components/motion/Tilt";
import LineReveal from "@/components/motion/LineReveal";
import { useCanAnimate, fadeUpItem, staggerContainer, POINTER_SPRING } from "@/lib/motion";

// How far each hero layer drifts from the pointer's center-relative
// position, in px -- the blob (purely decorative) moves the most, the
// photo a middle amount, the heading text the least, so hovering the hero
// reads as real depth rather than one flat scene sliding as a unit.
const BLOB_DEPTH = 18;
const PHOTO_DEPTH = 10;
const HEADING_DEPTH = 4;

interface ParallaxProps {
  parallaxX: MotionValue<number>;
  parallaxY: MotionValue<number>;
}

/** Two overlapping soft blobs behind the hero portrait -- the clay
 * illustration that replaces the removed Three.js flythrough canvas. Pure
 * decoration (aria-hidden), so it carries no content of its own. Drifts
 * subtly as the page scrolls past the hero (scroll-linked) and as the
 * pointer moves across the hero (parallaxX/parallaxY, from the parent's
 * shared pointer spring) -- inert entirely under reduced motion, since the
 * style is only attached when useCanAnimate() is true. */
function ClayBlobBackdrop({ parallaxX, parallaxY }: ParallaxProps) {
  const canAnimate = useCanAnimate();
  const { scrollY } = useScroll();
  const scrollDriftY = useTransform(scrollY, [0, 600], [0, 40]);
  const scale = useTransform(scrollY, [0, 600], [1, 1.08]);
  const y = useTransform([scrollDriftY, parallaxY], ([drift, pointer]: number[]) => drift + pointer);

  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -right-12 -top-12 -z-10 h-40 w-40 opacity-90 sm:-right-14 sm:-top-14 sm:h-48 sm:w-48 lg:-right-16 lg:-top-16 lg:h-56 lg:w-56"
      style={canAnimate ? { x: parallaxX, y, scale } : undefined}
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
  const heroRef = useRef<HTMLElement>(null);

  // Raw pointer position (-0.5 to 0.5 across the hero's own bounds),
  // spring-damped through POINTER_SPRING, then scaled per layer below
  // into each element's own depth.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, POINTER_SPRING);
  const springY = useSpring(pointerY, POINTER_SPRING);

  const blobX = useTransform(springX, (value) => value * BLOB_DEPTH);
  const blobY = useTransform(springY, (value) => value * BLOB_DEPTH);
  const photoX = useTransform(springX, (value) => value * PHOTO_DEPTH);
  const photoY = useTransform(springY, (value) => value * PHOTO_DEPTH);
  const headingX = useTransform(springX, (value) => value * HEADING_DEPTH);

  // Scroll-linked exit: as the hero itself scrolls out of view (not the
  // whole page), its content recedes -- translates up, fades, and scales
  // down slightly. The page keeps scrolling at the user's own pace the
  // entire time; this only changes how the hero's own content responds to
  // that scroll, it never takes control of it.
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const exitY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const exitOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.2]);
  const exitScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const node = heroRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const pill = (
    <p className="inline-block rounded-full bg-clay-amber-light px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-amber">
      {site.location} — {site.tagline}
    </p>
  );

  const heading = (
    <h1 className="mt-4 text-balance font-display text-[clamp(2.75rem,9vw,7rem)] font-extrabold leading-[0.95] text-ink">
      <LineReveal text={site.name} />
    </h1>
  );

  const descriptionRow = (
    <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
      <p className="max-w-xl text-lg leading-relaxed text-mute">{site.description}</p>
      <motion.div style={canAnimate ? { x: photoX, y: photoY } : undefined}>
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
      </motion.div>
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
          <ClayBlobBackdrop parallaxX={blobX} parallaxY={blobY} />
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
      <section
        ref={heroRef}
        className="relative overflow-hidden pt-16 sm:pt-24 md:pt-32"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <ClayBlobBackdrop parallaxX={blobX} parallaxY={blobY} />
        <motion.div style={{ y: exitY, opacity: exitOpacity, scale: exitScale }}>
          <motion.div variants={fadeUpItem}>{pill}</motion.div>
          <motion.div variants={fadeUpItem} style={{ x: headingX }}>
            {heading}
          </motion.div>
          <motion.div variants={fadeUpItem}>{descriptionRow}</motion.div>
        </motion.div>
      </section>
      <motion.div variants={fadeUpItem}>{marquee}</motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Write `components/__tests__/HomeHero.test.tsx`**

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomeHero from "../HomeHero";
import { site } from "@/content/site";

describe("HomeHero", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the hero name, description, and credentials marquee", () => {
    render(<HomeHero />);
    expect(screen.getByText(site.name)).toBeInTheDocument();
    expect(screen.getByText(site.description)).toBeInTheDocument();
  });

  it("renders with no baked motion styles when IntersectionObserver is unavailable (jsdom has none)", () => {
    const { container } = render(<HomeHero />);
    expect(container.innerHTML).not.toMatch(/style="/);
  });

  it("mounts the animated branch without throwing once IntersectionObserver is available", async () => {
    class StubIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);

    render(<HomeHero />);

    await waitFor(() => {
      expect(screen.getByText(site.name)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 3: Run HomeHero's tests**

Run: `npx vitest run components/__tests__/HomeHero.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 4: Mount `AmbientColorDrift` at the top of the homepage**

In `app/page.tsx`, add the import:

```tsx
import AmbientColorDrift from "@/components/motion/AmbientColorDrift";
```

Change the start of `HomePage`'s returned JSX from:

```tsx
    <div className="flex flex-col gap-12 sm:gap-16">
      <HomeHero />
```

to:

```tsx
    <div className="flex flex-col gap-12 sm:gap-16">
      <AmbientColorDrift />
      <HomeHero />
```

- [ ] **Step 5: Run the homepage SSR test — the most important check in this whole task**

Run: `npx vitest run app/__tests__/page.test.tsx`
Expected: PASS (2 tests), unmodified — `AmbientColorDrift` renders `null` under SSR (`useCanAnimate()` starts `false`), and every `HomeHero` layer only attaches a `style` when `canAnimate` is `true`, exactly like `ClayBlobBackdrop` already did in v2. `renderToStaticMarkup` never runs effects, so the whole tree renders through its plain branch with zero motion props.

- [ ] **Step 6: Typecheck, run the full test suite, and build**

Run: `npm run typecheck && npm run test && npm run build`
Expected: all three succeed.

- [ ] **Step 7: Commit**

```bash
git add components/HomeHero.tsx components/__tests__/HomeHero.test.tsx app/page.tsx
git commit -m "Give the hero cursor-reactive depth, a scroll exit, a line-mask heading, and an ambient color layer"
```

---

## Task 10: `Header` — client component with a static + morphing active-nav indicator

**Files:**
- Modify: `components/Header.tsx`
- Modify: `components/__tests__/Header.test.tsx`

**Interfaces:**
- Consumes: `navLinkClass(active)` (Task 6), `Magnetic` (Task 3), `useCanAnimate` (existing).
- No prop changes; `Header` becomes a client component (`"use client"`), the one deliberate exception to v2's "Header/Footer stay zero-JS" rule (see spec's Decisions and Risks).

- [ ] **Step 1: Rewrite `components/Header.tsx`**

Replace the whole file with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { nav, site } from "@/content/site";
import Magnetic from "@/components/motion/Magnetic";
import { navLinkClass } from "@/lib/ui";
import { useCanAnimate } from "@/lib/motion";

/** Site header. A client component (unlike Footer, which stays
 * server-rendered) so it can know the current route via usePathname() and
 * highlight which nav pill is active -- something a Server Component
 * shared by every route through the root layout can't determine on its
 * own. The active pill's fill is unconditional (present even with JS
 * disabled or under reduced motion, since pathname is known at render
 * time for every statically exported route); only the *sliding* layoutId
 * morph between pills on navigation is gated behind useCanAnimate(). */
export default function Header() {
  const pathname = usePathname();
  const canAnimate = useCanAnimate();

  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-7 sm:px-8">
        <Magnetic>
          <Link
            href="/"
            className="inline-block rounded-full px-2 py-1 font-display text-2xl font-extrabold text-ink transition-colors duration-300 hover:text-clay-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-amber/40"
          >
            {site.shortName}
          </Link>
        </Magnetic>
        <nav aria-label="Primary">
          <ul className="flex list-none flex-wrap items-center gap-2 p-0">
            {nav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href} className="relative">
                  {isActive &&
                    (canAnimate ? (
                      <motion.span
                        layoutId="active-nav-pill"
                        className="absolute inset-0 rounded-full bg-clay-amber"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    ) : (
                      <span aria-hidden="true" className="absolute inset-0 rounded-full bg-clay-amber" />
                    ))}
                  <Magnetic>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={navLinkClass(isActive)}
                    >
                      {item.label}
                    </Link>
                  </Magnetic>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Rewrite `components/__tests__/Header.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Header from "../Header";
import { nav } from "@/content/site";

vi.mock("next/navigation", () => ({
  usePathname: () => "/about",
}));

describe("Header", () => {
  it("renders a link for every nav entry with the correct href", () => {
    render(<Header />);
    for (const item of nav) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toHaveAttribute("href", item.href);
    }
  });

  it("marks the current route's nav link as the active page, and no other", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("never bakes opacity:0 into its rendered markup", () => {
    const { container } = render(<Header />);
    expect(container.innerHTML).not.toMatch(/opacity:\s*0(?!\.)/);
  });
});
```

- [ ] **Step 3: Run Header's tests**

Run: `npx vitest run components/__tests__/Header.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 4: Typecheck, run the full test suite, and build**

Run: `npm run typecheck && npm run test && npm run build`
Expected: all three succeed. Note the route sizes in the build output: `Header` moving into the client bundle means every route's First Load JS grows slightly compared to v2 — expected and accepted per the spec's Risks section, not a regression to chase.

- [ ] **Step 5: Commit**

```bash
git add components/Header.tsx components/__tests__/Header.test.tsx
git commit -m "Make Header a client component with a static + morphing active-nav indicator"
```

---

## Task 11: Full verification gate + manual QA

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: exits 0.

- [ ] **Step 2: Full test suite**

Run: `npm run test`
Expected: exits 0, all suites pass — pay special attention to `app/__tests__/page.test.tsx`, this plan's core SSR-safety invariant, unmodified since Task 9.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: exits 0. Compare route sizes against the v2 baseline as a sanity check, not a hard gate: `/` and `/about` (which already used client components) grow with the new motion components; `Header` moving client-side adds a small, roughly equal amount to every route's First Load JS; `/experience` should not jump disproportionately, since nothing in this plan touches it beyond whatever `Header`/`Magnetic` add sitewide.

- [ ] **Step 4: Verify the export**

Run: `npm run verify:export`
Expected: `Export verification passed: no placeholders, all required facts present.`

- [ ] **Step 5: Manual browser pass**

Run: `npm run build && npx serve@latest out -l 4173` and check in a real browser:

- **Golden path:** load `/` — the hero's pill/heading/description-photo/marquee stagger in, the heading wipes into view line-first rather than character-by-character, and moving the mouse across the hero visibly shifts the blob most, the photo a middle amount, and the heading text least. Scroll past the hero and confirm its content recedes (translates up, fades, scales down slightly) rather than cutting off abruptly, and that the page's background ambiently tints toward each section's accent color as you scroll into it. Hover an `OrgLogoGrid` card or `StatBand` tile and confirm the cursor-tracking glow follows the pointer. Hover the nav pills, the hero photo, and the homepage CTA links and confirm the magnetic nudge. Navigate between nav pills and confirm the active-pill background morphs/slides to the new position rather than snapping.
- **`prefers-reduced-motion: reduce`** (DevTools rendering emulation): confirm no parallax, no scroll exit, no line-wipe, no ambient color drift, no magnetic nudge, and no sliding nav-pill morph — content is fully visible immediately, the active nav pill is still visibly filled (just with no slide animation when it changes), and `Spotlight`'s glow still tracks the cursor (it's unconditional CSS, not gated).
- **Mobile viewport widths (375px, 768px):** no horizontal scroll on any page; pointer-driven effects (parallax, magnetic, spotlight, tilt) are simply inert on touch, no error, no broken layout.
- **View source / disable JS:** confirm every page's content (hero heading text, stat values, org names, nav links) is present and fully visible in the raw HTML, and that the active-nav pill for the current route is still visibly filled even with JS disabled.

- [ ] **Step 6: Final commit (only if Step 5 surfaced fixes)**

If manual QA required any follow-up edits, stage and commit them with a message describing what the QA pass caught. If nothing needed fixing, this plan is complete as of Task 10's commit — no empty commit needed.
