# vijayabhaskar.in — Site-wide 3D Fly-Through & Scroll Progress

Status: approved for planning
Date: 2026-09-02

## Background

The site owner asked to bring back a scroll-driven 3D "fly-through" — like
[dungyov.com](https://www.dungyov.com/) — across the **whole** site, with a
scroll progress bar throughout.

This is a deliberate reversal of an earlier decision, made with the history
on the table:

- Aug 13–14, 2026: a homepage 3D fly-through was built and shipped
  (`docs/superpowers/specs/2026-08-13-3d-flythrough-motion-design.md` +
  `2026-08-14-awwwards-motion-upgrade-design.md`) — Three.js +
  `@react-three/fiber` + `@react-three/drei`, a percentage intro overlay,
  scroll-driven camera keyframes, About/Experience/Contact "waypoints",
  device tiering, a WebGL org-logo shader.
- Aug 19, 2026: the claymorphism redesign
  (`docs/superpowers/specs/2026-08-19-clay-redesign-design.md`) *explicitly
  retired* all of it — scene canvas, camera keyframes, intro overlay, grain,
  and the scroll-pinned track — replacing the 3D hero with a flat clay
  illustration. Commit `f0dc81d` deleted ~1,550 lines of WebGL subsystem.
- Since then: Lenis smooth scroll, the Framer Motion "v3" motion primitives,
  and a light/dark theme toggle were all built *around* not having a 3D
  scene.

The owner has confirmed (three rounds of clarifying questions) that they
want to reverse course: a 3D fly-through on **every** route, not just the
homepage — accepting the costs below.

## Decisions confirmed with site owner

| Question | Decision |
|---|---|
| Scope | Fly-through 3D scene + scroll-driven camera on **every** route (`/`, `/about`, `/experience`, `/contact`, 404), plus a site-wide scroll progress bar. |
| SEO / no-JS posture | **3D-first, SEO secondary.** The original "90+ Lighthouse on all four categories" goal is relaxed for **Performance** only. Real text content still ships in the static HTML (it powers the fallback tiers and keeps `verify-export` green — a free byproduct, not the goal). |
| Aesthetic | **Keep the warm clay palette** — cream / terracotta / teal / pink / lavender — rendered as soft 3D forms. Not a dark "space" scene. One lighting setup. |
| Device support | **Full tiering** (`full` / `reduced` / `static`), same three-tier model as the retired system. The `static` tier never downloads Three.js. |
| Ceremony | **Scroll progress bar only.** No percentage-loader intro, no animated waypoint labels, no camera-flies-between-pages navigation. |
| Dark mode | **Removed entirely** — toggle, bootstrap script, dark tokens, `AmbientColorDrift`. |
| Scene contents | **Procedural soft forms** — abstract floating clay blobs, rounded shapes, soft particles, and content panels, generated in code. No modeled 3D assets, no asset pipeline. |
| Scene continuity | A **distinct scene per route** that crossfades on navigation (not one shared cloud lit differently). |
| Camera feel | **Calm, eased drift** — appropriate to the clay material — not fast/kinetic. |

## Goals

- A scroll-driven 3D camera fly-through on every route, rendered in the
  existing clay palette as procedural soft geometry.
- One persistent `<Canvas>` for the whole site (Approach A, below) so
  route changes crossfade the scene rather than tearing down and
  rebuilding the WebGL context.
- A persistent scroll progress bar reflecting progress through the current
  route.
- Real, single-source content: every route still server-renders its actual
  copy from `content/*.ts`; on the 3D tiers those same sections become
  scroll-pinned panels floating over the scene.
- Full device tiering so low-end/older devices get a fast experience —
  simplified 3D or a CSS-only fly-through, never a janky WebGL one.
- Every hard guarantee that isn't explicitly relaxed above still holds:
  content present without JS, `prefers-reduced-motion` respected, static
  export (`output: "export"`) unchanged, `scripts/verify-export.mjs`
  passes unmodified, GitHub Pages pipeline unchanged.

## Non-goals

- No percentage-loader intro overlay, no animated section labels, no
  camera-driven page-to-page navigation. Header/Footer DOM nav stays the
  way any route is reached; routes remain independent, directly linkable,
  statically exported.
- No custom 3D asset pipeline (modeled meshes, sculpted scenes). Geometry
  is abstract/procedural.
- No orbit/drag camera controls. The camera path is authored and driven
  only by scroll.
- No light/dark theme (removed). No new pages/routes. No content changes.
- No CMS or hosting change. Architecture stays static-export, content in
  typed local modules.

## Architecture

### Approach A — one persistent canvas in the layout

A single `<Canvas>` is mounted once in `app/layout.tsx` and survives route
changes. Each route contributes its own scene graph + camera keyframes; the
active route's scene crossfades in on navigation. The alternative
(independent `<Canvas>` per page) was rejected: it rebuilds the WebGL
context on every navigation (~150–300 ms hitch, and browsers cap the number
of live contexts) and still requires the tiering/progress logic to be
shared anyway.

Because the build is a static export, everything after first paint is
client-side already, so a layout-level persistent canvas carries no SSR
cost.

### New dependencies

`three`, `@react-three/fiber`, `@react-three/drei`; `@types/three` (dev).
All were present before and removed in `f0dc81d`.

### New modules (names may be refined during plan writing)

- `lib/scene.tsx` — React context (`SceneProvider`, mounted in the root
  layout) exposing: the resolved **device tier**, and a shared
  `scrollYProgress` MotionValue for the current route. One source of truth
  that both the camera rig and the progress bar read.
- `components/motion/deviceTier.ts` — expanded from today's one-line
  `prefersReducedMotion()` back to full tier detection (revive from git
  history, commit `1c83291`): WebGL2 support check,
  `navigator.deviceMemory` / `navigator.hardwareConcurrency` where
  available, a sub-second rAF frame-time probe. Returns
  `"full" | "reduced" | "static"`. Pure/synchronous enough to unit-test in
  jsdom by mocking `navigator` and the WebGL context.
- `components/three/SceneCanvas.tsx` — `"use client"`, loaded via
  `next/dynamic(..., { ssr: false })` **only** when tier is `full` or
  `reduced` (`static` never downloads the Three.js bundle). Wraps
  `@react-three/fiber`'s `<Canvas frameloop="demand">`; DPR capped per
  tier; rendering paused via `IntersectionObserver` (off-screen) and
  `visibilitychange` (tab hidden).
- `components/three/ClayField.tsx` — the procedural soft-form scene:
  instanced rounded geometry + soft particle field, clay-palette materials,
  parameterised by a per-route seed/variant so each route's scene looks
  distinct.
- `components/three/FlyPath.tsx` — the camera rig. Reads the shared
  `scrollYProgress`, interpolates the active route's authored keyframes
  (position + lookAt) through the shared `EASE` curve.
- `components/three/routeScenes.ts` — per-route config keyed by normalized
  pathname: camera keyframes + `ClayField` variant. The 404 route maps to a
  keyframe-less "drift" entry.
- `components/three/SceneController.tsx` — bridges the Next `usePathname()`
  value to the active `routeScenes` entry and drives the crossfade between
  the outgoing and incoming scene on navigation.
- `components/three/Waypoint.tsx` — revive from git history: a Framer
  Motion wrapper that pins a real DOM content panel within a scroll range,
  fading/scaling it over the scene. Used on the `full`/`reduced` tiers.
- `components/three/CssFlythroughFallback.tsx` — the `static`-tier
  presentation: a depth/translate CSS-parallax variant of the existing
  scroll-reveal pattern, fully contained in the
  `prefers-reduced-motion: no-preference` block. No WebGL, no Framer camera.
- `components/motion/ScrollProgressBar.tsx` — fixed thin bar at the top of
  the viewport. `scaleX` bound to the shared `scrollYProgress`;
  spring-smoothed on the `full` tier, direct on `reduced`/`static`.
  Rendered on every tier; self-hides when the current route isn't
  scrollable. `aria-hidden` (decorative — native scrollbar remains the
  accessible affordance).

### Per-route camera paths

Each path is a small set of authored keyframes (camera position + lookAt),
interpolated by that route's scroll progress 0 → 1. Calm easing, no
turning sharper than a gentle bank.

| Route | Path | Keyframes |
|---|---|---|
| `/` | Fly in from far away, past a few floating clay forms, **settle on the hero** (name + portrait panel), then drift upward past the remaining homepage sections as waypoints (org marquee, stat/affiliations band, and the About/Experience/Contact preview panels). | 3 anchor keyframes, one waypoint per section |
| `/about` | Slow, calm **forward push** through soft forms while the bio panel holds screen-centre and parallaxes slightly. Almost no turn — reads as "moving deeper in". | 2 |
| `/experience` | The literal one: camera **travels along the timeline**, each employment / credential / education entry a waypoint panel on alternating sides, camera banks toward each as it passes. | 1 per entry (~7) |
| `/contact` | Short, gentle **approach to a single panel** (email link + social icons) that grows to fill centre as the short page bottoms out. | 2 |
| 404 | Tiny drifting scene, no waypoints. | 0 (idle drift) |

### Migration of existing code

**Removed** (dark mode + now-dead ambient layer):

- `components/ThemeToggle.tsx` (+ test), `lib/theme.ts`,
  `lib/themeBootstrap.ts`, the `theme-bootstrap` `<Script>` and
  `suppressHydrationWarning` in `app/layout.tsx`.
- `components/motion/AmbientColorDrift.tsx` (+ test) and its
  `<AmbientColorDrift />` mount in `app/page.tsx` — the 3D scene is now the
  page backdrop.
- Dark-theme tokens in `app/globals.css` and `tailwind.config.ts`
  (`:root[data-theme="dark"]` block, dark palette values); any `useTheme()`
  consumers.

**Changed:**

- `app/layout.tsx` — add `<SceneProvider>`, `<SceneCanvas>` (dynamic),
  `<SceneController>`, `<ScrollProgressBar>`. Remove the theme script.
- `app/page.tsx`, `app/about/page.tsx`, `app/experience/page.tsx`,
  `app/contact/page.tsx`, `app/not-found.tsx` — wrap content sections in
  `<Waypoint>` (3D tiers) / `<CssFlythroughFallback>` (static tier); keep
  every piece of content. Each declares its `routeScenes` id.
- `components/HomeHero.tsx` — drop the `ClayBlobBackdrop` SVG (the real 3D
  scene replaces it). Hero DOM content becomes the first waypoint; pointer
  parallax on the text/photo may stay.
- `components/Header.tsx` — remove the `<ThemeToggle />` slot.

**Kept as-is:**

- Lenis smooth scroll (`components/SmoothScroll.tsx`) — the camera reads
  the same native scroll position Lenis writes each frame, so they stay in
  sync with no changes.
- The DOM motion primitives — `Reveal`, `LineReveal`, `SplitText`,
  `Magnetic`, `Tilt`, `Spotlight`, `Marquee` — for panel content.
- `app/template.tsx` route-enter transition.

### Progressive-enhancement contract

- Server-rendered HTML for every route contains the full real content,
  unconditionally in the DOM — exactly what `verify-export` checks today.
  `SceneCanvas` and `Waypoint` motion are strictly additive client layers;
  if JS never runs, nothing they would have shown is hidden.
- `prefers-reduced-motion: reduce` forces the `static` tier: no canvas, no
  camera, every panel shown in place, progress bar rendered without
  spring smoothing.
- `verify-export.mjs` runs **unmodified** and must pass.

## Performance & device tiering

On mount, before any 3D code is fetched, the visitor is sorted into a tier:

| Tier | Trigger | Behaviour |
|---|---|---|
| **Full** | WebGL2 present, no low-end signal, frame probe healthy | Full `ClayField` + particle field, camera fly, DPR capped at 2, spring-smoothed progress bar |
| **Reduced** | WebGL present but a low-end signal (mobile UA, low `deviceMemory`/`hardwareConcurrency`, borderline probe) | Simplified geometry, fewer/no particles, DPR capped at 1, `frameloop="demand"` (redraw on scroll only), direct progress bar |
| **Static** | No WebGL2, `prefers-reduced-motion`, or a failing probe | **Three.js never downloaded.** `CssFlythroughFallback` — CSS depth/translate parallax variant of the existing reveal pattern |

Additional: canvas pauses via `IntersectionObserver` + `visibilitychange`;
the frame probe runs during first render for < 1 s so a bad result
downgrades the tier before heavy assets load; instanced geometry keeps draw
calls low; touch scroll drives the camera directly (no controls to tune).

## SEO impact (accepted)

- **Performance** Lighthouse score will drop on the 3D tiers due to the
  Three.js bundle (~500–700 KB gzipped for three + fiber + drei). Accepted
  per the owner's "3D-first" decision. Mitigations: `static` tier ships
  zero 3D JS; the bundle is dynamically imported after tier resolution and
  not render-blocking; DPR/quality caps.
- **Accessibility, Best Practices, SEO** categories should stay ≥ 90.
  Retained unchanged: semantic HTML, per-route `<title>`/meta, JSON-LD
  `Person`, Open Graph/Twitter tags, `sitemap.xml`, `robots.txt`,
  self-hosted fonts.
- The reference site ranks on its owner's name, not on keywords — same
  expectation here.

## Testing

- `deviceTier.ts` tier-decision logic — pure-function unit tests (mocked
  `navigator`, WebGL context, frame timing).
- `ScrollProgressBar` — component test: `scaleX` tracks progress,
  reduced-motion path, self-hide when route not scrollable.
- `Waypoint`, `CssFlythroughFallback` — component tests on the existing
  `Reveal.test.tsx` pattern: content present and accessible in every tier;
  `prefers-reduced-motion` forces the in-place render.
- `SceneCanvas` / `FlyPath` / `ClayField` — not unit-tested (jsdom has no
  WebGL). Verified manually: `npm run dev` + Playwright screenshots at
  desktop and mobile viewports, plus one CPU-throttled ("low-end") pass,
  called out explicitly as manual verification.
- `npm test` (Vitest) green — tests for deleted components removed.
- `npm run build && npm run verify:export` passes **unmodified** — the hard
  guarantee this project is built around.
- A throttled Lighthouse mobile pass on each route, before/after, to
  confirm the tiering keeps the `static`-tier experience fast and to
  record the accepted `full`-tier Performance delta.

## Deployment

No change to the GitHub Pages / Actions pipeline — same static export, same
`.github/workflows/deploy.yml`, same `public/CNAME`.

## Suggested decomposition (for plan writing)

Large but coherent; likely three implementation plans:

1. **Scene infrastructure + homepage** — `deviceTier` expansion,
   `SceneProvider`/context, `SceneCanvas` + `ClayField` + `FlyPath`,
   `ScrollProgressBar`, `Waypoint`, `CssFlythroughFallback`; wire the
   homepage and its camera path.
2. **Roll-out** — `/about`, `/experience`, `/contact`, 404 camera paths and
   waypoint wrapping.
3. **Dark-mode removal + cleanup** — delete `ThemeToggle`, `theme.ts`,
   `themeBootstrap.ts`, `AmbientColorDrift`, dark tokens and their tests;
   simplify `layout.tsx` and `Header.tsx`.
