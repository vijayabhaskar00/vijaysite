import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Flythrough from "../Flythrough";
import Waypoint from "../Waypoint";

// A dedicated file, not a describe block inside Flythrough.test.tsx, because
// this test needs Waypoint itself mocked -- which would break that file's
// other tests asserting real waypoint content renders. vi.mock's hoisting is
// per-file, so isolating it here keeps the two suites independent.
//
// Why mock Waypoint instead of checking the DOM (as Flythrough.test.tsx does
// for the "WebGL2 available" scenario): `tier` starts `null` and resolves
// asynchronously, so on Flythrough's *first* render, `tier !== "static"` is
// true regardless of whether `reduceMotion` is (correctly) sourced from
// `prefersReducedMotion()` or (a regression) derived as `tier === "static"`
// -- both compute `reduceMotion = false` on that first pass, since tier is
// merely `null`, not yet `"static"`. Any assertion made without forcing a
// wait past settlement would coincidentally pass under either
// implementation, the same "timing accident" flagged in this task's dispatch.
//
// Forcing a wait and *then* inspecting DOM opacity/transform styles doesn't
// work either -- verified empirically: applying the `tier === "static"`
// regression and checking styles after tier settled found
// `opacity: 0; transform: none`. That's neither the correct "still live"
// state nor a clean "suppressed" state: Waypoint's imperative opacity write
// is guarded by `!reduceMotion` and simply stops running once reduceMotion
// flips true post-mount, freezing at whatever value it last wrote (0, from
// the pre-settlement pass), while Framer Motion's own declarative path
// separately (and correctly) resets `transform` to "none" when `style` goes
// back to `undefined`. A `[style*="opacity"]` selector still matches that
// frozen "0", so a presence/absence check can't tell settled-suppressed
// apart from this stale mid-transition residue.
//
// Capturing the actual prop value passed to Waypoint sidesteps all of that:
// it's a direct read of what Flythrough computed, unaffected by Waypoint's
// own DOM side effects or their timing.
vi.mock("../Waypoint", () => ({
  default: vi.fn(() => null),
}));
vi.mock("../SceneCanvas", () => ({
  default: () => null,
}));

const waypointMock = vi.mocked(Waypoint);

describe("Flythrough / reduceMotion-tier orthogonality", () => {
  it("passes reduceMotion=false to every Waypoint once tier settles to 'static' due to missing WebGL2 alone (jsdom's default; no reduced-motion preference)", async () => {
    render(<Flythrough hero={<h1>Hero content</h1>} />);

    const callsBeforeSettling = waypointMock.mock.calls.length;
    expect(callsBeforeSettling).toBeGreaterThan(0); // 3, one per <Waypoint> instance

    // tier settling triggers a re-render of Flythrough regardless of what
    // reduceMotion evaluates to (React re-renders on any state change), so
    // Waypoint gets called again -- an implementation-agnostic signal that
    // we're now looking at post-settlement props rather than the transient
    // pre-resolution ones.
    await waitFor(() => {
      expect(waypointMock.mock.calls.length).toBeGreaterThan(callsBeforeSettling);
    });

    const lastCallProps = waypointMock.mock.calls.at(-1)?.[0] as { reduceMotion?: boolean };
    expect(lastCallProps.reduceMotion).toBe(false);
  });
});
