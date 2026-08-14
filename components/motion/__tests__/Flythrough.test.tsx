import { render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Flythrough from "../Flythrough";
import { employment, credentials, education } from "@/content/experience";

// Real @react-three/fiber Canvas needs a real WebGL context and
// ResizeObserver, neither of which jsdom provides (no polyfill configured in
// vitest.setup.ts) -- mounting it for real would hang or throw for reasons
// entirely unrelated to what's under test in this file (whether reduceMotion
// is correctly independent of `tier`). Stubbed to a plain marker element so
// tests can assert tier genuinely went non-static via canFly's other effect
// (this mounting at all) without touching real WebGL.
vi.mock("../SceneCanvas", () => ({
  default: () => <div data-testid="scene-canvas-stub" />,
}));

const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;

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

afterAll(() => {
  Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
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
      expect(screen.queryByTestId("scene-canvas-stub")).not.toBeInTheDocument();
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
        expect(screen.queryByTestId("scene-canvas-stub")).not.toBeInTheDocument();
      });
    });
  });

  // Guards the orthogonality claim in Flythrough.tsx's own comment: `tier`
  // also collapses to "static" whenever WebGL2 is simply unavailable, which
  // must NOT be conflated with an actual reduced-motion preference. This
  // test alone doesn't fully discriminate the most natural regression
  // (reduceMotion derived as `tier === "static"`, equivalently `!canFly`)
  // -- verified by literally applying that regression and re-running: it
  // still PASSED, because tier resolves non-static here regardless of which
  // implementation is used, so both agree. It's kept anyway as a real check
  // that a capable device's tier resolving away from "static" doesn't itself
  // become some OTHER incorrect signal for the fade (e.g. tier === null vs.
  // settled). See Flythrough.reduceMotion.test.tsx for the test that
  // actually rules out the `tier === "static"` proxy specifically -- it
  // needs a different technique (inspecting the prop passed to Waypoint
  // directly, in its own file with Waypoint mocked) because a DOM-style
  // presence check can't reliably discriminate it here: see that file's
  // top-of-file comment for why.
  describe("with WebGL2 available and no reduced-motion preference", () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;

    beforeEach(() => {
      // detectWebGL2() does `document.createElement("canvas").getContext("webgl2") !== null`.
      // jsdom has no WebGL2 implementation at all (it throws "not
      // implemented"), so stub just enough of the real platform API for
      // detectWebGL2()'s own, unmodified implementation to see a capable
      // device -- deliberately not mocking `detectWebGL2` itself via
      // vi.mock, since that was verified NOT to work: resolveDeviceTier()
      // calls detectWebGL2() as a same-module closure reference, which a
      // vi.mock override of the exported binding does not intercept (only
      // cross-module imports of the mocked export are affected).
      HTMLCanvasElement.prototype.getContext = vi.fn(function (
        this: HTMLCanvasElement,
        contextId: string,
        options?: unknown
      ) {
        if (contextId === "webgl2") return {} as unknown as WebGL2RenderingContext;
        return (originalGetContext as (id: string, opts?: unknown) => unknown).call(
          this,
          contextId,
          options
        );
      }) as typeof HTMLCanvasElement.prototype.getContext;
    });

    afterEach(() => {
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it("still applies the live, scroll-linked waypoint style -- reduceMotion is not derived from tier", async () => {
      render(<Flythrough hero={<h1>Hero content</h1>} />);

      // Confirm tier genuinely settled away from "static" (canFly true) --
      // otherwise this test would prove nothing about the orthogonality
      // claim it exists to guard.
      await waitFor(() => {
        expect(screen.getByTestId("scene-canvas-stub")).toBeInTheDocument();
      });

      // If reduceMotion were ever (re)derived from `tier` instead of
      // prefersReducedMotion(), this would incorrectly come back empty, the
      // same way the reduced-motion test above asserts zero matches.
      expect(
        document.querySelectorAll('[style*="opacity"], [style*="transform"]').length
      ).toBeGreaterThan(0);
    });
  });

  it("renders one experience highlight from each of employment, credentials, and education", () => {
    render(<Flythrough hero={<h1>Hero content</h1>} />);
    // employment[0]'s "role · org" string is reused verbatim as the third
    // pinned-crossfade line in the Contact PinnedStatement, so it legitimately
    // renders twice: once in the Experience waypoint's list, once in Contact's
    // crossfade slot -- getAllByText (not getByText) accommodates that.
    expect(
      screen.getAllByText(`${employment[0].role} · ${employment[0].org}`).length
    ).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(`${credentials[0].role} · ${credentials[0].org}`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${education[0].role} · ${education[0].org}`)
    ).toBeInTheDocument();
  });
});
