import { render, screen, act, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Reveal from "../Reveal";

describe("Reveal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders its children", () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders plain, immediately-visible content with no motion styles when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>
    );
    const wrapper = screen.getByText("Hello").parentElement;
    expect(wrapper).not.toHaveAttribute("style");
  });

  it("passes the className through on the plain (pre-motion) render", () => {
    render(
      <Reveal className="my-class">
        <p>Hello</p>
      </Reveal>
    );
    expect(screen.getByText("Hello").parentElement).toHaveClass("my-class");
  });

  // jsdom has no real frame timing, so a Framer Motion tween never actually
  // completes there -- there is no reliable way to observe "opacity reached
  // 1" in this environment. What IS reliably observable, and what this test
  // asserts instead: once IntersectionObserver is available (canAnimate
  // becomes true), Reveal switches to the motion.div branch and applies its
  // hidden initial state correctly -- and firing the intersection callback
  // doesn't throw.
  it("renders the animated branch with its hidden initial state once IntersectionObserver is available, and handles intersecting without error", async () => {
    let trigger: (() => void) | null = null;
    class MockIntersectionObserver {
      constructor(callback: IntersectionObserverCallback) {
        trigger = () =>
          callback([{ isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

    render(
      <Reveal delayMs={120}>
        <p>Hello</p>
      </Reveal>
    );

    const wrapper = await waitFor(() => {
      const el = screen.getByText("Hello").parentElement as HTMLElement;
      expect(el).toHaveAttribute("style");
      return el;
    });

    expect(getComputedStyle(wrapper).opacity).toBe("0");
    expect(getComputedStyle(wrapper).transform).toContain("translateY");

    await act(async () => {
      trigger?.();
    });

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
