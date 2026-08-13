export type DeviceTier = "full" | "reduced" | "static";

export interface TierSignals {
  hasWebGL2: boolean;
  prefersReducedMotion: boolean;
  deviceMemory?: number;
  hardwareConcurrency?: number;
  avgFrameMs: number | null;
  isMobile?: boolean;
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
  if (lowMemory || lowCores || badFrame || signals.isMobile) {
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

/** A media-query-based mobile/touch signal -- more robust than user-agent
 * sniffing, and the spec's tiering table's "mobile UA" reduced-tier trigger
 * that decideTier otherwise has no way to see. Deliberately not UA-based:
 * iOS never exposes deviceMemory and typical mobile hardwareConcurrency
 * (4-8) overlaps with plenty of desktops, so without this most phones would
 * land in "full" -- the heaviest rendering path. */
export function isCoarsePointerOrNarrowViewport(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(pointer: coarse), (max-width: 768px)").matches;
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
  const isMobile = isCoarsePointerOrNarrowViewport();
  if (reducedMotion || !hasWebGL2) {
    return decideTier({
      hasWebGL2,
      prefersReducedMotion: reducedMotion,
      avgFrameMs: null,
      isMobile,
    });
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
    isMobile,
  });
}
