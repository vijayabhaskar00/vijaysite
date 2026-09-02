import { afterEach, describe, expect, it, vi } from "vitest";
import { decideTier, detectWebGL2, prefersReducedMotion } from "../deviceTier";

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
