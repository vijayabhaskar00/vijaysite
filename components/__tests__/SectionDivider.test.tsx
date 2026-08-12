import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SectionDivider from "../SectionDivider";

describe("SectionDivider", () => {
  it("renders a decorative, hidden-from-a11y-tree svg", () => {
    const { container } = render(<SectionDivider />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
