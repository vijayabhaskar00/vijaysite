import { act, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { motionValue } from "framer-motion";
import { describe, expect, it, vi } from "vitest";
import Waypoint from "../Waypoint";

const useMotionValueEventSpy = vi.hoisted(() => vi.fn());
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    useMotionValueEvent: (...args: Parameters<typeof actual.useMotionValueEvent>) => {
      useMotionValueEventSpy(...args);
      return actual.useMotionValueEvent(...args);
    },
  };
});

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

  // Regression tests for a bug where the rendered element's opacity got
  // permanently stuck at 0 in real browsers (confirmed via Playwright scroll
  // sweeps), even though the derived MotionValue kept computing the correct
  // value on every scroll frame and the paired `y` transform animated
  // correctly. Framer Motion's declarative `style` binding for `opacity`
  // never wrote the updated value to the DOM once `style` flipped from
  // `undefined` (pre-mount, for the no-JS/SSR-visible guarantee) to a
  // populated object post-mount; `y` only looked reactive because Framer
  // Motion's projection system re-applies transforms every frame
  // independently of that (broken) binding.
  //
  // Note: this failure mode does NOT reproduce in jsdom -- verified directly
  // by running the "keeps opacity reactive" test below against the pre-fix
  // declarative-binding implementation, which passed it too, since jsdom's
  // simplified render/paint pipeline doesn't hit whatever real-browser-only
  // condition breaks the declarative binding's write-back. So a second,
  // structural test pins down the actual fix (driving opacity imperatively
  // via useMotionValueEvent instead of through `style`), which *does* fail
  // if that wiring is removed, regardless of jsdom's blind spot to the
  // original runtime failure.
  describe("opacity regression (bug found in real-browser manual verification)", () => {
    it("keeps opacity reactive on the DOM as scroll progress crosses the waypoint's range", async () => {
      const progress = motionValue(0);
      render(
        <Waypoint range={[0.4, 0.6]} progress={progress}>
          <p>About preview</p>
        </Waypoint>
      );
      const node = screen.getByText("About preview").parentElement as HTMLElement;

      // Post-mount, before the range: gated to invisible, matching y's
      // pre-range translateY(40px) starting state.
      await waitFor(() => expect(node.style.opacity).toBe("0"));

      act(() => {
        progress.set(0.6); // past the range's midpoint (0.5) -> opacity should reach 1
      });

      await waitFor(() => expect(node.style.opacity).toBe("1"));
    });

    it("drives opacity through useMotionValueEvent rather than Framer Motion's declarative style binding", () => {
      useMotionValueEventSpy.mockClear();
      const progress = motionValue(0);
      render(
        <Waypoint range={[0.4, 0.6]} progress={progress}>
          <p>About preview</p>
        </Waypoint>
      );

      // The opacity MotionValue must be subscribed to imperatively -- this
      // is what actually reaches the DOM in real browsers. If a future
      // change removes this subscription and goes back to putting `opacity`
      // straight in the `style` object, this assertion fails even though
      // jsdom itself can't reproduce the original rendering defect.
      expect(useMotionValueEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ get: expect.any(Function) }),
        "change",
        expect.any(Function)
      );
    });
  });

  // A reduced-motion visitor must get zero scroll-linked animation at all
  // (per docs/superpowers/specs/2026-08-13-3d-flythrough-motion-design.md:
  // "every waypoint's content shown in place", not just "no 3D canvas").
  // Found missing during Task 9's real-browser manual verification under
  // `prefers-reduced-motion: reduce` emulation: the waypoints still rendered
  // `opacity: 0; transform: translateY(40px)` pending scroll.
  describe("reduceMotion prop", () => {
    it("renders content with no hiding style when reduceMotion is true, even for a waypoint whose range hasn't been reached", async () => {
      const progress = motionValue(0);
      render(
        <Waypoint range={[0.4, 0.6]} progress={progress} reduceMotion>
          <p>About preview</p>
        </Waypoint>
      );
      const node = screen.getByText("About preview").parentElement as HTMLElement;

      // Give any effects a chance to run; there should be nothing to apply.
      await waitFor(() => expect(node).toBeInTheDocument());
      expect(node.getAttribute("style")).toBeNull();
    });

    it("never applies opacity or transform, even once scroll progress moves through and past the range", async () => {
      const progress = motionValue(0);
      render(
        <Waypoint range={[0.4, 0.6]} progress={progress} reduceMotion>
          <p>About preview</p>
        </Waypoint>
      );
      const node = screen.getByText("About preview").parentElement as HTMLElement;

      act(() => {
        progress.set(1); // fully past the range -- would be opacity 1 / translateY(0) if reduceMotion were ignored
      });

      // No waitFor here: asserting a negative (nothing was ever written) has
      // to be checked as a steady-state fact, not raced against a timeout.
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(node.getAttribute("style")).toBeNull();
    });

    it("never bakes opacity:0 into server-rendered markup regardless of reduceMotion", () => {
      const progress = motionValue(0);
      const html = renderToStaticMarkup(
        <Waypoint range={[0.7, 0.9]} progress={progress} reduceMotion>
          <p>Contact preview</p>
        </Waypoint>
      );
      expect(html).toContain("Contact preview");
      expect(html).not.toMatch(/opacity:\s*0/);
    });
  });
});
