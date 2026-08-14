# Awwwards-Reference Motion Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade six existing homepage motion pieces (intro name reveal, stat band, org logo grid, Experience waypoint, Contact waypoint, starfield) to match the smoothness/ceremony of the reference recording, using only what's already in the stack.

**Architecture:** Every change extends an existing component or CSS block rather than introducing a parallel motion system. New animatable state is set by a small `useEffect`/`IntersectionObserver` (mirroring `Reveal.tsx`'s proven pattern); the actual motion is CSS (`@property`, `offset-path`, the site's one shared easing curve) or `framer-motion`'s `useTransform`/`useMotionValueEvent` (mirroring `Waypoint.tsx`'s proven imperative-opacity fix — never the naive declarative `style` binding that codebase already hit a real-browser bug with).

**Tech Stack:** Next.js 14 (static export), React 18, `framer-motion` ^13.1.0, Tailwind CSS, Vitest + Testing Library (jsdom). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-14-awwwards-motion-upgrade-design.md`

## Global Constraints

- No new npm dependencies — CSS and the already-installed `framer-motion` only.
- No fabricated content — every new string of copy traces back to `content/site.ts` or `content/experience.ts`.
- `prefers-reduced-motion: reduce` → zero scroll-linked or looping motion; the final/settled state renders immediately instead.
- No-JS/crawler visitors see real content unconditionally — nothing new may render `opacity: 0` (or any other hidden state) into server-rendered HTML.
- Shared easing for any new eased transition: `cubic-bezier(0.16, 1, 0.3, 1)` (already used everywhere else in the codebase — do not introduce a second curve).
- `npm run build && npm run verify:export` must keep passing unmodified after every task.

---

## File Structure

| File | Change |
|---|---|
| `components/motion/IntroOverlay.tsx` | Modify — add zoom (`scale`) to the existing name-reveal motion props |
| `components/motion/__tests__/IntroOverlay.test.tsx` | Modify — assert the zoom transform is applied |
| `components/StatCounter.tsx` | Create — scroll-triggered count-up for numeric stat values |
| `components/__tests__/StatCounter.test.tsx` | Create |
| `components/StatBand.tsx` | Modify — route numeric values through `StatCounter` |
| `app/globals.css` | Modify — add `@property --num`/`.stat-counter` rules and `.org-orbit`/`.org-orbit-item` orbit rules |
| `components/OrgLogoGrid.tsx` | Modify — orbit layout replacing the static grid |
| `components/__tests__/OrgLogoGrid.test.tsx` | Modify — add a CSS-only-positioning assertion |
| `components/motion/PinnedStatement.tsx` | Create — pinned, sequential crossfade block driven by shared scroll progress |
| `components/motion/__tests__/PinnedStatement.test.tsx` | Create |
| `components/motion/Flythrough.tsx` | Modify — Experience waypoint becomes a numbered timeline teaser; Contact `Waypoint` replaced by `PinnedStatement` |
| `components/motion/__tests__/Flythrough.test.tsx` | Modify — add timeline-teaser assertions |
| `components/motion/SceneCanvas.tsx` | Modify — particle field color/opacity/size tuning |

`components/motion/__tests__/Flythrough.reduceMotion.test.tsx` needs no changes (its assertions don't depend on the exact number of `Waypoint` instances) but gets re-run in Task 5 to confirm.

---

### Task 1: Kinetic zoom on the intro name

**Files:**
- Modify: `components/motion/IntroOverlay.tsx:102-109`
- Test: `components/motion/__tests__/IntroOverlay.test.tsx`

**Interfaces:** No prop/signature changes — `IntroOverlay({ enabled })` is unchanged.

- [ ] **Step 1: Write the failing test**

Add to `components/motion/__tests__/IntroOverlay.test.tsx`, inside the existing `describe("IntroOverlay", ...)` block:

```tsx
  it("applies a zoom transform alongside the existing fade/rise on the name", async () => {
    render(<IntroOverlay enabled />);
    const name = screen.getByText("Vijaya Bhaskar");
    // Framer Motion writes `initial`/`animate` values to the element's
    // inline `transform` style on mount; asserting a transform was written
    // at all (rather than empty) confirms the added `scale` motion prop is
    // wired up, without depending on Framer Motion's internal CSS format.
    await waitFor(() => expect(name.style.transform).not.toBe(""));
  });
```

Add `waitFor` to the existing `import { fireEvent, render, screen } from "@testing-library/react";` line (becomes `import { fireEvent, render, screen, waitFor } from "@testing-library/react";`).

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- IntroOverlay`
Expected: FAIL — `name.style.transform` is `""` (only `opacity`/`y` are animated today, and `y` alone with no `scale` may still leave `transform` empty pre-motion depending on Framer's write timing — the point of this test is to lock in that a zoom is present, so a fail here confirms the assertion is meaningful).

- [ ] **Step 3: Add the zoom to the motion props**

In `components/motion/IntroOverlay.tsx`, change:

```tsx
          <motion.p
            className="font-display text-4xl font-black uppercase tracking-tight text-paper sm:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
```

to:

```tsx
          <motion.p
            className="font-display text-4xl font-black uppercase tracking-tight text-paper sm:text-6xl"
            initial={{ opacity: 0, y: 20, scale: 1.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- IntroOverlay`
Expected: PASS (all 6 tests in the file)

- [ ] **Step 5: Commit**

```bash
git add components/motion/IntroOverlay.tsx components/motion/__tests__/IntroOverlay.test.tsx
git commit -m "Add kinetic zoom to the intro name reveal"
```

---

### Task 2: Scroll-triggered stat counters

**Files:**
- Create: `components/StatCounter.tsx`
- Create: `components/__tests__/StatCounter.test.tsx`
- Modify: `components/StatBand.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `StatCounter({ value: string; className?: string }): JSX.Element`, default export from `components/StatCounter.tsx`.
- Consumes: nothing new — reads a stat's `value` string directly.

- [ ] **Step 1: Write the failing tests**

Create `components/__tests__/StatCounter.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatCounter from "../StatCounter";

describe("StatCounter", () => {
  it("renders a numeric value as plain text when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(<StatCounter value="7" />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders a non-numeric value as plain text, unchanged", () => {
    render(<StatCounter value="HYD" />);
    expect(screen.getByText("HYD")).toBeInTheDocument();
  });

  it("applies the passed className to the rendered element", () => {
    render(<StatCounter value="7" className="text-amber" />);
    expect(screen.getByText("7")).toHaveClass("text-amber");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- StatCounter`
Expected: FAIL — `components/StatCounter.tsx` does not exist yet.

- [ ] **Step 3: Create `components/StatCounter.tsx`**

```tsx
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
    setPending(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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
```

- [ ] **Step 4: Add the counter CSS to `app/globals.css`**

Add near the top-level rules (alongside the other unconditional/base rules, before the `@media (prefers-reduced-motion: no-preference)` block):

```css
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
```

Add inside the existing `@media (prefers-reduced-motion: no-preference) { ... }` block (anywhere among its other rules):

```css
  .stat-counter {
    transition: --num 1.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
```

- [ ] **Step 5: Wire `StatCounter` into `StatBand.tsx`**

Change `components/StatBand.tsx` from:

```tsx
import { stats } from "@/content/site";

export default function StatBand() {
  return (
    <div className="border-y border-line">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4 sm:px-8">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-3xl font-bold tabular-nums text-amber sm:text-4xl">
              {stat.value}
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-mute">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

to:

```tsx
import { stats } from "@/content/site";
import StatCounter from "@/components/StatCounter";

export default function StatBand() {
  return (
    <div className="border-y border-line">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4 sm:px-8">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="font-display text-3xl font-bold tabular-nums text-amber sm:text-4xl">
              <StatCounter value={stat.value} />
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-mute">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests to verify everything passes**

Run: `npm test -- StatCounter StatBand`
Expected: PASS — `StatBand.test.tsx`'s existing `getByText(stat.value)` assertions still pass unmodified, because jsdom has no `IntersectionObserver`, so `StatCounter` stays on its plain-text branch (same output as before this task).

- [ ] **Step 7: Commit**

```bash
git add components/StatCounter.tsx components/__tests__/StatCounter.test.tsx components/StatBand.tsx app/globals.css
git commit -m "Add scroll-triggered count-up to numeric stats"
```

---

### Task 3: Orbiting logo cloud

**Files:**
- Modify: `components/OrgLogoGrid.tsx`
- Modify: `components/__tests__/OrgLogoGrid.test.tsx`
- Modify: `app/globals.css`

**Interfaces:** No prop changes — `OrgLogoGrid()` still takes no props.

- [ ] **Step 1: Write the failing test**

Add to `components/__tests__/OrgLogoGrid.test.tsx`, inside the existing `describe("OrgLogoGrid", ...)` block:

```tsx
  it("positions logos via CSS only -- no JS-computed inline transform", () => {
    const { container } = render(<OrgLogoGrid />);
    const items = container.querySelectorAll(".org-orbit-item");
    expect(items.length).toBe(orgNames.length);
    for (const item of Array.from(items)) {
      expect((item as HTMLElement).style.transform).toBe("");
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- OrgLogoGrid`
Expected: FAIL — no `.org-orbit-item` elements exist yet.

- [ ] **Step 3: Add orbit CSS to `app/globals.css`**

Add inside the existing `@media (prefers-reduced-motion: no-preference) { ... }` block (anywhere among its other rules):

```css
  .org-orbit {
    position: relative;
    display: block;
    height: 260px;
    max-width: 640px;
    margin: 0 auto;
  }

  .org-orbit-item {
    position: absolute;
    inset: 0;
    width: 92px;
    height: 92px;
    margin: auto;
    offset-path: ellipse(46% 38% at 50% 50%);
    animation: orbit 24s linear infinite;
    animation-delay: calc(var(--i, 0) * (24s / var(--count, 1)) * -1);
  }

  .org-orbit-item:hover,
  .org-orbit-item:focus-within {
    animation-play-state: paused;
  }

  @keyframes orbit {
    0% {
      offset-distance: 0%;
      opacity: 0.35;
      transform: scale(0.8);
    }
    50% {
      offset-distance: 50%;
      opacity: 1;
      transform: scale(1.08);
    }
    100% {
      offset-distance: 100%;
      opacity: 0.35;
      transform: scale(0.8);
    }
  }
```

This is additive and reduced-motion-gated: outside this media block, `.org-orbit` and `.org-orbit-item` have no rules at all, so under `prefers-reduced-motion: reduce` the wrapper's existing Tailwind grid classes (`grid grid-cols-2 gap-4 sm:grid-cols-4`, kept in the next step) are what render — today's exact static grid, unchanged.

- [ ] **Step 4: Update `components/OrgLogoGrid.tsx`**

Change:

```tsx
export default function OrgLogoGrid() {
  const [tier, setTier] = useState<DeviceTier | null>(null);
  const [reduceMotion, setReduceMotion] = useState(() => prefersReducedMotion());

  useEffect(() => {
    let cancelled = false;
    resolveDeviceTier().then((resolved) => {
      if (!cancelled) setTier(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mql.matches);
    if (typeof mql.addEventListener !== "function") return;
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const shaderEnabled = tier === "full" && !reduceMotion;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {orgNames.map((org, index) => {
        const logoSrc = orgLogos[org];
        return (
          <Reveal key={org} delayMs={index * 60}>
            <div className="org-card group">
              <div className="org-mark-wrap">
                <OrgMark org={org} />
                {shaderEnabled && logoSrc && <OrgMarkShader src={resolveAssetPath(logoSrc)} />}
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-mute">{org}</p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
```

to:

```tsx
export default function OrgLogoGrid() {
  const [tier, setTier] = useState<DeviceTier | null>(null);
  const [reduceMotion, setReduceMotion] = useState(() => prefersReducedMotion());

  useEffect(() => {
    let cancelled = false;
    resolveDeviceTier().then((resolved) => {
      if (!cancelled) setTier(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mql.matches);
    if (typeof mql.addEventListener !== "function") return;
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const shaderEnabled = tier === "full" && !reduceMotion;

  return (
    <div
      className="org-orbit grid grid-cols-2 gap-4 sm:grid-cols-4"
      style={{ "--count": orgNames.length } as React.CSSProperties}
    >
      {orgNames.map((org, index) => {
        const logoSrc = orgLogos[org];
        return (
          <div key={org} className="org-orbit-item" style={{ "--i": index } as React.CSSProperties}>
            <div className="org-card group">
              <div className="org-mark-wrap">
                <OrgMark org={org} />
                {shaderEnabled && logoSrc && <OrgMarkShader src={resolveAssetPath(logoSrc)} />}
              </div>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-mute">{org}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

Note this drops the per-item `Reveal` wrapper and its now-unused import: `OrgLogoGrid` is always rendered inside its own `<Reveal>` already, at the call site in `app/page.tsx` (`<Reveal className="py-14 sm:py-20">...<OrgLogoGrid /></Reveal>`), which already gives the whole section a scroll-triggered entrance — a second, per-item entrance animation would just be redundant on top of the new continuous orbit motion. Remove the now-unused `import Reveal from "@/components/Reveal";` line.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- OrgLogoGrid`
Expected: PASS — both the new test and the two existing ones (org names still present as text; shader still gated on `tier === "full"`).

- [ ] **Step 6: Manual visual check**

Run: `npm run dev`, open `/`, scroll to "Affiliations & credentials". Confirm the logos visibly orbit along the ellipse and pause on hover. This is a CSS `offset-path` layout — jsdom cannot render it, so this manual check is the only way to catch a visually-wrong radius/height; adjust the `260px`/`46% 38%` values in `app/globals.css` directly if logos clip outside their container or overlap awkwardly.

- [ ] **Step 7: Commit**

```bash
git add components/OrgLogoGrid.tsx components/__tests__/OrgLogoGrid.test.tsx app/globals.css
git commit -m "Replace the static affiliations grid with an orbiting logo cloud"
```

---

### Task 4: Timeline teaser on the Experience waypoint

**Files:**
- Modify: `components/motion/Flythrough.tsx`
- Modify: `components/motion/__tests__/Flythrough.test.tsx`

**Interfaces:** No prop changes to `Flythrough({ hero })`.

- [ ] **Step 1: Write the failing test**

Add to `components/motion/__tests__/Flythrough.test.tsx`. First, extend the import line:

```tsx
import { employment, credentials, education } from "@/content/experience";
```

Then add inside the existing `describe("Flythrough", ...)` block:

```tsx
  it("renders one experience highlight from each of employment, credentials, and education", () => {
    render(<Flythrough hero={<h1>Hero content</h1>} />);
    expect(
      screen.getByText(`${employment[0].role} · ${employment[0].org}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${credentials[0].role} · ${credentials[0].org}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${education[0].role} · ${education[0].org}`)
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- Flythrough.test`
Expected: FAIL — only `employment[0]` currently renders; `credentials[0]`/`education[0]` text is absent.

- [ ] **Step 3: Update the Experience waypoint in `components/motion/Flythrough.tsx`**

Change the import line:

```tsx
import { employment } from "@/content/experience";
```

to:

```tsx
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import OrgMark from "@/components/OrgMark";
```

Add, above the `export default function Flythrough` line:

```tsx
const EXPERIENCE_HIGHLIGHTS: (TimelineEntry & { number: string })[] = [
  { ...employment[0], number: "01" },
  { ...credentials[0], number: "02" },
  { ...education[0], number: "03" },
];
```

Change the Experience `Waypoint` block from:

```tsx
        <Waypoint range={[0.55, 0.75]} progress={scrollYProgress} reduceMotion={reduceMotion} className="min-h-screen py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Experience</p>
          <h2 className="mt-4 font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            {employment[0].role} · {employment[0].org}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">
            {employment[0].description}
          </p>
          <Link href="/experience" className={`mt-6 inline-block ${linkClass}`}>
            View full timeline →
          </Link>
        </Waypoint>
```

to:

```tsx
        <Waypoint range={[0.55, 0.75]} progress={scrollYProgress} reduceMotion={reduceMotion} className="min-h-screen py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Experience</p>
          <h2 className="mt-4 font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            A working history.
          </h2>
          <ol className="mt-8 max-w-xl space-y-6">
            {EXPERIENCE_HIGHLIGHTS.map((entry) => (
              <li key={`${entry.org}-${entry.period}`} className="flex items-start gap-4">
                <span className="mt-1 shrink-0 font-mono text-sm tabular-nums text-amber">
                  {entry.number}
                </span>
                <OrgMark org={entry.org} className="h-10 w-10 shrink-0" />
                <div>
                  <p className="font-display text-lg font-bold uppercase text-paper">
                    {entry.role} · {entry.org}
                  </p>
                  <p className="mt-1 text-sm text-mute">{entry.period}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/experience" className={`mt-6 inline-block ${linkClass}`}>
            View full timeline →
          </Link>
        </Waypoint>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- Flythrough`
Expected: PASS — the new test, plus all pre-existing `Flythrough.test.tsx` and `Flythrough.reduceMotion.test.tsx` assertions (none of them depend on the Experience waypoint's exact inner markup beyond the "View full timeline →" link, which is unchanged).

- [ ] **Step 5: Commit**

```bash
git add components/motion/Flythrough.tsx components/motion/__tests__/Flythrough.test.tsx
git commit -m "Turn the homepage Experience waypoint into a numbered timeline teaser"
```

---

### Task 5: Pinned crossfade Contact section

**Files:**
- Create: `components/motion/PinnedStatement.tsx`
- Create: `components/motion/__tests__/PinnedStatement.test.tsx`
- Modify: `components/motion/Flythrough.tsx`
- Modify: `components/motion/__tests__/Flythrough.test.tsx`

**Interfaces:**
- Produces: `PinnedStatement({ progress: MotionValue<number>; range: [number, number]; lines: string[]; reduceMotion?: boolean; className?: string; children: ReactNode })`, default export from `components/motion/PinnedStatement.tsx`. Also exports `buildFadeSegments(range: [number, number], slotCount: number): [number, number, number, number][]` as a named export, for direct unit testing.
- Consumes: the same `scrollYProgress` `MotionValue<number>` `Flythrough.tsx` already computes via `useScroll` — no new scroll listener.

- [ ] **Step 1: Write the failing tests**

Create `components/motion/__tests__/PinnedStatement.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { motionValue } from "framer-motion";
import { describe, expect, it } from "vitest";
import PinnedStatement, { buildFadeSegments } from "../PinnedStatement";

describe("buildFadeSegments", () => {
  it("splits a range into equal-width trapezoid-fade segments, with the last segment never fading out", () => {
    const segments = buildFadeSegments([0, 1], 2);
    expect(segments).toHaveLength(2);

    const [first, last] = segments;
    expect(first[0]).toBe(0); // first segment starts at range start
    expect(first[3]).toBeCloseTo(0.5); // first segment ends at the midpoint

    expect(last[0]).toBeCloseTo(0.5); // second segment starts at the midpoint
    expect(last[2]).toBe(1); // fallStart pinned to range end -- never fades before it
    expect(last[3]).toBeGreaterThan(1); // fallEnd sits beyond range end -- never actually reached
  });
});

describe("PinnedStatement", () => {
  it("renders every line and the final content regardless of current scroll progress", () => {
    const progress = motionValue(0);
    render(
      <PinnedStatement progress={progress} range={[0.85, 1]} lines={["Line one", "Line two"]}>
        <p>Final CTA</p>
      </PinnedStatement>
    );
    expect(screen.getByText("Line one")).toBeInTheDocument();
    expect(screen.getByText("Line two")).toBeInTheDocument();
    expect(screen.getByText("Final CTA")).toBeInTheDocument();
  });

  it("never bakes opacity:0 into server-rendered markup", () => {
    const progress = motionValue(0);
    const html = renderToStaticMarkup(
      <PinnedStatement progress={progress} range={[0.85, 1]} lines={["Line one"]}>
        <p>Final CTA</p>
      </PinnedStatement>
    );
    expect(html).toContain("Line one");
    expect(html).toContain("Final CTA");
    expect(html).not.toMatch(/opacity:\s*0/);
  });

  describe("reduceMotion", () => {
    it("renders all content statically stacked with no sticky positioning and no opacity/transform styling", () => {
      const progress = motionValue(0);
      const { container } = render(
        <PinnedStatement progress={progress} range={[0.85, 1]} lines={["Line one"]} reduceMotion>
          <p>Final CTA</p>
        </PinnedStatement>
      );
      expect(screen.getByText("Line one")).toBeInTheDocument();
      expect(screen.getByText("Final CTA")).toBeInTheDocument();
      expect(container.querySelector(".sticky")).not.toBeInTheDocument();
      expect(
        container.querySelectorAll('[style*="opacity"], [style*="transform"]')
      ).toHaveLength(0);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- PinnedStatement`
Expected: FAIL — `components/motion/PinnedStatement.tsx` does not exist yet.

- [ ] **Step 3: Create `components/motion/PinnedStatement.tsx`**

```tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- PinnedStatement`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Replace the Contact `Waypoint` in `components/motion/Flythrough.tsx`**

Add to the imports:

```tsx
import PinnedStatement from "./PinnedStatement";
```

Change the Contact `Waypoint` block from:

```tsx
        <Waypoint range={[0.85, 1]} progress={scrollYProgress} reduceMotion={reduceMotion} className="min-h-screen py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Contact</p>
          <h2 className="mt-4 font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            Get in touch.
          </h2>
          <p className="mt-6">
            <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
              {site.email}
            </a>
          </p>
          <ul
            aria-label="Social links"
            className="mt-6 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 font-mono text-xs uppercase tracking-widest"
          >
            {social.map((item) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/contact" className={`mt-6 inline-block ${linkClass}`}>
            View full contact →
          </Link>
        </Waypoint>
```

to:

```tsx
        <PinnedStatement
          range={[0.85, 1]}
          progress={scrollYProgress}
          reduceMotion={reduceMotion}
          lines={[site.tagline, site.jobTitle, `${employment[0].role} · ${employment[0].org}`]}
          className="min-h-[220vh] py-24"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Contact</p>
          <h2 className="mt-4 font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            Get in touch.
          </h2>
          <p className="mt-6">
            <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
              {site.email}
            </a>
          </p>
          <ul
            aria-label="Social links"
            className="mt-6 flex list-none flex-wrap justify-center gap-x-6 gap-y-2 p-0 font-mono text-xs uppercase tracking-widest"
          >
            {social.map((item) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <Link href="/contact" className={`mt-6 inline-block ${linkClass}`}>
            View full contact →
          </Link>
        </PinnedStatement>
```

- [ ] **Step 6: Run the full Flythrough test suite**

Run: `npm test -- Flythrough`
Expected: PASS — including the pre-existing "Get in touch." presence check, the reduced-motion "zero opacity/transform styles" check (`PinnedStatement`'s `reduceMotion` branch sets no inline styles, same as before), the "still applies the live, scroll-linked waypoint style" check (now also satisfied by `PinnedStatement`'s `FadeSlot`s in addition to the two remaining `Waypoint`s), and `Flythrough.reduceMotion.test.tsx` (its assertions only inspect the last of however many `Waypoint` calls occurred, so going from 3 `Waypoint` instances to 2 doesn't affect it).

- [ ] **Step 7: Run the full test suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: PASS, no type errors.

- [ ] **Step 8: Manual visual check**

Run: `npm run dev`, open `/`, scroll through the Contact section at the bottom. Confirm it pins in place while `site.tagline` → `site.jobTitle` → the headline employment line crossfade, before landing on the mailto/social content. Adjust `min-h-[220vh]` in `Flythrough.tsx` if the crossfades feel rushed or sluggish (more height = slower/more scroll per line).

- [ ] **Step 9: Commit**

```bash
git add components/motion/PinnedStatement.tsx components/motion/__tests__/PinnedStatement.test.tsx components/motion/Flythrough.tsx components/motion/__tests__/Flythrough.test.tsx
git commit -m "Replace the homepage Contact waypoint with a pinned crossfade CTA"
```

---

### Task 6: Starfield polish

**Files:**
- Modify: `components/motion/SceneCanvas.tsx`

**Interfaces:** No changes — `SceneCanvas` and `ParticleField`'s signatures are untouched; only the material's `color`/`opacity`/`size` literals change.

- [ ] **Step 1: Update `ParticleField`'s material in `components/motion/SceneCanvas.tsx`**

Change:

```tsx
      <pointsMaterial color="#5B8CFF" size={0.05} sizeAttenuation transparent opacity={0.8} />
```

to:

```tsx
      <pointsMaterial color="#8B8B90" size={0.035} sizeAttenuation transparent opacity={0.55} />
```

(`#8B8B90` is the same neutral gray already used as the `mute` design token elsewhere on the site, in place of the previous blue `signal` accent — closer to the reference recording's dim, neutral scattered stars.)

- [ ] **Step 2: Run the existing test suite**

Run: `npm test`
Expected: PASS — `SceneCanvas` has no dedicated unit tests (jsdom has no WebGL context, per the existing `Flythrough.test.tsx` comment), so this is a pure regression check that nothing else broke.

- [ ] **Step 3: Manual visual check**

Run: `npm run dev`, open `/`, confirm the particle field reads as dim scattered stars rather than a blue accent-colored field. This is the only way to verify a Three.js material change — jsdom cannot render WebGL.

- [ ] **Step 4: Commit**

```bash
git add components/motion/SceneCanvas.tsx
git commit -m "Tune the particle field toward dim neutral stars"
```

---

## Final verification

- [ ] Run: `npm test` — full suite passes.
- [ ] Run: `npm run typecheck` — no errors.
- [ ] Run: `npm run build && npm run verify:export` — static export still passes unmodified (the hard guarantee both prior motion specs established).
- [ ] Manual pass in `npm run dev` at desktop and a narrow/mobile viewport width, plus one pass with the OS/browser "reduce motion" setting turned on, confirming: intro name zooms in, stats count up on scroll, logos orbit (grid under reduced motion), Experience waypoint shows three numbered highlights, Contact pins and crossfades (static stack under reduced motion), starfield reads neutral/dim.
