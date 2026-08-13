import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Marquee from "../Marquee";

describe("Marquee", () => {
  it("renders two copies of the joined items for a seamless loop, hidden from a11y tree", () => {
    const { container } = render(<Marquee items={["One", "Two", "Three"]} />);
    const wrapper = container.firstElementChild;
    expect(wrapper).toHaveAttribute("aria-hidden", "true");

    const copies = container.querySelectorAll(".marquee-copy-1, .marquee-copy-2");
    expect(copies).toHaveLength(2);
    for (const copy of copies) {
      expect(copy.textContent).toContain("One");
      expect(copy.textContent).toContain("Two");
      expect(copy.textContent).toContain("Three");
    }
  });
});
