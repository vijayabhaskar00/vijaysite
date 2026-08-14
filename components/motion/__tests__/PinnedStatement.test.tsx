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
  // stacked on top of each other, so a hidden slot's interactive content
  // (e.g. the final slot's mailto/social/Link content) still sits
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
    it("marks a not-yet-visible slot inert and non-clickable, and restores the active slot once it becomes visible", async () => {
      const progress = motionValue(0.25); // inside "Line one"'s fade-in/hold window
      render(
        <PinnedStatement progress={progress} range={[0, 1]} lines={["Line one"]}>
          <a href="/contact">Final CTA</a>
        </PinnedStatement>
      );

      const lineSlot = screen.getByText("Line one").parentElement as HTMLElement;
      const ctaSlot = screen.getByText("Final CTA").parentElement as HTMLElement;

      // "Line one" is visible; the final CTA slot hasn't been reached yet
      // and must be excluded from pointer/keyboard interaction.
      await waitFor(() => expect(lineSlot).not.toHaveAttribute("inert"));
      expect(lineSlot.style.pointerEvents).toBe("auto");
      await waitFor(() => expect(ctaSlot).toHaveAttribute("inert"));
      expect(ctaSlot.style.pointerEvents).toBe("none");

      act(() => {
        progress.set(1); // scroll fully into the final content
      });

      // Once the final slot is fully visible it must be interactive again,
      // and the now-hidden line slot must have become inert in turn.
      await waitFor(() => expect(ctaSlot).not.toHaveAttribute("inert"));
      expect(ctaSlot.style.pointerEvents).toBe("auto");
      await waitFor(() => expect(lineSlot).toHaveAttribute("inert"));
      expect(lineSlot.style.pointerEvents).toBe("none");
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
  });
});
