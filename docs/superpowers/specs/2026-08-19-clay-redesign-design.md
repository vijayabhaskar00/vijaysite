# vijayabhaskar.in — Claymorphism Redesign

Status: approved for planning
Date: 2026-08-19

## Background

The site currently uses a deliberately dark, editorial "Warm Regional
Identity" (see `docs/superpowers/specs/2026-08-13-personal-site-design.md`):
ink/paper high-contrast palette, sharp/no-radius edges, mono-uppercase
labels, a film-grain overlay, and — added since, per
`docs/superpowers/specs/2026-08-13-3d-flythrough-motion-design.md` and
`docs/superpowers/specs/2026-08-14-awwwards-motion-upgrade-design.md` — a
homepage built as a single scroll-pinned "flythrough": a Three.js 3D scene
(`SceneCanvas`/`FlyPath`) sits fixed behind the page while `Waypoint` and
`PinnedStatement` fade section previews in and out at hard-coded scroll
fractions of that one track, preceded by an `IntroOverlay` intro animation.

The owner asked for a full claymorphism redesign — soft, puffy, heavily
rounded surfaces built from dual soft shadows (light highlight + dark
shadow) — which is a near-opposite of several of the current choices (flat
vs. puffy, sharp vs. rounded, dark editorial vs. light pastel). Direction
was settled through visual mockups and a round of clarifying questions (see
below); this spec captures the resulting decisions and full scope.

## Decisions confirmed with site owner

- **Style:** the generic "claymorphism" UI trend (soft dual-shadow puffy
  surfaces, heavy rounding, pastel palette) — not an attempt to imitate
  clay.com's specific brand.
- **Palette:** full departure to a light, warm cream/pastel palette (not a
  "dark clay" variant that keeps the ink background).
- **Accent breadth:** multiple pastel accents (one per major section: hero/
  CTA, About, Experience, Contact) rather than a single accent color.
- **3D hero:** the Three.js flythrough scene is replaced by a clay
  illustration; the scene canvas, camera keyframes, and intro overlay are
  removed rather than reskinned.
- **Grain overlay:** removed. Claymorphism reads as clean and matte; a grain
  texture fights the soft-shadow language.
- **Typography:** switch to a rounded, friendly sans (display + body); drop
  the mono-uppercase editorial labels.
- **Homepage structure:** the scroll-pinned track/waypoint mechanism is
  retired, not just re-skinned. The homepage becomes hero + normal in-flow
  sections using the existing scroll-reveal component — closer to how
  claymorphism marketing sites actually flow, and removes a large amount of
  scroll-hijacking machinery that no longer serves a purpose once the fixed
  3D backdrop is gone.

## Goals

- Apply a coherent claymorphism visual system across every route (`/`,
  `/about`, `/experience`, `/contact`, 404) and every shared component
  (Header, Footer) — not just the homepage hero.
- Simplify the homepage's structure now that the 3D-driven reason for
  scroll-pinning is gone.
- Remove now-dead code paths (3D scene stack, WebGL org-logo shader, device
  performance tiering, grain overlay) rather than leaving them disabled
  in place.
- Preserve all real content/copy, accessibility behavior (reduced-motion
  handling, focus rings, semantic structure), and the static-export /
  GitHub Pages deployment model — this is a visual and structural redesign,
  not a content or hosting change.

## Non-goals

- No content changes — all copy, stats, timeline entries, and links stay
  exactly as they are today.
- No new pages/routes.
- No CMS, backend, or build-tooling changes beyond what removing the 3D
  stack requires (dropping now-unused dependencies).

## Visual system

**Palette** (`tailwind.config.ts`, replaces `ink`/`paper`/`amber`/`signal`/
`mute`/`line`):

| Token | Hex | Use |
|---|---|---|
| `cream` | `#FBF3E7` | page background |
| `surface` | `#FFFDF8` | card/panel base (lighter than page bg, for shadow contrast) |
| `ink` | `#2C2013` | primary text — warm near-black, not pure black |
| `mute` | `#7A6B57` | secondary text |
| `clay-amber` | `#E2701F` (+ light tint `#FBE0C4`) | hero/CTA/primary accent — closest to the old `amber` |
| `clay-teal` | `#3FA79E` (+ light tint `#D8F0EC`) | Experience section |
| `clay-pink` | `#EF7FA8` (+ light tint `#FBE1E9`) | About section |
| `clay-lavender` | `#7B87F5` (+ light tint `#E5E6FD`) | Contact section |

Each accent's light tint becomes that section's card background; the solid
shade is used for CTAs, numerals, and small badges within it. This keeps
"multi-color" from reading as random confetti — one accent per section,
used consistently within it.

**Type:** `Baloo 2` for display headings (rounded, bold, puffy terminals —
does most of the "clay" signaling on its own) paired with `Nunito` for
body/UI text. `IBM Plex Mono` is dropped entirely — mono-uppercase-tracked
labels (nav, section eyebrows, timeline dates) are replaced by small
rounded pill badges in the section's accent color.

**Shape and depth:** cards/panels use a large radius (`rounded-[2rem]`),
buttons are pill-shaped (`rounded-full`). Two shared shadow tokens added to
`tailwind.config.ts`'s `boxShadow` extension:

- `clay-raised` — soft light highlight (top-left) + soft dark shadow
  (bottom-right), the default resting state for every card/button.
- `clay-pressed` — inset variant, applied on `:active` for buttons as the
  signature clay "press-in" feedback.

## Removed subsystem

Everything here is deleted outright, not disabled or left dead:

- `components/motion/Flythrough.tsx`, `SceneCanvas.tsx`, `FlyPath.tsx`,
  `Waypoint.tsx`, `PinnedStatement.tsx`, `IntroOverlay.tsx`,
  `OrgMarkShader.tsx`, and their tests under `components/motion/__tests__/`.
- `components/motion/GrainOverlay.tsx` and the grain CSS in
  `app/globals.css`.
- The `.org-orbit`/`offset-path` orbit animation CSS (logo grid no longer
  orbits — see below).
- `resolveDeviceTier`/`detectWebGL2`/`DeviceTier` from
  `components/motion/deviceTier.ts` — nothing left needs WebGL/FPS
  capability probing once the 3D scene and shader are gone. The file keeps
  only `prefersReducedMotion`, which `app/template.tsx`'s page-enter
  transition still uses.
- `@react-three/fiber` and `three` (+ `@types/three`) from `package.json` —
  unused once the above are gone. `framer-motion` stays; `template.tsx`'s
  page-transition is unrelated to the removed stack.

## Page-by-page plan

**Header / Footer** — nav and social links become small rounded pill
buttons that fill with the page's accent color on hover/focus, replacing
the mono-uppercase text + underline-sweep treatment. Logo mark keeps its
link but drops the uppercase tracking.

**Home (`app/page.tsx`)** — rebuilt as plain in-flow sections (no wrapper
component driving a shared scroll track):

1. Hero: headline, description, and photo (clay-framed portrait) plus a
   CSS/SVG clay illustration (soft blob shapes) replacing the 3D canvas.
2. Credentials `Marquee`, restyled as a soft pill strip on the cream
   background (ticker behavior unchanged).
3. `StatBand`: four clay tiles, one per accent color, each showing one
   stat (counter behavior unchanged).
4. `OrgLogoGrid`: simplified to a plain responsive grid of clay badge
   cards (logo or monogram + org name), gentle hover lift only — no orbit
   animation, no WebGL shader, no device-tier branching.
5. About/Experience/Contact preview sections — the copy currently living
   inside `Flythrough`'s `Waypoint`/`PinnedStatement` blocks, unchanged,
   now plain sections wrapped in the existing `Reveal` component and tinted
   with each section's assigned accent.

**About / Experience / Contact (full pages)** — same content and copy,
restyled: photo in a clay frame, timeline entries as clay list cards with
an accent-colored pill for the date/period instead of mono tabular-nums.

**404 (`app/not-found.tsx`)** — restyled as a clay panel, same copy.

`SectionDivider` (a bare `<hr>`) is retired; spacing plus each section's
tinted background carries the visual separation instead of a hard rule.

## Component inventory

| File | Change |
|---|---|
| `tailwind.config.ts` | new color tokens, `boxShadow` (`clay-raised`/`clay-pressed`), radius scale |
| `lib/fonts.ts` | `Big_Shoulders_Display`/`Manrope`/`IBM_Plex_Mono` → `Baloo_2`/`Nunito`, mono dropped |
| `app/globals.css` | remove grain + orbit CSS; add clay utility classes; keep `photo-frame` grayscale-hover (works on any background), `link-sweep`/`reveal`/`split-char`/`stat-counter` mechanics with recolored values |
| `app/layout.tsx` | drop `GrainOverlay`; `bg-cream text-ink` body |
| `app/page.tsx` | rebuilt per Home plan above; drops `Flythrough` wrapper |
| `app/about/page.tsx`, `app/experience/page.tsx`, `app/contact/page.tsx`, `app/not-found.tsx` | restyle only, content unchanged |
| `components/Header.tsx`, `Footer.tsx` | pill nav/social links |
| `components/StatBand.tsx` | clay tile styling, one accent per tile |
| `components/OrgLogoGrid.tsx` | drop shader/tier/orbit logic; plain grid |
| `components/PhotoFrame.tsx` | clay frame (radius + shadow) instead of hard border |
| `components/SectionDivider.tsx` | removed; call sites drop the divider |
| `lib/ui.ts` | `linkClass`/`navLinkClass` reworked for pill/accent styling |
| `components/Reveal.tsx`, `SplitText.tsx`, `StatCounter.tsx`, `Marquee.tsx`, `OrgMark.tsx` | behavior unchanged, only consuming CSS/class names change |
| `components/motion/*` (7 files) + tests | removed, see above |
| `scripts/verify-export.mjs` | `paletteColors` map updated to the new token hexes so `verify:export` checks the shipped CSS against the real palette |
| `package.json` | drop `@react-three/fiber`, `three`, `@types/three` |

## Testing / verification

- Delete tests for removed components (`Flythrough`, `deviceTier`'s
  tier/WebGL cases, and any `OrgMarkShader`-specific coverage).
- Update tests whose behavior changes: `OrgLogoGrid.test.tsx` (no more
  shader/tier branching to cover), `Footer.test.tsx`/`Header.test.tsx` (new
  markup/classes), `SectionDivider.test.tsx` removed with the component.
- Existing behavioral tests that shouldn't need logic changes (`Reveal`,
  `SplitText`, `StatCounter`, `Marquee`, `PhotoFrame`, `OrgMark`,
  `template.test.tsx`, `page.test.tsx`'s content-presence assertions)
  get updated only where they assert on now-removed class names.
- Full verification gate before this is considered done, same as any other
  change to this repo:
  `npm run typecheck && npm run test && npm run build && npm run verify:export`.
- Manual pass in a real browser: golden path (home → about → experience →
  contact nav, hero readability, stat counters firing on scroll, org grid
  hover) plus reduced-motion (`prefers-reduced-motion: reduce`) and mobile
  viewport widths, since several of the removed pieces existed specifically
  to handle low-tier devices and reduced motion.
