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
