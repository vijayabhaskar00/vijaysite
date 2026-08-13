import { render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
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
});
