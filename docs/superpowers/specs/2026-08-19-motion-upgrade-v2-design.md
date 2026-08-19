# Framer Motion Upgrade (v2) — Design

Status: approved for planning
Date: 2026-08-19

## Background

The site just went through a claymorphism redesign
(`docs/superpowers/specs/2026-08-19-clay-redesign-design.md`) that deliberately
removed the previous 3D-flythrough motion stack (Three.js scene, scroll-pinned
waypoints, device tiering, grain overlay) as unnecessary complexity. What's
left is a small set of CSS-driven motion primitives — `Reveal` (scroll fade-up
via IntersectionObserver + CSS classes), `SplitText` (per-character load
stagger via CSS `animation-delay`), `StatCounter` (CSS `@property --num`
counter), `Marquee` (CSS keyframe loop), plus `app/template.tsx`'s Framer
Motion page-enter transition (the one place Framer Motion is used today).

The site owner wants a genuine motion upgrade: richer, more polished
animation throughout, using Framer Motion (already a dependency), plus
lightweight 3D depth via CSS/Framer transforms (explicitly **not** a return to
WebGL/Three.js — confirmed with the owner). Direction was narrowed through
clarifying questions: **polished and tasteful, not showcase-y**; **replace
the scroll/entrance animation system with Framer Motion for real orchestration
gains, layer Framer Motion on top for genuinely new interactions, and leave
components that already work well (the CSS counter, the marquee loop) alone**.

## Goals

- Rebuild `Reveal` and `SplitText` on Framer Motion, keeping their existing
  public APIs so every call site across Home/About/Experience/Contact is
  unaffected by the internal swap.
- Add a single shared "can I safely animate" gate (`useCanAnimate`) that
  replicates, once, the three-way guarantee `Reveal` currently hand-rolls:
  SSR renders fully visible with zero motion styles baked in; a missing
  `IntersectionObserver` (old browsers, test environments) falls back to
  fully visible immediately; otherwise the element animates once, the first
  time it enters the viewport. Every rewritten/new component consumes this
  instead of re-implementing it.
- Orchestrate the hero's above-the-fold entrance as one staggered sequence
  instead of today's per-element `.reveal [animation-delay:Nms]` arbitrary
  values.
- Add lightweight 3D depth: a reusable pointer-tilt wrapper used around the
  hero/About portrait and the org-logo cards, plus a subtle scroll-linked
  parallax on the hero's decorative blob.
- Give `StatBand` and `OrgLogoGrid` a staggered grid entrance (their items
  animate in one after another, not as one flat block).
- Give the 404 page the same entrance treatment as every other route (it
  currently has none).
- Delete the CSS that becomes dead once `Reveal`/`SplitText` move to Framer
  Motion, rather than leaving it disabled in place.

## Non-goals

- No WebGL/Three.js/`@react-three/fiber` — confirmed with the owner; that
  stack was just removed and stays removed.
- No scroll-hijacking or scroll-pinning (the exact pattern the clay redesign
  retired).
- No new npm dependencies — `framer-motion` is already installed and is the
  only animation library this spec uses.
- No content, copy, route, palette, or typography changes.
- No autonomous infinite-loop animations (e.g. a perpetually bouncing/
  pulsing element with no user or scroll trigger) — motion is either
  scroll-triggered, mount-triggered (hero, once), or interaction-triggered
  (hover/tap/pointer-move).
- `Marquee` and `StatCounter`'s counting mechanism stay exactly as they are.
  `Header`/`Footer` and every `linkClass`/`navLinkClass`-styled link stay
  CSS-only/zero-JS (no Framer Motion, no client-component conversion) — see
  "Explicitly staying CSS-only" below for why; they still get small
  Tailwind-only hover/press class additions.

## Shared foundation

**New file `lib/motion.ts`** (no `"use client"` needed — it exports a hook
and plain values, consumed only from files that are already client
components):

- `EASE = [0.16, 1, 0.3, 1] as const` — the same cubic-bezier already used
  throughout `app/globals.css`, so old and new motion read as one language.
- `fadeUpItem` — a Framer Motion variants object: `hidden: { opacity: 0, y:
  20 }`, `visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease:
  EASE } }`. This is `Reveal`'s animation.
- `staggerContainer(staggerMs: number)` — returns a variants object whose
  `visible` state sets `transition: { staggerChildren: staggerMs / 1000 }`,
  for any component that orchestrates multiple `fadeUpItem` children.
- `useCanAnimate(): boolean` — a hook, the single load-bearing piece of this
  redesign:
  - Starts `false` unconditionally (server render and the pre-hydration
    client render both see `false` — this is what keeps SSR output
    animation-free, exactly mirroring `app/template.tsx`'s existing
    `hasEnteredOnce`/`animate` pattern and `Reveal`'s existing
    `mounted`/`pending` pattern).
  - In a `useEffect`, checks `typeof IntersectionObserver === "undefined"`
    (mirrors `Reveal.tsx`'s existing fallback) — if true, returns `true`
    immediately (skip straight to "fully visible, no animation attempted").
  - Otherwise checks the existing `prefersReducedMotion()` utility from
    `components/motion/deviceTier.ts` (kept from the clay redesign
    specifically for this reuse) plus a `matchMedia` change listener, same
    pattern already used in this codebase (e.g. the pre-redesign
    `OrgLogoGrid`) — if reduced motion is preferred, returns `true` (skip
    animation, render at rest) so nothing scroll-linked or pointer-driven
    ever fires for a visitor who asked for none.
  - Otherwise returns `false`, meaning "motion is safe to attempt" — callers
    branch on this to decide whether to render a plain element or a
    `motion.*` element with real `initial`/`whileInView`/`variants`.
  - **Important naming note for implementers:** the boolean's *name*
    describes availability, but each consumer decides what to DO with it —
    `Reveal` and `SplitText` use it to pick "render plain now" vs "render
    animated", while `Tilt` uses the inverse (skip attaching pointer
    handlers when animation is not safe/wanted).

This hook gets its own dedicated test file covering all three branches
(IntersectionObserver missing, reduced-motion preferred, normal case) — every
other component's test can then assume the gate works and just test its own
rendered output.

## Component-by-component

**`components/Reveal.tsx`** — same props (`children`, `className`,
`delayMs`). Internally: if `useCanAnimate()` is `false`
("not yet safe/decided"), render a plain `<div className={className}>`
(exactly today's pre-mount/no-IO/reduced-motion behavior). Once safe, render
`<motion.div variants={fadeUpItem} initial="hidden" whileInView="visible"
viewport={{ once: true, amount: 0.15, margin: "0px 0px -10% 0px" }}
transition={delayMs ? { delay: delayMs / 1000 } : undefined}>`. Same
threshold/rootMargin values as today, so the trigger point doesn't change.

**`components/SplitText.tsx`** — same props (`text`, `className`,
`baseDelayMs`, `staggerMs`). This one animates on **mount**, not scroll
(matches today — it's used for headings that are already above/near the
fold on load). Same `useCanAnimate()` branch: plain spans with real text
directly (today's no-JS/crawler-safe output) until safe, then a
`motion.span` container with `staggerContainer(staggerMs)` and each
character as a `motion.span` child using `fadeUpItem`-style variants (y+
opacity, matching the current `translateY(60%) rotate(4deg)` → resting
feel). `baseDelayMs` maps to the container's `transition.delayChildren`.
Same aria-label-on-wrapper / aria-hidden-on-chars structure as today — this
doesn't change, only the animation engine does.

**Hero (`app/page.tsx`)** — replace the three separate `className="reveal
[animation-delay:Nms]"` usages (pill, description+photo row, marquee) with
one `motion.div` stagger container wrapping the whole hero, using
`staggerContainer` with each of those three blocks as a `fadeUpItem`. The
`<h1>`'s `SplitText` keeps its own internal stagger (nested inside the outer
container is fine — Framer Motion handles nested variant propagation).
Mount-triggered like today (hero is above the fold), gated by the same
`useCanAnimate()` pattern.

**`components/StatCounter.tsx`** — **unchanged**. Its CSS `@property --num`
counting mechanism, driven by a "JS flips a value, CSS owns the motion"
split, already does exactly what it should; there's no visible improvement
from swapping engines, only risk. This is a deliberate scope decision, not
an oversight.

**`components/StatBand.tsx`** — becomes a client component (`"use client"`).
Wraps its 4 tiles in a `motion.div` stagger container (`staggerContainer`,
small stagger like 80ms) using the same `useCanAnimate()` gate; each tile is
a `fadeUpItem`. `StatCounter` inside each tile is untouched and keeps
triggering its own count-up independently via its own IntersectionObserver,
exactly as today.

**`components/OrgLogoGrid.tsx`** — becomes a client component again (it was
briefly one before the clay redesign simplified it back to a server
component). Cards get the same stagger-container treatment as `StatBand`,
plus each card is wrapped in the new `Tilt` component (see below) for a
pointer-following 3D lift on hover, replacing the current flat
`motion-safe:hover:-translate-y-1` CSS lift.

**New `components/motion/Tilt.tsx`** (`"use client"`) — a small, reusable
pointer-tilt wrapper:

```tsx
interface TiltProps {
  children: ReactNode;
  className?: string;
}
```

Tracks pointer position over the wrapped element via `onPointerMove`,
computes rotation via Framer Motion `useMotionValue` +
`useTransform`/`useSpring` (small range — roughly ±6deg — with a spring for
a natural settle-back on `onPointerLeave`), and applies via `style={{
rotateX, rotateY, transformPerspective: 800 }}` on a `motion.div`. When
`useCanAnimate()` reports motion is not safe/wanted (reduced motion, or
pre-mount), the pointer handlers are simply never attached and the wrapper
renders as an inert `<div>` — no tilt, no JS listeners, children render
exactly as passed. Used around: the hero and About-page `PhotoFrame`
instances, and each `OrgLogoGrid` card.

**Hero blob (`app/page.tsx`'s `ClayBlobBackdrop`)** — gets a subtle
scroll-linked parallax: `useScroll` (page-level `scrollY`) feeding
`useTransform` into a small vertical translate and scale range (e.g. the
blob drifts a few percent and scales slightly as the user scrolls past the
hero), applied only when `useCanAnimate()` allows it. This is scroll-linked,
not autonomous — it does nothing until the user scrolls, and is trivially
inert under reduced motion (the transform values simply aren't attached).

**`app/template.tsx`** — light polish only: add a subtle `scale: 0.98 → 1`
alongside the existing `opacity`/`y` on the animated branch. The delicate
`hasEnteredOnce`/SSR-safety logic that makes this component work at all is
**not** touched.

**`app/not-found.tsx`** — wrap the panel's content in `<Reveal>` for
consistency with every other route. Currently the only page with zero
entrance motion.

## Explicitly staying CSS-only (and why)

- **`Marquee`** — already an ideal pure CSS loop; nothing to gain from a JS
  engine for a continuous, non-interactive ticker.
- **`Header` / `Footer`**, and every `linkClass`/`navLinkClass`-styled link
  — these render on every single page and are zero-JS server components
  today. A hover/press scale or an arrow-nudge on the CTA links doesn't need
  Framer Motion — plain CSS `transition-transform` + `hover:scale-[1.03]` +
  `active:scale-95` (added directly to `lib/ui.ts`'s class strings) achieves
  the identical feel for zero JS cost and zero client-boundary conversion.
  Framer Motion is reserved for what CSS genuinely can't do well here:
  scroll-triggered reveal, orchestrated stagger, and pointer-following 3D
  tilt.
- **`components/StatCounter.tsx`** — see above; deliberately left alone.

## CSS cleanup (`app/globals.css`)

Once `Reveal` and `SplitText` move to Framer Motion, these become dead code
and are deleted outright (this repo's existing convention — see the clay
redesign spec's "Removed subsystem" section for precedent):

- `.reveal`, `@keyframes reveal-up`
- `.split-char`, `@keyframes split-char-up`
- `.reveal-scroll.is-pending`, `.reveal-scroll.is-visible`

Stays, unchanged:

- `.photo-frame` (+ its hover grayscale/zoom rules) — simple, cheap, purely
  CSS, no reason to touch it.
- `.link-sweep` — still used by `linkClass` (inline text CTAs).
- `.marquee-track`, `@keyframes marquee`, `.marquee-copy-2` — `Marquee`
  stays CSS.
- `@property --num`, `.stat-counter` — `StatCounter` stays CSS.

New, small CSS additions to `lib/ui.ts`'s `navLinkClass` (and `linkClass`
where relevant) for the hover/press scale described above — a few Tailwind
utility classes, not new CSS rules.

## Testing

- New `lib/__tests__/motion.test.ts` (or similar) covering `useCanAnimate`'s
  three branches directly: SSR/pre-mount (`false`/plain), `IntersectionObserver`
  unavailable (falls back to animate-safe/plain), and reduced-motion
  preferred (falls back to animate-safe/plain). This is the one place the
  tricky logic gets exhaustively tested.
- `Reveal.test.tsx`, `SplitText.test.tsx` — same assertions as today
  (children render, real text is present, `delayMs` affects timing) adapted
  to whatever DOM shape the Framer Motion rewrite produces; add a
  same-guarantee smoke test ("renders visible content with no motion
  props/opacity when `IntersectionObserver` is unavailable", mirroring
  today's existing test for the plain-`Reveal` case).
- `StatBand.test.tsx`, `OrgLogoGrid.test.tsx` — existing assertions (stat
  values/labels present; one card per org, no shader canvas) continue to
  hold regardless of the animation engine; add nothing new here beyond
  confirming they still pass against a client-component render.
- `app/__tests__/page.test.tsx`'s SSR composition test (`renderToStaticMarkup`
  must never contain baked `opacity:0`) is the ultimate backstop for the
  whole spec — every new/rewritten component is validated against it.
- Full verification gate at the end, same as any change to this repo:
  `npm run typecheck && npm run test && npm run build && npm run verify:export`,
  plus a manual reduced-motion and mobile-viewport pass in a real browser
  (tilt/parallax are pointer/scroll-driven and not meaningfully testable via
  jsdom).
