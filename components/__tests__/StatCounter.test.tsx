import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StatCounter from "../StatCounter";

describe("StatCounter", () => {
  it("renders a numeric value as plain text when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(<StatCounter value="7" />);
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders a non-numeric value as plain text, unchanged", () => {
    render(<StatCounter value="HYD" />);
    expect(screen.getByText("HYD")).toBeInTheDocument();
  });

  it("applies the passed className to the rendered element", () => {
    render(<StatCounter value="7" className="text-amber" />);
    expect(screen.getByText("7")).toHaveClass("text-amber");
  });

  // Every test above only ever reaches the plain-text fallback branch,
  // because jsdom implements no IntersectionObserver at all -- so the
  // component's actual counting behaviour (the branch that sets `--num` and
  // hands the animation over to .stat-counter's CSS transition) went
  // unobserved. This stubs the minimum of the real API the component uses
  // and fires the intersection by hand.
  describe("once scrolled into view", () => {
    afterEach(() => {
      // jsdom has no IntersectionObserver of its own, so this restores the
      // global to genuinely undefined -- which is exactly what the
      // fallback-branch tests above depend on.
      vi.unstubAllGlobals();
    });

    function stubIntersectionObserver() {
      let trigger: (() => void) | null = null;
      class MockIntersectionObserver {
        constructor(callback: IntersectionObserverCallback) {
          trigger = () =>
            callback(
              [{ isIntersecting: true } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver
            );
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      }
      vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
      return () => {
        if (!trigger) throw new Error("IntersectionObserver was never constructed");
        act(() => trigger!());
      };
    }

    it("switches to the CSS counter, targeting the real value via --num", () => {
      const intersect = stubIntersectionObserver();
      const { container } = render(<StatCounter value="7" className="text-amber" />);

      // Before intersection it's still the plain-text fallback.
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(container.querySelector(".stat-counter")).toBeNull();

      intersect();

      const counter = container.querySelector(".stat-counter") as HTMLElement;
      expect(counter).not.toBeNull();
      expect(counter).toHaveClass("text-amber"); // caller styling survives the swap
      // The number itself is rendered by CSS (counter(num) on ::before,
      // transitioned via the registered @property --num in globals.css), so
      // the only thing this component owes the DOM is the target value...
      expect(counter.getAttribute("style")).toMatch(/--num:\s*7/);
      // ...plus an accessible name, since the visible text is pseudo-element
      // content that assistive tech can't be relied on to announce.
      expect(counter).toHaveAttribute("aria-label", "7");
    });

    it("leaves a non-numeric value as plain text even when it scrolls into view", () => {
      const intersect = stubIntersectionObserver();
      const { container } = render(<StatCounter value="HYD" />);

      // Non-numeric values never observe at all, so nothing can fire.
      expect(() => intersect()).toThrow(/never constructed/);
      expect(container.querySelector(".stat-counter")).toBeNull();
      expect(screen.getByText("HYD")).toBeInTheDocument();
    });
  });
});
