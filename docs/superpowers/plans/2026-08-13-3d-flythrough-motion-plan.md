# 3D Fly-Through Homepage & Motion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the homepage a scroll-driven, tiered-performance 3D fly-through (Three.js via `@react-three/fiber`) with a percentage-loader intro, while every existing route, every existing CSS motion interaction, and the site's no-JS/crawler-visible guarantee stay exactly as they are today.

**Architecture:** A new `components/motion/` module adds device-tier detection, an intro overlay, a scroll-progress-driven camera rig, and content "waypoints" — all client-only, all additive on top of unchanged server-rendered HTML. `app/page.tsx` composes the existing hero content plus three new waypoints (About/Experience/Contact previews, each linking to its real route) inside a new `Flythrough` wrapper. The Three.js canvas is `position: fixed`, behind the content, and is only downloaded/mounted for devices whose tier resolves to `full` or `reduced`; `static`-tier devices (no WebGL2, `prefers-reduced-motion`, or a failing frame-time probe) never fetch the Three.js bundle at all.

**Tech Stack:** Next.js 14 (App Router, static export), React 18, TypeScript, `three` + `@react-three/fiber` + `@react-three/drei`, `framer-motion`, Vitest + `@testing-library/react`.

**Spec:** `docs/superpowers/specs/2026-08-13-3d-flythrough-motion-design.md`

## Global Constraints

- Static export only (`next.config.mjs` has `output: 'export'`) — no server-only APIs, no API routes, no `cookies()`/`headers()`.
- Path alias `@/*` maps to the project root.
- Every server-rendered route (`/`, `/about`, `/experience`, `/contact`) must contain full real content, unconditionally visible in the HTML — verified by `npm run build && npm run verify:export`, which must keep passing unmodified throughout this plan.
- `prefers-reduced-motion: reduce` must resolve the device tier to `static` (no intro, no camera movement, waypoint content shown in place).
- No content is ever duplicated as a second, divergent copy — homepage waypoint previews read from the same `content/site.ts` / `content/experience.ts` modules that `/about`, `/experience`, `/contact` already use.
- `Reveal`, `.link-sweep`, `.marquee-track`, `.photo-frame` — **do not modify.** They are proven and load-bearing for the no-JS guarantee; this project only adds new motion, it does not migrate existing motion (see spec's Migration section for why).
- No orbit/drag camera controls — the camera path is authored keyframes driven only by scroll position.
- Design tokens (`ink`, `paper`, `amber`, `signal`, `mute`, `line`) and fonts (`--font-display`, `--font-body`, `--font-mono`) come from `tailwind.config.ts` / `lib/fonts.ts` — reuse them, don't invent new colors.

---

## File Structure

```
components/
  motion/
    deviceTier.ts          — pure tier-decision logic + browser signal collection
    IntroOverlay.tsx        — client-only intro sequence
    Waypoint.tsx             — scroll-range content reveal wrapper
    FlyPath.tsx              — Three.js camera rig (runs inside <Canvas>)
    SceneCanvas.tsx          — the <Canvas> wrapper, tier-aware, pause-on-hidden
    Flythrough.tsx           — composes intro + canvas + hero + waypoints
    __tests__/
      deviceTier.test.ts
      Waypoint.test.tsx
      IntroOverlay.test.tsx
      Flythrough.test.tsx
app/
  page.tsx                  — rewired to render <Flythrough hero={...} />
components/
  Header.tsx                 — add stacking-context z-index (small, see Task 7)
  Footer.tsx                  — add stacking-context z-index (small, see Task 7)
package.json                 — new dependencies
```

---

### Task 1: Add 3D and motion dependencies

**Files:**
- Modify: `package.json`, `package-lock.json` (via `npm install`)

**Interfaces:**
- Produces: `three`, `@react-three/fiber`, `@react-three/drei`, `framer-motion` available to import from any component in later tasks.

- [ ] **Step 1: Confirm the baseline is green before changing anything**

Run: `npm run typecheck && npm test`
Expected: both pass (this is the existing, unmodified site).

- [ ] **Step 2: Install the runtime dependencies**

Run: `npm install three @react-three/fiber @react-three/drei framer-motion`

- [ ] **Step 3: Install type definitions**

Run: `npm install -D @types/three`

- [ ] **Step 4: Verify the install didn't break anything**

Run: `npm run typecheck && npm test`
Expected: both still pass — nothing in the codebase imports the new packages yet, so this only confirms the install itself is sound.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add three.js, react-three-fiber, drei, and framer-motion dependencies"
```

---

### Task 2: Device-tier detection (`deviceTier.ts`)

**Files:**
- Create: `components/motion/deviceTier.ts`
- Test: `components/motion/__tests__/deviceTier.test.ts`

**Interfaces:**
- Produces:
  - `type DeviceTier = "full" | "reduced" | "static"`
  - `interface TierSignals { hasWebGL2: boolean; prefersReducedMotion: boolean; deviceMemory?: number; hardwareConcurrency?: number; avgFrameMs: number | null }`
  - `function decideTier(signals: TierSignals): DeviceTier` — pure
  - `function detectWebGL2(): boolean`
  - `function prefersReducedMotion(): boolean`
  - `function measureAvgFrameMs(sampleCount?: number): Promise<number>`
  - `function resolveDeviceTier(): Promise<DeviceTier>` — the one function later tasks call
- Consumes: nothing (leaf module).

- [ ] **Step 1: Write the failing tests**

Create `components/motion/__tests__/deviceTier.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { decideTier, detectWebGL2, prefersReducedMotion } from "../deviceTier";

describe("decideTier", () => {
  it("returns static when reduced motion is preferred, regardless of other signals", () => {
    expect(
      decideTier({
        hasWebGL2: true,
        prefersReducedMotion: true,
        deviceMemory: 8,
        hardwareConcurrency: 8,
        avgFrameMs: 8,
      })
    ).toBe("static");
  });

  it("returns static when WebGL2 is unavailable", () => {
    expect(
      decideTier({ hasWebGL2: false, prefersReducedMotion: false, avgFrameMs: 8 })
    ).toBe("static");
  });

  it("returns full when every signal is healthy", () => {
    expect(
      decideTier({
        hasWebGL2: true,
        prefersReducedMotion: false,
        deviceMemory: 8,
        hardwareConcurrency: 8,
        avgFrameMs: 10,
      })
    ).toBe("full");
  });

  it("returns reduced when device memory is low", () => {
    expect(
      decideTier({ hasWebGL2: true, prefersReducedMotion: false, deviceMemory: 2, avgFrameMs: 10 })
    ).toBe("reduced");
  });

  it("returns reduced when hardware concurrency is low", () => {
    expect(
      decideTier({
        hasWebGL2: true,
        prefersReducedMotion: false,
        hardwareConcurrency: 2,
        avgFrameMs: 10,
      })
    ).toBe("reduced");
  });

  it("returns reduced when the frame-time probe is slow (under ~30fps)", () => {
    expect(
      decideTier({ hasWebGL2: true, prefersReducedMotion: false, avgFrameMs: 40 })
    ).toBe("reduced");
  });
});

describe("detectWebGL2", () => {
  it("returns false in jsdom, which has no WebGL2 context", () => {
    expect(detectWebGL2()).toBe(false);
  });
});

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

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run components/motion/__tests__/deviceTier.test.ts`
Expected: FAIL — `../deviceTier` does not exist yet.

- [ ] **Step 3: Implement `deviceTier.ts`**

Create `components/motion/deviceTier.ts`:

```ts
export type DeviceTier = "full" | "reduced" | "static";

export interface TierSignals {
  hasWebGL2: boolean;
  prefersReducedMotion: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  avgFrameMs: number | null;
}

/** Pure decision: what tier should this visitor get? No browser APIs here,
 * so this is the one part of the tiering system that's fully unit-testable. */
export function decideTier(signals: TierSignals): DeviceTier {
  if (signals.prefersReducedMotion || !signals.hasWebGL2) {
    return "static";
  }
  const lowMemory = signals.deviceMemory !== undefined && signals.deviceMemory <= 2;
  const lowCores = signals.hardwareConcurrency !== undefined && signals.hardwareConcurrency <= 2;
  const badFrame = signals.avgFrameMs !== null && signals.avgFrameMs > 33; // worse than ~30fps
  if (lowMemory || lowCores || badFrame) {
    return "reduced";
  }
  return "full";
}

export function detectWebGL2(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return canvas.getContext("webgl2") !== null;
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Samples real frame timing for under a second so a bad result downgrades
 * the tier before any heavy asset loads. */
export function measureAvgFrameMs(sampleCount = 10): Promise<number> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "undefined") {
      resolve(16);
      return;
    }
    const samples: number[] = [];
    let last = performance.now();
    function tick() {
      const now = performance.now();
      samples.push(now - last);
      last = now;
      if (samples.length >= sampleCount) {
        resolve(samples.reduce((a, b) => a + b, 0) / samples.length);
      } else {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  });
}

/** The single entry point later tasks call. Skips the frame-time probe
 * entirely when reduced-motion or missing WebGL2 already force `static` --
 * no reason to spend a second sampling frames for a visitor who was never
 * getting the canvas anyway. */
export async function resolveDeviceTier(): Promise<DeviceTier> {
  const reducedMotion = prefersReducedMotion();
  const hasWebGL2 = detectWebGL2();
  if (reducedMotion || !hasWebGL2) {
    return decideTier({ hasWebGL2, prefersReducedMotion: reducedMotion, avgFrameMs: null });
  }
  const nav =
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { deviceMemory?: number })
      : undefined;
  const avgFrameMs = await measureAvgFrameMs();
  return decideTier({
    hasWebGL2,
    prefersReducedMotion: reducedMotion,
    deviceMemory: nav?.deviceMemory,
    hardwareConcurrency: nav?.hardwareConcurrency,
    avgFrameMs,
  });
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run components/motion/__tests__/deviceTier.test.ts`
Expected: PASS, all 9 tests.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/motion/deviceTier.ts components/motion/__tests__/deviceTier.test.ts
git commit -m "Add device-tier detection for the 3D fly-through"
```

---

### Task 3: `Waypoint` — scroll-range content reveal

**Files:**
- Create: `components/motion/Waypoint.tsx`
- Test: `components/motion/__tests__/Waypoint.test.tsx`

**Interfaces:**
- Consumes: nothing new (only `framer-motion`'s `MotionValue`/`motionValue`/`useTransform`, already installed in Task 1).
- Produces: `export default function Waypoint(props: { children: ReactNode; range: [number, number]; progress: MotionValue<number>; className?: string }): JSX.Element` — used by Task 6 (`Flythrough.tsx`).

**Why this needs care:** Framer Motion resolves `style={{ opacity, y }}` synchronously at render time, including on the server. If a `MotionValue`-driven style were applied unconditionally, a waypoint scheduled to appear later in the scroll (progress 0 at load) would render `opacity: 0` directly into the static HTML — permanently invisible to anyone without working JS. The fix: don't apply the live style until after mount (`mounted` state, flipped in `useEffect`, which never runs during server rendering). Before mount, there's no `style` prop at all, so the element is visible by normal document flow — exactly the same "visible unless JS confirms otherwise" contract `Reveal` already uses.

- [ ] **Step 1: Write the failing tests**

Create `components/motion/__tests__/Waypoint.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { motionValue } from "framer-motion";
import { describe, expect, it } from "vitest";
import Waypoint from "../Waypoint";

describe("Waypoint", () => {
  it("renders its content regardless of current scroll progress", () => {
    const progress = motionValue(0);
    render(
      <Waypoint range={[0.4, 0.6]} progress={progress}>
        <p>About preview</p>
      </Waypoint>
    );
    expect(screen.getByText("About preview")).toBeInTheDocument();
  });

  it("never bakes opacity:0 into server-rendered markup, even for a waypoint scheduled later in the scroll", () => {
    const progress = motionValue(0);
    const html = renderToStaticMarkup(
      <Waypoint range={[0.7, 0.9]} progress={progress}>
        <p>Contact preview</p>
      </Waypoint>
    );
    expect(html).toContain("Contact preview");
    expect(html).not.toMatch(/opacity:\s*0/);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run components/motion/__tests__/Waypoint.test.tsx`
Expected: FAIL — `../Waypoint` does not exist yet.

- [ ] **Step 3: Implement `Waypoint.tsx`**

Create `components/motion/Waypoint.tsx`:

```tsx
"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

interface WaypointProps {
  children: ReactNode;
  /** Scroll-progress range (0-1) over which this waypoint settles into place. */
  range: [number, number];
  progress: MotionValue<number>;
  className?: string;
}

export default function Waypoint({ children, range, progress, className }: WaypointProps) {
  // Not applied until after mount -- see the file-level note in the plan/spec
  // for why this guards the no-JS/SSR-visible guarantee.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [start, end] = range;
  const mid = (start + end) / 2;
  const opacity = useTransform(progress, [start, mid], [0, 1]);
  const y = useTransform(progress, [start, mid], [40, 0]);

  return (
    <motion.div className={className} style={mounted ? { opacity, y } : undefined}>
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run components/motion/__tests__/Waypoint.test.tsx`
Expected: PASS, both tests.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/motion/Waypoint.tsx components/motion/__tests__/Waypoint.test.tsx
git commit -m "Add Waypoint: scroll-range content reveal, SSR-safe by construction"
```

---

### Task 4: `IntroOverlay` — percentage loader / kinetic intro

**Files:**
- Create: `components/motion/IntroOverlay.tsx`
- Test: `components/motion/__tests__/IntroOverlay.test.tsx`

**Interfaces:**
- Consumes: `site.shortName` from `@/content/site`.
- Produces: `export default function IntroOverlay(props: { enabled: boolean }): JSX.Element` — used by Task 6.
  - `enabled` should be `true` only once device-tier resolution has settled on `"full"` or `"reduced"` — tier resolution already folds `prefers-reduced-motion` into `"static"` (Task 2), so `IntroOverlay` itself needs no separate reduced-motion check.

- [ ] **Step 1: Write the failing tests**

Create `components/motion/__tests__/IntroOverlay.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import IntroOverlay from "../IntroOverlay";

describe("IntroOverlay", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    document.body.style.overflow = "";
  });

  it("renders nothing when not enabled", () => {
    render(<IntroOverlay enabled={false} />);
    expect(screen.queryByText("Scroll to begin")).not.toBeInTheDocument();
  });

  it("shows the intro when enabled and the session hasn't seen it yet", () => {
    render(<IntroOverlay enabled />);
    expect(screen.getByText("Scroll to begin")).toBeInTheDocument();
  });

  it("does not show again once the session has already seen it", () => {
    window.sessionStorage.setItem("intro-shown", "1");
    render(<IntroOverlay enabled />);
    expect(screen.queryByText("Scroll to begin")).not.toBeInTheDocument();
  });

  it("marks the session as seen and hides itself when dismissed by click", () => {
    render(<IntroOverlay enabled />);
    fireEvent.click(screen.getByTestId("intro-overlay"));
    expect(window.sessionStorage.getItem("intro-shown")).toBe("1");
  });

  it("never renders any markup on the server -- it's a purely additive client enhancement", () => {
    const html = renderToStaticMarkup(<IntroOverlay enabled />);
    expect(html).toBe("");
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run components/motion/__tests__/IntroOverlay.test.tsx`
Expected: FAIL — `../IntroOverlay` does not exist yet.

- [ ] **Step 3: Implement `IntroOverlay.tsx`**

Create `components/motion/IntroOverlay.tsx`:

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

const SESSION_KEY = "intro-shown";
const MAX_DURATION_MS = 1500;

interface IntroOverlayProps {
  enabled: boolean;
}

export default function IntroOverlay({ enabled }: IntroOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [percent, setPercent] = useState(0);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setVisible(false);
    document.body.style.overflow = "";
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable (e.g. private browsing) -- the intro
      // simply replays next time, which is harmless.
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let alreadyShown = false;
    try {
      alreadyShown = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      alreadyShown = false;
    }
    if (alreadyShown) return;

    finishedRef.current = false;
    setVisible(true);
    document.body.style.overflow = "hidden";
    const start = performance.now();
    let frame: number;

    const tick = () => {
      const elapsed = performance.now() - start;
      setPercent(Math.min(100, Math.round((elapsed / MAX_DURATION_MS) * 100)));
      if (elapsed < MAX_DURATION_MS) {
        frame = requestAnimationFrame(tick);
      } else {
        finish();
      }
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener("keydown", finish);

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", finish);
    };
  }, [enabled, finish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          data-testid="intro-overlay"
          role="presentation"
          aria-hidden="true"
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={finish}
          onWheel={finish}
          onTouchMove={finish}
        >
          <motion.p
            className="font-display text-4xl font-black uppercase tracking-tight text-paper sm:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {site.shortName}
          </motion.p>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-mute">{percent}%</p>
          <p className="mt-10 font-mono text-[11px] uppercase tracking-widest text-mute">
            Scroll to begin
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run components/motion/__tests__/IntroOverlay.test.tsx`
Expected: PASS, all 5 tests.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/motion/IntroOverlay.tsx components/motion/__tests__/IntroOverlay.test.tsx
git commit -m "Add IntroOverlay: session-gated percentage loader, purely additive on the server"
```

---

### Task 5: `FlyPath` + `SceneCanvas` — the Three.js layer

**Files:**
- Create: `components/motion/FlyPath.tsx`
- Create: `components/motion/SceneCanvas.tsx`

**Interfaces:**
- Consumes: `type DeviceTier` from `./deviceTier` (Task 2).
- Produces:
  - `interface CameraKeyframe { at: number; position: [number, number, number]; lookAt: [number, number, number] }`
  - `export default function FlyPath(props: { progress: MotionValue<number>; keyframes: CameraKeyframe[] }): null` — mounted inside `<Canvas>`.
  - `export default function SceneCanvas(props: { progress: MotionValue<number>; keyframes: CameraKeyframe[]; tier: Extract<DeviceTier, "full" | "reduced"> }): JSX.Element` — used by Task 6, always loaded via `next/dynamic(..., { ssr: false })` there, never imported statically.

**No automated test for this task.** jsdom has no WebGL2 context, so `@react-three/fiber`'s `<Canvas>` cannot render in Vitest — this is the one part of the system the spec explicitly calls out as manually verified (Task 9) rather than unit tested. Typechecking is still required and is this task's pass/fail gate.

- [ ] **Step 1: Implement the camera rig**

Create `components/motion/FlyPath.tsx`:

```tsx
"use client";

import { useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

export interface CameraKeyframe {
  /** Scroll progress (0-1) at which the camera reaches this position. */
  at: number;
  position: [number, number, number];
  lookAt: [number, number, number];
}

interface FlyPathProps {
  progress: MotionValue<number>;
  keyframes: CameraKeyframe[];
}

function lerpVector(a: [number, number, number], b: [number, number, number], t: number): THREE.Vector3 {
  return new THREE.Vector3(
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  );
}

export default function FlyPath({ progress, keyframes }: FlyPathProps) {
  const { camera, invalidate } = useThree();
  const sorted = useMemo(() => [...keyframes].sort((a, b) => a.at - b.at), [keyframes]);

  // The canvas uses frameloop="demand" (see SceneCanvas) to avoid a
  // continuous 60fps loop on low-end devices, so nothing re-renders unless
  // something explicitly asks for it. Scroll progress changes outside
  // React's render cycle (it's a framer-motion MotionValue), so we have to
  // manually invalidate the frame whenever it changes.
  useEffect(() => {
    const unsubscribe = progress.on("change", () => invalidate());
    return () => unsubscribe();
  }, [progress, invalidate]);

  useFrame(() => {
    const t = progress.get();
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
    const localT = Math.min(1, Math.max(0, (t - from.at) / span));
    camera.position.copy(lerpVector(from.position, to.position, localT));
    camera.lookAt(lerpVector(from.lookAt, to.lookAt, localT));
  });

  return null;
}
```

- [ ] **Step 2: Implement the canvas wrapper**

Create `components/motion/SceneCanvas.tsx`:

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import FlyPath, { type CameraKeyframe } from "./FlyPath";
import type { DeviceTier } from "./deviceTier";

interface SceneCanvasProps {
  progress: MotionValue<number>;
  keyframes: CameraKeyframe[];
  tier: Extract<DeviceTier, "full" | "reduced">;
}

/** Abstract particle field standing in for the scene's geometry -- procedural,
 * not a modeled asset, per the spec's non-goal of not building a bespoke 3D
 * asset pipeline. */
function ParticleField({ count }: { count: number }) {
  const [positions] = useState(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 40 - 10;
    }
    return arr;
  });

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#5B8CFF" size={0.05} sizeAttenuation transparent opacity={0.8} />
    </points>
  );
}

export default function SceneCanvas({ progress, keyframes, tier }: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  // Pause rendering (frameloop="never") when off-screen or the tab is
  // hidden -- the canvas is a fixed full-viewport backdrop, so "off-screen"
  // in practice means the user navigated away via the header nav without a
  // full page reload being needed, or backgrounded the tab.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(node);
    const onVisibility = () => setActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const dpr: [number, number] = tier === "full" ? [1, 2] : [1, 1];
  const particleCount = tier === "full" ? 1200 : 400;

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        frameloop={active ? "demand" : "never"}
        dpr={dpr}
        camera={{ fov: 50, position: keyframes[0]?.position ?? [0, 0, 5] }}
      >
        <ambientLight intensity={0.6} />
        <ParticleField count={particleCount} />
        <FlyPath progress={progress} keyframes={keyframes} />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Run the full test suite to confirm no regression**

Run: `npm test`
Expected: PASS — this task adds no tests, so this just confirms nothing else broke.

- [ ] **Step 5: Commit**

```bash
git add components/motion/FlyPath.tsx components/motion/SceneCanvas.tsx
git commit -m "Add the Three.js camera rig and tiered, pause-aware canvas"
```

---

### Task 6: `Flythrough` — compose intro, canvas, hero, and waypoints

**Files:**
- Create: `components/motion/Flythrough.tsx`
- Test: `components/motion/__tests__/Flythrough.test.tsx`

**Interfaces:**
- Consumes: `IntroOverlay` (Task 4), `Waypoint` (Task 3), `SceneCanvas`/`CameraKeyframe` (Task 5, dynamically imported), `resolveDeviceTier`/`DeviceTier` (Task 2), `site`/`social` from `@/content/site`, `employment` from `@/content/experience`, `linkClass`/`navLinkClass` from `@/lib/ui`.
- Produces: `export default function Flythrough(props: { hero: ReactNode }): JSX.Element` — used by Task 7 (`app/page.tsx`).

- [ ] **Step 1: Write the failing test**

Create `components/motion/__tests__/Flythrough.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import Flythrough from "../Flythrough";

beforeAll(() => {
  // jsdom returns an all-zero rect for every element, which is fine for
  // framer-motion's useScroll (it just won't reflect real scroll math in
  // this environment) but this makes the intent explicit and stable across
  // jsdom versions rather than relying on the zeroed default.
  Element.prototype.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      width: 800,
      height: 2000,
      top: 0,
      left: 0,
      right: 800,
      bottom: 2000,
      toJSON: () => {},
    }) as DOMRect;
});

describe("Flythrough", () => {
  it("renders the hero content and every waypoint's real, linked content unconditionally", async () => {
    render(<Flythrough hero={<h1>Hero content</h1>} />);

    expect(screen.getByText("Hero content")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view full profile/i })).toHaveAttribute(
      "href",
      "/about"
    );
    expect(screen.getByRole("link", { name: /view full timeline/i })).toHaveAttribute(
      "href",
      "/experience"
    );
    expect(screen.getByText("Get in touch.")).toBeInTheDocument();

    // jsdom has no WebGL2 context, so device-tier resolution settles on
    // "static" -- the 3D canvas must never mount in that case.
    await waitFor(() => {
      expect(document.querySelector("canvas")).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx vitest run components/motion/__tests__/Flythrough.test.tsx`
Expected: FAIL — `../Flythrough` does not exist yet.

- [ ] **Step 3: Implement `Flythrough.tsx`**

Create `components/motion/Flythrough.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useScroll } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { resolveDeviceTier, type DeviceTier } from "./deviceTier";
import IntroOverlay from "./IntroOverlay";
import Waypoint from "./Waypoint";
import type { CameraKeyframe } from "./FlyPath";
import { site, social } from "@/content/site";
import { employment } from "@/content/experience";
import { linkClass, navLinkClass } from "@/lib/ui";

// Loaded only when tier is "full"/"reduced" (see the conditional render
// below) -- never fetched at all for "static"-tier visitors.
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

const KEYFRAMES: CameraKeyframe[] = [
  { at: 0, position: [0, 0, 6], lookAt: [0, 0, 0] },
  { at: 0.33, position: [2, 0.5, 3], lookAt: [0, 0, -4] },
  { at: 0.66, position: [-2, -0.5, 0], lookAt: [0, 0, -8] },
  { at: 1, position: [0, 0.5, -3], lookAt: [0, 0, -12] },
];

interface FlythroughProps {
  hero: ReactNode;
}

export default function Flythrough({ hero }: FlythroughProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const [tier, setTier] = useState<DeviceTier | null>(null);

  useEffect(() => {
    let cancelled = false;
    resolveDeviceTier().then((resolved) => {
      if (!cancelled) setTier(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const canFly = tier === "full" || tier === "reduced";

  return (
    <div ref={trackRef} className="relative">
      <IntroOverlay enabled={canFly} />
      {canFly && tier && (
        <SceneCanvas progress={scrollYProgress} keyframes={KEYFRAMES} tier={tier} />
      )}

      <div className="relative z-10">
        <div className="min-h-screen">{hero}</div>

        <Waypoint range={[0.25, 0.45]} progress={scrollYProgress} className="min-h-screen py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">About</p>
          <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            {site.tagline}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-mute">{site.description}</p>
          <Link href="/about" className={`mt-6 inline-block ${linkClass}`}>
            View full profile →
          </Link>
        </Waypoint>

        <Waypoint range={[0.55, 0.75]} progress={scrollYProgress} className="min-h-screen py-24">
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

        <Waypoint range={[0.85, 1]} progress={scrollYProgress} className="min-h-screen py-24">
          <p className="font-mono text-xs uppercase tracking-widest text-amber">Contact</p>
          <h2 className="mt-4 font-display text-4xl font-bold uppercase text-paper sm:text-5xl">
            Get in touch.
          </h2>
          <p className="mt-6">
            <a href={`mailto:${site.email}`} className={`text-lg ${linkClass}`}>
              {site.email}
            </a>
          </p>
          <ul className="mt-6 flex list-none flex-wrap gap-x-6 gap-y-2 p-0 font-mono text-xs uppercase tracking-widest">
            {social.map((item) => (
              <li key={item.href}>
                <a href={item.href} target="_blank" rel="noreferrer noopener" className={navLinkClass}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </Waypoint>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npx vitest run components/motion/__tests__/Flythrough.test.tsx`
Expected: PASS.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/motion/Flythrough.tsx components/motion/__tests__/Flythrough.test.tsx
git commit -m "Add Flythrough: composes intro, tiered canvas, hero, and waypoints"
```

---

### Task 7: Wire `Flythrough` into the homepage; fix stacking order

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/Header.tsx`
- Modify: `components/Footer.tsx`

**Interfaces:**
- Consumes: `Flythrough` (Task 6).
- Produces: the live homepage.

**Why Header/Footer need a one-line change:** `SceneCanvas` is `position: fixed` with `z-0`. `<header>`/`<footer>` currently have no explicit `z-index`, so their stacking order relative to a fixed, explicitly-`z-0` sibling deep in `<main>` would be decided by DOM paint-order tie-breaking rather than anything deliberate — in practice this can let the fixed canvas paint over the header. Giving both an explicit `z-20` (already above the canvas's `z-0` and below the intro's `z-50`) makes the stacking order deliberate instead of incidental.

- [ ] **Step 1: Rewrite `app/page.tsx`**

Replace the full contents of `app/page.tsx`:

```tsx
import { site, orgNames } from "@/content/site";
import PhotoFrame from "@/components/PhotoFrame";
import SectionDivider from "@/components/SectionDivider";
import StatBand from "@/components/StatBand";
import Marquee from "@/components/Marquee";
import Reveal from "@/components/Reveal";
import Flythrough from "@/components/motion/Flythrough";

export default function HomePage() {
  const hero = (
    <>
      <section className="pb-10 pt-16 sm:pt-24 md:pb-16 md:pt-32">
        <p className="reveal font-mono text-xs uppercase tracking-[0.2em] text-amber">
          {site.location} — {site.tagline}
        </p>
        <h1 className="reveal [animation-delay:80ms] mt-4 text-balance font-display text-[clamp(2.75rem,9vw,7.5rem)] font-black uppercase leading-[0.9] text-paper">
          {site.name}
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
        className="reveal [animation-delay:320ms] border-y border-line py-4 font-mono text-sm uppercase tracking-widest text-mute"
      />

      <Reveal>
        <StatBand />
      </Reveal>

      <SectionDivider />
    </>
  );

  return <Flythrough hero={hero} />;
}
```

Notes on what changed from the current file: the hero section, marquee, and stat band are untouched. The old "Explore" nav list (a flat list of links to About/Experience/Contact) is removed — the new waypoints below the hero now serve that purpose with real preview content, not just a bare link list, so keeping both would be redundant. `nav` is no longer imported here since `exploreLinks` is gone; `linkClass` moved into `Flythrough.tsx`, which is the file that now uses it.

- [ ] **Step 2: Add stacking-context z-index to `Header.tsx`**

In `components/Header.tsx`, change:

```tsx
      <header className="border-b border-line">
```

to:

```tsx
      <header className="relative z-20 border-b border-line">
```

- [ ] **Step 3: Add stacking-context z-index to `Footer.tsx`**

In `components/Footer.tsx`, change:

```tsx
    <footer className="mt-24 border-t border-line">
```

to:

```tsx
    <footer className="relative z-20 mt-24 border-t border-line">
```

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: PASS — `Header.test.tsx` and `Footer.test.tsx` assert link roles/hrefs/text, not exact class strings, so the added classes don't break them. There's no `page.test.tsx` today, so the homepage rewrite itself isn't covered by an existing test; Task 9's manual verification covers it in a real browser.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx components/Header.tsx components/Footer.tsx
git commit -m "Wire Flythrough into the homepage and fix header/footer stacking order"
```

---

### Task 8: Full verification suite

**Files:** none (verification only).

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 2: Full test suite**

Run: `npm test`
Expected: PASS — every test from Tasks 2–7 plus every pre-existing test.

- [ ] **Step 3: Static export build**

Run: `npm run build`
Expected: PASS, `out/` produced. Watch the output for any warning about client-only code leaking into a server-rendered path (there shouldn't be any -- `SceneCanvas` is behind `next/dynamic(..., { ssr: false })`, and everything else in `components/motion/` renders safely on the server per Tasks 3-4's SSR tests).

- [ ] **Step 4: Export content-integrity check**

Run: `npm run verify:export`
Expected: `Export verification passed: no placeholders, all required facts present.` -- this is the automated proof that `/`, `/about`, `/experience`, `/contact` still ship full real content, unconditionally, in the static HTML.

- [ ] **Step 5: If any step fails, stop and fix before continuing**

Do not proceed to Task 9 with a red build or a failing `verify:export` -- that check exists specifically to catch the failure mode this whole plan was designed around avoiding.

---

### Task 9: Manual browser verification (desktop, mobile, low-end)

**Files:** none (manual verification only; this is the one part of the fly-through the automated suite can't cover, per Task 5's note).

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (leave running; default port 3000)

- [ ] **Step 2: Desktop pass**

Using a browser tool (e.g. Playwright), navigate to `http://localhost:3000/`, resize to a desktop viewport (e.g. 1440×900), and screenshot: the intro overlay on first load, the hero after scrolling past the intro, and each of the three waypoints (About/Experience/Contact) while scrolling. Confirm the 3D canvas is visible behind the content and the header stays visibly above it (this is what Task 7's z-index fix exists to guarantee).

- [ ] **Step 3: Mobile pass**

Resize to a mobile viewport (e.g. 390×844), reload, and repeat: confirm touch/scroll drives the camera and waypoints without needing any drag/orbit interaction, content stays readable, and nothing overflows horizontally.

- [ ] **Step 4: Low-end / reduced-motion pass**

With the browser's CPU throttled (e.g. 4x slowdown) and `prefers-reduced-motion: reduce` emulated, reload `/` and confirm: no intro overlay, no 3D canvas (check that no `<canvas>` element exists in the DOM), and all hero/waypoint content is visible immediately and in place.

- [ ] **Step 5: Direct-route pass**

Navigate directly to `/about`, `/experience`, and `/contact`. Confirm each renders exactly as it did before this project (these routes are untouched) and that the header/footer z-index change from Task 7 hasn't visibly altered them.

- [ ] **Step 6: Throttled Lighthouse mobile pass**

Run a mobile Lighthouse audit against `http://localhost:3000/` (e.g. Chrome DevTools' Lighthouse panel with mobile + throttling presets, or `npx lighthouse http://localhost:3000/ --preset=mobile --view`). Record the Performance score. This is the concrete check that the device-tiering strategy (Task 2/5) is actually preventing the regression it exists to prevent, rather than a theoretical mitigation. There's no prior baseline audit from before this project, so treat this as establishing the number to protect going forward rather than a before/after diff.

- [ ] **Step 7: Record findings**

If any pass surfaces a problem (jank, incorrect stacking, canvas visible when it shouldn't be, content not reachable, a materially poor Lighthouse mobile score), fix it and re-run the relevant pass before considering this plan complete. If everything passes, this plan is done.
