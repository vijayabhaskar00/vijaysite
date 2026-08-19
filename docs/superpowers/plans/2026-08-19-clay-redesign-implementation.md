# Claymorphism Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the site's dark "Warm Regional Identity" + 3D-flythrough visual system with a light claymorphism system (soft dual-shadow puffy surfaces, heavy rounding, multi-pastel palette) across every route and shared component, while removing the now-purposeless scroll-pinning/3D/grain machinery outright.

**Architecture:** Palette/type/shadow tokens move into `tailwind.config.ts`; a small number of CSS mechanics (link underline sweep, entrance/scroll reveal, split-char stagger, stat counter, marquee) stay in `app/globals.css`, recolored, everything else becomes Tailwind utility classes on the components themselves. The homepage drops its single scroll-pinned `Flythrough` track in favor of plain in-flow sections wrapped in the existing `Reveal` component. The `components/motion/` 3D/shader/tiering stack is deleted; `deviceTier.ts` is trimmed to the one function (`prefersReducedMotion`) still used by `app/template.tsx`.

**Tech Stack:** Next.js 14 (static export), Tailwind CSS 3, Framer Motion (kept, only for `template.tsx`'s page-enter transition), Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-19-clay-redesign-design.md`

## Global Constraints

- No content/copy changes anywhere — every string in `content/site.ts` and `content/experience.ts` stays byte-identical; only markup/classes around it change.
- No new routes; static-export/GitHub Pages deployment model (`resolveAssetPath`, `basePath`) is untouched.
- Preserve accessibility behavior already in place: focus rings, semantic structure, `prefers-reduced-motion` handling (CSS-media-query-gated, not JS-toggled), and the `inert`/no-op-by-default patterns in `Reveal`/`StatCounter`.
- Every deleted subsystem is deleted outright (files + its tests), never left disabled in place.
- Full verification gate (`npm run typecheck && npm run test && npm run build && npm run verify:export`) only has to pass at the end of the plan (Task 15) — intermediate tasks verify with their own targeted test file(s) only, since several files reference symbols/components that later tasks still need to remove or rebuild.
- New color tokens (see Task 1) replace `ink`/`paper`/`amber`/`signal`/`mute`/`line` entirely — `ink` and `mute` are reused names with new hex values, the rest are gone.

---

## Task 1: Palette, type, shadow, and link-class foundation

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `lib/fonts.ts`
- Modify: `lib/ui.ts`

**Interfaces:**
- Produces: Tailwind color tokens `cream`, `surface`, `ink`, `mute`, `clay-amber`/`clay-amber-light`, `clay-teal`/`clay-teal-light`, `clay-pink`/`clay-pink-light`, `clay-lavender`/`clay-lavender-light`; `boxShadow` tokens `clay-raised`/`clay-pressed`; font family tokens `font-display` (Baloo 2), `font-body` (Nunito) — `font-mono` removed. `lib/fonts.ts` exports `baloo2`, `nunito` (replaces `bigShoulders`, `manrope`, `plexMono`). `lib/ui.ts` exports `linkClass`, `navLinkClass` (same names, new pill/underline styling) — consumed by every task below.

- [ ] **Step 1: Replace the palette, drop mono, add shadow tokens in `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF3E7",
        surface: "#FFFDF8",
        ink: "#2C2013",
        mute: "#7A6B57",
        "clay-amber": { DEFAULT: "#E2701F", light: "#FBE0C4" },
        "clay-teal": { DEFAULT: "#3FA79E", light: "#D8F0EC" },
        "clay-pink": { DEFAULT: "#EF7FA8", light: "#FBE1E9" },
        "clay-lavender": { DEFAULT: "#7B87F5", light: "#E5E6FD" },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        "clay-raised": "8px 8px 20px rgba(44, 32, 19, 0.18), -6px -6px 16px rgba(255, 255, 255, 0.8)",
        "clay-pressed": "inset 4px 4px 10px rgba(44, 32, 19, 0.18), inset -4px -4px 10px rgba(255, 255, 255, 0.8)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Switch fonts to Baloo 2 + Nunito in `lib/fonts.ts`**

```ts
import { Baloo_2, Nunito } from "next/font/google";

export const baloo2 = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700", "800"],
});

export const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
```

- [ ] **Step 3: Rework `lib/ui.ts` for pill nav/social links and accent inline links**

```ts
// Shared Tailwind utility strings for clay pill-styled links, kept here so
// styling stays consistent across Header, Footer, and page-level links
// without duplicating the same class list by hand in every file.
const focusRingClass = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-amber/40";

// link-sweep (globals.css) draws an animated underline on hover/focus for
// inline body-text links (mailto, "View full profile"-style CTAs).
export const linkClass = `link-sweep font-semibold text-clay-amber rounded-sm ${focusRingClass}`;

// Pill-shaped nav/social links: fills with the site's primary accent on
// hover/focus and presses in on click, replacing the old underline-sweep +
// mono-uppercase treatment.
export const navLinkClass = `inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-ink shadow-clay-raised transition-colors duration-300 hover:bg-clay-amber hover:text-surface focus-visible:bg-clay-amber focus-visible:text-surface active:shadow-clay-pressed ${focusRingClass}`;
```

- [ ] **Step 4: Verify**

Run: `npx vitest run lib/__tests__` — these tests don't touch fonts/ui/tailwind, expected PASS (regression check only; no test exists for these config files).

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.ts lib/fonts.ts lib/ui.ts
git commit -m "Lay down the clay palette, type, shadow, and link-class tokens"
```

---

## Task 2: `app/globals.css` clay foundation

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: nothing new.
- Produces: recolored `body` fallback, kept mechanics (`.photo-frame`, `.link-sweep`, `.reveal`/`.reveal-scroll`, `.split-char`, `.stat-counter`, `.marquee-track`). Removes `.grain-overlay` + `grain-shift`, `.org-card`/`.org-mark*`/`.org-orbit*`/`@keyframes orbit` (OrgLogoGrid/OrgMark become pure Tailwind in Task 8, so this CSS becomes dead once that lands — deleting it now is safe since nothing in Task 1 introduced new consumers of it).

- [ ] **Step 1: Replace the file contents**

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

.split-char {
  display: inline-block;
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

/* Motion, gated behind prefers-reduced-motion in one shared block. Every
   element it touches is fully visible/static by default; this only adds
   the entrance stagger, the scroll-triggered reveal, the ticker loop (and
   its hover-pause), the photo zoom, and the underline easing on top when
   motion is allowed. */
@media (prefers-reduced-motion: no-preference) {
  @keyframes reveal-up {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Longhand properties only — deliberately NOT the `animation` shorthand.
     The shorthand implicitly resets animation-delay to 0, which silently
     cancels every per-element `[animation-delay:Nms]` stagger callers set
     via Tailwind arbitrary values. */
  .reveal {
    animation-name: reveal-up;
    animation-duration: 0.7s;
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    animation-fill-mode: both;
  }

  @keyframes split-char-up {
    from {
      opacity: 0;
      transform: translateY(60%) rotate(4deg);
    }
    to {
      opacity: 1;
      transform: translateY(0) rotate(0deg);
    }
  }

  .split-char {
    opacity: 0;
    animation-name: split-char-up;
    animation-duration: 0.6s;
    animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    animation-fill-mode: both;
  }

  /* Scroll-triggered sibling of .reveal, driven by the Reveal component
     toggling is-pending/is-visible on intersection instead of firing once
     on load. Transition (not @keyframes) since the JS owns the timing of
     when the class flips. */
  .reveal-scroll.is-pending {
    opacity: 0;
    transform: translateY(20px);
  }

  .reveal-scroll.is-visible {
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
      transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  }

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
   kinetic-type signature move. The track holds two identical copies of
   its content so it can loop seamlessly; reduced-motion hides the
   second copy and leaves the first sitting still instead of animating. */
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

- [ ] **Step 2: Verify**

Run: `npx vitest run components/__tests__/Marquee.test.tsx components/__tests__/Reveal.test.tsx components/__tests__/SplitText.test.tsx components/__tests__/StatCounter.test.tsx components/__tests__/PhotoFrame.test.tsx`
Expected: PASS — none of these tests assert on removed classes (`org-card`, `org-mark*`, `org-orbit*`, `grain-overlay`), confirmed by grep during planning.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "Recolor kept CSS mechanics for clay and drop grain/org-orbit/org-card CSS"
```

---

## Task 3: Remove the dead 3D/motion/tiering subsystem

**Files:**
- Delete: `components/motion/GrainOverlay.tsx`, `components/motion/__tests__/GrainOverlay.test.tsx`
- Delete: `components/motion/IntroOverlay.tsx`, `components/motion/__tests__/IntroOverlay.test.tsx`
- Delete: `components/motion/Waypoint.tsx`, `components/motion/__tests__/Waypoint.test.tsx`
- Delete: `components/motion/PinnedStatement.tsx`, `components/motion/__tests__/PinnedStatement.test.tsx`
- Delete: `components/motion/SceneCanvas.tsx`, `components/motion/FlyPath.tsx`, `components/motion/OrgMarkShader.tsx`
- Modify: `components/motion/deviceTier.ts` (trim to one function)
- Modify: `components/motion/__tests__/deviceTier.test.ts` (trim to that function's tests)
- Modify: `package.json` (drop `@react-three/fiber`, `three`, `@types/three`)

**Interfaces:**
- Consumes: nothing.
- Produces: `deviceTier.ts` now exports only `prefersReducedMotion(): boolean` — this is the only symbol `app/template.tsx` imports from this module, and it is unchanged.
- Note: `components/motion/Flythrough.tsx` (+ its 2 tests) and its remaining callers (`app/page.tsx`) are handled together in Task 9 (Home page rebuild), since Flythrough is Home's sole consumer and both must change in lockstep. Do not delete `Flythrough.tsx` in this task.

- [ ] **Step 1: Delete the dead files**

```bash
rm components/motion/GrainOverlay.tsx components/motion/__tests__/GrainOverlay.test.tsx
rm components/motion/IntroOverlay.tsx components/motion/__tests__/IntroOverlay.test.tsx
rm components/motion/Waypoint.tsx components/motion/__tests__/Waypoint.test.tsx
rm components/motion/PinnedStatement.tsx components/motion/__tests__/PinnedStatement.test.tsx
rm components/motion/SceneCanvas.tsx components/motion/FlyPath.tsx components/motion/OrgMarkShader.tsx
```

- [ ] **Step 2: Trim `components/motion/deviceTier.ts` to the one function still used**

```ts
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
```

- [ ] **Step 3: Trim `components/motion/__tests__/deviceTier.test.ts` to match**

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { prefersReducedMotion } from "../deviceTier";

describe("prefersReducedMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the matchMedia result when matchMedia is available", () => {
    const matchMediaMock = vi.fn().mockReturnValue({ matches: true });
    vi.stubGlobal("matchMedia", matchMediaMock);
    expect(prefersReducedMotion()).toBe(true);
    expect(matchMediaMock).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
  });

  it("returns false when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(prefersReducedMotion()).toBe(false);
  });
});
```

- [ ] **Step 4: Drop the now-unused 3D dependencies from `package.json`**

Remove these three lines (from `dependencies`: `"@react-three/fiber": "^8.18.0",` and `"three": "^0.185.1",`; from `devDependencies`: `"@types/three": "^0.185.4",`). `framer-motion` stays.

- [ ] **Step 5: Reinstall to sync the lockfile**

Run: `npm install`
Expected: exits 0, `package-lock.json` updates to drop the three packages.

- [ ] **Step 6: Verify**

Run: `npx vitest run components/motion/__tests__/deviceTier.test.ts`
Expected: PASS (2 tests).

Note: `npm run typecheck` will still fail after this step — `app/page.tsx` (via `Flythrough.tsx`) still imports `detectWebGL2`/`resolveDeviceTier`/`DeviceTier` from this module, and `components/OrgLogoGrid.tsx` still imports `resolveDeviceTier`/`DeviceTier` too. Both are fixed in Tasks 8 and 9. This is expected and not a regression to chase down now — see Global Constraints.

- [ ] **Step 7: Commit**

```bash
git add components/motion/GrainOverlay.tsx components/motion/__tests__/GrainOverlay.test.tsx \
  components/motion/IntroOverlay.tsx components/motion/__tests__/IntroOverlay.test.tsx \
  components/motion/Waypoint.tsx components/motion/__tests__/Waypoint.test.tsx \
  components/motion/PinnedStatement.tsx components/motion/__tests__/PinnedStatement.test.tsx \
  components/motion/SceneCanvas.tsx components/motion/FlyPath.tsx components/motion/OrgMarkShader.tsx \
  components/motion/deviceTier.ts components/motion/__tests__/deviceTier.test.ts \
  package.json package-lock.json
git commit -m "Delete the grain/intro/waypoint/3D-canvas subsystem and its WebGL dependencies"
```

---

## Task 4: `app/layout.tsx` — drop grain, switch to clay body/fonts

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `baloo2`, `nunito` from `lib/fonts.ts` (Task 1).
- Produces: no exported symbols consumed elsewhere; `<body>` now carries `bg-cream text-ink`.

- [ ] **Step 1: Rewrite the file**

```tsx
import type { Metadata } from "next";
import { baloo2, nunito } from "@/lib/fonts";
import { buildMetadata, personJsonLd } from "@/lib/seo";
import { site } from "@/content/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = buildMetadata({
  title: site.tagline,
  description: site.description,
  path: "/",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${baloo2.variable} ${nunito.variable}`}>
      <body className="flex min-h-screen flex-col bg-cream font-body text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 sm:px-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx vitest run lib/__tests__/seo.test.ts`
Expected: PASS (unaffected by this change; there is no `layout.test.tsx`).

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "Drop GrainOverlay and switch root layout to the clay fonts/body colors"
```

---

## Task 5: Header + Footer — pill nav/social chrome

**Files:**
- Modify: `components/Header.tsx`
- Modify: `components/Footer.tsx`

**Interfaces:**
- Consumes: `navLinkClass` from `lib/ui.ts` (Task 1).

- [ ] **Step 1: Rewrite `components/Header.tsx`**

```tsx
import Link from "next/link";
import { nav, site } from "@/content/site";
import { navLinkClass } from "@/lib/ui";

export default function Header() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-7 sm:px-8">
        <Link
          href="/"
          className="inline-block rounded-full px-2 py-1 font-display text-2xl font-extrabold text-ink transition-colors duration-300 hover:text-clay-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-amber/40"
        >
          {site.shortName}
        </Link>
        <nav aria-label="Primary">
          <ul className="flex list-none flex-wrap items-center gap-2 p-0">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={navLinkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Rewrite `components/Footer.tsx`**

```tsx
import { site, social } from "@/content/site";
import { navLinkClass } from "@/lib/ui";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-20 mt-24 border-t border-mute/20">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-sm text-mute">{site.location}</p>
        <ul aria-label="Social links" className="flex list-none flex-wrap gap-2 p-0">
          {social.map((item) => (
            <li key={item.href}>
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-mute/20 px-6 py-4 text-center text-xs text-mute sm:px-8">
        © {year} {site.name}
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npx vitest run components/__tests__/Header.test.tsx components/__tests__/Footer.test.tsx`
Expected: PASS unchanged — both tests assert only on `role="link"` name/href/target/rel and visible text, none of which changed (confirmed by reading both files during planning; no class-name assertions exist).

- [ ] **Step 4: Commit**

```bash
git add components/Header.tsx components/Footer.tsx
git commit -m "Restyle Header/Footer nav and social links as clay pill buttons"
```

---

## Task 6: PhotoFrame — clay frame instead of hard border

**Files:**
- Modify: `components/PhotoFrame.tsx`

**Interfaces:**
- No prop/interface change — `PhotoFrameProps` stays identical (`src`, `alt`, `width`, `height`, `className?`, `loading?`).

- [ ] **Step 1: Add the clay frame classes**

```tsx
import { resolveAssetPath } from "@/lib/assetPath";

interface PhotoFrameProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  /** LCP-critical hero usages (Home, About) should pass "eager". Defaults to "lazy". */
  loading?: "eager" | "lazy";
}

export default function PhotoFrame({
  src,
  alt,
  width,
  height,
  className,
  loading = "lazy",
}: PhotoFrameProps) {
  const frameClassName = ["photo-frame", "rounded-[2rem] shadow-clay-raised", className]
    .filter(Boolean)
    .join(" ");
  const resolvedSrc = resolveAssetPath(src);
  return (
    <div className={frameClassName}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resolvedSrc} alt={alt} width={width} height={height} loading={loading} />
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx vitest run components/__tests__/PhotoFrame.test.tsx`
Expected: PASS — the test only asserts `src`/`alt`/`width`/`height` attributes on the `<img>`, unaffected by the wrapper's className.

- [ ] **Step 3: Commit**

```bash
git add components/PhotoFrame.tsx
git commit -m "Give PhotoFrame a rounded clay frame instead of a hard border"
```

---

## Task 7: StatBand — clay tiles, one accent per stat

**Files:**
- Modify: `components/StatBand.tsx`

**Interfaces:**
- No prop change (still a zero-prop component reading `stats` from `content/site.ts`).
- Consumes: `StatCounter` (unchanged).

- [ ] **Step 1: Rewrite**

```tsx
import { stats } from "@/content/site";
import StatCounter from "@/components/StatCounter";

const ACCENTS = [
  { bg: "bg-clay-amber-light", text: "text-clay-amber" },
  { bg: "bg-clay-teal-light", text: "text-clay-teal" },
  { bg: "bg-clay-pink-light", text: "text-clay-pink" },
  { bg: "bg-clay-lavender-light", text: "text-clay-lavender" },
];

export default function StatBand() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat, index) => {
        const accent = ACCENTS[index % ACCENTS.length];
        return (
          <div key={stat.label} className={`rounded-[2rem] ${accent.bg} p-6 text-center shadow-clay-raised`}>
            <p className={`font-display text-3xl font-extrabold tabular-nums ${accent.text} sm:text-4xl`}>
              <StatCounter value={stat.value} />
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink/70">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx vitest run components/__tests__/StatBand.test.tsx`
Expected: PASS — the test only asserts each stat's value/label text is present, unaffected by wrapper classes.

- [ ] **Step 3: Commit**

```bash
git add components/StatBand.tsx
git commit -m "Restyle StatBand as four clay tiles, one accent color per stat"
```

---

## Task 8: OrgMark + OrgLogoGrid — plain clay grid, drop shader/tier/orbit

**Files:**
- Modify: `components/OrgMark.tsx`
- Modify: `components/OrgLogoGrid.tsx`
- Modify: `components/__tests__/OrgLogoGrid.test.tsx`

**Interfaces:**
- `OrgMark` keeps its props (`org: string`, `className?: string`) but no longer wraps content in `.org-mark`/`.org-mark-wrap` CSS classes — callers now size it directly via `className` (e.g. `"h-16 w-16"`), matching how `app/experience/page.tsx` already calls it.
- `OrgLogoGrid` drops its `"use client"` directive, all state/effects, and the `next/dynamic` shader import — it becomes a plain server component again.

- [ ] **Step 1: Rewrite `components/OrgMark.tsx`**

```tsx
import { orgLogos } from "@/content/orgLogos";
import { resolveAssetPath } from "@/lib/assetPath";
import { monogramFor } from "@/lib/monogram";

interface OrgMarkProps {
  org: string;
  className?: string;
}

/** A square mark representing an organization: its real logo when one is
 * available in content/orgLogos.ts, otherwise a generated monogram. The org
 * name itself is rendered as visible text by the caller (OrgLogoGrid /
 * experience timeline), so the mark itself can stay decorative. */
export default function OrgMark({ org, className }: OrgMarkProps) {
  const src = orgLogos[org];
  const classes = ["flex items-center justify-center", className].filter(Boolean).join(" ");

  if (src) {
    return (
      <div className={classes}>
        <img
          src={resolveAssetPath(src)}
          alt={`${org} logo`}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className={classes} aria-hidden="true">
      <span className="font-display text-2xl font-extrabold text-mute">{monogramFor(org)}</span>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `components/OrgLogoGrid.tsx`**

```tsx
import { orgNames } from "@/content/site";
import OrgMark from "@/components/OrgMark";

export default function OrgLogoGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {orgNames.map((org) => (
        <div
          key={org}
          className="flex flex-col items-center rounded-[2rem] bg-surface p-5 text-center shadow-clay-raised transition-transform duration-300 motion-safe:hover:-translate-y-1"
        >
          <OrgMark org={org} className="h-16 w-16" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-mute">{org}</p>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Update `components/__tests__/OrgLogoGrid.test.tsx`**

The shader-tier test and the orbit-positioning test no longer apply — there is no shader, no tier probe, and no offset-path orbit left to guard. Replace them with a structural check that one plain card exists per org and no canvas ever mounts:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { orgNames } from "@/content/site";
import OrgLogoGrid from "../OrgLogoGrid";

describe("OrgLogoGrid", () => {
  it("renders one card with a visible name for every unique org", () => {
    render(<OrgLogoGrid />);
    for (const org of orgNames) {
      expect(screen.getByText(org)).toBeInTheDocument();
    }
  });

  it("renders exactly one card per unique org, with no shader canvas", () => {
    const { container } = render(<OrgLogoGrid />);
    expect(container.querySelectorAll("canvas").length).toBe(0);
    const grid = container.firstElementChild;
    expect(grid?.children.length).toBe(orgNames.length);
  });
});
```

- [ ] **Step 4: Run the test and verify it fails first against the OLD implementation, then passes**

Since this is a refactor (not new behavior), run it only after Step 2's rewrite is in place:

Run: `npx vitest run components/__tests__/OrgLogoGrid.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add components/OrgMark.tsx components/OrgLogoGrid.tsx components/__tests__/OrgLogoGrid.test.tsx
git commit -m "Rebuild OrgLogoGrid as a plain clay card grid, dropping shader/tier/orbit"
```

---

## Task 9: Home page rebuild — drop Flythrough, plain in-flow clay sections

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/__tests__/page.test.tsx`
- Delete: `components/motion/Flythrough.tsx`, `components/motion/__tests__/Flythrough.test.tsx`, `components/motion/__tests__/Flythrough.reduceMotion.test.tsx`

**Interfaces:**
- `HomePage` becomes a zero-prop default export rendering a `<>...</>` fragment of plain in-flow sections (no wrapper component owning a shared scroll track).
- Consumes: `site`, `orgNames` (`content/site`), `employment`/`credentials`/`education`/`TimelineEntry` (`content/experience`), `PhotoFrame`, `StatBand`, `Marquee`, `Reveal`, `SplitText`, `OrgLogoGrid`, `OrgMark`, `linkClass`/`navLinkClass` (`lib/ui`) — `Flythrough`, `SectionDivider` are no longer imported.

- [ ] **Step 1: Delete `Flythrough` and its tests**

```bash
rm components/motion/Flythrough.tsx
rm components/motion/__tests__/Flythrough.test.tsx components/motion/__tests__/Flythrough.reduceMotion.test.tsx
```

- [ ] **Step 2: Rewrite `app/page.tsx`**

```tsx
import Link from "next/link";
import { site, social, orgNames } from "@/content/site";
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import PhotoFrame from "@/components/PhotoFrame";
import StatBand from "@/components/StatBand";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import SplitText from "@/components/SplitText";
import OrgLogoGrid from "@/components/OrgLogoGrid";
import OrgMark from "@/components/OrgMark";
import { linkClass, navLinkClass } from "@/lib/ui";

const EXPERIENCE_HIGHLIGHTS: (TimelineEntry & { number: string })[] = [
  { ...employment[0], number: "01" },
  { ...credentials[0], number: "02" },
  { ...education[0], number: "03" },
];

/** Two overlapping soft blobs behind the hero portrait — the clay
 * illustration that replaces the removed Three.js flythrough canvas. Pure
 * decoration (aria-hidden), so it carries no content of its own. */
function ClayBlobBackdrop() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -right-16 -top-16 -z-10 h-72 w-72 opacity-90 sm:h-96 sm:w-96"
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
    </svg>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden pb-10 pt-16 sm:pt-24 md:pb-16 md:pt-32">
        <ClayBlobBackdrop />
        <p className="reveal inline-block rounded-full bg-clay-amber-light px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-amber">
          {site.location} — {site.tagline}
        </p>
        <h1 className="mt-4 text-balance font-display text-[clamp(2.75rem,9vw,7rem)] font-extrabold leading-[0.95] text-ink">
          <SplitText text={site.name} baseDelayMs={80} staggerMs={18} />
        </h1>
        <div className="reveal [animation-delay:200ms] mt-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <p className="max-w-xl text-lg leading-relaxed text-mute">{site.description}</p>
          <PhotoFrame
            src={site.photo.src}
            alt={site.photo.alt}
            width={site.photo.width}
            height={site.photo.height}
            loading="eager"
            className="h-28 w-28 shrink-0 md:h-32 md:w-32"
          />
        </div>
      </section>

      <Marquee
        items={orgNames}
        className="reveal [animation-delay:320ms] rounded-full bg-surface py-4 text-sm font-semibold text-mute shadow-clay-raised"
      />

      <Reveal className="py-14 sm:py-20">
        <StatBand />
      </Reveal>

      <Reveal className="py-14 sm:py-20">
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
        <Link href="/about" className={`mt-6 inline-block ${linkClass}`}>
          View full profile →
        </Link>
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
        <Link href="/experience" className={`mt-6 inline-block ${linkClass}`}>
          View full timeline →
        </Link>
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
        <Link href="/contact" className={`mt-6 inline-block ${linkClass}`}>
          View full contact →
        </Link>
      </Reveal>
    </>
  );
}
```

- [ ] **Step 3: Update `app/__tests__/page.test.tsx`**

Same assertions (all four content anchors and the no-baked-opacity guarantee still hold — `Reveal`/`SplitText`/`StatCounter` never write inline `opacity` before mount, and there's no more Waypoint/PinnedStatement imperative-opacity code path at all), just with the comment updated since it no longer describes now-deleted components:

```tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "../page";
import { site } from "@/content/site";

// Composition-level SSR-safety test: locks in the guarantee that no
// section of the homepage is ever born invisible before JS hydrates —
// Reveal/SplitText/StatCounter are all "visible by default, JS opts into
// an animated state" components, so server-rendered markup must never
// contain a baked opacity:0.
describe("HomePage (SSR composition)", () => {
  it("never bakes opacity:0 into server-rendered markup anywhere in the full composition", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).not.toMatch(/opacity:\s*0(?!\.)/);
  });

  it("includes the key content anchors from every section, unconditionally visible", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain(site.name);
    expect(html).toContain("View full profile");
    expect(html).toContain("View full timeline");
    expect(html).toContain("Get in touch");
  });
});
```

- [ ] **Step 4: Verify**

Run: `npx vitest run app/__tests__/page.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/__tests__/page.test.tsx \
  components/motion/Flythrough.tsx components/motion/__tests__/Flythrough.test.tsx \
  components/motion/__tests__/Flythrough.reduceMotion.test.tsx
git commit -m "Rebuild the homepage as plain in-flow clay sections, retiring the scroll-pinned flythrough"
```

---

## Task 10: About page restyle

**Files:**
- Modify: `app/about/page.tsx`

**Interfaces:** none (page component, no props).

- [ ] **Step 1: Rewrite**

```tsx
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import Reveal from "@/components/Reveal";
import SplitText from "@/components/SplitText";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description: site.description,
  path: "/about",
});

export default function AboutPage() {
  return (
    <section className="grid gap-10 rounded-[2rem] bg-clay-pink-light px-6 py-14 sm:py-20 md:grid-cols-[minmax(0,200px)_1fr] md:items-start md:gap-16">
      <Reveal>
        <PhotoFrame
          src={site.photo.src}
          alt={site.photo.alt}
          width={site.photo.width}
          height={site.photo.height}
          loading="eager"
          className="mx-auto h-40 w-40 md:mx-0 md:h-48 md:w-48"
        />
      </Reveal>
      <Reveal delayMs={120}>
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-pink">
          About
        </p>
        <h1 className="mt-2 text-balance font-display text-4xl font-bold text-ink sm:text-5xl">
          <SplitText text="Entrepreneur, mentor, and product designer." staggerMs={10} />
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/80">{site.description}</p>
        <p className="mt-6 max-w-2xl rounded-[1.5rem] bg-surface px-6 py-5 text-xl leading-relaxed text-ink shadow-clay-raised">
          &ldquo;{site.tagline}&rdquo; &mdash; based in {site.location}, working across education,
          innovation mentorship, and product design.
        </p>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx vitest run` (no dedicated test file exists for this page — run the full suite as a smoke check that nothing else broke from the import graph)
Expected: same pass/fail set as before this task (About-page-specific failures should be zero either way, since there's nothing testing it directly).

- [ ] **Step 3: Commit**

```bash
git add app/about/page.tsx
git commit -m "Restyle the About page as a clay panel"
```

---

## Task 11: Experience page restyle + retire SectionDivider

**Files:**
- Modify: `app/experience/page.tsx`
- Delete: `components/SectionDivider.tsx`, `components/__tests__/SectionDivider.test.tsx`

**Interfaces:** none (page component, no props). `SectionDivider` has no other remaining callers — `app/page.tsx` already stopped importing it in Task 9.

- [ ] **Step 1: Rewrite `app/experience/page.tsx`, dropping the `SectionDivider` import/usage**

```tsx
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import Reveal from "@/components/Reveal";
import OrgMark from "@/components/OrgMark";
import SplitText from "@/components/SplitText";

export const metadata: Metadata = buildMetadata({
  title: "Experience",
  description: "Employment history, education, and credentials for Vijaya Bhaskar Jatoth.",
  path: "/experience",
});

const SECTION_ACCENTS = {
  Employment: { badgeBg: "bg-clay-teal-light", badgeText: "text-clay-teal", pillBg: "bg-clay-teal-light", pillText: "text-clay-teal" },
  Education: { badgeBg: "bg-clay-lavender-light", badgeText: "text-clay-lavender", pillBg: "bg-clay-lavender-light", pillText: "text-clay-lavender" },
  Credentials: { badgeBg: "bg-clay-pink-light", badgeText: "text-clay-pink", pillBg: "bg-clay-pink-light", pillText: "text-clay-pink" },
} as const;

function Timeline({
  title,
  entries,
}: {
  title: keyof typeof SECTION_ACCENTS;
  entries: TimelineEntry[];
}) {
  const accent = SECTION_ACCENTS[title];
  return (
    <div>
      <h2
        className={`inline-block rounded-full ${accent.badgeBg} px-4 py-1 text-xs font-semibold uppercase tracking-wide ${accent.badgeText}`}
      >
        {title}
      </h2>
      <ul className="mt-6 space-y-4">
        {entries.map((entry) => (
          <li
            key={`${entry.org}-${entry.period}`}
            className="flex gap-4 rounded-[2rem] bg-surface p-5 shadow-clay-raised sm:p-6"
          >
            <OrgMark org={entry.org} className="h-12 w-12 shrink-0" />
            <div>
              <span
                className={`inline-block rounded-full ${accent.pillBg} px-3 py-0.5 text-xs font-semibold tabular-nums ${accent.pillText}`}
              >
                {entry.period}
              </span>
              <h3 className="mt-2 font-display text-xl font-bold text-ink">
                {entry.role} · {entry.org}
              </h3>
              <p className="mt-2 max-w-2xl text-mute">{entry.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const sections: { title: keyof typeof SECTION_ACCENTS; entries: TimelineEntry[] }[] = [
  { title: "Employment", entries: employment },
  { title: "Education", entries: education },
  { title: "Credentials", entries: credentials },
];

export default function ExperiencePage() {
  return (
    <section className="py-14 sm:py-20">
      <h1 className="font-display text-4xl font-bold text-ink sm:text-5xl">
        <SplitText text="Experience" />
      </h1>
      {sections.map((section, index) => (
        <div key={section.title} className={index === 0 ? "mt-12" : "mt-16"}>
          <Reveal delayMs={index * 80}>
            <Timeline title={section.title} entries={section.entries} />
          </Reveal>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Delete `SectionDivider` and its test**

```bash
rm components/SectionDivider.tsx components/__tests__/SectionDivider.test.tsx
```

- [ ] **Step 3: Verify**

Run: `npx vitest run` (no dedicated Experience-page test exists; run the full suite — this also confirms nothing else still imports the just-deleted `SectionDivider`)
Expected: no failures referencing `SectionDivider` or `components/experience` — the only remaining failures at this point in the plan should be the ones already expected from Task 3's note (Contact/404 pages not yet touched are unaffected by this deletion since they never imported `SectionDivider`).

- [ ] **Step 4: Commit**

```bash
git add app/experience/page.tsx
git rm components/SectionDivider.tsx components/__tests__/SectionDivider.test.tsx
git commit -m "Restyle the Experience timeline as clay list cards and retire SectionDivider"
```

---

## Task 12: Contact page restyle

**Files:**
- Modify: `app/contact/page.tsx`

**Interfaces:** none (page component, no props).

- [ ] **Step 1: Rewrite**

```tsx
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { site, social } from "@/content/site";
import { linkClass, navLinkClass } from "@/lib/ui";
import Reveal from "@/components/Reveal";
import SplitText from "@/components/SplitText";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description: `Get in touch with ${site.name}.`,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <section className="max-w-2xl rounded-[2rem] bg-clay-lavender-light px-6 py-14 sm:py-20">
      <Reveal>
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-lavender">
          Contact
        </p>
        <h1 className="mt-2 text-balance font-display text-4xl font-bold text-ink sm:text-5xl">
          <SplitText text="Get in touch." />
        </h1>
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
              <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx vitest run` (no dedicated Contact-page test exists)
Expected: no new failures.

- [ ] **Step 3: Commit**

```bash
git add app/contact/page.tsx
git commit -m "Restyle the Contact page as a clay panel"
```

---

## Task 13: 404 page restyle

**Files:**
- Modify: `app/not-found.tsx`

**Interfaces:** none (page component, no props).

- [ ] **Step 1: Rewrite**

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { site } from "@/content/site";
import { linkClass } from "@/lib/ui";

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
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx vitest run` (no dedicated 404-page test exists)
Expected: no new failures.

- [ ] **Step 3: Commit**

```bash
git add app/not-found.tsx
git commit -m "Restyle the 404 page as a clay panel"
```

---

## Task 14: `scripts/verify-export.mjs` — check the new palette in shipped CSS

**Files:**
- Modify: `scripts/verify-export.mjs`

**Interfaces:** none (standalone Node script, no exports consumed elsewhere).

- [ ] **Step 1: Replace the `paletteColors` map**

```js
const paletteColors = {
  cream: "#fbf3e7",
  surface: "#fffdf8",
  ink: "#2c2013",
  mute: "#7a6b57",
  "clay-amber": "#e2701f",
  "clay-teal": "#3fa79e",
  "clay-pink": "#ef7fa8",
  "clay-lavender": "#7b87f5",
};
```

Everything else in the file (`requiredFiles`, `forbiddenStrings`, `requiredStrings`, `forbiddenSocialFragments`, the HTML/CSS scanning logic) is unchanged — this script checks content and hosting invariants that this redesign doesn't touch.

- [ ] **Step 2: Verify (deferred to Task 15)**

This script only runs against a real `npm run build` output (`out/`), so it can't be exercised standalone yet — Task 15's full gate is what actually runs it.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-export.mjs
git commit -m "Point verify-export at the new clay palette tokens"
```

---

## Task 15: Full verification gate + manual QA

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: exits 0. If it doesn't, the remaining error is almost certainly a leftover reference to a deleted symbol (`amber`/`paper`/`ink`(old)/`signal`/`mute`(old)/`line` Tailwind tokens don't fail typecheck since Tailwind classes are just strings — but leftover imports of deleted modules/exports, e.g. `resolveDeviceTier`, `DeviceTier`, `Flythrough`, `SectionDivider`, `GrainOverlay`, do fail it). Grep for any of those identifiers across `app/` and `components/` and fix.

- [ ] **Step 2: Run the full test suite**

Run: `npm run test`
Expected: exits 0, all suites pass.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: exits 0, produces `out/`.

- [ ] **Step 4: Verify the export**

Run: `npm run verify:export`
Expected: `Export verification passed: no placeholders, all required facts present.`

- [ ] **Step 5: Manual browser pass**

Run: `npm run start` (or serve `out/` statically) and check in a real browser:
- Golden path: home → about → experience → contact nav works, hero is readable, stat counters fire on scroll into `StatBand`, org grid cards lift on hover.
- `prefers-reduced-motion: reduce` (OS/browser setting or DevTools rendering emulation): no scroll-triggered fade/slide, no marquee scroll, no split-char stagger, no page-enter transition (`template.tsx`) — content is fully visible immediately everywhere.
- Mobile viewport widths (375px, 768px): no horizontal scroll on any page, StatBand/OrgLogoGrid grids collapse to 2 columns, hero blob backdrop doesn't overflow its section.
- Confirm no remaining dark-editorial artifacts: no `#0B0B0C`/`#F2F1ED` background/text anywhere, no mono-uppercase labels, no film-grain texture, no orbiting logos.

- [ ] **Step 6: Final commit (only if Step 5 surfaced fixes)**

If manual QA required any follow-up edits, stage and commit them with a message describing what the QA pass caught. If nothing needed fixing, this plan is complete as of Task 14's commit — no empty commit needed.
