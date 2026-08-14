import { render, screen } from "@testing-library/react";
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
