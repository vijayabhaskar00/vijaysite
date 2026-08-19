import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LineReveal from "../LineReveal";

describe("LineReveal", () => {
  it("renders the real text as plain readable content", () => {
    render(<LineReveal text="Vijaya Bhaskar Jatoth" />);
    expect(screen.getByText("Vijaya Bhaskar Jatoth")).toBeInTheDocument();
  });

  it("renders a single plain block with no motion styles when IntersectionObserver is unavailable (jsdom has none)", () => {
    render(<LineReveal text="Hello" className="my-class" />);
    const el = screen.getByText("Hello");
    expect(el).toHaveClass("block", "my-class");
    expect(el).not.toHaveAttribute("style");
  });
});
