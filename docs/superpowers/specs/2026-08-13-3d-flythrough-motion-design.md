# vijayabhaskar.in — 3D Fly-Through Homepage & Motion System

Status: approved for planning
Date: 2026-08-13

## Background

The site currently uses a deliberate, hand-rolled CSS motion system
(`components/Reveal.tsx`, `.marquee-track`, `.link-sweep`, `.photo-frame`
zoom in `app/globals.css`) — no-JS/crawler-safe, `prefers-reduced-motion`
gated, and documented as such in code comments. It was built to this
project's existing design spec
(`docs/superpowers/specs/2026-08-13-personal-site-design.md`), which
explicitly rejected "generic AI-generated/template portfolio patterns."

The site owner asked for a step change inspired by
[dungyov.com](https://www.dungyov.com/), a WebGL/Three.js 3D portfolio with
a percentage loading screen and a scroll-driven camera "fly-through" of its
sections. After review of what that site actually is (full 3D experience,
not a text/CSS site) and two explicit rounds of confirmation, the owner
chose the full version: real 3D fly-through navigation, not a scoped
hero-only effect, with two hard requirements layered on top — full mobile
responsiveness, and smooth performance on low-end devices.

This spec resolves that requirement against the constraints the previous
spec established (real, single-source content; no-JS/crawler safety;
GitHub Pages static export) rather than treating them as obstacles to work
around.

## Goals

- A cinematic, scroll-driven 3D fly-through as the homepage's core
  interaction: percentage loader, kinetic name reveal, camera movement tied
  to scroll position — evoking dungyov.com's ceremony.
- Real, single-source content. Fly-through waypoints render actual page
  content (sourced from the same `content/*.ts` modules already feeding
  `/about`, `/experience`, `/contact`), not a duplicated copy maintained in
  two places.
- `/about`, `/experience`, `/contact` remain real, statically-exported,
  directly-linkable routes, unchanged in role — the fly-through introduces
  them from the home page; it does not replace them as the way to reach
  them. (Header/Footer nav is unaffected, so any page is reachable directly
  regardless of device tier or JS.)
- Full mobile responsiveness.
- A tiered rendering strategy so low-end/older devices get a fast, smooth
  experience — never a degraded, janky 3D one.
- New DOM motion (intro sequence, waypoint choreography) is built on
  Framer Motion, coordinated with the Three.js camera through one shared
  scroll-progress value. Existing, proven CSS motion is left in place
  rather than rewritten for its own sake (see Migration below).
- Every current guarantee holds: content fully visible without JS
  (progressive enhancement), `prefers-reduced-motion` respected, static
  export (`output: 'export'`) unchanged, and `scripts/verify-export.mjs`
  (required facts, forbidden strings, per-route `index.html`, design
  tokens in compiled CSS) continues to pass unmodified.

## Non-goals

- Not replacing Header/Footer global navigation with 3D. Standard DOM nav
  stays as the always-available way to reach any page.
- Not a custom 3D asset pipeline (modeled meshes, textures, sculpted
  scenes). The scene is abstract/procedural geometry (wireframe/particle
  forms), not bespoke 3D art — keeps scope and long-term maintenance
  realistic for a single-owner site.
- No orbit/drag camera controls. The camera path is authored and driven
  only by scroll, so there is nothing to fiddle with on a touch device.
- No CMS or backend change. Architecture stays static-export, content in
  typed local modules under `content/`.

## Content & UX design

Home page becomes one continuous scroll experience:

```
[Intro overlay] → [Hero, existing content] → [About waypoint]
→ [Experience waypoint] → [Contact waypoint] → [Footer]
```

**Intro overlay.** Fixed, full-viewport, client-only. Percentage counter
(driven by real font/critical-asset readiness, capped at ~1.5s so it never
blocks on a stalled asset), kinetic reveal of `site.shortName`, a "scroll to
begin" cue. Skippable by scroll or click at any time. Shown once per
browser session (`sessionStorage` flag) — a recruiter clicking back to `/`
mid-visit shouldn't have to sit through it twice. Never mounted at all for
`prefers-reduced-motion`, the Static tier, or a repeat-session visit.

**Waypoints.** Each of the three (About/Experience/Contact) is a camera
position + a content panel that fades/scales into view over its scroll
range, rendering a condensed preview sourced from the same typed content
already used on the full page (e.g. the About waypoint reuses
`site.description`/`site.tagline`; the Experience waypoint reuses a couple
of `employment`/`credentials` entries; the Contact waypoint reuses
`social`) plus a "View full →" link to the real route — the same
preview-then-link pattern the current homepage nav list already uses
(`app/page.tsx`), just staged along camera position instead of a flat list.
No new content is invented; nothing is copy-pasted into a second, divergent
location — the preview and the full page read from the same source.

**Camera.** Authored keyframes (position + lookAt) at each waypoint,
interpolated by scroll progress (`useScroll` over the page height, 0→1).
Not physics-based, no orbit controls — this is what keeps it controllable
and calm on a touch screen.

## Architecture

### New dependencies

`three`, `@react-three/fiber`, `@react-three/drei` (3D rendering);
`framer-motion` (DOM motion, replacing the hand-rolled CSS reveal system
where noted below).

### New modules (files refined during implementation planning)

- `components/motion/deviceTier.ts` — pure function(s): WebGL2 support
  check, `navigator.deviceMemory`/`navigator.hardwareConcurrency` where
  available, a short rAF-based frame-time probe. Returns
  `"full" | "reduced" | "static"`. Kept pure/synchronous enough to be
  unit-tested in jsdom by mocking `navigator` and the WebGL context.
- `components/motion/SceneCanvas.tsx` — `"use client"`, loaded via
  `next/dynamic(..., { ssr: false })` **only** when tier is `full` or
  `reduced` (Static tier never downloads the Three.js bundle at all).
  Wraps `@react-three/fiber`'s `<Canvas frameloop="demand">`; paused via
  `IntersectionObserver`/`visibilitychange` when off-screen or the tab is
  hidden.
- `components/motion/FlyPath.tsx` — the camera keyframe rig, driven by the
  shared scroll-progress value.
- `components/motion/IntroOverlay.tsx` — the intro sequence described
  above, Framer Motion driven, `sessionStorage`-gated.
- `components/motion/Waypoint.tsx` — Framer Motion wrapper that positions a
  real content panel within a scroll range; used on the home page only.
- `app/page.tsx` — restructured to compose Intro + hero + waypoints. Still
  fully server-rendered static HTML; the canvas/intro are client-only
  layers on top, not a replacement for the underlying markup.

### Migration of the existing CSS motion system

- `Reveal`, `.link-sweep`, `.marquee-track`, `.photo-frame` zoom — **stay
  exactly as they are.** They're proven, tested, and load-bearing for the
  no-JS/crawler-visible guarantee. (Framer Motion's `whileInView`/`animate`
  bakes its target value into the very first render — including the
  server-rendered, no-JS HTML — so a naive migration of `Reveal` would
  ship `opacity: 0` as static markup and permanently hide content for
  anyone without working JS. Reproducing today's safe behavior in Framer
  Motion is possible but requires the same two-phase
  mount-then-observe dance the current implementation already does
  correctly in plain CSS, for zero user-visible gain.) Framer Motion is
  used only for genuinely new motion that has no existing implementation
  to put at risk: the intro sequence, waypoint content choreography, and
  camera path. `about/page.tsx`, `experience/page.tsx`, `contact/page.tsx`,
  `Header`, `Footer` are unaffected by this project.

### Progressive enhancement contract (re-verified, not weakened)

- Server-rendered HTML for `/`, `/about`, `/experience`, `/contact`
  contains full real content, unconditionally present in the DOM — this is
  what `scripts/verify-export.mjs` already checks today. `IntroOverlay` and
  `SceneCanvas` are strictly additive client components: if JS never runs,
  they never mount, and nothing they would have shown is hidden-until-JS
  content.
- `prefers-reduced-motion: reduce` forces the Static tier: no intro, no
  camera movement, every waypoint's content shown in place. This extends
  today's `reveal-scroll` reduced-motion contract rather than replacing it.

## Performance & device tiering

On mount, a synchronous-as-possible check sorts the visitor into a tier
before any 3D code is fetched:

| Tier | Trigger | Behavior |
|---|---|---|
| **Full** | WebGL2 present, no low-end signal, FPS probe healthy | Full particle/wireframe scene, camera fly, DPR capped at 2 |
| **Reduced** | WebGL present but a low-end signal (mobile UA, `deviceMemory`/`hardwareConcurrency` low, or borderline FPS probe) | Simplified geometry, DPR capped at 1, `frameloop="demand"` (redraw only on scroll, not a continuous 60fps loop) |
| **Static** | No WebGL2, `prefers-reduced-motion`, or a failing FPS probe | **Three.js is never downloaded** — `SceneCanvas` simply isn't mounted |

The tier only ever gates the Three.js/WebGL canvas. Waypoint content
motion (fade/scale into place as the user scrolls) is driven by Framer
Motion's `useTransform` against scroll progress on every tier, including
Static — that's a cheap, GPU-accelerated `opacity`/`transform` animation,
not a rendering cost worth tiering separately. This also means there's
only one waypoint-motion implementation to build and maintain, not a
parallel CSS system.

Additional measures: canvas rendering pauses via `IntersectionObserver`
(off-screen) and `visibilitychange` (tab hidden); the FPS probe runs for
under a second during the intro so a bad result downgrades the tier before
any heavy asset loads; touch scroll drives the camera directly (no
drag/orbit controls to tune for touch).

## Testing

- `deviceTier.ts` tier-decision logic: pure-function unit tests (mocked
  `navigator`, WebGL context, frame timing) — the one part of the 3D system
  that's meaningfully unit-testable under Vitest/jsdom.
- `IntroOverlay`, `Waypoint`: component tests following the existing
  `Reveal.test.tsx`/`Marquee.test.tsx` pattern — content present and
  accessible regardless of tier, `sessionStorage` gating behaves,
  `prefers-reduced-motion` skips the intro.
- `SceneCanvas`/`FlyPath` are not unit-tested — jsdom has no WebGL context.
  Verified manually: `npm run dev` + Playwright screenshots at desktop and
  mobile viewports, plus one CPU-throttled ("low-end") pass, called out
  explicitly as manual verification rather than silently skipped.
- `npm run build && npm run verify:export` must continue to pass
  unmodified — the hard guarantee this whole project is designed around.
- A throttled Lighthouse mobile pass on `/`, before/after, to confirm the
  tiering strategy is actually preventing the regression it exists to
  prevent.

## Deployment

No change to the GitHub Pages / Actions pipeline — same static export,
same `.github/workflows/deploy.yml`.
