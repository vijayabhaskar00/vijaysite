import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GrainOverlay from "../GrainOverlay";

describe("GrainOverlay", () => {
  it("renders a decorative, click-through overlay", () => {
    const { container } = render(<GrainOverlay />);
    const overlay = container.querySelector(".grain-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });
});
