import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Magnetic from "../Magnetic";

describe("Magnetic", () => {
  it("renders its children", () => {
    render(
      <Magnetic>
        <p>Hello</p>
      </Magnetic>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders a plain inline-block wrapper with no pointer listeners when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(
      <Magnetic className="my-class">
        <p>Hello</p>
      </Magnetic>
    );
    const wrapper = screen.getByText("Hello").parentElement;
    expect(wrapper).toHaveClass("inline-block", "my-class");
    expect(wrapper).not.toHaveAttribute("style");
  });
});
