# Framer Motion Upgrade (v3) — Signature Motion Craft

Status: approved for planning
Date: 2026-08-19

## Background

The site's motion has gone through several swings: a Three.js scroll-pinned
"flythrough" with grain and a custom cursor
(`2026-08-13-3d-flythrough-motion-design.md`,
`2026-08-14-awwwards-motion-upgrade-design.md`), torn out entirely and
replaced with a soft, light "claymorphism" visual system
(`2026-08-19-clay-redesign-design.md`), then given a first Framer Motion
pass (`2026-08-19-motion-upgrade-v2-design.md`) that was deliberately
conservative: fade-ups, character-stagger text, a pointer-tilt wrapper —
tasteful but, per the site owner, still reading as basic.

This spec is the third motion pass. The owner wants the site to feel like
one of the most rewarding, distinctive personal sites they could land on —
not by re-litigating the visual identity (the clay palette/type/shadow
system stays exactly as-is) and not by resurrecting WebGL or scroll-hijacking
(both were explicitly rejected before), but by going meaningfully deeper on
what Framer Motion + native scroll can do: real scroll choreography and
considered interaction craft, concentrated on the homepage as the showcase.

## Decisions confirmed with site owner

- **Visual identity unchanged.** Clay palette, type scale, shadow system,
  rounding — none of it changes. This is a motion-layer upgrade only.
- **No WebGL, no scroll-hijacking/pinning of the whole page.** The page
  always scrolls natively under the user's control. `position: sticky` and
  scroll-linked transforms are fine; a fixed full-viewport canvas that owns
  scroll is not.
- **No new npm dependencies.** Framer Motion (already installed) and native
  CSS/JS only — no smooth-scroll library, no GSAP.
- **Homepage is the showcase.** It gets the full scroll-choreography
  treatment. About/Experience/Contact/404 get the sitewide
  interaction-craft layer (spotlight, magnetic links) plus their existing
  v2 `Reveal`/`Tilt`/stagger treatment, but no homepage-only techniques
  (parallax layers, scroll-color-drift, scroll-exit).
- **`Header` becomes a client component.** v2 explicitly kept `Header`/
  `Footer` as zero-JS server components. This spec deliberately overrides
  that for `Header` only, to support the morphing active-nav indicator —
  accepted trade-off, see Risks. `Footer` stays zero-JS/server-rendered;
  nothing in this spec touches it.
- **Every new effect renders through `useCanAnimate()`** (or, for the two
  effects noted below that are pure hover-state CSS, through the existing
  unconditional/`motion-safe:` split already used by `.photo-frame` and
  `navLinkClass`) — same SSR/reduced-motion contract as v2, no exceptions.

## Goals

- Make the homepage read as genuinely crafted: scroll-linked depth and
  motion, not just entrance fades.
- Give every page a layer of considered interaction detail (spotlight
  hover, magnetic links, morphing nav indicator) that a templated site
  wouldn't have.
- Keep the site static-exportable, fast, accessible, and fully inert under
  `prefers-reduced-motion` and pre-hydration — these constraints are not up
  for negotiation even in service of "impressive."

## Non-goals

- No new content, sections, routes, or copy. The site's hard "verified
  facts only" constraint stands; nothing here invents content to give the
  motion more to work with.
- No change to `Marquee`, `StatCounter`'s counting mechanism, or `Footer`.
- No new npm dependencies (see Decisions).

## Motion system

### 1. Homepage hero — cursor-reactive depth + scroll exit

`HomeHero` (built in v2) gains two new behaviors, both gated behind
`useCanAnimate()` exactly like its existing stagger entrance:

- **Pointer parallax layers.** A single `pointermove` listener on the hero
  section drives one spring-damped pair of motion values (x, y offset from
  center, clamped small). The clay blob backdrop, the heading, and the
  photo each apply that same pair through a different multiplier (e.g.
  blob furthest/most movement since it's decorative, heading least since
  it's the primary content, photo in between) — real depth, not one thing
  sliding under a static scene. Reuses the spring config already
  established in `Tilt`.
- **Scroll exit.** The whole hero content stack (pill, heading,
  description/photo — not the blob, which keeps its existing v2 scroll
  parallax) is wrapped in one `useScroll({ target: heroRef, offset:
  ["start start", "end start"] })` transform: as the user scrolls the hero
  out of view, content translates upward slightly faster than native
  scroll and fades/scales down a touch. This is what makes the hero feel
  directed rather than merely present — the page still scrolls at the
  user's own pace throughout.

### 2. Homepage — line-mask heading reveal

The hero's `site.name` heading switches from `SplitText`'s per-character
stagger to a new `LineReveal` component: each line sits in an
`overflow-hidden` mask and wipes into view via `clip-path`/`translateY`
rather than character-by-character. This reads as more considered at
hero scale; `SplitText`'s character mode is kept as-is and stays in use on
the About page subheading, where the smaller scale suits it. Same
`aria-label`-on-wrapper / `aria-hidden`-on-pieces accessibility pattern as
`SplitText`.

### 3. Homepage — ambient section color drift

A fixed, full-bleed color layer sits behind the homepage content (below
everything, `-z-30`), built from one stacked `motion.div` per accent color
already in use (amber/pink/teal/lavender). Each layer's opacity is driven
by its own section's scroll-into-view progress (`useScroll` with `target`
on that section's ref), so the ambient background tint anticipates and
follows whichever section is actually in view instead of hard-cutting at
each panel boundary. Purely decorative and `aria-hidden`; under
`useCanAnimate() === false` it renders as nothing (the existing cream body
background shows through, exactly like today).

### 4. Sitewide — spotlight hover on cards

`OrgLogoGrid` cards and `StatBand` tiles get a new `Spotlight` wrapper: a
`pointermove` handler updates two CSS custom properties (`--spot-x`,
`--spot-y`) on the card, and a `radial-gradient` positioned by those
variables provides a soft glow that tracks the cursor. This is a
cursor-position-driven visual, not motion in the vestibular-trigger sense
(no autoplay, no parallax) — like the existing unconditional
grayscale-to-color `.photo-frame:hover` treatment, it runs unconditionally;
only the `Tilt` rotation these cards already have (v2) stays gated behind
`useCanAnimate()`.

### 5. Sitewide — magnetic links

A new `Magnetic` wrapper (same spring primitive as `Tilt`) applies to nav
links, footer/contact social links, and the homepage `ArrowLink` CTAs: on
pointer proximity within the element's own bounds, it nudges a few pixels
toward the cursor and springs back on leave. Gated behind
`useCanAnimate()`, same plain-wrapper fallback pattern as every other v2/v3
component.

### 6. Header — morphing active-nav indicator

`Header` becomes a client component using `usePathname()` and a Framer
Motion `layoutId` shared background behind the active nav pill, which
slides/morphs to the new position on navigation instead of each pill
independently toggling its own background. Falls back to the current
static active-state styling when `useCanAnimate()` is false (including
during SSR), so the no-JS/crawler markup is unaffected — only the
transition animation between states requires client JS.

## New components

| Component | File | Purpose |
|---|---|---|
| `LineReveal` | `components/motion/LineReveal.tsx` | Clip-path line-mask text reveal (hero heading) |
| `Spotlight` | `components/motion/Spotlight.tsx` | Cursor-tracking radial glow wrapper (cards) |
| `Magnetic` | `components/motion/Magnetic.tsx` | Cursor-proximity nudge wrapper (links/pills) |
| `AmbientColorDrift` | `components/motion/AmbientColorDrift.tsx` | Homepage-only scroll-linked background tint layer |

`HomeHero.tsx` and `Header.tsx` are modified, not replaced.

## Accessibility & performance guardrails

- Every new component follows the established two-branch shape: plain,
  fully-visible/inert render when `useCanAnimate()` is false (server,
  pre-hydration, `IntersectionObserver`-less environments, reduced motion);
  real motion only once mounted and confirmed safe.
- `Spotlight`'s glow is the one unconditional exception (see §4), matching
  the existing `.photo-frame` precedent — it carries no motion, only a
  cursor-tracked static gradient position.
- Pointer listeners are attached at a container level (one per hero, one
  per card), not globally, and use the same spring/`requestAnimationFrame`
  machinery Framer Motion already provides — no new polling loops.
- `AmbientColorDrift` uses independent `useScroll` calls scoped to each
  section's own `ref` (not the whole document), so each only recomputes
  while its own section is near the viewport.
- The homepage SSR test
  (`app/__tests__/page.test.tsx` — no baked `opacity:0` anywhere in the
  full composition) and the reduced-motion contract are the two hard gates
  this spec must not regress, exactly as in v2.

## Testing strategy

Each new component gets the same test shape already established for
`Tilt`/`Reveal`/`SplitText`: renders children; plain/inert branch has no
motion styles and no listeners when `IntersectionObserver` is unavailable;
animated branch is reachable and doesn't throw once `IntersectionObserver`
is stubbed in. `Header`'s existing nav-link test is extended to cover the
new client-component version rendering the same links/hrefs. The full
suite, typecheck, build, and `verify:export` all re-run at the end exactly
as in v2's Task 10 gate.

## Risks / trade-offs (accepted)

- **`Header` as a client component** adds it to the client JS bundle on
  every route (previously zero-JS). Accepted because the morphing
  indicator is a small, deliberate piece of sitewide polish and `Header`'s
  own markup is tiny; `Footer` stays server-rendered so not all site chrome
  pays this cost.
- **`AmbientColorDrift`'s multiple `useScroll` instances** are more moving
  parts than anything in v2. Scoped per-section (not document-wide) to
  keep each cheap; if real-device testing in Task-10-equivalent QA shows
  jank, the fallback is to simplify to a single document-scroll-driven
  interpolation instead of per-section crossfade layers — noted here so
  the implementation plan can treat that as an acceptable in-scope
  simplification, not a spec violation.
