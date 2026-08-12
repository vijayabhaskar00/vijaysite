import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Texture from "../Texture";

describe("Texture", () => {
  it("renders a decorative svg pattern", () => {
    const { container } = render(<Texture />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("pattern#ikat-weave")).toBeTruthy();
  });
});
