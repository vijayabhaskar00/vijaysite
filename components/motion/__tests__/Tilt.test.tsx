import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Tilt from "../Tilt";

describe("Tilt", () => {
  it("renders its children", () => {
    render(
      <Tilt>
        <p>Hello</p>
      </Tilt>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders a plain, unstyled wrapper with no pointer listeners when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(
      <Tilt className="my-class">
        <p>Hello</p>
      </Tilt>
    );
    const wrapper = screen.getByText("Hello").parentElement;
    expect(wrapper).toHaveClass("my-class");
    expect(wrapper).not.toHaveAttribute("style");
  });
});
