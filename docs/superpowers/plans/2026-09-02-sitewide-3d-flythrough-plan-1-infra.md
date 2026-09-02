# Site-wide 3D Fly-Through — Plan 1: Scene Infrastructure + Homepage

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the persistent Three.js fly-through canvas, device tiering, scroll progress bar, and the per-route scene registry, then wire the **homepage** to fly through a procedural clay scene — with every other route unchanged and the no-JS/crawler guarantee intact.

**Architecture:** One `<Canvas>` mounted once in `app/layout.tsx` behind all content, fed by a `SceneProvider` React context that resolves the device tier once, owns a single document `scrollYProgress` MotionValue, and selects the current route's camera keyframes from a static registry. The canvas, the camera rig, and the scroll progress bar all read that one context. The Three.js bundle is dynamically imported and only downloaded when the tier resolves to `full` or `reduced`; `static`-tier and `prefers-reduced-motion` visitors never fetch it and see every section in place.

**Tech Stack:** Next.js 14 (App Router, static export), React 18, TypeScript, `three` + `@react-three/fiber` + `@react-three/drei`, `framer-motion` (already a dependency), `lenis` (already wired), Vitest + `@testing-library/react`.

**Spec:** `docs/superpowers/specs/2026-09-02-sitewide-3d-flythrough-design.md`

This is the first of three plans from that spec:
1. **This plan** — scene infrastructure + homepage.
2. Roll-out — `/about`, `/experience`, `/contact`, 404 camera paths + waypoints.
3. Dark-mode removal + cleanup (`ThemeToggle`, `lib/theme.ts`, `lib/themeBootstrap.ts`, `AmbientColorDrift`, dark tokens).

Plan 3 is independent of Plans 1–2 and may be executed at any time; Plan 2 depends on this plan.

## Global Constraints

Copied verbatim from the spec. Every task's requirements implicitly include these.

- **Static export only** — `next.config.mjs` has `output: "export"`, `trailingSlash: true`. No server-only APIs, no route handlers, no `cookies()`/`headers()`.
- **Path alias** `@/*` maps to the project root.
- **`npm run build && npm run verify:export` must pass unmodified** throughout. `verify-export.mjs` checks that `/`, `/about`, `/experience`, `/contact` and the 404 page ship full real content and the design-token colors reach the compiled CSS.
- **`prefers-reduced-motion: reduce` resolves the tier to `static`** — no canvas, no camera movement, every section shown in place; the progress bar renders without spring smoothing.
- **Three.js is never downloaded on the `static` tier** — it must be behind `next/dynamic(..., { ssr: false })` and a runtime tier check, never a static import from a always-rendered module.
- **Content is single-source** — homepage sections read from `content/site.ts` / `content/experience.ts`, never a second copy.
- **Do not modify** `components/Reveal.tsx`, `components/Marquee.tsx`, `.link-sweep` / `.marquee-track` / `.photo-frame` / `.spotlight` in `app/globals.css`, or the DOM motion primitives (`LineReveal`, `Magnetic`, `Tilt`, `Spotlight`, `SplitText`). This plan only adds motion.
- **Colors come from the clay tokens** in `tailwind.config.ts` / `app/globals.css` (`cream`, `surface`, `ink`, `mute`, `clay-amber[-light]`, `clay-teal[-light]`, `clay-pink[-light]`, `clay-lavender[-light]`). The 3D materials use the same hex values (listed in Task 7). Do not invent new colors.
- **No orbit/drag camera controls.** Camera path is authored keyframes driven only by scroll.
- **`@react-three/fiber` context does not cross the `<Canvas>` boundary.** Router hooks (`usePathname`) and context consumers must run on the DOM side; the Canvas receives everything it needs as plain props (MotionValues included — they are plain mutable refs).

---

## File Structure

```
lib/
  scene.tsx                       — SceneProvider + useScene() context (DOM side)
components/
  three/
    routeScenes.ts                — pure: per-route camera keyframes + variant registry
    Waypoint.tsx                  — SSR-safe, tier-aware scroll-range content wrapper
    FlyPath.tsx                   — camera rig, runs inside <Canvas>
    ClayField.tsx                 — procedural soft-form scene, runs inside <Canvas>
    SceneCanvas.tsx               — the <Canvas> wrapper (tier-aware, pause-on-hidden, crossfade)
    SceneCanvasLazy.tsx           — 'use client' next/dynamic wrapper for SceneCanvas
    __tests__/
      routeScenes.test.ts
      Waypoint.test.tsx
  motion/
    deviceTier.ts                 — EXPAND: decideTier / detectWebGL2 / measureAvgFrameMs / resolveDeviceTier
    ScrollProgressBar.tsx         — fixed top progress bar (DOM side)
    __tests__/
      deviceTier.test.ts          — EXPAND
      ScrollProgressBar.test.tsx
  HomeHero.tsx                    — MODIFY: drop ClayBlobBackdrop
app/
  layout.tsx                      — MODIFY: mount SceneProvider + SceneCanvasLazy + ScrollProgressBar
  page.tsx                        — MODIFY: wrap sections in Waypoint, drop <AmbientColorDrift/>
package.json / package-lock.json  — new dependencies
```

---

### Task 1: Add Three.js dependencies

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npm install`)

**Interfaces:**
- Produces: `three`, `@react-three/fiber`, `@react-three/drei` importable from any component; `@types/three` for typechecking.

- [ ] **Step 1: Confirm the baseline is green**

Run: `npm run typecheck && npm test`
Expected: both pass (unmodified site).

- [ ] **Step 2: Install runtime dependencies**

Run: `npm install three@^0.169.0 @react-three/fiber@^8.17.10 @react-three/drei@^9.114.0`

(These are the last `@react-three/fiber` v8 line, which targets React 18 — the project is on React 18.3. Do **not** take `@react-three/fiber` v9, which requires React 19.)

- [ ] **Step 3: Install type definitions**

Run: `npm install -D @types/three@^0.169.0`

- [ ] **Step 4: Verify nothing broke**

Run: `npm run typecheck && npm test`
Expected: both still pass — nothing imports the new packages yet.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add three, @react-three/fiber, @react-three/drei dependencies"
```

---

### Task 2: Expand `deviceTier.ts` — full tier detection

**Files:**
- Modify: `components/motion/deviceTier.ts`
- Modify: `components/motion/__tests__/deviceTier.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces:
  - `type DeviceTier = "full" | "reduced" | "static"`
  - `interface TierSignals { hasWebGL2: boolean; prefersReducedMotion: boolean; deviceMemory?: number; hardwareConcurrency?: number; avgFrameMs: number | null }`
  - `function decideTier(signals: TierSignals): DeviceTier` — pure
  - `function detectWebGL2(): boolean`
  - `function prefersReducedMotion(): boolean` — **unchanged, keep the existing export and its two tests**
  - `function measureAvgFrameMs(sampleCount?: number): Promise<number>`
  - `function resolveDeviceTier(): Promise<DeviceTier>` — the entry point Task 3 calls

- [ ] **Step 1: Add the failing tests**

Append to `components/motion/__tests__/deviceTier.test.ts` (keep the existing `prefersReducedMotion` block):

```ts
import { decideTier, detectWebGL2 } from "../deviceTier";

describe("decideTier", () => {
  it("returns static when reduced motion is preferred, whatever else is true", () => {
    expect(
      decideTier({ hasWebGL2: true, prefersReducedMotion: true, deviceMemory: 8, hardwareConcurrency: 8, avgFrameMs: 8 })
    ).toBe("static");
  });

  it("returns static when WebGL2 is unavailable", () => {
    expect(decideTier({ hasWebGL2: false, prefersReducedMotion: false, avgFrameMs: 8 })).toBe("static");
  });

  it("returns full when every signal is healthy", () => {
    expect(
      decideTier({ hasWebGL2: true, prefersReducedMotion: false, deviceMemory: 8, hardwareConcurrency: 8, avgFrameMs: 10 })
    ).toBe("full");
  });

  it("returns full when the optional memory/core signals are absent but the frame probe is fine", () => {
    expect(decideTier({ hasWebGL2: true, prefersReducedMotion: false, avgFrameMs: 12 })).toBe("full");
  });

  it("returns reduced when device memory is low", () => {
    expect(
      decideTier({ hasWebGL2: true, prefersReducedMotion: false, deviceMemory: 2, avgFrameMs: 10 })
    ).toBe("reduced");
  });

  it("returns reduced when hardware concurrency is low", () => {
    expect(
      decideTier({ hasWebGL2: true, prefersReducedMotion: false, hardwareConcurrency: 2, avgFrameMs: 10 })
    ).toBe("reduced");
  });

  it("returns reduced when the frame-time probe is slower than ~30fps", () => {
    expect(decideTier({ hasWebGL2: true, prefersReducedMotion: false, avgFrameMs: 40 })).toBe("reduced");
  });
});

describe("detectWebGL2", () => {
  it("returns false in jsdom, which has no WebGL2 context", () => {
    expect(detectWebGL2()).toBe(false);
  });
});
```

- [ ] **Step 2: Run to confirm the new tests fail**

Run: `npx vitest run components/motion/__tests__/deviceTier.test.ts`
Expected: FAIL — `decideTier` / `detectWebGL2` not exported.

- [ ] **Step 3: Implement the expansion**

Replace `components/motion/deviceTier.ts` with:

```ts
export type DeviceTier = "full" | "reduced" | "static";

export interface TierSignals {
  hasWebGL2: boolean;
  prefersReducedMotion: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  avgFrameMs: number | null;
}

/** Pure decision: which tier does this visitor get? No browser APIs here,
 * so this is the one part of the tiering system that is fully unit-testable. */
export function decideTier(signals: TierSignals): DeviceTier {
  if (signals.prefersReducedMotion || !signals.hasWebGL2) return "static";
  const lowMemory = signals.deviceMemory !== undefined && signals.deviceMemory <= 2;
  const lowCores = signals.hardwareConcurrency !== undefined && signals.hardwareConcurrency <= 2;
  const badFrame = signals.avgFrameMs !== null && signals.avgFrameMs > 33; // worse than ~30fps
  return lowMemory || lowCores || badFrame ? "reduced" : "full";
}

export function detectWebGL2(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.createElement("canvas").getContext("webgl2") !== null;
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Samples real frame timing for well under a second so a bad result can
 * downgrade the tier before any heavy asset loads. */
export function measureAvgFrameMs(sampleCount = 10): Promise<number> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "undefined" || typeof performance === "undefined") {
      resolve(16);
      return;
    }
    const samples: number[] = [];
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      samples.push(now - last);
      last = now;
      if (samples.length >= sampleCount) {
        resolve(samples.reduce((a, b) => a + b, 0) / samples.length);
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  });
}

/** The single entry point the SceneProvider calls. Skips the frame probe
 * when reduced-motion or missing WebGL2 already force `static`. */
export async function resolveDeviceTier(): Promise<DeviceTier> {
  const reduced = prefersReducedMotion();
  const hasWebGL2 = detectWebGL2();
  if (reduced || !hasWebGL2) {
    return decideTier({ hasWebGL2, prefersReducedMotion: reduced, avgFrameMs: null });
  }
  const nav =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { deviceMemory?: number })
      : undefined;
  const avgFrameMs = await measureAvgFrameMs();
  return decideTier({
    hasWebGL2,
    prefersReducedMotion: reduced,
    deviceMemory: nav?.deviceMemory,
    hardwareConcurrency: nav?.hardwareConcurrency,
    avgFrameMs,
  });
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run components/motion/__tests__/deviceTier.test.ts`
Expected: PASS — the 2 original `prefersReducedMotion` tests plus the 9 new ones.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS. (The old one-line file's only consumers — `lib/motion.ts`, `SmoothScroll.tsx`, `AmbientColorDrift.tsx` — import only `prefersReducedMotion`, which is unchanged.)

- [ ] **Step 6: Commit**

```bash
git add components/motion/deviceTier.ts components/motion/__tests__/deviceTier.test.ts
git commit -m "Expand deviceTier back to full full/reduced/static detection"
```

---

### Task 3: `routeScenes.ts` — per-route camera keyframe registry

**Files:**
- Create: `components/three/routeScenes.ts`
- Create: `components/three/__tests__/routeScenes.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `interface CameraKeyframe { at: number; position: [number, number, number]; lookAt: [number, number, number] }`
  - `interface RouteScene { id: string; variant: "home" | "about" | "experience" | "contact" | "drift"; keyframes: CameraKeyframe[] }`
  - `function getSceneForPath(pathname: string): RouteScene` — normalizes the trailing slash, falls back to the `drift` scene for unknown paths (the 404 case). Used by Task 4 and, in Plan 2, by the other routes.

- [ ] **Step 1: Write the failing tests**

Create `components/three/__tests__/routeScenes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getSceneForPath } from "../routeScenes";

describe("getSceneForPath", () => {
  it("returns the home scene for '/'", () => {
    expect(getSceneForPath("/").variant).toBe("home");
  });

  it("normalizes a trailing slash (static export uses trailingSlash: true)", () => {
    expect(getSceneForPath("/about/").id).toBe(getSceneForPath("/about").id);
  });

  it("falls back to the drift scene for an unknown path", () => {
    const scene = getSceneForPath("/does-not-exist");
    expect(scene.variant).toBe("drift");
    expect(scene.keyframes).toEqual([]);
  });

  it("every registered scene has keyframes sorted and spanning 0..1 (except drift)", () => {
    for (const path of ["/", "/about", "/experience", "/contact"]) {
      const { keyframes } = getSceneForPath(path);
      expect(keyframes.length).toBeGreaterThanOrEqual(2);
      expect(keyframes[0].at).toBe(0);
      expect(keyframes[keyframes.length - 1].at).toBe(1);
      const ats = keyframes.map((k) => k.at);
      expect([...ats].sort((a, b) => a - b)).toEqual(ats);
    }
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run components/three/__tests__/routeScenes.test.ts`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `routeScenes.ts`**

Create `components/three/routeScenes.ts`. The `/about`, `/experience`, `/contact` keyframes are placeholders here so the registry is complete and testable now; Plan 2 tunes them against the real scenes.

```ts
export interface CameraKeyframe {
  /** Scroll progress (0..1) at which the camera reaches this pose. */
  at: number;
  position: [number, number, number];
  lookAt: [number, number, number];
}

export type SceneVariant = "home" | "about" | "experience" | "contact" | "drift";

export interface RouteScene {
  id: string;
  variant: SceneVariant;
  keyframes: CameraKeyframe[];
}

// Homepage: fly in from far, settle on the hero (~0.15), then drift up and
// back past the section waypoints. Calm — no lookAt turn sharper than a
// gentle bank.
const HOME: RouteScene = {
  id: "home",
  variant: "home",
  keyframes: [
    { at: 0, position: [0, 0, 14], lookAt: [0, 0, 0] },
    { at: 0.15, position: [0, 0, 6], lookAt: [0, 0, 0] },
    { at: 1, position: [0, 3.5, -6], lookAt: [0, 1, -10] },
  ],
};

const ABOUT: RouteScene = {
  id: "about",
  variant: "about",
  keyframes: [
    { at: 0, position: [0, 0, 8], lookAt: [0, 0, -4] },
    { at: 1, position: [0, 0, -6], lookAt: [0, 0, -14] },
  ],
};

const EXPERIENCE: RouteScene = {
  id: "experience",
  variant: "experience",
  keyframes: [
    { at: 0, position: [0, 0, 8], lookAt: [0, 0, 0] },
    { at: 0.5, position: [2, -3, -6], lookAt: [-1, -3, -10] },
    { at: 1, position: [-2, -8, -18], lookAt: [1, -8, -24] },
  ],
};

const CONTACT: RouteScene = {
  id: "contact",
  variant: "contact",
  keyframes: [
    { at: 0, position: [0, 0, 9], lookAt: [0, 0, 0] },
    { at: 1, position: [0, 0, 3.5], lookAt: [0, 0, 0] },
  ],
};

const DRIFT: RouteScene = { id: "drift", variant: "drift", keyframes: [] };

const REGISTRY: Record<string, RouteScene> = {
  "/": HOME,
  "/about": ABOUT,
  "/experience": EXPERIENCE,
  "/contact": CONTACT,
};

/** trailingSlash: true means usePathname() yields "/about/" for every
 * route except root — strip it before lookup. */
export function getSceneForPath(pathname: string): RouteScene {
  const normalized =
    pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return REGISTRY[normalized] ?? DRIFT;
}
```

- [ ] **Step 4: Run to confirm pass**

Run: `npx vitest run components/three/__tests__/routeScenes.test.ts`
Expected: PASS, all 4 tests.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`
Expected: PASS.

```bash
git add components/three/routeScenes.ts components/three/__tests__/routeScenes.test.ts
git commit -m "Add per-route camera keyframe registry"
```

---

### Task 4: `lib/scene.tsx` — SceneProvider + useScene() context

**Files:**
- Create: `lib/scene.tsx`
- Create: `lib/__tests__/scene.test.tsx`

**Interfaces:**
- Consumes: `resolveDeviceTier`, `DeviceTier` (Task 2); `getSceneForPath`, `RouteScene` (Task 3); `useScroll` from `framer-motion`; `usePathname` from `next/navigation`.
- Produces:
  - `function SceneProvider({ children }: { children: ReactNode }): JSX.Element` — mounted once in `app/layout.tsx`, inside `<body>`, wrapping everything.
  - `interface SceneContextValue { tier: DeviceTier | null; scrollProgress: MotionValue<number>; scene: RouteScene; canFly: boolean }`
  - `function useScene(): SceneContextValue` — throws if used outside the provider.
  - `canFly` is `tier === "full" || tier === "reduced"`.

**Why this shape:** the context is the single coordination point. `SceneProvider` runs on the DOM side (above the Canvas), so it can safely use `usePathname()` and `useScroll()`. It resolves the tier exactly once. Everything downstream — the canvas, the camera rig (via props), the progress bar, every `Waypoint` — reads this one object. `scrollProgress` is a stable `MotionValue` created once with `useScroll()` (document scroll, no target), so route changes and content-height changes are tracked by framer-motion automatically.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/scene.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SceneProvider, useScene } from "../scene";

function Probe() {
  const { tier, canFly, scene } = useScene();
  return (
    <div>
      <span data-testid="tier">{tier ?? "pending"}</span>
      <span data-testid="canfly">{String(canFly)}</span>
      <span data-testid="variant">{scene.variant}</span>
    </div>
  );
}

describe("SceneProvider", () => {
  it("renders children immediately, before the tier resolves", () => {
    render(
      <SceneProvider>
        <p>page content</p>
      </SceneProvider>
    );
    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("resolves to the static tier in jsdom (no WebGL2) and reports canFly=false", async () => {
    render(
      <SceneProvider>
        <Probe />
      </SceneProvider>
    );
    await waitFor(() => expect(screen.getByTestId("tier")).toHaveTextContent("static"));
    expect(screen.getByTestId("canfly")).toHaveTextContent("false");
  });

  it("exposes the home scene for the default test path", async () => {
    render(
      <SceneProvider>
        <Probe />
      </SceneProvider>
    );
    // next/navigation's usePathname() returns "/" in the test environment.
    await waitFor(() => expect(screen.getByTestId("variant")).toHaveTextContent("home"));
  });

  it("adds no server markup of its own around children", () => {
    const html = renderToStaticMarkup(
      <SceneProvider>
        <p>hi</p>
      </SceneProvider>
    );
    expect(html).toBe("<p>hi</p>");
  });

  it("useScene throws when used outside the provider", () => {
    const spy = () => renderToStaticMarkup(<Probe />);
    expect(spy).toThrow(/useScene must be used within a SceneProvider/);
  });
});
```

If `usePathname` is not already mocked project-wide, add to the top of the test file:

```tsx
import { vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
```

Check `vitest.config.ts` / existing tests first — `Header.test.tsx` already renders a component that calls `usePathname`, so a mock or setup shim may already exist; reuse it rather than adding a second.

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run lib/__tests__/scene.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/scene.tsx`**

```tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useScroll, type MotionValue } from "framer-motion";
import { usePathname } from "next/navigation";
import { resolveDeviceTier, type DeviceTier } from "@/components/motion/deviceTier";
import { getSceneForPath, type RouteScene } from "@/components/three/routeScenes";

export interface SceneContextValue {
  tier: DeviceTier | null;
  scrollProgress: MotionValue<number>;
  scene: RouteScene;
  canFly: boolean;
}

const SceneContext = createContext<SceneContextValue | null>(null);

export function useScene(): SceneContextValue {
  const value = useContext(SceneContext);
  if (!value) throw new Error("useScene must be used within a SceneProvider");
  return value;
}

export function SceneProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<DeviceTier | null>(null);
  const { scrollYProgress } = useScroll();
  const pathname = usePathname() ?? "/";
  const scene = useMemo(() => getSceneForPath(pathname), [pathname]);

  useEffect(() => {
    let cancelled = false;
    resolveDeviceTier().then((resolved) => {
      if (!cancelled) setTier(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<SceneContextValue>(
    () => ({
      tier,
      scrollProgress: scrollYProgress,
      scene,
      canFly: tier === "full" || tier === "reduced",
    }),
    [tier, scrollYProgress, scene]
  );

  return <SceneContext.Provider value={value}>{children}</SceneContext.Provider>;
}
```

- [ ] **Step 4: Run to confirm pass**

Run: `npx vitest run lib/__tests__/scene.test.tsx`
Expected: PASS, all 5 tests.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`

```bash
git add lib/scene.tsx lib/__tests__/scene.test.tsx
git commit -m "Add SceneProvider context: tier + document scroll progress + active scene"
```

---

### Task 5: `ScrollProgressBar.tsx`

**Files:**
- Create: `components/motion/ScrollProgressBar.tsx`
- Create: `components/motion/__tests__/ScrollProgressBar.test.tsx`

**Interfaces:**
- Consumes: `useScene` (Task 4); `motion`, `useSpring` from `framer-motion`.
- Produces: `export default function ScrollProgressBar(): JSX.Element | null` — mounted once in `app/layout.tsx`.

**Behavior:**
- Fixed, full-width, 3px, top of viewport, `z-40` (above the canvas `z-0` / content `z-10`, below nothing that matters). `clay-amber` fill on a transparent track.
- `scaleX` bound to `useScene().scrollProgress`, `transform-origin: left`.
- On the `full` tier the bound value is passed through `useSpring` for a slight lag; on `reduced`/`static`/pending it is used directly.
- Returns `null` until after mount (SSR-safe: nothing baked into static HTML) **and** when the document is not scrollable (`documentElement.scrollHeight <= clientHeight`), re-checked on resize.
- `aria-hidden="true"` — the native scrollbar is the accessible affordance.

- [ ] **Step 1: Write the failing tests**

Create `components/motion/__tests__/ScrollProgressBar.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SceneProvider } from "@/lib/scene";
import ScrollProgressBar from "../ScrollProgressBar";

const withProvider = (ui: React.ReactElement) => <SceneProvider>{ui}</SceneProvider>;

describe("ScrollProgressBar", () => {
  it("renders no server markup (purely additive client enhancement)", () => {
    const html = renderToStaticMarkup(withProvider(<ScrollProgressBar />));
    expect(html).toBe("");
  });

  it("mounts a decorative bar when the document is scrollable", () => {
    // jsdom reports scrollHeight 0 by default; force a scrollable document.
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 5000, configurable: true });
    Object.defineProperty(document.documentElement, "clientHeight", { value: 800, configurable: true });
    const { container } = render(withProvider(<ScrollProgressBar />));
    const bar = container.querySelector('[data-testid="scroll-progress-bar"]');
    expect(bar).not.toBeNull();
    expect(bar).toHaveAttribute("aria-hidden", "true");
  });

  it("renders nothing when the document is not tall enough to scroll", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", { value: 700, configurable: true });
    Object.defineProperty(document.documentElement, "clientHeight", { value: 800, configurable: true });
    const { container } = render(withProvider(<ScrollProgressBar />));
    expect(container.querySelector('[data-testid="scroll-progress-bar"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run components/motion/__tests__/ScrollProgressBar.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `ScrollProgressBar.tsx`**

```tsx
"use client";

import { motion, useSpring } from "framer-motion";
import { useEffect, useState } from "react";
import { useScene } from "@/lib/scene";

export default function ScrollProgressBar() {
  const { scrollProgress, tier } = useScene();
  const [mounted, setMounted] = useState(false);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => {
      const el = document.documentElement;
      setScrollable(el.scrollHeight - el.clientHeight > 2);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Spring only on the full tier; everywhere else follow the raw value.
  const springed = useSpring(scrollProgress, { stiffness: 220, damping: 40, mass: 0.4 });
  const scaleX = tier === "full" ? springed : scrollProgress;

  if (!mounted || !scrollable) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[3px] bg-transparent"
    >
      <motion.div
        data-testid="scroll-progress-bar"
        aria-hidden="true"
        className="h-full origin-left bg-clay-amber"
        style={{ scaleX }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run to confirm pass**

Run: `npx vitest run components/motion/__tests__/ScrollProgressBar.test.tsx`
Expected: PASS, all 3 tests.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`

```bash
git add components/motion/ScrollProgressBar.tsx components/motion/__tests__/ScrollProgressBar.test.tsx
git commit -m "Add site-wide scroll progress bar"
```

---

### Task 6: `Waypoint.tsx` — SSR-safe, tier-aware content wrapper

**Files:**
- Create: `components/three/Waypoint.tsx`
- Create: `components/three/__tests__/Waypoint.test.tsx`

**Interfaces:**
- Consumes: `useScene` (Task 4); `motion`, `useTransform` from `framer-motion`.
- Produces: `export default function Waypoint(props: { children: ReactNode; range?: [number, number]; className?: string }): JSX.Element` — wraps a homepage section (Task 8) and, in Plan 2, sub-page sections.
  - `range` is the scroll-progress window over which the section settles in. Defaults to `[0, 0]`, meaning "always settled" (used for the hero).

**Why this needs care (same rule the old `Reveal`/`Waypoint` followed):** framer-motion resolves `style={{ opacity, y }}` synchronously, including on the server. A section scheduled to appear later in the scroll (progress 0 at load) would otherwise render `opacity: 0` straight into the static HTML — invisible forever to anyone without working JS. Fix: no live `style` prop until after mount (`useEffect`, never runs server-side), and no transform at all on the `static` tier. Before mount / on `static`, the element is a plain `<div>` in normal flow.

- [ ] **Step 1: Write the failing tests**

Create `components/three/__tests__/Waypoint.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SceneProvider } from "@/lib/scene";
import Waypoint from "../Waypoint";

const wrap = (ui: React.ReactElement) => <SceneProvider>{ui}</SceneProvider>;

describe("Waypoint", () => {
  it("renders its content regardless of scroll position", () => {
    render(
      wrap(
        <Waypoint range={[0.4, 0.6]}>
          <p>About preview</p>
        </Waypoint>
      )
    );
    expect(screen.getByText("About preview")).toBeInTheDocument();
  });

  it("never bakes opacity:0 into server markup for a later-scheduled section", () => {
    const html = renderToStaticMarkup(
      wrap(
        <Waypoint range={[0.7, 0.9]}>
          <p>Contact preview</p>
        </Waypoint>
      )
    );
    expect(html).toContain("Contact preview");
    expect(html).not.toMatch(/opacity:\s*0/);
  });

  it("passes className through", () => {
    const { container } = render(
      wrap(
        <Waypoint className="my-section">
          <p>x</p>
        </Waypoint>
      )
    );
    expect(container.querySelector(".my-section")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

Run: `npx vitest run components/three/__tests__/Waypoint.test.tsx`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `Waypoint.tsx`**

```tsx
"use client";

import { motion, useTransform } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { useScene } from "@/lib/scene";

interface WaypointProps {
  children: ReactNode;
  /** Scroll-progress window (0..1) over which this section settles in.
   * Default [0, 0] = always settled (hero). */
  range?: [number, number];
  className?: string;
}

export default function Waypoint({ children, range = [0, 0], className }: WaypointProps) {
  const { scrollProgress, tier } = useScene();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [start, end] = range;
  const mid = end > start ? (start + end) / 2 : start;
  // useTransform must be called unconditionally (hook rules); the value is
  // simply not attached to style until we're allowed to animate.
  const opacity = useTransform(scrollProgress, [start, Math.max(mid, start + 0.0001)], [0, 1]);
  const y = useTransform(scrollProgress, [start, Math.max(mid, start + 0.0001)], [48, 0]);

  const animate = mounted && tier !== "static" && end > start;

  return (
    <motion.div className={className} style={animate ? { opacity, y } : undefined}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run to confirm pass**

Run: `npx vitest run components/three/__tests__/Waypoint.test.tsx`
Expected: PASS, all 3 tests.

- [ ] **Step 5: Typecheck + commit**

Run: `npm run typecheck`

```bash
git add components/three/Waypoint.tsx components/three/__tests__/Waypoint.test.tsx
git commit -m "Add SSR-safe, tier-aware Waypoint wrapper"
```

---

### Task 7: The Three.js layer — `FlyPath`, `ClayField`, `SceneCanvas`, `SceneCanvasLazy`

**Files:**
- Create: `components/three/FlyPath.tsx`
- Create: `components/three/ClayField.tsx`
- Create: `components/three/SceneCanvas.tsx`
- Create: `components/three/SceneCanvasLazy.tsx`

**Interfaces:**
- Consumes: `CameraKeyframe`, `SceneVariant` (Task 3); `MotionValue` from `framer-motion`; `Canvas`, `useFrame`, `useThree` from `@react-three/fiber`; `three`.
- Produces:
  - `FlyPath(props: { progress: MotionValue<number>; keyframes: CameraKeyframe[] }): null` — runs inside `<Canvas>`.
  - `ClayField(props: { variant: SceneVariant; quality: "full" | "reduced"; fade: MotionValue<number> }): JSX.Element` — runs inside `<Canvas>`.
  - `SceneCanvas(props: { progress: MotionValue<number>; keyframes: CameraKeyframe[]; variant: SceneVariant; tier: "full" | "reduced" }): JSX.Element`.
  - `SceneCanvasLazy` — default export, `"use client"`, wraps `SceneCanvas` in `next/dynamic(..., { ssr: false })`. This is the **only** module Task 8 imports; it is what keeps `three` out of the `static`-tier bundle.

**No automated tests.** jsdom has no WebGL2 context, so `<Canvas>` cannot mount under Vitest — the spec calls this the manually-verified part (Task 10). Typecheck is the gate. Scene composition and camera timing are tuned by eye during Task 10 and Plan 2.

- [ ] **Step 1: Implement `FlyPath.tsx`**

```tsx
"use client";

import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { CameraKeyframe } from "./routeScenes";

const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3); // matches lib/motion EASE feel

function lerp(a: readonly [number, number, number], b: readonly [number, number, number], t: number) {
  return new THREE.Vector3(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
}

export default function FlyPath({
  progress,
  keyframes,
}: {
  progress: MotionValue<number>;
  keyframes: CameraKeyframe[];
}) {
  const { camera, invalidate } = useThree();
  const sorted = useMemo(() => [...keyframes].sort((a, b) => a.at - b.at), [keyframes]);
  const smoothed = useMemo(() => ({ t: progress.get() }), [progress]);

  // frameloop="demand": nothing re-renders unless asked. Scroll progress
  // changes outside React (it's a MotionValue), so invalidate on change.
  useEffect(() => progress.on("change", () => invalidate()), [progress, invalidate]);

  useFrame((_, delta) => {
    if (sorted.length === 0) return;
    // Damp toward the scroll target so a fast flick still eases.
    smoothed.t += (progress.get() - smoothed.t) * Math.min(1, delta * 4);
    const t = smoothed.t;
    let from = sorted[0];
    let to = sorted[sorted.length - 1];
    for (let i = 0; i < sorted.length - 1; i++) {
      if (t >= sorted[i].at && t <= sorted[i + 1].at) {
        from = sorted[i];
        to = sorted[i + 1];
        break;
      }
    }
    const span = to.at - from.at || 1;
    const localT = EASE_OUT(Math.min(1, Math.max(0, (t - from.at) / span)));
    camera.position.copy(lerp(from.position, to.position, localT));
    camera.lookAt(lerp(from.lookAt, to.lookAt, localT));
    invalidate();
  });

  return null;
}
```

- [ ] **Step 2: Implement `ClayField.tsx`**

Procedural soft forms in the clay palette. Instanced rounded geometry + a soft point field. `variant` seeds the layout so each route looks distinct; `quality` drops counts on the `reduced` tier; `fade` (0..1) drives material opacity for the route crossfade.

```tsx
"use client";

import { useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { SceneVariant } from "./routeScenes";

// Clay tokens (app/globals.css :root) as linear-ish hex for three materials.
const CLAY = {
  cream: "#FBF3E7",
  amber: "#E2701F",
  amberLight: "#FBE0C4",
  teal: "#3FA79E",
  tealLight: "#D8F0EC",
  pink: "#EF7FA8",
  pinkLight: "#FBE1E9",
  lavender: "#7B87F5",
  lavenderLight: "#E5E6FD",
} as const;

const VARIANT_ACCENT: Record<SceneVariant, string[]> = {
  home: [CLAY.amberLight, CLAY.pinkLight, CLAY.tealLight, CLAY.lavenderLight],
  about: [CLAY.pinkLight, CLAY.amberLight],
  experience: [CLAY.tealLight, CLAY.cream],
  contact: [CLAY.lavenderLight, CLAY.amberLight],
  drift: [CLAY.cream, CLAY.amberLight],
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED: Record<SceneVariant, number> = { home: 7, about: 21, experience: 42, contact: 63, drift: 99 };

export default function ClayField({
  variant,
  quality,
  fade,
}: {
  variant: SceneVariant;
  quality: "full" | "reduced";
  fade: MotionValue<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const blobCount = quality === "full" ? 14 : 7;
  const accents = VARIANT_ACCENT[variant];

  const blobs = useMemo(() => {
    const rand = mulberry32(SEED[variant]);
    return Array.from({ length: blobCount }, (_, i) => ({
      position: [
        (rand() - 0.5) * 16,
        (rand() - 0.5) * 12,
        -rand() * 34 - 2,
      ] as [number, number, number],
      scale: 0.6 + rand() * 1.8,
      color: accents[i % accents.length],
      drift: 0.2 + rand() * 0.5,
    }));
  }, [variant, blobCount, accents]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const opacity = fade.get();
    const time = state.clock.elapsedTime;
    g.children.forEach((child, i) => {
      child.position.y += Math.sin(time * blobs[i]?.drift + i) * 0.0015;
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = opacity;
        mat.transparent = true;
      }
    });
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.85} color={CLAY.cream} />
      <directionalLight position={[6, 8, 4]} intensity={0.7} color="#ffffff" />
      {blobs.map((b, i) => (
        <mesh key={i} position={b.position} scale={b.scale}>
          <icosahedronGeometry args={[1, 4]} />
          <meshStandardMaterial color={b.color} roughness={0.9} metalness={0} transparent opacity={0} flatShading={false} />
        </mesh>
      ))}
    </group>
  );
}
```

- [ ] **Step 3: Implement `SceneCanvas.tsx`**

Holds the `<Canvas>`, pauses when hidden, and crossfades between the outgoing and incoming `ClayField` when `variant` changes.

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { motionValue, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import ClayField from "./ClayField";
import FlyPath from "./FlyPath";
import type { CameraKeyframe, SceneVariant } from "./routeScenes";

interface SceneCanvasProps {
  progress: MotionValue<number>;
  keyframes: CameraKeyframe[];
  variant: SceneVariant;
  tier: "full" | "reduced";
}

export default function SceneCanvas({ progress, keyframes, variant, tier }: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  // Crossfade: keep the previous variant mounted at fade 1->0 while the new
  // one goes 0->1 over ~0.6s.
  const [layers, setLayers] = useState<{ variant: SceneVariant; fade: MotionValue<number> }[]>(() => [
    { variant, fade: motionValue(1) },
  ]);

  useEffect(() => {
    setLayers((prev) => {
      if (prev[prev.length - 1]?.variant === variant) return prev;
      const incoming = { variant, fade: motionValue(0) };
      const start = performance.now();
      const DURATION = 600;
      const tick = () => {
        const k = Math.min(1, (performance.now() - start) / DURATION);
        incoming.fade.set(k);
        prev.forEach((l) => l.fade.set(1 - k));
        if (k < 1) requestAnimationFrame(tick);
        else setLayers([incoming]);
      };
      requestAnimationFrame(tick);
      return [...prev, incoming];
    });
  }, [variant]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 });
    observer.observe(node);
    const onVis = () => setActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const dpr: [number, number] = tier === "full" ? [1, 2] : [1, 1];

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 -z-0" aria-hidden="true">
      <Canvas
        frameloop={active ? "demand" : "never"}
        dpr={dpr}
        gl={{ antialias: tier === "full", powerPreference: "high-performance" }}
        camera={{ fov: 50, position: keyframes[0]?.position ?? [0, 0, 8] }}
      >
        <color attach="background" args={["#FBF3E7"]} />
        {layers.map((l, i) => (
          <ClayField key={`${l.variant}-${i}`} variant={l.variant} quality={tier} fade={l.fade} />
        ))}
        <FlyPath progress={progress} keyframes={keyframes} />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 4: Implement `SceneCanvasLazy.tsx`**

```tsx
"use client";

import dynamic from "next/dynamic";

/** The only entry point app/layout.tsx imports. next/dynamic with ssr:false
 * plus the tier gate in layout means `three` is fetched only when a visitor
 * actually resolves to the full/reduced tier. */
const SceneCanvasLazy = dynamic(() => import("./SceneCanvas"), { ssr: false });

export default SceneCanvasLazy;
```

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS. If `@react-three/fiber` JSX intrinsics (`<mesh>`, `<icosahedronGeometry>`, ...) are unrecognized, add `import type {} from "@react-three/fiber";` is not enough — confirm `"types": ["@react-three/fiber"]` is not required; v8 augments JSX automatically once any file imports from it. If errors persist, add `/// <reference types="@react-three/fiber" />` at the top of `SceneCanvas.tsx`.

- [ ] **Step 6: Run the full suite (no regression)**

Run: `npm test`
Expected: PASS — this task adds no tests.

- [ ] **Step 7: Commit**

```bash
git add components/three/FlyPath.tsx components/three/ClayField.tsx components/three/SceneCanvas.tsx components/three/SceneCanvasLazy.tsx
git commit -m "Add the clay 3D scene: camera rig, procedural field, tiered canvas"
```

---

### Task 8: Wire the layer into `app/layout.tsx`

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `SceneProvider` (Task 4), `ScrollProgressBar` (Task 5), `SceneCanvasLazy` (Task 7).
- Produces: the canvas + progress bar live on every route.

**Why a small client sub-component:** `app/layout.tsx` is a Server Component and must stay one (it exports `metadata`). The tier gate (`useScene().canFly`) and the `<SceneCanvasLazy>` render are client concerns, so they go in a tiny `"use client"` component that sits inside `<SceneProvider>`.

- [ ] **Step 1: Create the canvas mount sub-component**

Create `components/three/SceneLayer.tsx`:

```tsx
"use client";

import { useScene } from "@/lib/scene";
import SceneCanvasLazy from "./SceneCanvasLazy";

/** Renders the 3D canvas only once the tier has resolved to full/reduced.
 * Until then (and forever on the static tier) it renders nothing and the
 * plain cream page background shows through. */
export default function SceneLayer() {
  const { canFly, tier, scene, scrollProgress } = useScene();
  if (!canFly || (tier !== "full" && tier !== "reduced")) return null;
  return (
    <SceneCanvasLazy
      progress={scrollProgress}
      keyframes={scene.keyframes}
      variant={scene.variant}
      tier={tier}
    />
  );
}
```

Add its import to Task 7's commit set if executing out of order; otherwise commit it with this task.

- [ ] **Step 2: Edit `app/layout.tsx`**

In [app/layout.tsx](app/layout.tsx), add imports:

```tsx
import { SceneProvider } from "@/lib/scene";
import SceneLayer from "@/components/three/SceneLayer";
import ScrollProgressBar from "@/components/motion/ScrollProgressBar";
```

Wrap the existing `<body>` children in `<SceneProvider>` and mount the two new pieces just after `<SmoothScroll />`:

```tsx
      <body className="flex min-h-screen flex-col bg-cream font-body text-ink">
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript()}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        <SceneProvider>
          <SmoothScroll />
          <SceneLayer />
          <ScrollProgressBar />
          <a
            href="#main-content"
            className="sr-only rounded-full bg-clay-amber px-4 py-2 text-sm font-semibold text-surface focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
          >
            Skip to content
          </a>
          <Header />
          <main id="main-content" className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-6 sm:px-8">
            {children}
          </main>
          <Footer />
        </SceneProvider>
      </body>
```

Note the one change to `<main>`: added `relative z-10` so content sits above the `-z-0` canvas. Leave the theme `<Script>` and `suppressHydrationWarning` alone — Plan 3 removes those.

- [ ] **Step 3: Give the header its own stacking context**

In [components/Header.tsx](components/Header.tsx), the root is `<header className="relative z-20">` already — no change needed. Confirm it reads `z-20` (above content `z-10` and canvas `-z-0`). If a future edit dropped it, restore `relative z-20`.

- [ ] **Step 4: Typecheck + full suite**

Run: `npm run typecheck && npm test`
Expected: PASS. `app/__tests__/template.test.tsx` and `page.test.tsx` render within the App Router test setup; if either now renders a component tree that calls `useScene()` without a `SceneProvider`, wrap the render in the test or add `SceneProvider` to the shared test utility. Fix any such test by wrapping, not by weakening `useScene`'s guard.

- [ ] **Step 5: Build + verify export**

Run: `npm run build && npm run verify:export`
Expected: PASS. Watch the build log for "`three`" appearing in the **first-load JS** of any route — it must only appear in an async chunk. If the homepage's first-load JS grew by the size of three (~150 KB+), the dynamic import was bypassed — check that nothing imports `SceneCanvas` (not `SceneCanvasLazy`) directly.

- [ ] **Step 6: Commit**

```bash
git add app/layout.tsx components/three/SceneLayer.tsx
git commit -m "Mount the persistent 3D canvas and scroll progress bar site-wide"
```

---

### Task 9: Rebuild the homepage as a fly-through

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/HomeHero.tsx`

**Interfaces:**
- Consumes: `Waypoint` (Task 6).
- Produces: the live homepage flying through the `home` scene.

**What changes:** the homepage keeps every section and all content. Each in-flow section is wrapped in a `<Waypoint range={...}>` so it fades/rises into place as the camera passes its point in the scroll. `<AmbientColorDrift />` is removed (the 3D scene is the backdrop now; the panels keep their own `clay-*-light` backgrounds so they stay legible over the scene). The hero's decorative `ClayBlobBackdrop` SVG is removed — the real scene replaces it.

Scroll-range budget for `/` (the `home` scene camera settles by 0.15, then drifts through the rest):

| Section | `range` |
|---|---|
| `HomeHero` | `[0, 0]` (always settled) |
| `StatBand` | `[0.15, 0.30]` |
| Affiliations / `OrgLogoGrid` | `[0.30, 0.45]` |
| About preview panel | `[0.45, 0.60]` |
| Experience preview panel | `[0.60, 0.75]` |
| Contact preview panel | `[0.78, 0.92]` |

- [ ] **Step 1: Remove `ClayBlobBackdrop` from `HomeHero.tsx`**

In [components/HomeHero.tsx](components/HomeHero.tsx):
- Delete the `ClayBlobBackdrop` function (lines ~28–60) and both `<ClayBlobBackdrop parallaxX={blobX} parallaxY={blobY} />` usages.
- Delete the now-unused `blobX` / `blobY` `useTransform` calls and the `BLOB_DEPTH` const.
- Keep everything else — the pointer parallax on the heading/photo, the scroll-exit transform, `LineReveal`, the marquee. The `ParallaxProps` interface and `parallaxX`/`parallaxY` params are now only used by nothing — delete `ParallaxProps` too.

- [ ] **Step 2: Run HomeHero's test**

Run: `npx vitest run components/__tests__/HomeHero.test.tsx`
Expected: PASS — the test asserts the name/description/CTA render (see the file); removing the decorative SVG doesn't touch those. If the test references `ClayBlobBackdrop` or `blob`, update it to drop that assertion.

- [ ] **Step 3: Rewrite `app/page.tsx`**

Replace the file with the version below. It is the current file with: `AmbientColorDrift` import + element removed, and each section wrapped in `Waypoint`. Content, links, and component usage are otherwise unchanged.

```tsx
import Link from "next/link";
import { site, social } from "@/content/site";
import { employment, credentials, education, type TimelineEntry } from "@/content/experience";
import HomeHero from "@/components/HomeHero";
import StatBand from "@/components/StatBand";
import OrgLogoGrid from "@/components/OrgLogoGrid";
import OrgMark from "@/components/OrgMark";
import PhotoFrame from "@/components/PhotoFrame";
import Tilt from "@/components/motion/Tilt";
import Magnetic from "@/components/motion/Magnetic";
import Waypoint from "@/components/three/Waypoint";
import { linkClass, navLinkClass, primaryButtonClass } from "@/lib/ui";

const EXPERIENCE_HIGHLIGHTS: TimelineEntry[] = [employment[0], credentials[0], education[0]];

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

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <Waypoint>
        <HomeHero />
      </Waypoint>

      <Waypoint range={[0.15, 0.3]}>
        <StatBand />
      </Waypoint>

      <Waypoint range={[0.3, 0.45]}>
        <p className="inline-block rounded-full bg-clay-amber-light px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-amber">
          Affiliations &amp; credentials
        </p>
        <div className="mt-6">
          <OrgLogoGrid />
        </div>
      </Waypoint>

      <Waypoint range={[0.45, 0.6]} className="rounded-[2rem] bg-clay-pink-light px-6 py-14 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-[minmax(0,140px)_1fr] sm:items-center sm:gap-12">
          <Tilt>
            <PhotoFrame
              src={site.photo.src}
              alt={site.photo.alt}
              width={site.photo.width}
              height={site.photo.height}
              className="mx-auto h-32 w-32 sm:mx-0"
            />
          </Tilt>
          <div>
            <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-pink">
              01 · About
            </p>
            <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold text-ink sm:text-5xl">
              {site.tagline}
            </h2>
            <p className="mt-6 max-w-xl rounded-[1.5rem] bg-surface px-6 py-5 text-lg leading-relaxed text-ink shadow-clay-raised">
              {site.description}
            </p>
            <ArrowLink href="/about">View full profile</ArrowLink>
          </div>
        </div>
      </Waypoint>

      <Waypoint range={[0.6, 0.75]} className="rounded-[2rem] bg-clay-teal-light px-6 py-14 sm:py-20">
        <p className="inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-teal">
          02 · Experience
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">A working history.</h2>
        <div className="relative mt-8 max-w-xl">
          <div aria-hidden="true" className="pointer-events-none absolute bottom-1 left-[19px] top-1 w-px bg-ink/10" />
          <ol className="space-y-6">
            {EXPERIENCE_HIGHLIGHTS.map((entry) => (
              <li key={`${entry.org}-${entry.period}`} className="relative flex items-start gap-4 pl-10">
                <span
                  aria-hidden="true"
                  className="absolute left-3 top-2 h-3 w-3 rounded-full bg-clay-teal ring-4 ring-clay-teal-light"
                />
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
        </div>
        <ArrowLink href="/experience">View full timeline</ArrowLink>
      </Waypoint>

      <Waypoint range={[0.78, 0.92]} className="rounded-[2rem] bg-clay-lavender-light px-6 py-14 text-center sm:py-20">
        <Tilt className="mx-auto inline-block">
          <PhotoFrame
            src={site.photo.src}
            alt={site.photo.alt}
            width={site.photo.width}
            height={site.photo.height}
            className="mx-auto h-24 w-24"
          />
        </Tilt>
        <p className="mt-6 inline-block rounded-full bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-wide text-clay-lavender">
          03 · Contact
        </p>
        <h2 className="mt-4 font-display text-4xl font-bold text-ink sm:text-5xl">Get in touch.</h2>
        <p className="mt-6">
          <Magnetic>
            <a href={`mailto:${site.email}`} className={primaryButtonClass}>
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
        <ArrowLink href="/contact">View full contact</ArrowLink>
      </Waypoint>
    </div>
  );
}
```

Removed vs. the current file: `import Reveal` (replaced by `Waypoint`), `import AmbientColorDrift` and `<AmbientColorDrift />`. Everything else — every string, link, and component — is identical.

- [ ] **Step 4: Delete the now-dead AmbientColorDrift mount only**

Do **not** delete `components/motion/AmbientColorDrift.tsx` or its test in this plan — Plan 3 removes the file with the rest of the theme system. This plan only stops rendering it.

- [ ] **Step 5: Update `app/__tests__/page.test.tsx`**

Run: `npx vitest run app/__tests__/page.test.tsx`
Expected: it may FAIL now because the rendered tree calls `useScene()` (via `Waypoint`) with no provider. Fix by wrapping the render in `SceneProvider`:

```tsx
import { SceneProvider } from "@/lib/scene";
// ...
render(
  <SceneProvider>
    <HomePage />
  </SceneProvider>
);
```

Keep every existing assertion (headings, links, content). Add one:

```tsx
it("still renders every section's content with the fly-through wrapper", () => {
  render(<SceneProvider><HomePage /></SceneProvider>);
  expect(screen.getByRole("link", { name: /view full profile/i })).toHaveAttribute("href", "/about");
  expect(screen.getByRole("link", { name: /view full timeline/i })).toHaveAttribute("href", "/experience");
  expect(screen.getByText(/get in touch/i)).toBeInTheDocument();
});
```

- [ ] **Step 6: Typecheck + full suite**

Run: `npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 7: Build + verify export**

Run: `npm run build && npm run verify:export`
Expected: PASS — `Export verification passed`. This proves the homepage still ships all real content in static HTML with the fly-through wrapper in place.

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx components/HomeHero.tsx app/__tests__/page.test.tsx components/__tests__/HomeHero.test.tsx
git commit -m "Rebuild the homepage as a clay fly-through with per-section waypoints"
```

---

### Task 10: Manual browser verification

**Files:** none. This is the part the automated suite cannot cover (no WebGL in jsdom).

- [ ] **Step 1: Start dev server**

Run: `npm run dev` (leave running, port 3000).

- [ ] **Step 2: Desktop full-tier pass**

With a browser tool (Playwright), open `http://localhost:3000/` at 1440×900. Screenshot: initial view, then after scrolling to ~25%, ~50%, ~75%, ~100%. Confirm:
- the clay scene is visible behind the content and the camera moves as you scroll;
- the scroll progress bar at the top fills left-to-right and tracks scroll;
- the header stays above the canvas;
- each section fades/rises in near its scroll range and all text stays legible over the scene (panels keep their `clay-*-light` backgrounds).

- [ ] **Step 3: Route-change crossfade pass**

From `/`, click the header **About** link, then **Home**. Confirm the scene crossfades (no hard cut, no WebGL context error in the console) and the camera resets to the new route's start pose. `/about` etc. still show placeholder camera paths from Task 3 — that is expected; Plan 2 tunes them.

- [ ] **Step 4: Mobile pass**

390×844, reload. Confirm touch scroll drives the camera, nothing overflows horizontally, the progress bar is visible, and the scene runs at the `reduced` quality (fewer blobs — check the console tier log if you added one, or just confirm it is smooth).

- [ ] **Step 5: Low-end pass**

DevTools → CPU 4× slowdown, reload `/`. Confirm the frame probe downgrades to `reduced` or `static` and the page stays responsive (no locked scroll, no multi-second jank).

- [ ] **Step 6: Reduced-motion / static-tier pass**

Emulate `prefers-reduced-motion: reduce`, reload `/`. Confirm:
- **no `<canvas>` element exists** in the DOM (`document.querySelector("canvas")` → null);
- the Network tab shows **no `three` / `@react-three` chunk** was fetched;
- every section is visible immediately, in place, no transforms;
- the progress bar still renders (without spring lag) — or is absent only if the page is not scrollable.

- [ ] **Step 7: Direct sub-route pass**

Open `/about`, `/experience`, `/contact` directly. Confirm they render their existing content unchanged and the progress bar / canvas behave (placeholder camera paths are fine).

- [ ] **Step 8: Throttled Lighthouse**

Run a mobile Lighthouse audit on `http://localhost:3000/` (DevTools Lighthouse panel, mobile + throttling). Record all four category scores. Per the spec, Performance is expected to drop on the 3D tiers — record the number as the new baseline to protect. Accessibility / Best Practices / SEO should stay ≥ 90; if any of those three regressed, fix before closing the plan.

- [ ] **Step 9: Record findings**

Write the screenshots + Lighthouse numbers into the PR description / plan notes. If any pass fails (jank, canvas on the static tier, content unreachable, a11y/SEO regression), fix and re-run that pass. When all pass, Plan 1 is complete.

---

## Self-Review

**1. Spec coverage (Plan 1's slice):**

| Spec item | Task |
|---|---|
| Approach A: one persistent canvas in the layout | 7, 8 |
| `SceneProvider` context (tier + shared scrollYProgress) | 4 |
| `deviceTier` expanded to full/reduced/static | 2 |
| `SceneCanvas` dynamic-imported, only on full/reduced | 7 (`SceneCanvasLazy`), 8 (`SceneLayer` gate) |
| `ClayField` procedural soft forms, clay palette, per-route variant | 7 |
| `FlyPath` camera rig, scroll-driven, eased | 7 |
| `routeScenes` per-route keyframe registry | 3 |
| `SceneController` crossfade on navigation | 7 (folded into `SceneCanvas`'s layer state — noted deviation below) |
| `Waypoint` revived, SSR-safe, tier-aware | 6 |
| `CssFlythroughFallback` (static tier) | 6 — **folded into `Waypoint`**: on the `static` tier `Waypoint` renders children in place with no transform. A separate component added nothing; noted deviation. |
| `ScrollProgressBar` site-wide, spring on full tier, self-hide when not scrollable | 5 |
| Homepage camera path + waypoints | 3, 9 |
| Content stays server-rendered; `verify-export` passes unmodified | 8, 9 (build + verify steps) |
| `prefers-reduced-motion` → static, everything in place | 2, 6, 10 (step 6) |
| Lenis kept, DOM motion primitives untouched | Global Constraints; no task modifies them |
| Dark-mode removal | **Plan 3** — out of scope here; Task 9 only stops rendering `AmbientColorDrift` |
| `/about`, `/experience`, `/contact`, 404 camera paths | **Plan 2** — Task 3 ships placeholder keyframes so the registry is testable now |

**2. Placeholder scan:** the `/about`/`/experience`/`/contact` keyframes in Task 3 are explicitly labelled placeholders tuned in Plan 2, and are real, valid data now (tests pass, scenes render) — not a `TODO`. No other placeholders.

**3. Type consistency:** `CameraKeyframe` / `SceneVariant` / `RouteScene` defined in Task 3, consumed with the same names in Tasks 4, 7. `DeviceTier` from Task 2 consumed in Tasks 4, 7, 8. `SceneContextValue` fields (`tier`, `scrollProgress`, `scene`, `canFly`) defined in Task 4, read with those names in Tasks 5, 6, 8. `SceneCanvas` props (`progress`, `keyframes`, `variant`, `tier`) match between Task 7's definition and Task 8's `SceneLayer` call site. `Waypoint` prop `range?: [number, number]` default `[0,0]` consistent between Task 6 and Task 9's usage.

**Noted deviations from the spec's module list** (both reduce surface area, no behavior lost):
- `SceneController.tsx` — not a separate file; the crossfade is `SceneCanvas`'s internal `layers` state keyed off the `variant` prop, which `SceneLayer` already derives from the router.
- `CssFlythroughFallback.tsx` — not a separate file; `Waypoint` handles the `static` tier by rendering in place. If Plan 2 needs richer CSS parallax for the static tier, add it there.
