import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { motionValue } from "framer-motion";
import { describe, expect, it } from "vitest";
import Waypoint from "../Waypoint";

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
});
