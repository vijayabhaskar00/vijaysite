import { act, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { motionValue } from "framer-motion";
import { describe, expect, it } from "vitest";
import PinnedStatement, { buildFadeSegments } from "../PinnedStatement";

describe("buildFadeSegments", () => {
  it("splits a range into equal-width trapezoid-fade segments, with the last segment never fading out", () => {
    const segments = buildFadeSegments([0, 1], 2);
    expect(segments).toHaveLength(2);

    const [first, last] = segments;
    expect(first[0]).toBe(0); // first segment starts at range start
    expect(first[3]).toBeCloseTo(0.5); // first segment ends at the midpoint

    expect(last[0]).toBeCloseTo(0.5); // second segment starts at the midpoint
    expect(last[2]).toBe(1); // fallStart pinned to range end -- never fades before it
    expect(last[3]).toBeGreaterThan(1); // fallEnd sits beyond range end -- never actually reached
  });

  // The case above is the brief's toy example. This one pins the actual
  // production parameters used by Flythrough's Contact section (two
  // crossfade lines + the resting CTA = 3 slots across [0.72, 1]) so a
  // future change to either the range or the line count has to consciously
  // re-check that every slot still lands inside the sticky pin's window
  // (progress ~0.745-1 -- see Flythrough.tsx's range comment).
  it("subdivides the production Contact range across its three real slots", () => {
    const segments = buildFadeSegments([0.72, 1], 3);
    expect(segments).toHaveLength(3);

    const width = (1 - 0.72) / 3; // ~0.0933 of total page progress per slot
    expect(segments[0][0]).toBe(0.72); // first slot starts exactly at range start
    expect(segments[0][1]).toBeCloseTo(0.72 + width * 0.25, 4); // fully visible by ~0.743
    expect(segments[0][3]).toBeCloseTo(0.72 + width, 4);
    expect(segments[1][0]).toBeCloseTo(0.72 + width, 4); // slot 2 picks up where slot 1 ends
    expect(segments[2][0]).toBeCloseTo(0.72 + width * 2, 4); // ~0.907

    // The final slot (the resting CTA) fades in over the first quarter of
    // its own segment -- fully visible by ~0.93 -- and then holds, because
    // its fade-out points sit at/beyond the range end.
    expect(segments[2][1]).toBeCloseTo(0.93, 4);
    expect(segments[2][2]).toBe(1);
    expect(segments[2][3]).toBeGreaterThan(1);
  });
});

describe("PinnedStatement", () => {
  it("renders every line and the final content regardless of current scroll progress", () => {
    const progress = motionValue(0);
    render(
      <PinnedStatement progress={progress} range={[0.85, 1]} lines={["Line one", "Line two"]}>
        <p>Final CTA</p>
      </PinnedStatement>
    );
    expect(screen.getByText("Line one")).toBeInTheDocument();
    expect(screen.getByText("Line two")).toBeInTheDocument();
    expect(screen.getByText("Final CTA")).toBeInTheDocument();
  });

  it("never bakes opacity:0 into server-rendered markup", () => {
    const progress = motionValue(0);
    const html = renderToStaticMarkup(
      <PinnedStatement progress={progress} range={[0.85, 1]} lines={["Line one"]}>
        <p>Final CTA</p>
      </PinnedStatement>
    );
    expect(html).toContain("Line one");
    expect(html).toContain("Final CTA");
    expect(html).not.toMatch(/opacity:\s*0/);
  });

  // Regression test for a real accessibility bug: FadeSlots are absolutely
  // stacked on top of each other, so a hidden slot's content still sits
  // geometrically on top of whichever slot is actually visible. Without
  // this, a keyboard user tabbing through the page can land focus on
  // invisible (opacity: 0) links -- the browser's default scrollIntoView
  // only cares about geometric bounding rects, and once the sticky wrapper
  // is on-screen at all, every slot's content is already geometrically "in
  // view," so there's no further scroll to reveal what's actually focused.
  //
  // Note: jsdom does not implement the `inert` attribute's actual runtime
  // behavior (it doesn't remove elements from tab order or the
  // accessibility tree the way real evergreen browsers do), so this test
  // can only verify the *mechanism* -- that the attribute and pointer-events
  // style are correctly toggled as opacity crosses the threshold -- not the
  // resulting browser behavior itself. A manual check in a real browser
  // (Tab through the Contact section mid-crossfade and confirm focus never
  // lands on an invisible link) is the fuller verification for that.
  describe("inactive slot pointer/keyboard safety", () => {
    it("marks a not-yet-visible decorative line slot inert and non-clickable, and restores it once it becomes visible", async () => {
      const progress = motionValue(1); // past "Line one"'s window, on the final slot
      render(
        <PinnedStatement progress={progress} range={[0, 1]} lines={["Line one"]}>
          <a href="/contact">Final CTA</a>
        </PinnedStatement>
      );

      const lineSlot = screen.getByText("Line one").parentElement as HTMLElement;

      await waitFor(() => expect(lineSlot).toHaveAttribute("inert"));
      expect(lineSlot.style.pointerEvents).toBe("none");

      act(() => {
        progress.set(0.25); // back into "Line one"'s fade-in/hold window
      });

      await waitFor(() => expect(lineSlot).not.toHaveAttribute("inert"));
      expect(lineSlot.style.pointerEvents).toBe("auto");
    });

    // The counterpart guarantee, and a regression test for a real
    // accessibility bug the gating above originally caused: the FINAL slot
    // holds this section's only contact links (mailto, socials, "View full
    // contact"). Gating those on opacity left keyboard and screen-reader
    // users with no way to reach them until scroll progress was nearly at
    // the very end -- strictly worse than having no crossfade at all. It is
    // exempt, so only opacity is ever written to it.
    it("never makes the final content slot inert or unclickable, at any scroll progress", async () => {
      const progress = motionValue(0); // nothing of the final slot is visible yet
      render(
        <PinnedStatement progress={progress} range={[0, 1]} lines={["Line one"]}>
          <a href="/contact">Final CTA</a>
        </PinnedStatement>
      );

      const ctaSlot = screen.getByText("Final CTA").parentElement as HTMLElement;

      // Opacity is still driven (it fades in with scroll like any slot)...
      await waitFor(() => expect(ctaSlot.style.opacity).toBe("0"));
      // ...but interactivity is never taken away.
      expect(ctaSlot).not.toHaveAttribute("inert");
      expect(ctaSlot.style.pointerEvents).toBe("");

      for (const value of [0.25, 0.5, 0.9, 1]) {
        act(() => {
          progress.set(value);
        });
        expect(ctaSlot).not.toHaveAttribute("inert");
        expect(ctaSlot.style.pointerEvents).toBe("");
      }
      await waitFor(() => expect(ctaSlot.style.opacity).toBe("1")); // still fades in normally
    });
  });

  describe("reduceMotion", () => {
    it("renders all content statically stacked with no sticky positioning and no opacity/transform styling", () => {
      const progress = motionValue(0);
      const { container } = render(
        <PinnedStatement progress={progress} range={[0.85, 1]} lines={["Line one"]} reduceMotion>
          <p>Final CTA</p>
        </PinnedStatement>
      );
      expect(screen.getByText("Line one")).toBeInTheDocument();
      expect(screen.getByText("Final CTA")).toBeInTheDocument();
      expect(container.querySelector(".sticky")).not.toBeInTheDocument();
      expect(
        container.querySelectorAll('[style*="opacity"], [style*="transform"]')
      ).toHaveLength(0);
    });

    // With no sticky element and no crossfade, the extra page height the pin
    // needs buys a reduced-motion visitor nothing -- it would just be ~1.5
    // viewports of empty page between the contact content and the footer.
    it("applies scrollHeightClassName only to the animated branch, never the static one", () => {
      const progress = motionValue(0);
      const { container: animated } = render(
        <PinnedStatement
          progress={progress}
          range={[0.72, 1]}
          lines={["Line one"]}
          className="py-24"
          scrollHeightClassName="min-h-[220vh]"
        >
          <p>Final CTA</p>
        </PinnedStatement>
      );
      const animatedSection = animated.querySelector("section") as HTMLElement;
      expect(animatedSection.className).toContain("min-h-[220vh]");
      expect(animatedSection.className).toContain("py-24");

      const { container: staticContainer } = render(
        <PinnedStatement
          progress={progress}
          range={[0.72, 1]}
          lines={["Line one"]}
          className="py-24"
          scrollHeightClassName="min-h-[220vh]"
          reduceMotion
        >
          <p>Final CTA</p>
        </PinnedStatement>
      );
      const staticSection = staticContainer.querySelector("section") as HTMLElement;
      expect(staticSection.className).not.toContain("min-h-[220vh]");
      expect(staticSection.className).toContain("py-24"); // shared concerns still apply
    });
  });
});
