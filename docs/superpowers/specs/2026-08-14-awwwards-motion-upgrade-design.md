# vijayabhaskar.in — Awwwards-Reference Motion Upgrade

Status: approved for planning
Date: 2026-08-14

## Background

The site owner recorded a screen capture of a reference portfolio site
(dark/starfield theme, kinetic name intro, morphing stat counters, a
scroll-pinned crossfading "Let's Talk" section, and an orbiting client-logo
cloud) and asked for that level of smoothness and ceremony on
vijayabhaskar.in. The recording was pushed directly to `main` via GitHub's
web UI (`Recording 2026-08-14 133739.mp4`) and analyzed frame-by-frame
(ffmpeg contact sheets) rather than guessed at.

The site already carries most of the DNA this ask requires, built to
`docs/superpowers/specs/2026-08-13-3d-flythrough-motion-design.md`: a
`Flythrough` 3D particle field standing in for a starfield, `SplitText`
kinetic type, `Waypoint` scroll-fades driven by one shared
`scrollYProgress`, a single `cubic-bezier(0.16, 1, 0.3, 1)` ease used
everywhere, and full `prefers-reduced-motion`/device-tier discipline. This
spec is an upgrade of those existing pieces, not a parallel system — and
it deliberately does not import the reference's literal content (it is a
design-agency case-study site; this is a board member/entrepreneur site).
Two pieces needed an explicit content-mapping decision from the owner
before design, resolved as noted per-section below.

## Goals

- Kinetic zoom on the intro name reveal, matching the reference's
  whoosh-in rather than a plain fade.
- Numeric stats (`content/site.ts`'s `stats`) count up into view on scroll
  instead of appearing statically.
- The credentials/affiliations logo set (`OrgLogoGrid`) moves along an
  orbiting path instead of sitting in a static grid.
- The homepage's Experience waypoint becomes a numbered, thumbnailed
  mini-list (real `employment`/`credentials`/`education` entries, not
  invented case studies) — the closest real analog to the reference's
  numbered project list.
- The homepage's Contact waypoint becomes a pinned block that crossfades a
  short sequence of the owner's own lines (`site.tagline`, `site.jobTitle`,
  a headline employment entry) before landing on the existing mailto/social
  content — the closest analog to the reference's pinned "LET'S TALK"
  section.
- Every new/changed piece keeps the two guarantees everything else on the
  site already keeps: content visible with no JS, and zero scroll-linked
  or looping motion under `prefers-reduced-motion`.

## Non-goals

- No new dependencies. Everything below is plain CSS (including CSS
  `@property`/`offset-path`, both supported in current evergreen browsers)
  or the `framer-motion` already in `package.json`. No GSAP, no Lenis, no
  scroll library swap.
- No fabricated content: no invented case studies, client logos, or quote
  copy. Every new line of copy traces back to `content/site.ts` or
  `content/experience.ts`.
- No change to `/about`, `/experience`, `/contact` as standalone routes —
  same non-goal the prior fly-through spec already established; this
  upgrade only touches the homepage's `Flythrough` composition and the
  shared `OrgLogoGrid`/`StatBand` components it (and other pages) use.
- No change to the device-tiering thresholds in `deviceTier.ts` or to the
  3D camera fly-path itself (`FlyPath.tsx`) — only `SceneCanvas`'s particle
  field gets minor visual tuning (count/color/opacity), not new logic.

## Design

### 1. Kinetic zoom intro — `components/motion/IntroOverlay.tsx`

The name (`site.shortName`) currently animates `opacity: 0→1, y: 20→0`
over 0.6s. Add `scale: 1.6→1` to the same `initial`/`animate` pair, same
`[0.16, 1, 0.3, 1]` ease, same duration — one Framer Motion prop change,
no new component, no behavior change to the percent counter or dismissal
logic.

### 2. Stat counters — new `components/StatCounter.tsx`, used by `StatBand.tsx`

Each `StatEntry` in `content/site.ts` is checked for a purely numeric
`value` (`/^\d+$/`). Non-numeric values (`"HYD"`, and any future
non-numeric stat) render exactly as today — plain text, no animation
attempted on something that isn't a count.

For numeric entries, `StatCounter` wraps the value in a small
`IntersectionObserver` (same `threshold`/`rootMargin` as `Reveal`) that,
the first time the element scrolls into view, sets a `--num` inline style
to the target integer. A CSS rule registers `--num` via `@property` as an
animatable `<integer>` and renders it through `counter-reset`/`content:
counter(...)`, with a `transition` on `--num` gated inside the site's
existing `@media (prefers-reduced-motion: no-preference)` block — so a
reduced-motion visitor's inline style still sets the final value, it just
never animates there, matching `Reveal`'s existing split between "JS
decides *when*, CSS decides *whether it moves*."  No animation frame loop,
no new runtime dependency — consistent with the rest of the site's
"JS flips a class/property, CSS owns the motion" convention.

`StatBand.tsx` changes only to route each numeric value through
`StatCounter` instead of rendering it directly; layout is unchanged.

### 3. Orbiting logo cloud — `components/OrgLogoGrid.tsx`

Same DOM as today (real `<img>`/monogram `OrgMark`s in document order —
nothing changes for screen readers or tab order), restyled: each item gets
a CSS `offset-path` (ellipse) with a per-item `animation-delay` spreading
the ~8 orgs evenly around it, so they read as one continuous slow orbit.
Opacity/scale are keyframed against the same animation (dip at the back of
the ellipse, peak at front-center) for a sense of depth. Hover/focus on an
item pauses its animation (`animation-play-state: paused`, the same
pattern `.marquee-track:hover` already uses) so the existing full-tier
`OrgMarkShader` hover effect stays usable without the logo drifting out
from under the pointer.

Gating: the orbit motion itself lives inside the same `@media
(prefers-reduced-motion: no-preference)` CSS block as the rest of the
site's looping/scroll animation — under `reduce`, items fall back to
today's static grid position (the un-animated, base CSS state), same
contract as `.marquee-track`/`.split-char`. The `OrgMarkShader` gating
(`tier === "full"`) is unchanged — WebGL capability and motion preference
are orthogonal signals here, as they already are elsewhere in this
codebase.

### 4. Timeline teaser — `components/motion/Flythrough.tsx`, Experience waypoint

The Experience `Waypoint` currently renders a single `employment[0]`
summary. It expands to a numbered list (1–4) of one highlighted entry each
from `employment`, `credentials`, and `education` (real `TimelineEntry`
data, `OrgMark` thumbnail per item, `Reveal`-staggered), still ending in
the existing "View full timeline →" link to `/experience`. This is the
homepage's analog to the reference's numbered case-study list, built from
real data rather than invented project cards.

### 5. Pinned crossfade CTA — new `components/motion/PinnedStatement.tsx`

Replaces the Contact `Waypoint` in `Flythrough.tsx`. Structurally: a
taller wrapper (enough scroll room for its line sequence) containing a
`position: sticky` inner block, fed by the *same* shared `scrollYProgress`
`Flythrough` already computes for the 3D camera and the other waypoints —
no new scroll listener. Its assigned progress range (today's `[0.85, 1]`)
subdivides into sequential sub-ranges, one per line
(`site.tagline` → `site.jobTitle` → `` `${employment[0].role} · ${employment[0].org}` ``),
each faded in/out via `useTransform` exactly like `Waypoint`'s existing
`[start, mid]` opacity mapping, just repeated per slice — before settling
on the existing mailto/social content, still pinned, for the remainder of
the range.

`reduceMotion` (already threaded through `Flythrough` today) renders the
same content statically stacked in document flow — no `position: sticky`,
no crossfade — identical contract to `Waypoint`'s existing `reduceMotion`
branch (content visible, zero scroll-linked animation).

### 6. Starfield polish — `components/motion/SceneCanvas.tsx`

Tuning only, to read closer to the reference's dim scattered stars:
adjust `ParticleField`'s color/opacity/count. No change to `FlyPath` or
the tiering-driven `particleCount`/`dpr` logic.

## Testing

Every new/changed component gets `__tests__` coverage in the existing
jsdom + Testing Library style already used for `Waypoint`, `Reveal`,
`OrgLogoGrid`:

- `StatCounter`: numeric values expose the target number in the DOM
  immediately (no JS/no-observer fallback, matching `Reveal`'s pattern);
  non-numeric values render unchanged; reduced-motion still exposes the
  final value.
- `PinnedStatement`: all lines' text content is present regardless of
  scroll progress (nothing is ever hidden from the DOM, only faded);
  `reduceMotion` renders without `position: sticky`; final mailto/social
  content matches what the current Contact `Waypoint` renders today (no
  content regression).
- `Flythrough`: Experience waypoint renders one entry from each of
  `employment`/`credentials`/`education` with correct `OrgMark`s.
- `OrgLogoGrid`: unchanged assertions (all org names/logos present,
  `OrgMarkShader` still gated on `tier === "full"`) plus a check that the
  reduced-motion path doesn't rely on any JS-computed position.
- `IntroOverlay`: existing tests extended to assert the new `scale`
  transform values are present in the motion props.
- `npm run build && npm run verify:export` must continue to pass
  unmodified — same hard guarantee the prior motion spec established.

## Deployment

No change to `.github/workflows/deploy.yml` or the static-export pipeline.
