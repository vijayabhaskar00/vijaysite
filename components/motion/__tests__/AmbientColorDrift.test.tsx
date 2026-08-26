import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AmbientColorDrift from "../AmbientColorDrift";

describe("AmbientColorDrift", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.removeAttribute("data-theme");
    localStorage.clear();
  });

  it("renders nothing when IntersectionObserver is unavailable (jsdom has none)", () => {
    const { container } = render(<AmbientColorDrift />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders an aria-hidden, pointer-events-none full-bleed layer once IntersectionObserver is available", async () => {
    class StubIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);

    const { container } = render(<AmbientColorDrift />);

    const layer = await waitFor(() => {
      const el = container.querySelector('[aria-hidden="true"]');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });

    expect(layer).toHaveClass("pointer-events-none", "fixed", "inset-0", "-z-30");
    expect(layer).toHaveAttribute("style");
  });

  it("tints toward the dark palette's color stops, not the light one, when the page is in dark mode", async () => {
    document.documentElement.setAttribute("data-theme", "dark");
    class StubIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);

    const { container } = render(<AmbientColorDrift />);

    const layer = await waitFor(() => {
      const el = container.querySelector('[aria-hidden="true"]') as HTMLElement | null;
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });

    // scrollYProgress starts at 0 in jsdom, so the layer paints the first
    // color stop -- light-theme cream (#FBF3E7 / rgb(251, 243, 231)) would
    // be a bug here, the dark-theme cream (#1B140F / rgb(27, 20, 15)) is
    // the whole point of this test.
    expect(layer.style.backgroundColor).toBe("rgb(27, 20, 15)");
  });

  it("re-tints to the dark stops when the theme switches AFTER mount, not just when it starts dark", async () => {
    // Regression test: a real visitor toggles dark mode mid-session far
    // more often than they land with it already on, and that path had a
    // real bug -- useTransform's backgroundColor motion value recomputed
    // correctly internally (confirmed via .get()) but the already-mounted
    // <motion.div>'s DOM style kept tracking the light stops regardless,
    // verified live with Playwright by toggling dark mode and scrolling:
    // the rendered backgroundColor never left the light palette. Fixed by
    // giving the element key={theme} so a theme change unmounts/remounts
    // it with a fresh MotionValue instead of reusing the stale one.
    class StubIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);

    const { container } = render(<AmbientColorDrift />);

    await waitFor(() => {
      const el = container.querySelector('[aria-hidden="true"]') as HTMLElement | null;
      expect(el?.style.backgroundColor).toBe("rgb(251, 243, 231)"); // light cream
    });

    // Mirrors lib/theme.ts's applyTheme(): set the DOM attribute, then
    // fire the same event useTheme() listens for.
    document.documentElement.setAttribute("data-theme", "dark");
    window.dispatchEvent(new Event("sitethemechange"));

    await waitFor(() => {
      const el = container.querySelector('[aria-hidden="true"]') as HTMLElement | null;
      expect(el?.style.backgroundColor).toBe("rgb(27, 20, 15)"); // dark cream
    });
  });
});
