import { renderHook, act, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCanAnimate, POINTER_SPRING } from "../motion";

class StubIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("useCanAnimate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts false on the very first render (SSR/pre-hydration safe)", () => {
    const { result } = renderHook(() => useCanAnimate());
    expect(result.current).toBe(false);
  });

  it("stays false when IntersectionObserver is unavailable (jsdom has none by default)", async () => {
    const { result } = renderHook(() => useCanAnimate());
    await act(async () => {});
    expect(result.current).toBe(false);
  });

  it("becomes true once mounted, when IntersectionObserver exists and motion is not reduced", async () => {
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);
    const { result } = renderHook(() => useCanAnimate());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it("stays false when the visitor prefers reduced motion", async () => {
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    );
    const { result } = renderHook(() => useCanAnimate());
    await act(async () => {});
    expect(result.current).toBe(false);
  });
});

describe("POINTER_SPRING", () => {
  it("is the shared spring config used by every cursor-driven component", () => {
    expect(POINTER_SPRING).toEqual({ stiffness: 300, damping: 20 });
  });
});
