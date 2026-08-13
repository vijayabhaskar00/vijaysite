import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Reveal from "../Reveal";

describe("Reveal", () => {
  it("renders its children", () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("falls back to visible when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(
      <Reveal>
        <p>Hello</p>
      </Reveal>
    );
    const wrapper = screen.getByText("Hello").parentElement;
    expect(wrapper).toHaveClass("reveal-scroll", "is-visible");
    expect(wrapper).not.toHaveClass("is-pending");
  });

  it("applies a transition delay when delayMs is passed", () => {
    render(
      <Reveal delayMs={120}>
        <p>Hello</p>
      </Reveal>
    );
    expect(screen.getByText("Hello").parentElement).toHaveStyle({ transitionDelay: "120ms" });
  });
});
