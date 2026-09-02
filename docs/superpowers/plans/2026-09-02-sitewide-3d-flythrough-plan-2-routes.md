# Site-wide 3D Fly-Through — Plan 2: Route Roll-out

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the fly-through from the homepage to `/about`, `/experience`, `/contact`, and the 404 page — each with a tuned camera path and its sections wrapped in `Waypoint`.

**Architecture:** Plan 1 already mounts one persistent canvas that reads the current route's scene from `components/three/routeScenes.ts` and crossfades on navigation. This plan replaces the placeholder keyframes for the three sub-routes with tuned values, adds a `drift` entry for 404, wraps each page's sections in `Waypoint`, and adds an alternating-offset treatment to the experience timeline so the camera visibly banks past each block.

**Tech Stack:** Same as Plan 1. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-02-sitewide-3d-flythrough-design.md`

**Depends on:** Plan 1 (`2026-09-02-sitewide-3d-flythrough-plan-1-infra.md`) — merged and green.

## Global Constraints

Same as Plan 1. In particular:
- `npm run build && npm run verify:export` passes unmodified.
- `prefers-reduced-motion` / `static` tier → every section shown in place, no canvas.
- Content is single-source (`content/*.ts`); do not modify `Reveal`, `SplitText`, `Marquee`, or the DOM motion primitives.
- Sub-page camera keyframes must keep `at: 0` first, `at: 1` last, sorted (enforced by `routeScenes.test.ts` from Plan 1).

---

## File Structure

```
components/three/routeScenes.ts        — MODIFY: tune ABOUT / EXPERIENCE / CONTACT keyframes; add NOT_FOUND
components/three/__tests__/routeScenes.test.ts  — MODIFY: add 404 case
app/about/page.tsx                     — MODIFY: Reveal -> Waypoint, ranges
app/experience/page.tsx                — MODIFY: Reveal -> Waypoint, alternating offset, ranges
app/contact/page.tsx                   — MODIFY: Reveal -> Waypoint, ranges
app/not-found.tsx                      — MODIFY: Reveal -> Waypoint
app/*/__tests__ or app/__tests__       — MODIFY: wrap renders in SceneProvider, keep assertions
```

Every page currently uses `Reveal` (a `whileInView` fade). Swapping to `Waypoint` ties the reveal to the shared scroll progress instead, so it stays in step with the camera. `Waypoint` already degrades to a plain in-place render on the `static` tier (Plan 1 Task 6), so this preserves the reduced-motion contract with no extra work.

---

### Task 1: Tune the sub-route camera paths + add 404

**Files:**
- Modify: `components/three/routeScenes.ts`
- Modify: `components/three/__tests__/routeScenes.test.ts`

**Interfaces:**
- Produces: unchanged public surface (`getSceneForPath`, `CameraKeyframe`, `RouteScene`, `SceneVariant`). `SceneVariant` gains no new members — 404 uses the existing `"drift"` variant.

- [ ] **Step 1: Add the 404 test**

In `components/three/__tests__/routeScenes.test.ts`, add:

```ts
it("maps the 404 path shape to a drift scene with a gentle idle path", () => {
  const scene = getSceneForPath("/404");
  expect(scene.variant).toBe("drift");
});

it("experience has a keyframe near the middle so the camera banks past the timeline", () => {
  const ats = getSceneForPath("/experience").keyframes.map((k) => k.at);
  expect(ats.some((a) => a > 0.3 && a < 0.7)).toBe(true);
});
```

Note: `/404` is not a real route in a Next static export (the file is `not-found.tsx`, emitted as `404.html`), and `usePathname()` on that page returns the URL the user actually hit — so any unknown path must resolve to `drift`. The existing "falls back to the drift scene for an unknown path" test already covers the mechanism; this just documents the 404 intent.

- [ ] **Step 2: Run to confirm the middle-keyframe test fails**

Run: `npx vitest run components/three/__tests__/routeScenes.test.ts`
Expected: the new "banks past the timeline" test FAILS if the placeholder `EXPERIENCE` from Plan 1 only had endpoints — Plan 1 shipped a 0.5 keyframe, so it may already pass. Either way, proceed to tune.

- [ ] **Step 3: Replace the three sub-route scenes in `routeScenes.ts`**

Tuned values. Keep the `HOME` scene from Plan 1 untouched.

```ts
const ABOUT: RouteScene = {
  id: "about",
  variant: "about",
  keyframes: [
    { at: 0, position: [0, 0, 9], lookAt: [0, 0, -6] },
    { at: 0.5, position: [0.6, -0.3, 2], lookAt: [0, 0, -10] },
    { at: 1, position: [0, -0.6, -8], lookAt: [0, -0.5, -18] },
  ],
};

const EXPERIENCE: RouteScene = {
  id: "experience",
  variant: "experience",
  keyframes: [
    { at: 0, position: [0, 1, 10], lookAt: [0, 0, 0] },
    { at: 0.34, position: [3.2, -2, 2], lookAt: [-1.5, -2.5, -6] }, // banks right, past Employment
    { at: 0.67, position: [-3.2, -6, -6], lookAt: [1.5, -6.5, -14] }, // banks left, past Education
    { at: 1, position: [2.4, -11, -16], lookAt: [-1, -11.5, -24] }, // banks right, past Credentials
  ],
};

const CONTACT: RouteScene = {
  id: "contact",
  variant: "contact",
  keyframes: [
    { at: 0, position: [0, 0.4, 10], lookAt: [0, 0, 0] },
    { at: 1, position: [0, 0, 3], lookAt: [0, 0, -0.5] },
  ],
};
```

- [ ] **Step 4: Run the registry tests**

Run: `npx vitest run components/three/__tests__/routeScenes.test.ts`
Expected: PASS — all keyframe arrays still start at 0, end at 1, sorted; experience has a mid keyframe.

- [ ] **Step 5: Typecheck + commit**

```bash
git add components/three/routeScenes.ts components/three/__tests__/routeScenes.test.ts
git commit -m "Tune sub-route camera paths for the fly-through"
```

---

### Task 2: `/about` — Waypoint wrapping

**Files:**
- Modify: `app/about/page.tsx`
- Modify: the about page test (find it: `app/about/__tests__/page.test.tsx` or similar — check `git ls-files | grep about`)

**Interfaces:** consumes `Waypoint` (Plan 1 Task 6).

The about page is a single `<section>` with two `Reveal`s (photo, then text block). The `about` camera does a slow forward push, so one settled waypoint for the photo and one ranged waypoint for the text block reads right.

- [ ] **Step 1: Swap `Reveal` for `Waypoint` in `app/about/page.tsx`**

Change the import:

```tsx
import Waypoint from "@/components/three/Waypoint";
```

Remove `import Reveal from "@/components/Reveal";`.

Replace `<Reveal>` / `<Reveal delayMs={120}>` wrappers:

```tsx
      <Waypoint>
        <Tilt>
          <PhotoFrame ... />
        </Tilt>
      </Waypoint>
      <Waypoint range={[0.1, 0.4]}>
        <p className="inline-block rounded-full bg-surface ...">About</p>
        {/* ...unchanged text block... */}
      </Waypoint>
```

Keep every string, class, and child element exactly as-is — only the wrapper component and its props change.

- [ ] **Step 2: Update the about page test**

Wrap the render in `SceneProvider`:

```tsx
import { SceneProvider } from "@/lib/scene";
// render(<AboutPage />)  ->
render(<SceneProvider><AboutPage /></SceneProvider>);
```

Keep every existing assertion (heading text, description, affiliations). The `metadata` export test (if any) is unaffected — `Waypoint` is a client component but `metadata` is a module-level export, still statically analyzable.

- [ ] **Step 3: Typecheck + test + commit**

Run: `npm run typecheck && npx vitest run app/about`
Expected: PASS.

```bash
git add app/about/page.tsx app/about/__tests__/
git commit -m "Wrap the About page in scroll-driven waypoints"
```

---

### Task 3: `/experience` — Waypoint wrapping + alternating offset

**Files:**
- Modify: `app/experience/page.tsx`
- Modify: the experience page test

**Interfaces:** consumes `Waypoint`.

The page renders three `Timeline` blocks (Employment / Education / Credentials) inside `Reveal`s. The `experience` camera banks right→left→right past them, so each block gets a `Waypoint` with a matching horizontal offset class so the content visibly sits on the side the camera is looking from.

- [ ] **Step 1: Swap `Reveal` for `Waypoint` with per-index range + offset**

In `app/experience/page.tsx`:

```tsx
import Waypoint from "@/components/three/Waypoint";
// remove: import Reveal from "@/components/Reveal";

const SECTION_RANGES: [number, number][] = [
  [0.05, 0.33],
  [0.36, 0.64],
  [0.67, 0.95],
];
// Camera banks right, left, right -> nudge content the opposite way so it
// faces the camera. Tailwind translate utilities, gated to md+ so mobile
// stays a plain column.
const SECTION_OFFSET = ["md:translate-x-6", "md:-translate-x-6", "md:translate-x-6"];
```

Then in the render:

```tsx
      {sections.map((section, index) => (
        <div key={section.title} className={index === 0 ? "mt-12" : "mt-16"}>
          <Waypoint range={SECTION_RANGES[index]} className={`transition-transform ${SECTION_OFFSET[index]}`}>
            <Timeline title={section.title} entries={section.entries} />
          </Waypoint>
        </div>
      ))}
```

Keep the `<h1><SplitText text="Experience" /></h1>` outside any `Waypoint` (it's the page title, always visible).

- [ ] **Step 2: Update the experience page test**

Wrap render in `SceneProvider`. Keep assertions for every role/period/description string and the three section headings. Add:

```tsx
it("still renders all three timeline sections through the waypoint wrapper", () => {
  render(<SceneProvider><ExperiencePage /></SceneProvider>);
  expect(screen.getByRole("heading", { name: "Employment" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Education" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Credentials" })).toBeInTheDocument();
});
```

- [ ] **Step 3: Typecheck + test + commit**

Run: `npm run typecheck && npx vitest run app/experience`
Expected: PASS.

```bash
git add app/experience/page.tsx app/experience/__tests__/
git commit -m "Wrap the Experience timeline in banking waypoints"
```

---

### Task 4: `/contact` — Waypoint wrapping

**Files:**
- Modify: `app/contact/page.tsx`
- Modify: the contact page test

- [ ] **Step 1: Swap `Reveal` for `Waypoint`**

In `app/contact/page.tsx`: replace the import and the two `<Reveal>` wrappers:

```tsx
import Waypoint from "@/components/three/Waypoint";
// ...
      <Waypoint>
        <div className="grid gap-8 sm:grid-cols-[minmax(0,120px)_1fr] sm:items-center">
          {/* unchanged */}
        </div>
      </Waypoint>
      <Waypoint range={[0.2, 0.7]}>
        <ul aria-label="Social links" className="mt-10 flex ...">
          {/* unchanged */}
        </ul>
      </Waypoint>
```

- [ ] **Step 2: Update the contact page test** — wrap in `SceneProvider`, keep assertions (mailto link, social links).

- [ ] **Step 3: Typecheck + test + commit**

Run: `npm run typecheck && npx vitest run app/contact`

```bash
git add app/contact/page.tsx app/contact/__tests__/
git commit -m "Wrap the Contact page in scroll-driven waypoints"
```

---

### Task 5: 404 page — Waypoint wrapping

**Files:**
- Modify: `app/not-found.tsx`
- Modify: `app/__tests__/` 404 test if one exists (`git grep -l "not-found\|NotFound" app`)

`getSceneForPath` already returns the `drift` scene (no keyframes → camera idles) for any unmatched path, which is what a 404 hits. The page just needs its `Reveal` swapped so it behaves under the shared context.

- [ ] **Step 1: Swap `Reveal` for `Waypoint`**

```tsx
import Waypoint from "@/components/three/Waypoint";
// ...
export default function NotFound() {
  return (
    <Waypoint>
      <section className="mx-auto max-w-md rounded-[2rem] bg-surface ...">
        {/* unchanged */}
      </section>
    </Waypoint>
  );
}
```

- [ ] **Step 2: Update / add the test** — if a 404 test exists, wrap its render in `SceneProvider` and keep assertions. If none exists, add `app/__tests__/not-found.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SceneProvider } from "@/lib/scene";
import NotFound from "@/app/not-found";

describe("NotFound", () => {
  it("renders the 404 heading and a link home", () => {
    render(<SceneProvider><NotFound /></SceneProvider>);
    expect(screen.getByRole("heading", { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to home/i })).toHaveAttribute("href", "/");
  });
});
```

- [ ] **Step 3: Typecheck + test + commit**

```bash
git add app/not-found.tsx app/__tests__/not-found.test.tsx
git commit -m "Wrap the 404 page in the drift-scene waypoint"
```

---

### Task 6: Per-route `ClayField` variant tuning (visual)

**Files:**
- Modify: `components/three/ClayField.tsx`

**No automated test** — this is eyeballed in the dev server. Plan 1 gave each variant a seed + accent list; this task adjusts blob spread / depth / count per variant so each route's scene reads as its own place (spec: "a distinct scene per route that crossfades on navigation").

- [ ] **Step 1: Add per-variant layout params**

In `ClayField.tsx`, replace the single hard-coded spread with a per-variant table:

```ts
const VARIANT_LAYOUT: Record<SceneVariant, { spreadXY: number; depth: number; countScale: number }> = {
  home: { spreadXY: 16, depth: 34, countScale: 1 },
  about: { spreadXY: 10, depth: 26, countScale: 0.8 },
  experience: { spreadXY: 20, depth: 44, countScale: 1.1 }, // long corridor
  contact: { spreadXY: 8, depth: 16, countScale: 0.6 }, // small room
  drift: { spreadXY: 12, depth: 24, countScale: 0.7 },
};
```

Use `layout.spreadXY` / `layout.depth` where the blob positions are generated and `Math.round(blobCount * layout.countScale)` for the count.

- [ ] **Step 2: Dev-server check**

Run `npm run dev`, visit `/`, `/about`, `/experience`, `/contact`, and a bogus path. Confirm each scene looks distinct and the crossfade on nav is smooth.

- [ ] **Step 3: Typecheck + commit**

```bash
git add components/three/ClayField.tsx
git commit -m "Give each route's clay scene its own spread and density"
```

---

### Task 7: Full verification + per-route manual pass

**Files:** none.

- [ ] **Step 1:** `npm run typecheck && npm test` → PASS (every page test now wrapped in `SceneProvider`).
- [ ] **Step 2:** `npm run build && npm run verify:export` → PASS. Confirms `/about`, `/experience`, `/contact`, `404.html` still ship full content.
- [ ] **Step 3: Desktop pass per route.** With Playwright at 1440×900, scroll `/about`, `/experience`, `/contact` top-to-bottom. Screenshot 4 scroll positions each. Confirm: camera moves, progress bar tracks, sections settle near their ranges, experience blocks visibly alternate side, text legible over the scene.
- [ ] **Step 4: 404 pass.** Visit `/this-does-not-exist`. Confirm the 404 content renders, the drift scene idles (camera not locked), progress bar absent (page not scrollable) or minimal.
- [ ] **Step 5: Reduced-motion pass per route.** Emulate `prefers-reduced-motion`. Each route: no `<canvas>`, all content in place, no `three` chunk fetched.
- [ ] **Step 6: Mobile pass per route** at 390×844 — no horizontal overflow, offsets collapse to a column (the `md:` prefix), scene at `reduced` quality.
- [ ] **Step 7: Lighthouse mobile** on each of `/about`, `/experience`, `/contact`. Record all four scores. Accessibility / Best Practices / SEO must stay ≥ 90; Performance delta recorded as accepted.
- [ ] **Step 8: Record findings** in the PR. Fix any failure and re-run that route's pass. When all green, Plan 2 is complete.

---

## Self-Review

**Spec coverage (Plan 2's slice):**

| Spec item | Task |
|---|---|
| `/about` camera path: slow forward push, panel holds centre | 1, 2 |
| `/experience` camera travels along timeline, alternating sides, banks toward each | 1, 3 |
| `/contact` short approach to a single panel | 1, 4 |
| 404: tiny drifting scene, no waypoints | 1, 5 |
| Distinct scene per route, crossfade on nav | 6 (variant tuning); crossfade itself shipped in Plan 1 |
| Sections wrapped so they settle with the camera | 2, 3, 4, 5 |
| `static` tier / reduced-motion: content in place, no canvas | `Waypoint` behavior from Plan 1; verified Task 7 step 5 |
| `verify-export` passes unmodified | Task 7 step 2 |

**Noted deviation:** the spec sketched "~7 keyframes, one per entry" for `/experience`. This plan uses **one keyframe per section** (Employment / Education / Credentials = 4 keyframes incl. start) with a `Waypoint` per section, because that matches the page's actual DOM structure and the 7 entries are short. The camera still visibly banks past each block; a per-entry path added motion without adding legibility.

**Placeholder scan:** none. All keyframe values are concrete. Test file paths say "check `git ls-files`" because the repo's per-page test location wasn't verified at plan-writing time — the executor resolves the exact path in one `git` call; the change itself (wrap in `SceneProvider`) is fully specified.

**Type consistency:** no new types. `Waypoint` `range?: [number, number]` used consistently. `SceneVariant` unchanged (404 reuses `"drift"`). `VARIANT_LAYOUT` / `VARIANT_ACCENT` keyed by the same `SceneVariant` union.
