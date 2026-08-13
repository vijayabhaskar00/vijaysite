import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SectionDivider from "../SectionDivider";

describe("SectionDivider", () => {
  it("renders an hr separator with the hairline border color", () => {
    const { container } = render(<SectionDivider />);
    const hr = container.querySelector("hr");
    expect(hr).toBeTruthy();
    expect(hr).toHaveClass("border-line");
  });
});
