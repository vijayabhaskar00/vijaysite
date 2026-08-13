import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
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

  // jsdom doesn't implement matchMedia by default, so prefersReducedMotion()
  // resolves false in the test above (typeof window.matchMedia !== "function"
  // short-circuits to false) -- exercising the "true" branch here needs an
  // explicit stub, same pattern as deviceTier.test.ts's prefersReducedMotion
  // suite.
  describe("with prefers-reduced-motion: reduce", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("threads reduceMotion through to every waypoint, so none carry a scroll-linked opacity/transform style", async () => {
      vi.stubGlobal(
        "matchMedia",
        vi.fn().mockReturnValue({ matches: true })
      );

      render(<Flythrough hero={<h1>Hero content</h1>} />);

      // Content is present and immediately visible -- no waypoint div was
      // ever given a hiding opacity/transform, unlike the normal-motion path.
      expect(screen.getByText("Get in touch.")).toBeInTheDocument();
      expect(
        document.querySelectorAll('[style*="opacity"], [style*="transform"]')
      ).toHaveLength(0);

      // Also matches the normal-motion test's canvas assertion, letting
      // resolveDeviceTier's async tier resolution settle before the test ends.
      await waitFor(() => {
        expect(document.querySelector("canvas")).not.toBeInTheDocument();
      });
    });
  });
});
